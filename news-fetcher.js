/**
 * عاجل نيوز - محرك جلب الأخبار التلقائي
 * يدعم: RSS/Atom feeds + Web Scraping + ترجمة + تصنيف تلقائي
 */

const RSSParser = require('rss-parser');
const cheerio = require('cheerio');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const db = require('./database');

const rssParser = new RSSParser({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
            ['description', 'description'],
            ['content:encoded', 'contentEncoded'],
        ]
    }
});

// ===== HTTP FETCH HELPER =====
function fetchURL(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ar,en;q=0.9',
                'Accept-Encoding': 'identity',
                ...options.headers,
            },
            timeout: options.timeout || 15000,
        };

        const req = client.request(reqOptions, (res) => {
            // Follow redirects
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                const redirectUrl = new URL(res.headers.location, url).href;
                return fetchURL(redirectUrl, options).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }

            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
    });
}

// ===== IMAGE EXTRACTION =====
function extractImage(item, htmlContent) {
    // From RSS item
    if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
    if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
    if (item.enclosure?.url) return item.enclosure.url;
    if (item.image?.url) return item.image.url;

    // From HTML content
    if (htmlContent) {
        const $ = cheerio.load(htmlContent);
        const img = $('img').first();
        if (img.length) {
            const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
            if (src && src.startsWith('http')) return src;
        }
    }

    // From content:encoded
    if (item.contentEncoded) {
        const $ = cheerio.load(item.contentEncoded);
        const img = $('img').first();
        if (img.length) {
            const src = img.attr('src') || img.attr('data-src');
            if (src && src.startsWith('http')) return src;
        }
    }

    return '';
}

// ===== HTML CLEANUP =====
function cleanHTML(html) {
    if (!html) return '';
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, iframe, noscript, .ad, .ads, .advertisement, .social-share, .related-posts, nav, footer, header').remove();

    // Get text with basic formatting
    let text = '';
    $('p, h2, h3, h4, li, blockquote').each((i, el) => {
        const tag = el.tagName;
        const content = $(el).text().trim();
        if (content) {
            if (tag === 'h2' || tag === 'h3') text += '\n## ' + content + '\n';
            else if (tag === 'h4') text += '\n### ' + content + '\n';
            else if (tag === 'li') text += '\n• ' + content;
            else if (tag === 'blockquote') text += '\n> ' + content + '\n';
            else text += content + '\n\n';
        }
    });

    return text.trim() || $.text().trim().substring(0, 2000);
}

// ===== CONTENT EXTRACTION FROM URL =====
async function extractArticleContent(url) {
    try {
        const html = await fetchURL(url);
        const $ = cheerio.load(html);

        // Remove noise
        $('script, style, nav, header, footer, aside, .sidebar, .ad, .ads, .comments, .social, .share, .related, .menu, .breadcrumb, .navigation').remove();

        // Try common article selectors
        const selectors = [
            'article', '.article-body', '.article-content', '.story-body',
            '.post-content', '.entry-content', '.content-body', '.news-content',
            '.article-text', '.article__body', '[itemprop="articleBody"]',
            'main .content', '.main-content', '#article-body', '.detail-content',
            '.news-body', '.article-detail', '.story-content',
        ];

        let content = '';
        for (const sel of selectors) {
            const el = $(sel);
            if (el.length && el.text().trim().length > 100) {
                content = el.html();
                break;
            }
        }

        // Fallback: largest text block
        if (!content) {
            let maxLen = 0;
            $('div, section, article').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > maxLen && text.length > 200) {
                    maxLen = text.length;
                    content = $(el).html();
                }
            });
        }

        // Extract main image
        let image = '';
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) image = ogImage;
        else {
            const mainImg = $('article img, .article img, .content img, main img').first();
            image = mainImg.attr('src') || mainImg.attr('data-src') || '';
        }

        return {
            content: cleanHTML(content),
            image: image.startsWith('http') ? image : '',
        };
    } catch (err) {
        console.error(` extract failed for ${url}:`, err.message);
        return { content: '', image: '' };
    }
}

