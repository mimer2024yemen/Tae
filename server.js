const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const db = require('./database');
const newsFetcher = require('./news-fetcher');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ajel_news_secret_key_2024';
const SITE_URL = process.env.SITE_URL || 'https://mimer2024yemen.github.io/Tae';

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// ===== MULTER CONFIG =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('فقط ملفات الصور مسموحة'));
    }
});

// ===== AUTH MIDDLEWARE =====
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'غير مصرح' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'توكن غير صالح' });
    }
}

// ===== HELPERS =====
function slugify(text) {
    return text
        .replace(/[^\w\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 80);
}

function articleUrl(article) {
    const slug = slugify(article.title);
    return `${SITE_URL}/article/${article.id}/${slug}`;
}

function sectionUrl(slug) {
    return `${SITE_URL}/${slug}`;
}

// =============================
//       AUTH ROUTES
// =============================
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'أدخل اسم المستخدم وكلمة المرور' });

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

// =============================
//       SECTIONS ROUTES
// =============================
app.get('/api/sections', (req, res) => {
    const sections = db.prepare('SELECT * FROM sections WHERE is_active = 1 ORDER BY sort_order').all();
    res.json(sections);
});

app.get('/api/sections/:slug', (req, res) => {
    const section = db.prepare('SELECT * FROM sections WHERE slug = ?').get(req.params.slug);
    if (!section) return res.status(404).json({ error: 'القسم غير موجود' });
    res.json(section);
});

app.put('/api/sections/:id', authMiddleware, (req, res) => {
    const { name, icon, sort_order, is_active } = req.body;
    db.prepare('UPDATE sections SET name = COALESCE(?, name), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), is_active = COALESCE(?, is_active) WHERE id = ?')
        .run(name, icon, sort_order, is_active, req.params.id);
    res.json({ success: true });
});

// =============================
//       ARTICLES ROUTES
// =============================

// Public: get articles with filters
app.get('/api/articles', (req, res) => {
    const { section, section_id, limit, offset, featured, breaking, slider, status } = req.query;
    let query = 'SELECT a.*, s.name as section_name, s.slug as section_slug FROM articles a LEFT JOIN sections s ON a.section_id = s.id WHERE 1=1';
    const params = [];

    if (section) { query += ' AND s.slug = ?'; params.push(section); }
    if (section_id) { query += ' AND a.section_id = ?'; params.push(section_id); }
    if (featured) { query += ' AND a.is_featured = 1'; }
    if (breaking) { query += ' AND a.is_breaking = 1'; }
    if (slider) { query += ' AND a.is_slider = 1'; }
    if (status) { query += ' AND a.status = ?'; params.push(status); }
    else { query += " AND a.status = 'published'"; }

    query += ' ORDER BY a.created_at DESC';

    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
    if (offset) { query += ' OFFSET ?'; params.push(parseInt(offset)); }

    const articles = db.prepare(query).all(...params);

    // Add share URLs and clean slugs
    const enriched = articles.map(a => ({
        ...a,
        url: articleUrl(a),
        share_url: articleUrl(a),
        share_twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(articleUrl(a))}`,
        share_facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl(a))}`,
        share_whatsapp: `https://wa.me/?text=${encodeURIComponent(a.title + '\n' + articleUrl(a))}`,
        share_telegram: `https://t.me/share/url?url=${encodeURIComponent(articleUrl(a))}&text=${encodeURIComponent(a.title)}`,
    }));

    res.json(enriched);
});

