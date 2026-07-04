/**
 * عاجل نيوز - جلب الأخبار المباشر (Client-side)
 * يعمل على GitHub Pages بدون سيرفر
 * يجلب RSS عبر allorigins.win proxy
 */

const NEWS_CONFIG = {
    proxy: 'https://api.allorigins.win/raw?url=',
    imgProxy: 'https://images.weserv.nl/?url=',
    cacheKey: 'ajel_news_cache',
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    sources: [
        // World News
        { id: 'bbc', name: 'BBC عربي', url: 'https://feeds.bbci.co.uk/arabic/rss.xml', category: 'international', logo: '🇬🇧' },
        { id: 'sky', name: 'سكاي نيوز عربي', url: 'https://www.skynewsarabia.com/rss', category: 'international', logo: '🔵' },
        { id: 'aljazeera', name: 'الجزيرة', url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9', category: 'international', logo: '🌐' },
        { id: 'cnbc', name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'economy', logo: '💹' },
        { id: 'france24', name: 'France24', url: 'https://www.francetvinfo.fr/titres.rss', category: 'international', logo: '🇫🇷' },
        // DW removed - no images
        { id: 'abc', name: 'ABC News', url: 'https://feeds.abcnews.com/abcnews/topstories', category: 'international', logo: '🇺🇸' },
        { id: 'cnn', name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss', category: 'international', logo: '📺' },
        { id: 'nyt', name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', category: 'international', logo: '📰' },
        { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'international', logo: '🇬🇧' },
        { id: 'arabnews', name: 'Arab News', url: 'https://www.arabnews.com/rss.xml', category: 'local', logo: '🇸🇦' },
        { id: 'gulfnews', name: 'Gulf News', url: 'https://gulfnews.com/rss', category: 'local', logo: '🇦🇪' },
        // Sports
        { id: 'bbc-sport', name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'sports', logo: '⚽' },
        { id: 'espn', name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'sports', logo: '🏈' },
        { id: 'skysports', name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', category: 'sports', logo: '⚽' },
        // Economy
        { id: 'bloomberg', name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'economy', logo: '📊' },
        { id: 'ft', name: 'Financial Times', url: 'https://www.ft.com/rss/home', category: 'economy', logo: '💼' },
        // WSJ removed - no images
        // Tech
        { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology', logo: '💻' },
        { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technology', logo: '📱' },
        { id: 'wired', name: 'WIRED', url: 'https://www.wired.com/feed/rss', category: 'technology', logo: '🔌' },
        // Science & Health
        { id: 'nasa', name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'science', logo: '🚀' },
        { id: 'sciencedaily', name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science', logo: '🔬' },
        { id: 'medicalnewstoday', name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/newsfeeds/rss/medical-news-today.xml', category: 'health', logo: '🏥' },
        // More World
        { id: 'euronews', name: 'Euronews', url: 'https://www.euronews.com/rss', category: 'international', logo: '🇪🇺' },
        { id: 'aljazeera-en', name: 'Al Jazeera EN', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'international', logo: '🌐' },
        // More Sports
        { id: 'marca', name: 'Marca', url: 'https://www.marca.com/rss/portada.xml', category: 'sports', logo: '⚽' },
        { id: 'football-italia', name: 'Football Italia', url: 'https://www.football-italia.net/feed', category: 'sports', logo: '⚽' },
        // More Economy
        { id: 'investing', name: 'Investing.com', url: 'https://www.investing.com/rss/news.rss', category: 'economy', logo: '📈' },
    ],
};

// ===== RSS PARSER =====
function parseRSS(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = [];

    // RSS 2.0
    const rssItems = xml.querySelectorAll('item');
    rssItems.forEach(item => {
        items.push(extractRSSItem(item));
    });

    // Atom
    if (items.length === 0) {
        const atomEntries = xml.querySelectorAll('entry');
        atomEntries.forEach(entry => {
            items.push(extractAtomEntry(entry));
        });
    }

    return items;
}

function extractRSSItem(item) {
    const getText = (tag) => {
        const el = item.querySelector(tag);
        return el ? el.textContent.trim() : '';
    };

    const title = getText('title');
    const link = getText('link');
    const description = getText('description');
    const pubDate = getText('pubDate');
    const content = getText('content\\:encoded') || getText('content') || description;

    // Extract image
    let image = '';
    const media = item.querySelector('media\\:content, content');
    if (media) image = media.getAttribute('url') || '';

    const enclosure = item.querySelector('enclosure');
    if (!image && enclosure) image = enclosure.getAttribute('url') || '';

    if (!image) {
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) image = imgMatch[1];
    }

    if (!image) {
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) image = imgMatch[1];
    }

    // Clean description
    const cleanDesc = description.replace(/<[^>]*>/g, '').trim().substring(0, 300);

    return { title, link, description: cleanDesc, pubDate, image, content };
}

function extractAtomEntry(entry) {
    const getText = (tag) => {
        const el = entry.querySelector(tag);
        return el ? el.textContent.trim() : '';
    };

    const title = getText('title');
    const linkEl = entry.querySelector('link');
    const link = linkEl ? (linkEl.getAttribute('href') || '') : '';
    const summary = getText('summary') || getText('content');
    const pubDate = getText('published') || getText('updated');

    let image = '';
    const media = entry.querySelector('media\\:thumbnail, media\\:content');
    if (media) image = media.getAttribute('url') || '';

    if (!image) {
        const imgMatch = summary.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) image = imgMatch[1];
    }

    const cleanDesc = summary.replace(/<[^>]*>/g, '').trim().substring(0, 300);

    return { title, link, description: cleanDesc, pubDate, image };
}

// ===== CATEGORY DETECTION =====
function detectCategory(title, desc, sourceCategory) {
    // Use SmartCategorizer if available
    if (window.SmartCategorizer) {
        const result = window.SmartCategorizer.classify(title, desc, sourceCategory);
        return result.categorySlug;
    }

    // Fallback: basic keyword matching
    const text = (title + ' ' + desc).toLowerCase();
    const cats = {
        sports: ['رياضة', 'كرة', 'مباراة', 'هدف', 'لاعب', 'فريق', 'بطولة', 'كأس', 'الدوري', 'sport', 'match', 'goal', 'football', 'soccer', 'fifa', 'مونديال', 'world cup', 'nba', 'formula'],
        economy: ['اقتصاد', 'نفط', 'أسهم', 'بورصة', 'استثمار', 'ريال', 'دولار', 'economy', 'oil', 'stock', 'market', 'investment', 'أوبك'],
        international: ['دولي', 'عالمي', 'أمريكا', 'أوروبا', 'الصين', 'روسيا', 'حرب', 'سلام', 'international', 'world', 'trump', 'iran', 'israel'],
        entertainment: ['ترفيه', 'فن', 'مسلسل', 'فيلم', 'ممثل', 'مغني', 'حفل', 'concert', 'movie', 'entertainment', 'celebrity'],
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

// ===== FETCH NEWS FROM ALL SOURCES =====
async function fetchAllNews() {
    // Check cache first
    const cached = localStorage.getItem(NEWS_CONFIG.cacheKey);
    if (cached) {
        try {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < NEWS_CONFIG.cacheExpiry) {
                return data.articles;
            }
        } catch {}
    }

    const allArticles = [];
    const fetchPromises = NEWS_CONFIG.sources.map(async (source) => {
        try {
            const proxyUrl = NEWS_CONFIG.proxy + encodeURIComponent(source.url);
            const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            const items = parseRSS(text);

            return items.slice(0, 15).map(item => ({
                id: source.id + '_' + hashCode(item.title),
                title: item.title,
                summary: item.description,
                image: item.image,
                link: item.link,
                source: source.name,
                sourceLogo: source.logo,
                category: detectCategory(item.title, item.description, source.category),
                date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                timeAgo: getTimeAgo(item.pubDate),
            }));
        } catch (err) {
            console.warn(`Failed to fetch ${source.name}:`, err.message);
            return [];
        }
    });

    const results = await Promise.allSettled(fetchPromises);
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
        }
    });

    // Sort by date (newest first)
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Remove duplicates by title similarity
    const unique = [];
    const seen = new Set();
    for (const article of allArticles) {
        const normalized = article.title.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '').substring(0, 40);
        if (!seen.has(normalized) && article.title.length > 10) {
            seen.add(normalized);
            unique.push(article);
        }
    }

    // Cache
    try {
        localStorage.setItem(NEWS_CONFIG.cacheKey, JSON.stringify({
            timestamp: Date.now(),
            articles: unique,
        }));
    } catch {}

    return unique;
}

// ===== HELPERS =====
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function getTimeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `قبل ${Math.floor(diff / 86400)} يوم`;
    return formatDateArabic(dateStr);
}

function formatDateArabic(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ===== RENDER NEWS =====
function renderNewsCards(articles, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><p>جاري تحميل الأخبار...</p></div>';
        return;
    }

    container.innerHTML = articles.map(a => {
        const catInfo = window.SmartCategorizer ? window.SmartCategorizer.classify(a.title, a.summary || '', a.category || '') : { categoryName: a.category, categoryIcon: '📰', subcategory: '' };
        const catBadge = catInfo.subcategory ? `${catInfo.categoryIcon} ${catInfo.categoryName} · ${catInfo.subcategory}` : `${catInfo.categoryIcon} ${catInfo.categoryName}`;
        const imgProxy = window.NEWS_CONFIG?.imgProxy || 'https://images.weserv.nl/?url=';
        const proxiedImg = a.image ? imgProxy + encodeURIComponent(a.image) : '';
        const imgHtml = a.image ? `<img src="${proxiedImg}" data-original="${a.image}" alt="" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:6px 6px 0 0;" loading="lazy" onerror="handleImgError(this)">` : '<div class="no-img">📰</div>';
        return `
        <a href="${a.link}" target="_blank" rel="noopener" class="latest-card" data-category="${a.category}">
            ${imgHtml}
            <div class="latest-card-body">
                <span class="card-cat">${catBadge}</span>
                <h3>${escapeHtmlLive(a.title)}</h3>
                <span class="card-date">${a.sourceLogo} ${a.source} · ${a.timeAgo}</span>
                <span class="read-more">اقرأ المزيد ←</span>
            </div>
        </a>`}).join('');
}

function renderBreakingNews(articles, containerId) {
    const container = document.getElementById(containerId);
    if (!container || articles.length === 0) return;

    const breaking = articles.slice(0, 5);
    container.innerHTML = breaking.map((a, i) =>
        `<a href="${a.link}" target="_blank" rel="noopener">${a.title}</a>${i < breaking.length - 1 ? '<span class="ticker-sep">|</span>' : ''}`
    ).join('');
}

function renderSliderNews(articles, containerId) {
    const container = document.getElementById(containerId);
    if (!container || articles.length === 0) return;

    const featured = articles.filter(a => a.image).slice(0, 4);
    const dotsContainer = document.getElementById('sliderDots');

    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    featured.forEach((a, i) => {
        const slide = document.createElement('div');
        slide.className = 'slide' + (i === 0 ? ' active' : '');
        const slideImgProxy = window.NEWS_CONFIG?.imgProxy || 'https://images.weserv.nl/?url=';
        const slideProxiedImg = a.image ? slideImgProxy + encodeURIComponent(a.image) : '';
        slide.innerHTML = `
            <div class="slide-img">
                <img src="${slideProxiedImg}" data-original="${a.image}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="handleImgError(this)">
                <div class="slide-overlay">
                    <span class="slide-category">${a.sourceLogo} ${a.source}</span>
                    <h2><a href="${a.link}" target="_blank" rel="noopener">${escapeHtmlLive(a.title)}</a></h2>
                    <span class="slide-date">${a.timeAgo}</span>
                </div>
            </div>
        `;
        container.appendChild(slide);

        if (dotsContainer) {
            const dot = document.createElement('span');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => window.goToSlide && window.goToSlide(i);
            dotsContainer.appendChild(dot);
        }
    });
}

function escapeHtmlLive(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== IMAGE ERROR HANDLER WITH PROXY FALLBACK =====
function handleImgError(img) {
    const original = img.getAttribute('data-original');
    const currentSrc = img.src;

    // If we tried proxy and it failed, try original
    if (currentSrc.includes('weserv.nl') && original && !img.dataset.triedOriginal) {
        img.dataset.triedOriginal = '1';
        img.src = original;
        return;
    }

    // If we tried original and it failed, try another proxy
    if (!currentSrc.includes('wsrv.nl') && original && !img.dataset.triedWsrv) {
        img.dataset.triedWsrv = '1';
        img.src = 'https://wsrv.nl/?url=' + encodeURIComponent(original);
        return;
    }

    // All proxies failed, show placeholder
    img.outerHTML = '<div class="no-img">📰</div>';
}

// Make it global
window.handleImgError = handleImgError;

// ===== AUTO REFRESH =====
let refreshInterval = null;

function startAutoRefresh(intervalMs = 5 * 60 * 1000) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
        localStorage.removeItem(NEWS_CONFIG.cacheKey);
        const articles = await fetchAllNews();
        updateHomePage(articles);
    }, intervalMs);
}

function updateHomePage(articles) {
    renderSliderNews(articles, 'heroSlider');
    renderBreakingNews(articles, 'tickerContent');
    renderNewsCards(articles.slice(0, 6), 'articlesGrid');
    renderNewsCards(articles, 'latestGrid');
}

// ===== CATEGORY FILTER =====
function filterByCategory(articles, category) {
    if (!category || category === 'all') return articles;
    return articles.filter(a => a.category === category);
}

// ===== INIT =====
async function initLiveNews() {
    const articles = await fetchAllNews();
    updateHomePage(articles);
    startAutoRefresh();
    return articles;
}

// Export for use
window.AjelNews = {
    fetchAllNews,
    initLiveNews,
    renderNewsCards,
    renderBreakingNews,
    renderSliderNews,
    filterByCategory,
    startAutoRefresh,
};
