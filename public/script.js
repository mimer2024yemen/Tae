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