// Public: single article by ID (supports /article/123 and /article/123/slug)
app.get('/api/articles/:id', (req, res) => {
    const article = db.prepare(`
        SELECT a.*, s.name as section_name, s.slug as section_slug
        FROM articles a LEFT JOIN sections s ON a.section_id = s.id
        WHERE a.id = ?
    `).get(req.params.id);
    if (!article) return res.status(404).json({ error: 'المقال غير موجود' });

    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(req.params.id);
    article.views += 1;

    // Enrich with URLs
    article.url = articleUrl(article);
    article.canonical = articleUrl(article);
    article.share_url = articleUrl(article);
    article.share_twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl(article))}`;
    article.share_facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl(article))}`;
    article.share_whatsapp = `https://wa.me/?text=${encodeURIComponent(article.title + '\n' + articleUrl(article))}`;
    article.share_telegram = `https://t.me/share/url?url=${encodeURIComponent(articleUrl(article))}&text=${encodeURIComponent(article.title)}`;
    article.share_linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl(article))}`;

    // Related articles from same section
    article.related = db.prepare(`
        SELECT id, title, image, created_at FROM articles
        WHERE section_id = ? AND id != ? AND status = 'published'
        ORDER BY created_at DESC LIMIT 5
    `).all(article.section_id, article.id);
    article.related = article.related.map(r => ({ ...r, url: articleUrl(r) }));

    res.json(article);
});

// Admin: create article
app.post('/api/articles', authMiddleware, (req, res) => {
    const { title, summary, content, image, section_id, is_featured, is_breaking, is_slider, status, author_name } = req.body;
    if (!title || !section_id) return res.status(400).json({ error: 'العنوان والقسم مطلوبان' });

    const result = db.prepare(`
        INSERT INTO articles (title, summary, content, image, section_id, is_featured, is_breaking, is_slider, status, author_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, summary || '', content || '', image || '', section_id, is_featured ? 1 : 0, is_breaking ? 1 : 0, is_slider ? 1 : 0, status || 'published', author_name || 'عاجل');

    res.json({ id: result.lastInsertRowid, success: true, url: articleUrl({ id: result.lastInsertRowid, title }) });
});

// Admin: update article
app.put('/api/articles/:id', authMiddleware, (req, res) => {
    const { title, summary, content, image, section_id, is_featured, is_breaking, is_slider, status, author_name } = req.body;

    db.prepare(`
        UPDATE articles SET
            title = COALESCE(?, title),
            summary = COALESCE(?, summary),
            content = COALESCE(?, content),
            image = COALESCE(?, image),
            section_id = COALESCE(?, section_id),
            is_featured = COALESCE(?, is_featured),
            is_breaking = COALESCE(?, is_breaking),
            is_slider = COALESCE(?, is_slider),
            status = COALESCE(?, status),
            author_name = COALESCE(?, author_name),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(title, summary, content, image, section_id, is_featured, is_breaking, is_slider, status, author_name, req.params.id);

    res.json({ success: true });
});

// Admin: delete article
app.delete('/api/articles/:id', authMiddleware, (req, res) => {
    const article = db.prepare('SELECT image FROM articles WHERE id = ?').get(req.params.id);
    if (article?.image) {
        const imgPath = path.join(__dirname, article.image);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// =============================
//       OPINION ROUTES
// =============================
app.get('/api/opinions', (req, res) => {
    const { limit, status } = req.query;
    let query = 'SELECT * FROM opinion_articles WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    else { query += " AND status = 'published'"; }
    query += ' ORDER BY created_at DESC';
    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
    const opinions = db.prepare(query).all(...params);

    const enriched = opinions.map(o => ({
        ...o,
        url: `${SITE_URL}/opinion/${o.id}`,
        share_url: `${SITE_URL}/opinion/${o.id}`,
        share_twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(o.title)}&url=${encodeURIComponent(SITE_URL + '/opinion/' + o.id)}`,
        share_facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL + '/opinion/' + o.id)}`,
        share_whatsapp: `https://wa.me/?text=${encodeURIComponent(o.title + '\n' + SITE_URL + '/opinion/' + o.id)}`,
    }));

    res.json(enriched);
});

app.get('/api/opinions/:id', (req, res) => {
    const article = db.prepare('SELECT * FROM opinion_articles WHERE id = ?').get(req.params.id);
    if (!article) return res.status(404).json({ error: 'المقال غير موجود' });
    article.url = `${SITE_URL}/opinion/${article.id}`;
    article.share_url = article.url;
    article.share_twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(article.url)}`;
    article.share_facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.url)}`;
    article.share_whatsapp = `https://wa.me/?text=${encodeURIComponent(article.title + '\n' + article.url)}`;
    article.share_telegram = `https://t.me/share/url?url=${encodeURIComponent(article.url)}&text=${encodeURIComponent(article.title)}`;
    res.json(article);
});