// ===== DUPLICATE CHECK =====
function isDuplicate(title, sourceId) {
    // Check exact title match
    const exact = db.prepare('SELECT id FROM articles WHERE title = ?').get(title);
    if (exact) return true;

    // Check similar title (fuzzy)
    const normalized = title.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '').trim();
    const similar = db.prepare(`
        SELECT id FROM articles
        WHERE REPLACE(REPLACE(title, '«', ''), '»', '') LIKE ?
        AND created_at > datetime('now', '-7 days')
    `).get(`%${normalized.substring(0, 50)}%`);

    return !!similar;
}

// ===== CATEGORY DETECTION =====
function detectCategory(title, content, sourceCategory) {
    if (sourceCategory && sourceCategory !== 'auto') return sourceCategory;

    const text = (title + ' ' + content).toLowerCase();

    const categories = {
        'sports': ['رياضة', 'كرة', 'مباراة', 'هدف', 'لاعب', 'فريق', 'بطولة', 'كأس', 'الدوري', 'coach', 'sport', 'match', 'goal', 'football', 'soccer', 'fifa', 'كرة قدم', 'المنتدي', 'مونديال', 'كأس العالم'],
        'economy': ['اقتصاد', 'نفط', 'أسهم', 'بورصة', 'استثمار', 'مصرف', 'ريال', 'دولار', 'تجارة', 'economy', 'oil', 'stock', 'market', 'investment', 'أوبك', 'البنك', 'تضخم', 'نمو اقتصادي'],
        'international': ['دولي', 'عالمي', 'أمريكا', 'أوروبا', 'الصين', 'روسيا', 'حرب', 'سلام', '联合国', 'international', 'world', 'global', 'trump', 'putin', 'iran', 'israel'],
        'entertainment': ['ترفيه', 'فن', 'مسلسل', 'فيلم', 'ممثل', 'مغني', 'حفل', 'concert', 'movie', 'entertainment', 'celebrity', 'celeb', 'actor', 'سهرة', 'حفلة'],
        'tourism': ['سياحة', 'سفر', 'فندق', 'مطار', 'وجهة', 'رحلات', 'tourism', 'travel', 'hotel', 'resort', 'سياحي'],
        'jobs': ['وظيفة', 'توظيف', 'راتب', 'مسمى وظيفي', 'job', 'career', 'hiring', 'recruitment', 'employment', 'وظائف'],
        'society': ['مجتمع', 'صحة', 'تعليم', 'أحوال', 'اجتماعي', 'society', 'health', 'education', 'social'],
    };

    let bestMatch = sourceCategory || 'local';
    let bestScore = 0;

    for (const [cat, keywords] of Object.entries(categories)) {
        let score = 0;
        for (const kw of keywords) {
            if (text.includes(kw)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = cat;
        }
    }

    return bestMatch;
}

// ===== GET SECTION ID BY SLUG =====
function getSectionId(slug) {
    const section = db.prepare('SELECT id FROM sections WHERE slug = ?').get(slug);
    return section ? section.id : 1; // default to local
}

// ===== FETCH RSS FEED =====
async function fetchRSS(source) {
    const logs = [];
    const log = (msg) => { logs.push(`[${new Date().toISOString()}] ${msg}`); console.log(`[RSS] ${msg}`); };

    try {
        log(`جلب RSS: ${source.name} - ${source.url}`);
        const feed = await rssParser.parseURL(source.url);
        log(`تم العثور على ${feed.items.length} عنصر`);

        let newCount = 0;
        const maxItems = source.max_items || 20;

        for (const item of feed.items.slice(0, maxItems)) {
            const title = (item.title || '').trim();
            if (!title || title.length < 5) continue;

            // Check duplicate
            if (isDuplicate(title, source.id)) {
                log(`  مكرر: ${title.substring(0, 50)}...`);
                continue;
            }

            // Extract content
            const summary = cleanHTML(item.contentSnippet || item.content || item.description || '').substring(0, 500);
            const image = extractImage(item, item.content || item['content:encoded'] || '');

            // Get full content if enabled
            let fullContent = summary;
            if (source.fetch_full_content && item.link) {
                log(`  جلب المحتوى الكامل: ${item.link}`);
                const extracted = await extractArticleContent(item.link);
                if (extracted.content.length > summary.length) {
                    fullContent = extracted.content;
                }
            }

            // Detect category
            const category = detectCategory(title, fullContent, source.default_category);
            const sectionId = getSectionId(category);

            // Insert article
            try {
                const result = db.prepare(`
                    INSERT INTO articles (title, summary, content, image, section_id, status, author_name, is_featured, is_breaking, is_slider)
                    VALUES (?, ?, ?, ?, ?, 'published', ?, 0, 0, 0)
                `).run(
                    title,
                    summary.substring(0, 500),
                    fullContent,
                    image || source.default_image || '',
                    sectionId,
                    source.attribution || source.name
                );

                log(`  ✅ جديد (#${result.lastInsertRowid}): ${title.substring(0, 60)}...`);
                newCount++;

                // Small delay to avoid overwhelming
                await new Promise(r => setTimeout(r, 200));
            } catch (err) {
                log(`  ❌ خطأ: ${err.message}`);
            }
        }

        // Update source last fetch time
        db.prepare('UPDATE news_sources SET last_fetch = CURRENT_TIMESTAMP, last_status = ?, last_count = ? WHERE id = ?')
            .run('success', newCount, source.id);

        log(`انتهاء: ${newCount} خبر جديد من ${source.name}`);
        return { success: true, newCount, logs };

    } catch (err) {
        const errMsg = `فشل جلب ${source.name}: ${err.message}`;
        log(`❌ ${errMsg}`);
        db.prepare('UPDATE news_sources SET last_fetch = CURRENT_TIMESTAMP, last_status = ?, last_error = ? WHERE id = ?')
            .run('error', err.message, source.id);
        return { success: false, newCount: 0, logs, error: err.message };
    }
}

// ===== FETCH WEB PAGE (SCRAPE) =====
async function fetchWeb(source) {
    const logs = [];
    const log = (msg) => { logs.push(`[${new Date().toISOString()}] ${msg}`); console.log(`[WEB] ${msg}`); };

    try {
        log(`جلب صفحة: ${source.name} - ${source.url}`);
        const html = await fetchURL(source.url);
        const $ = cheerio.load(html);

        // Parse selectors from source config
        const selectors = source.selectors ? JSON.parse(source.selectors) : {};
        const itemSelector = selectors.item || 'article, .news-item, .article-item, .story';
        const titleSelector = selectors.title || 'h2 a, h3 a, .title a, .headline a';
        const linkSelector = selectors.link || 'a';
        const imageSelector = selectors.image || 'img';
        const summarySelector = selectors.summary || 'p, .summary, .excerpt, .description';

        const items = $(itemSelector);
        log(`تم العثور على ${items.length} عنصر`);

        let newCount = 0;
        const maxItems = source.max_items || 20;

        items.each((i, el) => {
            if (newCount >= maxItems) return false;

            const $el = $(el);
            const $link = $el.find(titleSelector).first();
            const title = ($link.text() || $el.find('h2, h3, h1').first().text() || '').trim();

            if (!title || title.length < 5) return true;

            let link = $link.attr('href') || $el.find(linkSelector).first().attr('href') || '';
            if (link && !link.startsWith('http')) {
                try { link = new URL(link, source.url).href; } catch {}
            }

            const imgEl = $el.find(imageSelector).first();
            let image = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';
            if (image && !image.startsWith('http')) {
                try { image = new URL(image, source.url).href; } catch {}
            }

            const summary = $el.find(summarySelector).first().text().trim().substring(0, 500);

            // Check duplicate
            if (isDuplicate(title, source.id)) {
                log(`  مكرر: ${title.substring(0, 50)}...`);
                return true;
            }

            const category = detectCategory(title, summary, source.default_category);
            const sectionId = getSectionId(category);

            try {
                const result = db.prepare(`
                    INSERT INTO articles (title, summary, content, image, section_id, status, author_name, is_featured, is_breaking, is_slider)
                    VALUES (?, ?, ?, ?, ?, 'published', ?, 0, 0, 0)
                `).run(title, summary, summary, image || source.default_image || '', sectionId, source.attribution || source.name);

                log(`  ✅ جديد (#${result.lastInsertRowid}): ${title.substring(0, 60)}...`);
                newCount++;
            } catch (err) {
                log(`  ❌ خطأ: ${err.message}`);
            }
        });

        db.prepare('UPDATE news_sources SET last_fetch = CURRENT_TIMESTAMP, last_status = ?, last_count = ? WHERE id = ?')
            .run('success', newCount, source.id);

        log(`انتهاء: ${newCount} خبر جديد من ${source.name}`);
        return { success: true, newCount, logs };

    } catch (err) {
        const errMsg = `فشل جلب ${source.name}: ${err.message}`;
        log(`❌ ${errMsg}`);
        db.prepare('UPDATE news_sources SET last_fetch = CURRENT_TIMESTAMP, last_status = ?, last_error = ? WHERE id = ?')
            .run('error', err.message, source.id);
        return { success: false, newCount: 0, logs, error: err.message };
    }
}

// ===== MAIN FETCH FUNCTION =====
async function fetchSource(source) {
    if (source.type === 'rss') return fetchRSS(source);
    if (source.type === 'web') return fetchWeb(source);
    return { success: false, newCount: 0, logs: ['نوع مصدر غير معروف'], error: 'Unknown source type' };
}

async function fetchAllSources() {
    const sources = db.prepare('SELECT * FROM news_sources WHERE is_active = 1').all();
    const results = [];

    for (const source of sources) {
        try {
            const result = await fetchSource(source);
            results.push({ source: source.name, ...result });

            // Log to fetch_logs
            db.prepare(`
                INSERT INTO fetch_logs (source_id, status, new_count, error_message, details)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                source.id,
                result.success ? 'success' : 'error',
                result.newCount,
                result.error || '',
                result.logs.join('\n')
            );

            // Delay between sources
            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            results.push({ source: source.name, success: false, error: err.message });
        }
    }

    return results;
}

// ===== PRESET ARABIC NEWS SOURCES =====
const PRESET_SOURCES = [
    { name: 'عاجل', url: 'https://ajel.sa/rss', type: 'rss', default_category: 'local', attribution: 'عاجل' },
    { name: 'العربية', url: 'https://www.alarabiya.net/feed/rss2', type: 'rss', default_category: 'international', attribution: 'العربية' },
    { name: 'الجزيرة', url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9', type: 'rss', default_category: 'international', attribution: 'الجزيرة' },
    { name: 'BBC عربي', url: 'https://feeds.bbci.co.uk/arabic/rss.xml', type: 'rss', default_category: 'international', attribution: 'BBC عربي' },
    { name: 'رويترز عربي', url: 'https://www.reutersagency.com/feed/', type: 'rss', default_category: 'international', attribution: 'رويترز' },
    { name: 'سكاي نيوز عربي', url: 'https://www.skynewsarabia.com/rss', type: 'rss', default_category: 'international', attribution: 'سكاي نيوز عربي' },
    { name: 'الإمارات اليوم', url: 'https://www.emaratalyoum.com/rss', type: 'rss', default_category: 'local', attribution: 'الإمارات اليوم' },
    { name: 'الوطن', url: 'https://alwatan.com/feed', type: 'rss', default_category: 'local', attribution: 'الوطن' },
    { name: 'سبق', url: 'https://sabq.org/rss', type: 'rss', default_category: 'local', attribution: 'سبق' },
    { name: 'الأهرام', url: 'https://www.ahram.org.eg/rss', type: 'rss', default_category: 'international', attribution: 'الأهرام' },
    { name: 'CNN عربي', url: 'https://arabic.cnn.com/api/rss', type: 'rss', default_category: 'international', attribution: 'CNN عربي' },
    { name: 'France24 عربي', url: 'https://www.francetvinfo.fr/titres.rss', type: 'rss', default_category: 'international', attribution: 'France24' },
];

module.exports = {
    fetchSource,
    fetchAllSources,
    fetchRSS,
    fetchWeb,
    extractArticleContent,
    PRESET_SOURCES,
};
