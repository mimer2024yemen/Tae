/* ========================================
   AJEL.SA - عاجل نيوز - JavaScript
   Slider, Ticker, Navigation, Interactions
   ======================================== */

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