app.post('/api/opinions', authMiddleware, (req, res) => {
    const { title, summary, content, author_name, author_letter, author_color, image, status } = req.body;
    if (!title || !author_name) return res.status(400).json({ error: 'العنوان واسم الكاتب مطلوبان' });
    const result = db.prepare(`
        INSERT INTO opinion_articles (title, summary, content, author_name, author_letter, author_color, image, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, summary || '', content || '', author_name, author_letter || author_name.charAt(0), author_color || '#d71920', image || '', status || 'published');
    res.json({ id: result.lastInsertRowid, success: true });
});

app.put('/api/opinions/:id', authMiddleware, (req, res) => {
    const { title, summary, content, author_name, author_letter, author_color, image, status } = req.body;
    db.prepare(`
        UPDATE opinion_articles SET
            title = COALESCE(?, title), summary = COALESCE(?, summary), content = COALESCE(?, content),
            author_name = COALESCE(?, author_name), author_letter = COALESCE(?, author_letter),
            author_color = COALESCE(?, author_color), image = COALESCE(?, image),
            status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(title, summary, content, author_name, author_letter, author_color, image, status, req.params.id);
    res.json({ success: true });
});

app.delete('/api/opinions/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM opinion_articles WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// =============================
//       IMAGE UPLOAD
// =============================
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    res.json({ url: '/uploads/' + req.file.filename, filename: req.file.filename });
});

app.post('/api/upload-multiple', authMiddleware, upload.array('images', 10), (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    const urls = req.files.map(f => '/uploads/' + f.filename);
    res.json({ urls });
});

// =============================
//       STATS (Admin Dashboard)
// =============================
app.get('/api/stats', authMiddleware, (req, res) => {
    const totalArticles = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
    const publishedArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'published'").get().count;
    const draftArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'draft'").get().count;
    const totalOpinions = db.prepare('SELECT COUNT(*) as count FROM opinion_articles').get().count;
    const totalViews = db.prepare('SELECT COALESCE(SUM(views), 0) as total FROM articles').get().total;
    const sections = db.prepare('SELECT s.name, s.slug, COUNT(a.id) as article_count FROM sections s LEFT JOIN articles a ON s.id = a.section_id GROUP BY s.id ORDER BY s.sort_order').all();
    const recentArticles = db.prepare('SELECT a.id, a.title, a.status, a.created_at, s.name as section_name FROM articles a LEFT JOIN sections s ON a.section_id = s.id ORDER BY a.created_at DESC LIMIT 10').all();

    res.json({ totalArticles, publishedArticles, draftArticles, totalOpinions, totalViews, sections, recentArticles });
});

// =============================
//       SETTINGS
// =============================
app.get('/api/settings', authMiddleware, (req, res) => {
    const settings = {};
    db.prepare('SELECT * FROM settings').all().forEach(s => settings[s.key] = s.value);
    res.json(settings);
});

app.put('/api/settings', authMiddleware, (req, res) => {
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const updateMany = db.transaction((items) => {
        for (const [key, value] of Object.entries(items)) upsert.run(key, value);
    });
    updateMany(req.body);
    res.json({ success: true });
});

