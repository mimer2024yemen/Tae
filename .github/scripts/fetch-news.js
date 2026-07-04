/**
 * GitHub Actions: جلب الأخبار وحفظها كملفات JSON ثابتة
 * يعمل كل 15 دقيقة عبر GitHub Actions
 */

const RSSParser = require('rss-parser');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const rssParser = new RSSParser({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AjelNewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
            ['content:encoded', 'contentEncoded'],
        ]
    }
});

const SOURCES = [
    { id: 'bbc', name: 'BBC عربي', url: 'https://feeds.bbci.co.uk/arabic/rss.xml', category: 'international', logo: '🇬🇧' },
    { id: 'sky', name: 'سكاي نيوز عربي', url: 'https://www.skynewsarabia.com/rss', category: 'international', logo: '🔵' },
    { id: 'aljazeera', name: 'الجزيرة', url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9', category: 'international', logo: '🌐' },
    { id: 'cnbc', name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'economy', logo: '💹' },
    { id: 'espn', name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'sports', logo: '⚽' },
    { id: 'reuters', name: 'رويترز', url: 'https://www.reutersagency.com/feed/', category: 'international', logo: '📰' },
    { id: 'france24', name: 'France24', url: 'https://www.francetvinfo.fr/titres.rss', category: 'international', logo: '🇫🇷' },
    { id: 'nhk', name: 'NHK World', url: 'https://www3.nhk.or.jp/nhkworld/en/news/feeds/', category: 'international', logo: '🇯🇵' },
    { id: 'dw', name: 'DW', url: 'https://rss.dw.com/rdf/rss-en-all', category: 'international', logo: '🇩🇪' },
];

function extractImage(item) {
    if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
    if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
    if (item.enclosure?.url) return item.enclosure.url;
    if (item.image?.url) return item.image.url;

    const content = item.contentEncoded || item.content || item.description || '';
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match && match[1].startsWith('http')) return match[1];

    return '';
}

function detectCategory(title, desc, sourceCategory) {
    const text = (title + ' ' + desc).toLowerCase();
    const cats = {
        sports: ['رياضة', 'كرة', 'مباراة', 'هدف', 'لاعب', 'فريق', 'بطولة', 'كأس', 'الدوري', 'sport', 'match', 'goal', 'football', 'soccer', 'fifa', 'world cup', 'nba', 'tennis', 'golf', 'basketball'],
        economy: ['اقتصاد', 'نفط', 'أسهم', 'بورصة', 'استثمار', 'ريال', 'دولار', 'economy', 'oil', 'stock', 'market', 'investment', 'bitcoin', 'crypto', 'fed', 'inflation'],
        international: ['دولي', 'عالمي', 'أمريكا', 'أوروبا', 'الصين', 'روسيا', 'حرب', 'سلام', 'international', 'world', 'trump', 'iran', 'israel', 'gaza', 'ukraine', 'nato', 'un'],
        entertainment: ['ترفيه', 'فن', 'مسلسل', 'فيلم', 'ممثل', 'مغني', 'concert', 'movie', 'entertainment', 'celebrity', 'actor', 'netflix', 'grammy', 'oscar'],
        tourism: ['سياحة', 'سفر', 'فندق', 'مطار', 'tourism', 'travel', 'hotel', 'resort'],
    };

    let best = sourceCategory;
    let bestScore = 0;
    for (const [cat, keywords] of Object.entries(cats)) {
        let score = 0;
        for (const kw of keywords) { if (text.includes(kw)) score++; }
        if (score > bestScore) { bestScore = score; best = cat; }
    }
    return best || 'international';
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function cleanHTML(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 300);
}

async function fetchSource(source) {
    try {
        console.log(`  Fetching: ${source.name}...`);
        const feed = await rssParser.parseURL(source.url);
        const articles = feed.items.slice(0, 20).map(item => {
            const title = (item.title || '').trim();
            const desc = cleanHTML(item.contentSnippet || item.content || item.description || '');
            const image = extractImage(item);

            return {
                id: source.id + '_' + hashCode(title),
                title,
                summary: desc,
                image,
                link: item.link || '',
                source: source.name,
                sourceLogo: source.logo,
                category: detectCategory(title, desc, source.category),
                date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            };
        }).filter(a => a.title.length > 5);

        console.log(`  ✅ ${source.name}: ${articles.length} articles`);
        return articles;
    } catch (err) {
        console.error(`  ❌ ${source.name}: ${err.message}`);
        return [];
    }
}

async function main() {
    console.log('🚀 Starting news fetch...');
    console.log(`📅 ${new Date().toISOString()}`);

    const allArticles = [];

    for (const source of SOURCES) {
        const articles = await fetchSource(source);
        allArticles.push(...articles);
        await new Promise(r => setTimeout(r, 500));
    }

    // Sort by date
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    for (const a of allArticles) {
        const norm = a.title.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '').substring(0, 40);
        if (!seen.has(norm) && a.title.length > 10) {
            seen.add(norm);
            unique.push(a);
        }
    }

    // Add timeAgo
    const now = Date.now();
    for (const a of unique) {
        const diff = Math.floor((now - new Date(a.date).getTime()) / 1000);
        if (diff < 60) a.timeAgo = 'الآن';
        else if (diff < 3600) a.timeAgo = `قبل ${Math.floor(diff / 60)} دقيقة`;
        else if (diff < 86400) a.timeAgo = `قبل ${Math.floor(diff / 3600)} ساعة`;
        else a.timeAgo = `قبل ${Math.floor(diff / 86400)} يوم`;
    }

    // Save to files
    const dataDir = path.join(__dirname, '../../public/data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    // All news
    fs.writeFileSync(path.join(dataDir, 'news.json'), JSON.stringify({
        updated: new Date().toISOString(),
        count: unique.length,
        articles: unique,
    }, null, 2));

    // By category
    const categories = {};
    for (const a of unique) {
        if (!categories[a.category]) categories[a.category] = [];
        categories[a.category].push(a);
    }
    for (const [cat, articles] of Object.entries(categories)) {
        fs.writeFileSync(path.join(dataDir, `news-${cat}.json`), JSON.stringify({
            category: cat,
            updated: new Date().toISOString(),
            count: articles.length,
            articles,
        }, null, 2));
    }

    // Latest 50 (for ticker + slider)
    fs.writeFileSync(path.join(dataDir, 'latest.json'), JSON.stringify({
        updated: new Date().toISOString(),
        articles: unique.slice(0, 50),
    }, null, 2));

    console.log(`\n✅ Done! ${unique.length} unique articles from ${SOURCES.length} sources`);
    console.log(`📁 Saved to: ${dataDir}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
