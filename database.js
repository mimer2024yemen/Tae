const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'ajel.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== CREATE TABLES =====
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT DEFAULT '',
        content TEXT DEFAULT '',
        image TEXT DEFAULT '',
        section_id INTEGER NOT NULL,
        is_featured INTEGER DEFAULT 0,
        is_breaking INTEGER DEFAULT 0,
        is_slider INTEGER DEFAULT 0,
        status TEXT DEFAULT 'published',
        views INTEGER DEFAULT 0,
        author_name TEXT DEFAULT 'عاجل',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
    );

    CREATE TABLE IF NOT EXISTS opinion_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT DEFAULT '',
        content TEXT DEFAULT '',
        author_name TEXT NOT NULL,
        author_letter TEXT DEFAULT '',
        author_color TEXT DEFAULT '#d71920',
        image TEXT DEFAULT '',
        status TEXT DEFAULT 'published',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS news_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT DEFAULT 'rss',
        is_active INTEGER DEFAULT 1,
        default_category TEXT DEFAULT 'auto',
        default_image TEXT DEFAULT '',
        attribution TEXT DEFAULT '',
        max_items INTEGER DEFAULT 20,
        fetch_full_content INTEGER DEFAULT 0,
        selectors TEXT DEFAULT '',
        fetch_interval INTEGER DEFAULT 30,
        last_fetch DATETIME,
        last_status TEXT DEFAULT '',
        last_count INTEGER DEFAULT 0,
        last_error TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fetch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER,
        status TEXT DEFAULT 'success',
        new_count INTEGER DEFAULT 0,
        error_message TEXT DEFAULT '',
        details TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES news_sources(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section_id);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);
    CREATE INDEX IF NOT EXISTS idx_articles_breaking ON articles(is_breaking);
    CREATE INDEX IF NOT EXISTS idx_articles_slider ON articles(is_slider);
    CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
    CREATE INDEX IF NOT EXISTS idx_sources_active ON news_sources(is_active);
    CREATE INDEX IF NOT EXISTS idx_logs_source ON fetch_logs(source_id);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON fetch_logs(created_at DESC);
`);

// ===== SEED DEFAULT SECTIONS =====
const sectionCount = db.prepare('SELECT COUNT(*) as count FROM sections').get().count;
if (sectionCount === 0) {
    const insert = db.prepare('INSERT INTO sections (slug, name, icon, sort_order) VALUES (?, ?, ?, ?)');
    const sections = [
        ['local', 'المحليات', '🏛️', 1],
        ['economy', 'الاقتصاد', '💰', 2],
        ['sports', 'رياضة', '⚽', 3],
        ['international', 'مدارات عالمية', '🌍', 4],
        ['jobs', 'وظائف', '💼', 5],
        ['entertainment', 'الترفيه', '🎭', 6],
        ['misc', 'منوعات', '📰', 7],
        ['tourism', 'سياحة وسفر', '✈️', 8],
        ['society', 'مجتمع', '👥', 9],
        ['worldcup', 'المونديال', '🏆', 10],
    ];
    const insertMany = db.transaction((items) => {
        for (const item of items) insert.run(...item);
    });
    insertMany(sections);
}

// ===== SEED DEFAULT ADMIN =====
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
}

// ===== SEED DEFAULT SETTINGS =====
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('site_name', 'عاجل');
    insertSetting.run('site_tagline', 'أ�tar السعودية والخليج والعالم لحظة بلحظة');
    insertSetting.run('site_description', 'صحيفة إلكترونية سعودية تم تأسيسها عام 2007م تهتم بنشر الأخبار المحلية والمنافسة في سبق الأخبار بمهنية ومصداقية وموضوعية');
    insertSetting.run('auto_fetch_enabled', '0');
    insertSetting.run('auto_fetch_interval', '30');
}

module.exports = db;
