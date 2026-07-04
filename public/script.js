/* ========================================
   AJEL.SA - عاجل نيوز - JavaScript
   Slider, Ticker, Navigation, Interactions
   ======================================== */

const API_BASE = '';

// ===== LOAD DATA FROM API =====
async function loadHomeData() {
    try {
        // Load sections for nav
        const sections = await fetch(API_BASE + '/api/sections').then(r => r.json());
        // Load slider articles
        const sliderArticles = await fetch(API_BASE + '/api/articles?slider=1&limit=5').then(r => r.json());
        // Load breaking articles
        const breakingArticles = await fetch(API_BASE + '/api/articles?breaking=1&limit=5').then(r => r.json());
        // Load latest articles
        const latestArticles = await fetch(API_BASE + '/api/articles?limit=12').then(r => r.json());
        // Load featured articles
        const featuredArticles = await fetch(API_BASE + '/api/articles?featured=1&limit=10').then(r => r.json());
        // Load opinions
        const opinions = await fetch(API_BASE + '/api/opinions?limit=4').then(r => r.json());

        // Update slider
        if (sliderArticles.length > 0) updateSlider(sliderArticles);
        // Update breaking ticker
        if (breakingArticles.length > 0) updateTicker(breakingArticles);
        // Update latest news
        if (latestArticles.length > 0) updateLatestNews(latestArticles);
        // Update opinions
        if (opinions.length > 0) updateOpinions(opinions);
    } catch (err) {
        console.log('API not available, using static content');
    }
}

function updateSlider(articles) {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;
    const dotsContainer = document.getElementById('sliderDots');
    slider.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    articles.forEach((a, i) => {
        const slide = document.createElement('div');
        slide.className = 'slide' + (i === 0 ? ' active' : '');
        slide.innerHTML = `
            <div class="slide-img">
                ${a.image ? `<img src="${a.image}" alt="" style="width:100%;height:100%;object-fit:cover;">` : `<div class="img-placeholder" style="background:#1a1a2e;"><span>صورة الخبر</span></div>`}
                <div class="slide-overlay">
                    <span class="slide-category">${a.section_name || ''}</span>
                    <h2><a href="/article?id=${a.id}">${a.title}</a></h2>
                    <span class="slide-date">${formatDateAr(a.created_at)}</span>
                </div>
            </div>
        `;
        slider.appendChild(slide);

        if (dotsContainer) {
            const dot = document.createElement('span');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => goToSlide(i);
            dotsContainer.appendChild(dot);
        }
    });
}

function updateTicker(articles) {
    const content = document.querySelector('.ticker-content');
    if (!content) return;
    content.innerHTML = articles.map((a, i) =>
        `<a href="/article?id=${a.id}">${a.title}</a>${i < articles.length - 1 ? '<span class="ticker-sep">|</span>' : ''}`
    ).join('');
}

