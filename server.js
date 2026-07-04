const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ajel_news_secret_key_2024';

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
    const { section, section_id, limit, offset, featured, breaking, slider, status, latest } = req.query;
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
    res.json(articles);
});

// Public: single article
app.get('/api/articles/:id', (req, res) => {
    const article = db.prepare(`
        SELECT a.*, s.name as section_name, s.slug as section_slug
        FROM articles a LEFT JOIN sections s ON a.section_id = s.id
        WHERE a.id = ?
    `).get(req.params.id);
    if (!article) return res.status(404).json({ error: 'المقال غير موجود' });

    // Increment views
    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(req.params.id);
    article.views += 1;

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

    res.json({ id: result.lastInsertRowid, success: true });
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
    res.json(db.prepare(query).all(...params));
});

app.get('/api/opinions/:id', (req, res) => {
    const article = db.prepare('SELECT * FROM opinion_articles WHERE id = ?').get(req.params.id);
    if (!article) return res.status(404).json({ error: 'المقال غير موجود' });
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

    res.json({
        totalArticles, publishedArticles, draftArticles, totalOpinions, totalViews, sections, recentArticles
    });
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
        for (const [key, value] of Object.entries(items)) {
            upsert.run(key, value);
        }
    });
    updateMany(req.body);
    res.json({ success: true });
});

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

// ===== START SERVER =====
// Catch-all for sub-routes (admin/anything, section/anything)
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 عاجل نيوز يعمل على المنفذ ${PORT}`);
    console.log(`📰 الموقع: http://localhost:${PORT}`);
    console.log(`🔧 الإدارة: http://localhost:${PORT}/admin`);
    console.log(`👤 تسجيل الدخول: admin / admin123`);
});
