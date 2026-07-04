/**
 * عاجل نيوز - نظام الانتقال السريع (SPA Transitions)
 * انتقال بين الصفحات بدون إعادة تحميل
 */

const PageTransitions = {
    isTransitioning: false,
    cache: {},

    // Initialize
    init() {
        // Intercept all internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            
            // Skip external links, anchors, mailto, tel, and links with target=_blank
            if (!href) return;
            if (href.startsWith('http://') || href.startsWith('https://')) return;
            if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            if (link.target === '_blank') return;
            if (link.hasAttribute('download')) return;

            // Only handle internal navigation
            e.preventDefault();
            this.navigate(href);
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.path) {
                this.loadPage(e.state.path, false);
            }
        });

        // Set initial state
        history.replaceState({ path: window.location.pathname + window.location.search }, '', window.location.href);
    },

    // Navigate to a new page
    async navigate(path) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Update URL
        history.pushState({ path }, '', path);

        // Load page
        await this.loadPage(path, true);

        this.isTransitioning = false;
    },

    // Load page content
    async loadPage(path, animate = true) {
        const main = document.getElementById('content') || document.querySelector('main') || document.querySelector('.content-area');
        if (!main) return;

        // Show loading state
        if (animate) {
            main.style.transition = 'opacity 0.15s ease';
            main.style.opacity = '0.5';
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Determine what to load
        const url = new URL(path, window.location.origin);
        const section = url.searchParams.get('section');
        const articleId = url.searchParams.get('id');

        try {
            if (articleId) {
                await this.loadArticle(articleId, url.searchParams.get('type'), main);
            } else if (section) {
                await this.loadSection(section, main);
            } else {
                await this.loadHome(main);
            }
        } catch (err) {
            console.error('Transition error:', err);
        }

        // Restore opacity
        if (animate) {
            requestAnimationFrame(() => {
                main.style.opacity = '1';
            });
        }

        // Update active nav
        this.updateNav(section);

        // Update title
        const sectionNames = {
            'local': 'المحليات', 'economy': 'الاقتصاد', 'sports': 'رياضة',
            'international': 'مدارات عالمية', 'technology': 'تقنية', 'health': 'صحة',
            'science': 'علوم', 'entertainment': 'الترفيه', 'tourism': 'سياحة وسفر',
            'society': 'مجتمع', 'worldcup': 'المونديال', 'latest-news': 'آخر الأخبار',
        };
        document.title = (sectionNames[section] || 'عاجل') + ' — عاجل نيوز';
    },

    // Load home page content
    async loadHome(main) {
        // Show all sections
        const sections = main.querySelectorAll('.hero-section, .worldcup-section, .trending-bar, .section, .opinion-section');
        sections.forEach(s => s.style.display = '');

        // Re-trigger news load
        if (window.AjelNews) {
            const articles = await window.AjelNews.fetchAllNews();
            window.AjelNews.renderSliderNews(articles, 'heroSlider');
            window.AjelNews.renderBreakingNews(articles, 'tickerContent');
            window.AjelNews.renderNewsCards(articles.slice(0, 6), 'articlesGrid');
        }
    },

    // Load section content
    async loadSection(section, main) {
        // Hide home-specific sections
        const homeSections = main.querySelectorAll('.hero-section, .worldcup-section, .trending-bar, .opinion-section');
        homeSections.forEach(s => s.style.display = 'none');

        // Show news section
        const newsSection = main.querySelector('.section');
        if (newsSection) newsSection.style.display = '';

        // Update header
        const header = main.querySelector('.section-header h2');
        const sectionNames = {
            'local': 'المحليات', 'economy': 'الاقتصاد', 'sports': 'رياضة',
            'international': 'مدارات عالمية', 'technology': 'تقنية', 'health': 'صحة',
            'science': 'علوم', 'entertainment': 'الترفيه', 'tourism': 'سياحة وسفر',
            'society': 'مجتمع', 'worldcup': 'المونديال', 'latest-news': 'آخر الأخبار',
        };
        if (header) header.textContent = sectionNames[section] || section;

        // Load articles
        const articles = await this.getArticles(section);
        const grid = main.querySelector('.latest-grid');
        if (grid && window.AjelNews) {
            window.AjelNews.renderNewsCards(articles, grid.id || 'articlesGrid');
        }
    },

    // Load article content
    async loadArticle(id, type, main) {
        // Hide all sections except article view
        const sections = main.querySelectorAll('.hero-section, .worldcup-section, .trending-bar, .opinion-section');
        sections.forEach(s => s.style.display = 'none');

        const newsSection = main.querySelector('.section');
        if (newsSection) newsSection.style.display = '';

        // Fetch article data
        try {
            const endpoint = type === 'opinion' ? '/api/opinions/' : '/api/articles/';
            const article = await fetch(endpoint + id).then(r => r.json());

            const grid = main.querySelector('.latest-grid');
            if (grid) {
                grid.innerHTML = `
                    <div style="max-width:800px;margin:0 auto;grid-column:1/-1;">
                        <a href="/" style="color:#d71920;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;">← العودة للرئيسية</a>
                        <h1 style="font-size:28px;font-weight:800;line-height:1.5;margin-bottom:12px;font-family:'Noto Kufi Arabic',sans-serif;">${article.title}</h1>
                        <div style="font-size:13px;color:#888;margin-bottom:20px;display:flex;gap:15px;">
                            <span>${article.section_name || article.author_name || ''}</span>
                            <span>${new Date(article.created_at).toLocaleDateString('ar-SA')}</span>
                            <span>${article.views || 0} مشاهدة</span>
                        </div>
                        ${article.image ? `<img src="https://images.weserv.nl/?url=${encodeURIComponent(article.image)}" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px;margin-bottom:20px;" onerror="this.style.display='none'">` : ''}
                        <div style="font-size:17px;line-height:2;color:#333;">
                            ${(article.content || article.summary || '').split('\n').map(p => p.trim() ? `<p style="margin-bottom:18px;">${p}</p>` : '').join('')}
                        </div>
                    </div>
                `;
            }

            // Update header
            const header = main.querySelector('.section-header h2');
            if (header) header.textContent = article.section_name || article.author_name || 'المقال';

        } catch (err) {
            console.error('Article load error:', err);
        }
    },

    // Get articles from cache or fetch
    async getArticles(section) {
        try {
            const data = await fetch('/data/news.json').then(r => r.json());
            let articles = data.articles || [];

            if (section && section !== 'latest-news') {
                articles = articles.filter(a => a.category === section);
            }

            return articles.slice(0, 18);
        } catch {
            return [];
        }
    },

    // Update navigation active state
    updateNav(section) {
        document.querySelectorAll('.nav-list li').forEach(li => li.classList.remove('active'));
        document.querySelectorAll('.nav-list a').forEach(a => {
            const href = a.getAttribute('href');
            if (section && href === '/?section=' + section) {
                a.parentElement.classList.add('active');
            } else if (!section && href === '/') {
                a.parentElement.classList.add('active');
            }
        });
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    PageTransitions.init();
});

// Export
window.PageTransitions = PageTransitions;