// =============================
//       SITEMAP.XML
// =============================
app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');

    const articles = db.prepare("SELECT id, title, created_at, updated_at FROM articles WHERE status = 'published' ORDER BY created_at DESC LIMIT 5000").all();
    const opinions = db.prepare("SELECT id, title, created_at, updated_at FROM opinion_articles WHERE status = 'published' ORDER BY created_at DESC LIMIT 1000").all();
    const sections = db.prepare("SELECT slug, name FROM sections WHERE is_active = 1").all();

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- الرئيسية -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- صفحات الأقسام -->
`;

    sections.forEach(s => {
        xml += `  <url>
    <loc>${sectionUrl(s.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    xml += `
  <!-- أخبار Google News -->
`;

    articles.forEach(a => {
        const pubDate = new Date(a.created_at).toISOString();
        const modDate = new Date(a.updated_at || a.created_at).toISOString();
        const url = articleUrl(a);
        xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${modDate.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <news:news>
      <news:publication>
        <news:name>عاجل</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${a.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</news:title>
    </news:news>
  </url>
`;
    });

    xml += `
  <!-- مقالات الرأي -->
`;

    opinions.forEach(o => {
        const pubDate = new Date(o.created_at).toISOString();
        xml += `  <url>
    <loc>${SITE_URL}/opinion/${o.id}</loc>
    <lastmod>${pubDate.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    res.send(xml);
});

// =============================
//       ROBOTS.TXT
// =============================
app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /uploads/

Sitemap: ${SITE_URL}/sitemap.xml

User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /api/

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /
`);
});

// =============================
//       META TAGS (OG + Twitter)
// =============================
function generateMetaHTML(article, sectionName) {
    const title = article ? `${article.title} — عاجل` : 'عاجل — أخبار السعودية والخليج والعالم';
    const description = article ? (article.summary || article.title).substring(0, 160) : 'صحيفة إلكترونية سعودية تهتم بنشر الأخبار المحلية والمنافسة في سبق الأخبار بمهنية ومصداقية';
    const image = article?.image || `${SITE_URL}/og-default.png`;
    const url = article ? articleUrl(article) : SITE_URL;
    const type = article ? 'article' : 'website';
    const publishedTime = article?.created_at ? new Date(article.created_at).toISOString() : '';
    const section = sectionName || article?.section_name || 'أخبار';

    return `
    <!-- Open Graph -->
    <meta property="og:type" content="${type}">
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${url}">
    <meta property="og:site_name" content="عاجل">
    <meta property="og:locale" content="ar_SA">
    ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}">` : ''}
    <meta property="article:section" content="${section}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="${image}">

    <!-- Canonical -->
    <link rel="canonical" href="${url}">
    `;
}

// API for meta tags (used by frontend JS)
app.get('/api/meta/:type/:id', (req, res) => {
    const { type, id } = req.params;
    let article;
    if (type === 'opinion') {
        article = db.prepare('SELECT * FROM opinion_articles WHERE id = ?').get(id);
    } else {
        article = db.prepare('SELECT a.*, s.name as section_name FROM articles a LEFT JOIN sections s ON a.section_id = s.id WHERE a.id = ?').get(id);
    }
    if (!article) return res.status(404).json({ error: 'Not found' });

    res.json({
        title: article.title,
        description: (article.summary || article.title).substring(0, 160),
        image: article.image || '',
        url: type === 'opinion' ? `${SITE_URL}/opinion/${id}` : articleUrl(article),
        type: type === 'opinion' ? 'article' : 'article',
        section: article.section_name || '',
        published_at: article.created_at,
        share: {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(type === 'opinion' ? SITE_URL + '/opinion/' + id : articleUrl(article))}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(type === 'opinion' ? SITE_URL + '/opinion/' + id : articleUrl(article))}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(article.title + '\n' + (type === 'opinion' ? SITE_URL + '/opinion/' + id : articleUrl(article)))}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(type === 'opinion' ? SITE_URL + '/opinion/' + id : articleUrl(article))}&text=${encodeURIComponent(article.title)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(type === 'opinion' ? SITE_URL + '/opinion/' + id : articleUrl(article))}`,
            copy: type === 'opinion' ? `${SITE_URL}/opinion/${id}` : articleUrl(article),
        }
    });
});

// =============================
//       NEWS SOURCES (Admin)
// =============================
app.get('/api/sources', authMiddleware, (req, res) => {
    const sources = db.prepare('SELECT * FROM news_sources ORDER BY created_at DESC').all();
    res.json(sources);
});