function updateLatestNews(articles) {
    // Update latest grid
    const grid = document.querySelector('.latest-grid');
    if (grid) {
        grid.innerHTML = articles.slice(0, 6).map(a => `
            <a href="/article?id=${a.id}" class="latest-card">
                ${a.image ? `<img src="${a.image}" alt="" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:6px 6px 0 0;">` : `<div class="img-placeholder card" style="background:#e63946;"><span>صورة</span></div>`}
                <div class="latest-card-body">
                    <span class="card-cat">${a.section_name || ''}</span>
                    <h3>${a.title}</h3>
                    <span class="card-date">${formatDateAr(a.created_at)}</span>
                    <span class="read-more">اقرأ المزيد ←</span>
                </div>
            </a>
        `).join('');
    }
}

function updateOpinions(opinions) {
    const grid = document.querySelector('.opinion-grid');
    if (!grid) return;
    grid.innerHTML = opinions.map(o => `
        <a href="/article?id=${o.id}&type=opinion" class="opinion-card">
            <div class="opinion-author">
                <div class="author-avatar" style="background:${o.author_color || '#d71920'};">${o.author_letter || o.author_name.charAt(0)}</div>
                <div class="author-info">
                    <span class="author-name">${o.author_name}</span>
                </div>
            </div>
            <h3>${o.title}</h3>
            <p>${o.summary || ''}</p>
        </a>
    `).join('');
}

function formatDateAr(d) {
    if (!d) return '';
    const date = new Date(d);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return days[date.getDay()] + ' ' + date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

// ===== DYNAMIC META TAGS FOR SHARING =====
function updateMetaTags(article) {
    if (!article) return;

    const title = article.title + ' — عاجل نيوز';
    const description = (article.summary || article.title).substring(0, 160);
    const image = article.image ? 'https://images.weserv.nl/?url=' + encodeURIComponent(article.image) : '';
    const url = window.location.href;

    // Update page title
    document.title = title;

    // Update Open Graph
    updateMeta('og:type', 'article');
    updateMeta('og:title', title);
    updateMeta('og:description', description);
    updateMeta('og:url', url);
    if (image) {
        updateMeta('og:image', image);
        updateMeta('og:image:width', '1200');
        updateMeta('og:image:height', '630');
    }

    // Update Twitter Card
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    if (image) updateMeta('twitter:image', image);

    // Update canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = url;
}

function updateMeta(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
    if (meta) meta.setAttribute('content', content);
}

// ===== SECTION ROUTING (GitHub Pages SPA) =====
(function() {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    const articleId = params.get('id');
    const articleType = params.get('type');

    if (section || articleId) {
        // We're on a section/article page, load section.html logic
        document.addEventListener('DOMContentLoaded', function() {
            loadSectionPage(section, articleId, articleType);
        });
    }
})();

async function loadSectionPage(section, articleId, articleType) {
    const sectionNames = {
        'local': 'المحليات', 'economy': 'الاقتصاد', 'sports': 'رياضة',
        'international': 'مدارات عالمية', 'jobs': 'وظائف', 'entertainment': 'الترفيه',
        'misc': 'منوعات', 'tourism': 'سياحة وسفر', 'society': 'مجتمع', 'worldcup': 'المونديال',
        'opinion': 'مقالات الرأي', 'latest-news': 'آخر الأخبار',
    };

    // Update title
    if (section) {
        document.title = (sectionNames[section] || section) + ' — عاجل';
        const header = document.querySelector('.section-header h2');
        if (header) header.textContent = sectionNames[section] || section;
    }

    // Load articles from static data
    try {
        const data = await fetch('/Tae/data/news.json').then(r => r.json());
        let articles = data.articles || [];

        // If viewing a specific article
        if (articleId) {
            const article = articles.find(a => a.id == articleId);
            if (article) {
                updateMetaTags(article);
                showArticleView(article);
                return;
            }
        }

        if (section && section !== 'latest-news') {
            articles = articles.filter(a => a.category === section);
        }

        const grid = document.querySelector('.latest-grid');
        if (grid && articles.length > 0) {
            if (window.AjelNews) {
                window.AjelNews.renderNewsCards(articles.slice(0, 12), grid.id || 'articlesGrid');
            }
        }
    } catch (err) {
        console.log('Section load error:', err);
    }
}

// ===== PAGINATION SYSTEM (Optimized) =====
const Pagination = {
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
    totalPages: 0,
    allArticles: [],
    loadedPages: new Set(),
    pageCache: {},

    async init() {
        // Load lightweight index first
        try {
            const index = await fetch('/Tae/data/index.json').then(r => r.json());
            this.totalItems = index.count;
            this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            this.allArticles = index.articles;
            this.currentPage = 1;
            await this.loadPage(1);
            this.render();
        } catch (err) {
            console.log('Pagination init error:', err);
            // Fallback to full data
            const data = await fetch('/Tae/data/news.json').then(r => r.json());
            this.allArticles = data.articles;
            this.totalItems = data.articles.length;
            this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            this.currentPage = 1;
            this.render();
        }
    },

    async loadPage(page) {
        // Try paginated file first (fast)
        try {
            if (this.pageCache[page]) {
                return this.pageCache[page];
            }
            const data = await fetch(`/Tae/data/page-${page}.json`).then(r => r.json());
            this.pageCache[page] = data.articles;
            return data.articles;
        } catch {
            // Fallback: slice from full data
            const start = (page - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.allArticles.slice(start, end);
        }
    },

    getPageArticles(page) {
        const start = (page - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.allArticles.slice(start, end);
    },

    render() {
        const wrap = document.getElementById('paginationWrap');
        const info = document.getElementById('paginationInfo');
        const controls = document.getElementById('paginationControls');
        const loadMore = document.getElementById('loadMoreWrap');

        if (!wrap || !info || !controls) return;

        if (this.totalPages <= 1) {
            wrap.style.display = 'none';
            if (loadMore) loadMore.style.display = 'none';
            return;
        }

        wrap.style.display = 'flex';
        if (loadMore) loadMore.style.display = 'none';

        // Info text
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        info.textContent = `عرض ${start}-${end} من ${this.totalItems} خبر`;

        // Controls
        let html = '';

        // Previous button
        if (this.currentPage > 1) {
            html += `<button class="page-btn" onclick="Pagination.goToPage(${this.currentPage - 1})">→ السابق</button>`;
        }

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="page-btn" onclick="Pagination.goToPage(1)">1</button>`;
            if (startPage > 2) html += `<span class="page-dots">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="Pagination.goToPage(${i})">${i}</button>`;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) html += `<span class="page-dots">...</span>`;
            html += `<button class="page-btn" onclick="Pagination.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            html += `<button class="page-btn" onclick="Pagination.goToPage(${this.currentPage + 1})">التالي ←</button>`;
        }

        controls.innerHTML = html;
    },

    async goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;

        // Show loading skeleton
        const grid = document.getElementById('articlesGrid');
        if (grid) {
            grid.innerHTML = Array(6).fill('<div class="latest-card skeleton" style="height:300px;"></div>').join('');
        }

        // Load page data (paginated file is much faster)
        const articles = await this.loadPage(page);

        // Render articles
        if (grid && window.AjelNews) {
            window.AjelNews.renderNewsCards(articles, 'articlesGrid');
        }

        // Update pagination
        this.render();

        // Scroll to top of news section
        const section = document.querySelector('.latest-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        history.pushState({}, '', url);
    }
};

// Load more news (for initial load)
async function loadMoreNews() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) {
        btn.textContent = 'جاري التحميل...';
        btn.disabled = true;
    }

    try {
        const articles = await window.AjelNews.fetchAllNews();
        if (articles && articles.length > 0) {
            Pagination.init(articles);
            const pageArticles = Pagination.getPageArticles(1);
            window.AjelNews.renderNewsCards(pageArticles, 'articlesGrid');
            Pagination.render();
        }
    } catch (err) {
        console.error('Load more error:', err);
    }

    if (btn) {
        btn.textContent = 'تحميل المزيد من الأخبار';
        btn.disabled = false;
    }
}

// ===== ARTICLE VIEW =====
function showArticleView(article) {
    const main = document.querySelector('main') || document.getElementById('content');
    if (!main) return;

    // Hide home sections
    const homeSections = main.querySelectorAll('.hero-section, .worldcup-section, .trending-bar, .opinion-section');
    homeSections.forEach(s => s.style.display = 'none');

    const newsSection = main.querySelector('.section');
    if (newsSection) newsSection.style.display = '';

    const grid = main.querySelector('.latest-grid');
    if (!grid) return;

    const readTime = Math.max(1, Math.ceil((article.summary || '').split(' ').length / 3));
    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(article.title);
    const imgHtml = article.image ? `<img src="https://images.weserv.nl/?url=${encodeURIComponent(article.image)}" alt="${article.title}" style="width:100%;max-height:450px;object-fit:cover;border-radius:12px;margin-bottom:24px;" onerror="this.style.display='none'">` : '';

    grid.innerHTML = `
        <div style="max-width:800px;margin:0 auto;grid-column:1/-1;">
            <a href="/Tae/" style="color:#d71920;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;text-decoration:none;">← العودة للرئيسية</a>
            <span style="display:inline-block;background:#d71920;color:#fff;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;margin-bottom:10px;">${article.source || ''}</span>
            <h1 style="font-size:28px;font-weight:800;line-height:1.5;margin-bottom:12px;font-family:'Noto Kufi Arabic',sans-serif;">${article.title}</h1>
            <div style="font-size:13px;color:#888;margin-bottom:20px;display:flex;gap:15px;flex-wrap:wrap;">
                <span>🕐 ${readTime} دقائق للقراءة</span>
                <span>📅 ${new Date(article.date).toLocaleDateString('ar-SA')}</span>
                <span>📰 ${article.source || ''}</span>
            </div>
            ${imgHtml}
            <div style="font-size:17px;line-height:2;color:#333;margin-bottom:30px;">
                ${(article.summary || '').split('\n').map(p => p.trim() ? `<p style="margin-bottom:18px;">${p}</p>` : '').join('')}
            </div>
            <!-- Share Buttons -->
            <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:30px;">
                <h3 style="font-size:16px;font-weight:800;margin-bottom:12px;">مشاركة الخبر</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#000;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">𝕏 تويتر</a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#1877f2;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">f فيسبوك</a>
                    <a href="https://wa.me/?text=${shareTitle}%20${shareUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#25d366;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">📱 واتساب</a>
                    <a href="https://t.me/share/url?url=${shareUrl}&text=${shareTitle}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#0088cc;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">✈️ تلجرام</a>
                    <button onclick="navigator.clipboard.writeText(window.location.href);this.textContent='✅ تم النسخ';setTimeout(()=>this.textContent='🔗 نسخ الرابط',2000)" style="display:inline-flex;align-items:center;gap:6px;background:#666;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;border:none;cursor:pointer;">🔗 نسخ الرابط</button>
                </div>
            </div>
            <a href="/Tae/" style="color:#d71920;font-size:14px;font-weight:700;">← العودة للرئيسية</a>
        </div>
    `;

    // Update header
    const header = main.querySelector('.section-header h2');
    if (header) header.textContent = article.source || 'المقال';
}

// ===== LIVE NEWS (Static data + Client-side RSS fallback) =====
async function loadLiveNews() {
    try {
        // First try static data (from GitHub Actions)
        const staticData = await fetch('/data/news.json').then(r => r.ok ? r.json() : null).catch(() => null);
        if (staticData && staticData.articles && staticData.articles.length > 0) {
            console.log(`[عاجل] تم تحميل ${staticData.count} خبر من البيانات المحفوظة`);
            if (window.AjelNews) {
                window.AjelNews.renderSliderNews(staticData.articles, 'heroSlider');
                window.AjelNews.renderBreakingNews(staticData.articles, 'tickerContent');
                window.AjelNews.renderNewsCards(staticData.articles.slice(0, 6), 'articlesGrid');
            }
            return;
        }
    } catch {}

    // Fallback: client-side RSS fetch
    try {
        if (window.AjelNews) {
            const articles = await window.AjelNews.initLiveNews();
            if (articles && articles.length > 0) {
                console.log(`[عاجل] تم جلب ${articles.length} خبر مباشرة`);
            }
        }
    } catch (err) {
        console.log('[عاجل] Live news unavailable:', err.message);
    }
}

// Load live news
loadLiveNews();

// Load data on page load
loadHomeData();

document.addEventListener('DOMContentLoaded', function () {

    // ===== HERO SLIDER =====
    const slides = document.querySelectorAll('#heroSlider .slide');
    const dots = document.querySelectorAll('#sliderDots .dot');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    let currentSlide = 0;
    let slideInterval;

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
        stopAutoSlide();
        prevSlide();
        startAutoSlide();
    });

    if (nextBtn) nextBtn.addEventListener('click', function () {
        stopAutoSlide();
        nextSlide();
        startAutoSlide();
    });

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            stopAutoSlide();
            goToSlide(index);
            startAutoSlide();
        });
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    const sliderEl = document.getElementById('heroSlider');

    if (sliderEl) {
        sliderEl.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sliderEl.addEventListener('touchend', function (e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            stopAutoSlide();
            if (diff > 0) {
                nextSlide(); // swipe left = next
            } else {
                prevSlide(); // swipe right = prev
            }
            startAutoSlide();
        }
    }

    startAutoSlide();


    // ===== MOBILE MENU =====
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navList = document.getElementById('navList');

    if (menuBtn && navList) {
        menuBtn.addEventListener('click', function () {
            navList.classList.toggle('open');
            menuBtn.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (!menuBtn.contains(e.target) && !navList.contains(e.target)) {
                navList.classList.remove('open');
                menuBtn.classList.remove('active');
            }
        });
    }


    // ===== STICKY NAV SHADOW =====
    const mainNav = document.getElementById('mainNav');

    function handleNavScroll() {
        if (window.scrollY > 100) {
            mainNav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        } else {
            mainNav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        }
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });


    // ===== BACK TO TOP =====
    const backToTop = document.getElementById('backToTop');

    function handleBackToTop() {
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', handleBackToTop, { passive: true });

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ===== TICKER PAUSE ON HOVER =====
    const tickerContent = document.querySelector('.ticker-content');

    if (tickerContent) {
        tickerContent.addEventListener('mouseenter', function () {
            this.style.animationPlayState = 'paused';
        });

        tickerContent.addEventListener('mouseleave', function () {
            this.style.animationPlayState = 'running';
        });
    }


    // ===== LAZY LOAD ANIMATION (Intersection Observer) =====
    const animateElements = document.querySelectorAll('.latest-card, .trending-item, .section-col, .opinion-card, .side-story, .news-list-item');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animateElements.forEach(function (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    }


    // ===== SIDEBAR SCROLL =====
    const sidebarNews = document.querySelector('.sidebar-news');

    if (sidebarNews) {
        let isDown = false;
        let startY;
        let scrollTop;

        sidebarNews.addEventListener('mousedown', function (e) {
            isDown = true;
            startY = e.pageY - sidebarNews.offsetTop;
            scrollTop = sidebarNews.scrollTop;
        });

        sidebarNews.addEventListener('mouseleave', function () {
            isDown = false;
        });

        sidebarNews.addEventListener('mouseup', function () {
            isDown = false;
        });

        sidebarNews.addEventListener('mousemove', function (e) {
            if (!isDown) return;
            e.preventDefault();
            var y = e.pageY - sidebarNews.offsetTop;
            var walk = (y - startY) * 2;
            sidebarNews.scrollTop = scrollTop - walk;
        });
    }


    // ===== SEARCH FOCUS ANIMATION =====
    const searchInput = document.querySelector('.header-search input');

    if (searchInput) {
        searchInput.addEventListener('focus', function () {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.transition = 'transform 0.2s ease';
        });

        searchInput.addEventListener('blur', function () {
            this.parentElement.style.transform = 'scale(1)';
        });
    }


    // ===== NUMBERED ITEMS HOVER EFFECT =====
    const numberedItems = document.querySelectorAll('.numbered-item');

    numberedItems.forEach(function (item) {
        item.addEventListener('mouseenter', function () {
            const num = this.querySelector('.num');
            if (num) {
                num.style.transform = 'scale(1.1)';
                num.style.transition = 'transform 0.2s ease';
            }
        });

        item.addEventListener('mouseleave', function () {
            const num = this.querySelector('.num');
            if (num) {
                num.style.transform = 'scale(1)';
            }
        });
    });


    // ===== LIVE BADGE PULSE =====
    const liveBadges = document.querySelectorAll('.wc-live-badge, .trending-badge');

    liveBadges.forEach(function (badge) {
        setInterval(function () {
            badge.style.opacity = badge.style.opacity === '0.5' ? '1' : '0.5';
        }, 1000);
    });


    // ===== CURRENT TIME IN HEADER =====
    function updateTime() {
        const now = new Date();
        const options = {
            timeZone: 'Asia/Riyadh',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const timeStr = now.toLocaleTimeString('ar-SA', options);
        // You can append this to header if needed
    }

    updateTime();
    setInterval(updateTime, 60000);

});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K = Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const fullSearch = document.getElementById('fullSearch');
            if (fullSearch) fullSearch.style.display = 'block';
            searchInput.focus();
        }
    }
    // Escape = Close search
    if (e.key === 'Escape') {
        const fullSearch = document.getElementById('fullSearch');
        if (fullSearch) fullSearch.style.display = 'none';
    }
    // D = Toggle dark mode
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        toggleDarkMode();
    }
});
