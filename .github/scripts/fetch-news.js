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
    // World News
    { id: 'bbc', name: 'BBC عربي', url: 'https://feeds.bbci.co.uk/arabic/rss.xml', category: 'international', logo: '🇬🇧' },
    { id: 'sky', name: 'سكاي نيوز عربي', url: 'https://www.skynewsarabia.com/rss', category: 'international', logo: '🔵' },
    { id: 'aljazeera', name: 'الجزيرة', url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9', category: 'international', logo: '🌐' },
    { id: 'cnbc', name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'economy', logo: '💹' },
    { id: 'france24', name: 'France24 عربي', url: 'https://www.francetvinfo.fr/titres.rss', category: 'international', logo: '🇫🇷' },
    { id: 'dw', name: 'DW عربي', url: 'https://rss.dw.com/rdf/rss-en-all', category: 'international', logo: '🇩🇪' },
    { id: 'rt', name: 'RT', url: 'https://www.rt.com/rss/', category: 'international', logo: '🇷🇺' },
    { id: 'trt', name: 'TRT عربي', url: 'https://www.trt.net.tr/rss', category: 'international', logo: '🇹🇷' },
    { id: 'abc', name: 'ABC News', url: 'https://feeds.abcnews.com/abcnews/topstories', category: 'international', logo: '🇺🇸' },
    { id: 'cnn', name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss', category: 'international', logo: '📺' },
    { id: 'nyt', name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', category: 'international', logo: '📰' },
    { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'international', logo: '🇬🇧' },
    { id: 'al', name: 'العربية', url: 'https://www.alarabiya.net/feed/rss2', category: 'international', logo: '🟥' },
    { id: 'arabnews', name: 'Arab News', url: 'https://www.arabnews.com/rss.xml', category: 'local', logo: '🇸🇦' },
    { id: 'gulfnews', name: 'Gulf News', url: 'https://gulfnews.com/rss', category: 'local', logo: '🇦🇪' },
    // Sports
    { id: 'bbc-sport', name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'sports', logo: '⚽' },
    { id: 'espn', name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'sports', logo: '🏈' },
    { id: 'skysports', name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', category: 'sports', logo: '⚽' },
    { id: 'goal', name: 'Goal.com', url: 'https://www.goal.com/en/feeds/news?fmt=rss', category: 'sports', logo: '🥅' },
    // Economy
    { id: 'bloomberg', name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'economy', logo: '📊' },
    { id: 'ft', name: 'Financial Times', url: 'https://www.ft.com/rss/home', category: 'economy', logo: '💼' },
    { id: 'wsj', name: 'Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'economy', logo: '📈' },
    // Tech
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology', logo: '💻' },
    { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technology', logo: '📱' },
    { id: 'wired', name: 'WIRED', url: 'https://www.wired.com/feed/rss', category: 'technology', logo: '🔌' },
    // Science & Health
    { id: 'natgeo', name: 'National Geographic', url: 'https://www.nationalgeographic.com/page/rss', category: 'science', logo: '🔬' },
    { id: 'nasa', name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'science', logo: '🚀' },
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

// Smart categorization with entity recognition
const SPORTS_PLAYERS = ['ميسي','رونالدو','مبابي','هالاند','نيمار','صلاح','بنزيما','بيلينغهام','فينيسيوس','يامال','ليفاندوفسكي','تاليسكا','حمدالله','الشهري','الدوسري','كنو','المقهو','البريكان'];
const SPORTS_CLUBS = ['ريال مدريد','برشلونة','مانشستر سيتي','ليفربول','أرسنال','بايرن ميونخ','باريس سان جيرمان','يوفنتوس','الهلال','النصر','الأهلي','الاتحاد','الشباب','الاتفاق','الترجي','الوداد','الرجاء'];
const SPORTS_COMPS = ['كأس العالم','مونديال','دوري أبطال أوروبا','تشامبيونزليغ','الدوري الإنجليزي','البريمرليغ','الليغا','البوندسليغا','السيري آ','دوري روشن','كأس الملك','يورو','كوبا أمريكا','فورمولا 1','NBA'];
const ECONOMY_TERMS = ['نفط','برميل','أسهم','بورصة','تداول','استثمار','ريال','دولار','يورو','تضخم','نمو','ركود','أوبك','bitcoin','crypto','OPEC','البنك المركزي','صندوق النقد','Wall Street'];
const ECONOMY_COMPANIES = ['أرامكو','سابك','أبل','Apple','جوجل','Google','مايكروسوفت','أمازون','تسلا','Tesla','سامسونغ','Samsung'];
const INT_COUNTRIES = ['أمريكا','روسيا','الصين','فرنسا','ألمانيا','بريطانيا','إيران','تركيا','إسرائيل','فلسطين','غزة','مصر','العراق','سوريا','لبنان','أوكرانيا'];
const INT_LEADERS = ['ترامب','بايدن','بوتين','ماكرون','شولتس','إردوغان','خامنئي','نتنياهو','زيلينسكي','السيسي','مودي'];
const INT_ORGS = ['الأمم المتحدة','حلف الناتو','NATO','الاتحاد الأوروبي','منظمة الصحة العالمية','الأوبك','G20','G7','الجامعة العربية'];
const SAUDI_KEYWORDS = ['السعودية','المملكة','الرياض','جدة','مكة','المدينة','سمو ولي العهد','الملك سلمان','رؤية 2030','مجلس الوزراء','وزارة','أمير','الحرس','الدفاع','الداخلية'];

function detectCategory(title, desc, sourceCategory) {
    const text = (title + ' ' + desc).toLowerCase();
    const scores = { sports:0, economy:0, international:0, local:0, entertainment:0, tourism:0, misc:0, jobs:0, worldcup:0 };

    for (const p of SPORTS_PLAYERS) if (text.includes(p.toLowerCase())) scores.sports += 10;
    for (const c of SPORTS_CLUBS) if (text.includes(c.toLowerCase())) scores.sports += 8;
    for (const c of SPORTS_COMPS) if (text.includes(c.toLowerCase())) scores.sports += 9;
    for (const t of ['مباراة','هدف','لاعب','فريق','بطولة','كأس','دوري','مدرب','فوز','خسارة','تأهل','goal','match','final','score']) if (text.includes(t)) scores.sports += 3;

    for (const t of ECONOMY_TERMS) if (text.includes(t.toLowerCase())) scores.economy += 4;
    for (const c of ECONOMY_COMPANIES) if (text.includes(c.toLowerCase())) scores.economy += 8;

    for (const c of INT_COUNTRIES) if (text.includes(c.toLowerCase())) scores.international += 4;
    for (const l of INT_LEADERS) if (text.includes(l.toLowerCase())) scores.international += 8;
    for (const o of INT_ORGS) if (text.includes(o.toLowerCase())) scores.international += 6;
    for (const t of ['حرب','سلام','مفاوضات','اتفاق','عقوبات','أزمة','إرهاب']) if (text.includes(t)) scores.international += 3;

    for (const k of SAUDI_KEYWORDS) if (text.includes(k.toLowerCase())) scores.local += 4;

    for (const t of ['فن','فيلم','مسلسل','ممثل','مغني','حفل','concert','movie','entertainment','celebrity']) if (text.includes(t)) scores.entertainment += 3;
    for (const t of ['سياحة','سفر','فندق','مطار','tourism','travel','hotel']) if (text.includes(t)) scores.tourism += 3;
    for (const t of ['وظيفة','توظيف','راتب','job','career','hiring']) if (text.includes(t)) scores.jobs += 5;
    for (const t of ['كأس العالم','مونديال','world cup','2026']) if (text.includes(t)) scores.worldcup += 6;

    if (sourceCategory && sourceCategory !== 'auto' && scores[sourceCategory] !== undefined) scores[sourceCategory] += 5;

    let best = 'local';
    let bestScore = 0;
    for (const [cat, score] of Object.entries(scores)) {
        if (score > bestScore) { bestScore = score; best = cat; }
    }
    return best;
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