app.get('/api/sources/presets', authMiddleware, (req, res) => {
    const extendedPresets = [
        ...newsFetcher.PRESET_SOURCES,
        { name: 'RT', url: 'https://www.rt.com/rss/', type: 'rss', default_category: 'international', attribution: 'RT' },
        { name: 'TRT عربي', url: 'https://www.trt.net.tr/rss', type: 'rss', default_category: 'international', attribution: 'TRT' },
        { name: 'ABC News', url: 'https://feeds.abcnews.com/abcnews/topstories', type: 'rss', default_category: 'international', attribution: 'ABC News' },
        { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss', type: 'rss', default_category: 'international', attribution: 'CNN' },
        { name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', type: 'rss', default_category: 'international', attribution: 'NY Times' },
        { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', type: 'rss', default_category: 'international', attribution: 'The Guardian' },
        { name: 'Arab News', url: 'https://www.arabnews.com/rss.xml', type: 'rss', default_category: 'local', attribution: 'Arab News' },
        { name: 'Gulf News', url: 'https://gulfnews.com/rss', type: 'rss', default_category: 'local', attribution: 'Gulf News' },
        { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', type: 'rss', default_category: 'sports', attribution: 'BBC Sport' },
        { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', type: 'rss', default_category: 'sports', attribution: 'ESPN' },
        { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', type: 'rss', default_category: 'sports', attribution: 'Sky Sports' },
        { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', type: 'rss', default_category: 'economy', attribution: 'Bloomberg' },
        { name: 'Financial Times', url: 'https://www.ft.com/rss/home', type: 'rss', default_category: 'economy', attribution: 'Financial Times' },
        { name: 'Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', type: 'rss', default_category: 'economy', attribution: 'WSJ' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss', default_category: 'misc', attribution: 'TechCrunch' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss', default_category: 'misc', attribution: 'The Verge' },
        { name: 'WIRED', url: 'https://www.wired.com/feed/rss', type: 'rss', default_category: 'misc', attribution: 'WIRED' },
        { name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', type: 'rss', default_category: 'international', attribution: 'NASA' },
    ];
    res.json(extendedPresets);
});

app.post('/api/sources', authMiddleware, (req, res) => {
    const { name, url, type, default_category, default_image, attribution, max_items, fetch_full_content, selectors, fetch_interval } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'الاسم والرابط مطلوبان' });

    const result = db.prepare(`
        INSERT INTO news_sources (name, url, type, default_category, default_image, attribution, max_items, fetch_full_content, selectors, fetch_interval)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, url, type || 'rss', default_category || 'auto', default_image || '', attribution || name, max_items || 20, fetch_full_content ? 1 : 0, typeof selectors === 'string' ? selectors : JSON.stringify(selectors || {}), fetch_interval || 30);

    res.json({ id: result.lastInsertRowid, success: true });
});

app.put('/api/sources/:id', authMiddleware, (req, res) => {
    const { name, url, type, is_active, default_category, default_image, attribution, max_items, fetch_full_content, selectors, fetch_interval } = req.body;
    db.prepare(`
        UPDATE news_sources SET
            name = COALESCE(?, name), url = COALESCE(?, url), type = COALESCE(?, type),
            is_active = COALESCE(?, is_active), default_category = COALESCE(?, default_category),
            default_image = COALESCE(?, default_image), attribution = COALESCE(?, attribution),
            max_items = COALESCE(?, max_items), fetch_full_content = COALESCE(?, fetch_full_content),
            selectors = COALESCE(?, selectors), fetch_interval = COALESCE(?, fetch_interval)
        WHERE id = ?
    `).run(name, url, type, is_active, default_category, default_image, attribution, max_items, fetch_full_content, typeof selectors === 'string' ? selectors : (selectors ? JSON.stringify(selectors) : null), fetch_interval, req.params.id);
    res.json({ success: true });
});

app.delete('/api/sources/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM fetch_logs WHERE source_id = ?').run(req.params.id);
    db.prepare('DELETE FROM news_sources WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Trigger manual fetch for one source
app.post('/api/sources/:id/fetch', authMiddleware, async (req, res) => {
    const source = db.prepare('SELECT * FROM news_sources WHERE id = ?').get(req.params.id);
    if (!source) return res.status(404).json({ error: 'المصدر غير موجود' });
    try {
        const result = await newsFetcher.fetchSource(source);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Trigger manual fetch for all active sources
app.post('/api/sources/fetch-all', authMiddleware, async (req, res) => {
    try {
        const results = await newsFetcher.fetchAllSources();
        const totalNew = results.reduce((sum, r) => sum + (r.newCount || 0), 0);
        res.json({ results, totalNew });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch logs
app.get('/api/fetch-logs', authMiddleware, (req, res) => {
    const { source_id, limit } = req.query;
    let query = 'SELECT fl.*, ns.name as source_name FROM fetch_logs fl LEFT JOIN news_sources ns ON fl.source_id = ns.id WHERE 1=1';
    const params = [];
    if (source_id) { query += ' AND fl.source_id = ?'; params.push(source_id); }
    query += ' ORDER BY fl.created_at DESC';
    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
    else { query += ' LIMIT 50'; }
    res.json(db.prepare(query).all(...params));
});

// Auto-fetch scheduler toggle
app.post('/api/sources/scheduler', authMiddleware, (req, res) => {
    const { enabled, interval } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_fetch_enabled', ?)").run(enabled ? '1' : '0');
    if (interval) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_fetch_interval', ?)").run(String(interval));
    setupScheduler();
    res.json({ success: true, enabled, interval: interval || 30 });
});

app.get('/api/sources/scheduler/status', authMiddleware, (req, res) => {
    const enabled = db.prepare("SELECT value FROM settings WHERE key = 'auto_fetch_enabled'").get()?.value === '1';
    const interval = parseInt(db.prepare("SELECT value FROM settings WHERE key = 'auto_fetch_interval'").get()?.value || '30');
    res.json({ enabled, interval, nextRun: schedulerNextRun });
});

// =============================
//       AUTO-FETCH SCHEDULER
// =============================
let schedulerTask = null;
let schedulerNextRun = null;

function setupScheduler() {
    const enabled = db.prepare("SELECT value FROM settings WHERE key = 'auto_fetch_enabled'").get()?.value === '1';
    const interval = parseInt(db.prepare("SELECT value FROM settings WHERE key = 'auto_fetch_interval'").get()?.value || '30');

    if (schedulerTask) {
        schedulerTask.stop();
        schedulerTask = null;
    }

    if (enabled) {
        // Run every N minutes
        const cronExpr = `*/${Math.max(interval, 5)} * * * *`;
        schedulerTask = cron.schedule(cronExpr, async () => {
            console.log(`[CRON] تشغيل الجلب التلقائي - ${new Date().toISOString()}`);
            try {
                const results = await newsFetcher.fetchAllSources();
                const totalNew = results.reduce((sum, r) => sum + (r.newCount || 0), 0);
                console.log(`[CRON] انتهى الجلب: ${totalNew} خبر جديد`);
            } catch (err) {
                console.error('[CRON] خطأ:', err.message);
            }
        });
        schedulerNextRun = `كل ${interval} دقيقة`;
        console.log(`[SCHEDULER] الجلب التلقائي مفعّل - كل ${interval} دقيقة`);
    } else {
        schedulerNextRun = null;
        console.log('[SCHEDULER] الجلب التلقائي معطّل');
    }
}

// Initialize scheduler on startup
setupScheduler();

// =============================
//       FRONTEND PAGES
// =============================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));

// Section pages
const sectionPages = ['local', 'economy', 'sports', 'international', 'jobs', 'entertainment', 'misc', 'tourism', 'society', 'worldcup', 'opinion', 'latest-news', 'article'];
sectionPages.forEach(page => {
    app.get('/' + page, (req, res) => res.sendFile(path.join(__dirname, 'public', 'section.html')));
});

// Article with slug: /article/123/slug-text
app.get('/article/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'section.html')));
app.get('/article/:id/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'section.html')));

// Opinion with id: /opinion/123
app.get('/opinion/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'section.html')));

// Catch-all for admin sub-routes
app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) {
        return res.sendFile(path.join(__dirname, 'admin', 'index.html'));
    }
    const firstSegment = req.path.split('/')[1];
    if (sectionPages.includes(firstSegment)) {
        return res.sendFile(path.join(__dirname, 'public', 'section.html'));
    }
    next();
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 عاجل نيوز يعمل على المنفذ ${PORT}`);
    console.log(`📰 الموقع: http://localhost:${PORT}`);
    console.log(`🔧 الإدارة: http://localhost:${PORT}/admin`);
    console.log(`🗺️  Sitemap: http://localhost:${PORT}/sitemap.xml`);
    console.log(`👤 تسجيل الدخول: admin / admin123`);
});
