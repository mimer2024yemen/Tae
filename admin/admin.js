/* ========================================
   AJEL ADMIN PANEL - JavaScript
   ======================================== */

const API = '';
let token = localStorage.getItem('ajel_token');
let currentPage = 'dashboard';
let sections = [];
let articlesPage = 1;
const articlesPerPage = 15;

// ===== API HELPERS =====
async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(API + path, { ...options, headers: { ...headers, ...options.headers } });
    if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطأ في الخادم');
    return data;
}

// ===== AUTH =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        token = data.token;
        localStorage.setItem('ajel_token', token);
        showAdmin();
    } catch (err) {
        document.getElementById('loginError').textContent = err.message;
    }
});

function logout() {
    token = null;
    localStorage.removeItem('ajel_token');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminApp').style.display = 'none';
}

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// ===== INIT =====
async function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'flex';
    try {
        const user = await api('/api/auth/me');
        document.getElementById('userName').textContent = user.username;
        await loadSections();
        navigateTo('dashboard');
    } catch {
        logout();
    }
}

// Check if already logged in
if (token) {
    showAdmin();
} else {
    document.getElementById('loginScreen').style.display = 'flex';
}

// ===== NAVIGATION =====
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById('page-' + page);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);

    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    const titles = {
        'dashboard': 'لوحة القيادة',
        'articles': 'إدارة الأخبار',
        'add-article': 'إضافة خبر',
        'opinions': 'مقالات الرأي',
        'add-opinion': 'إضافة مقال رأي',
        'sections': 'الأقسام',
        'media': 'إدارة الصور',
        'settings': 'الإعدادات',
        'sources': 'مصادر الأخبار'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    // Load page data
    if (page === 'dashboard') loadDashboard();
    if (page === 'articles') loadArticles();
    if (page === 'opinions') loadOpinions();
    if (page === 'sections') loadSectionsPage();
    if (page === 'media') loadMedia();
    if (page === 'settings') loadSettings();
    if (page === 'sources') { loadSources(); loadFetchLogs(); }
    if (page === 'add-article') prepareArticleForm();
    if (page === 'add-opinion') prepareOpinionForm();

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.dataset.page);
    });
});

// Mobile menu
document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ===== SECTIONS =====
async function loadSections() {
    sections = await api('/api/sections');
    populateSectionDropdowns();
}

function populateSectionDropdowns() {
    const selectors = ['filterSection', 'articleSection'];
    selectors.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const current = el.value;
        const firstOption = el.querySelector('option:first-child');
        el.innerHTML = '';
        if (firstOption) el.appendChild(firstOption);
        sections.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            el.appendChild(opt);
        });
        if (current) el.value = current;
    });
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const stats = await api('/api/stats');
        document.getElementById('statTotal').textContent = stats.totalArticles;
        document.getElementById('statPublished').textContent = stats.publishedArticles;
        document.getElementById('statDraft').textContent = stats.draftArticles;
        document.getElementById('statViews').textContent = formatNumber(stats.totalViews);
        document.getElementById('statOpinions').textContent = stats.totalOpinions;

        // Sections stats
        const sectionsHtml = stats.sections.map(s => `
            <div class="section-stat-item">
                <div class="sec-icon">${getSectionIcon(s.slug)}</div>
                <span class="sec-name">${s.name}</span>
                <span class="sec-count">${s.article_count}</span>
            </div>
        `).join('');
        document.getElementById('sectionsStats').innerHTML = sectionsHtml;

        // Recent articles
        const recentHtml = stats.recentArticles.map(a => `
            <tr>
                <td>${a.id}</td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(a.title)}</td>
                <td>${a.section_name || '-'}</td>
                <td><span class="badge badge-${a.status}">${a.status === 'published' ? 'منشور' : 'مسودة'}</span></td>
                <td>${formatDate(a.created_at)}</td>
                <td class="action-btns">
                    <button class="btn btn-sm" onclick="editArticle(${a.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteArticle(${a.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        document.getElementById('recentArticlesBody').innerHTML = recentHtml || '<tr><td colspan="6" class="empty-state"><p>لا توجد أخبار بعد</p></td></tr>';
    } catch (err) {
        toast('خطأ في تحميل البيانات', 'error');
    }
}

// ===== ARTICLES =====
async function loadArticles(page = 1) {
    articlesPage = page;
    const sectionFilter = document.getElementById('filterSection').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const search = document.getElementById('filterSearch').value.toLowerCase();

    try {
        let url = `/api/articles?limit=100&status=`;
        if (sectionFilter) url = `/api/articles?limit=100&section_id=${sectionFilter}&status=`;
        if (statusFilter) url += statusFilter;
        else url = `/api/articles?limit=100`;

        let articles = await api(url);

        // Client-side search filter
        if (search) {
            articles = articles.filter(a => a.title.toLowerCase().includes(search));
        }

        // Pagination
        const total = articles.length;
        const totalPages = Math.ceil(total / articlesPerPage);
        const start = (page - 1) * articlesPerPage;
        const pageArticles = articles.slice(start, start + articlesPerPage);

        const html = pageArticles.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${a.image ? `<img src="${a.image}" class="img-thumb" alt="">` : '<span style="color:#ccc;">—</span>'}</td>
                <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(a.title)}</td>
                <td>${a.section_name || '-'}</td>
                <td><span class="badge badge-${a.status}">${a.status === 'published' ? 'منشور' : 'مسودة'}</span></td>
                <td>${formatNumber(a.views)}</td>
                <td>${formatDate(a.created_at)}</td>
                <td class="action-btns">
                    <a href="/article/${a.id}" target="_blank" class="btn btn-sm" title="عرض">👁️</a>
                    <button class="btn btn-sm" onclick="copyShareLink(${a.id}, '${escapeHtml(a.title)}')" title="نسخ الرابط">🔗</button>
                    <button class="btn btn-sm" onclick="editArticle(${a.id})" title="تعديل">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteArticle(${a.id})" title="حذف">🗑️</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('articlesTableBody').innerHTML = html || '<tr><td colspan="8" class="empty-state"><p>لا توجد نتائج</p></td></tr>';

        // Pagination
        let paginationHtml = '';
        if (totalPages > 1) {
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += `<button class="${i === page ? 'active' : ''}" onclick="loadArticles(${i})">${i}</button>`;
            }
        }
        document.getElementById('articlesPagination').innerHTML = paginationHtml;
    } catch (err) {
        toast('خطأ في تحميل الأخبار', 'error');
    }
}

// Filters
['filterSection', 'filterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => loadArticles(1));
});
document.getElementById('filterSearch')?.addEventListener('input', () => loadArticles(1));

// ===== ARTICLE FORM =====
function prepareArticleForm() {
    populateSectionDropdowns();
    if (!document.getElementById('articleId').value) {
        document.getElementById('articleFormTitle').textContent = 'إضافة خبر جديد';
    }
}

document.getElementById('articleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('articleId').value;
    const data = {
        title: document.getElementById('articleTitle').value,
        summary: document.getElementById('articleSummary').value,
        content: document.getElementById('articleContent').value,
        image: document.getElementById('articleImage').value,
        section_id: parseInt(document.getElementById('articleSection').value),
        is_featured: document.getElementById('articleFeatured').checked,
        is_breaking: document.getElementById('articleBreaking').checked,
        is_slider: document.getElementById('articleSlider').checked,
        status: document.getElementById('articleStatus').value,
        author_name: document.getElementById('articleAuthor').value
    };

    try {
        if (id) {
            await api(`/api/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            toast('تم تحديث الخبر بنجاح', 'success');
        } else {
            await api('/api/articles', { method: 'POST', body: JSON.stringify(data) });
            toast('تم إضافة الخبر بنجاح', 'success');
        }
        resetArticleForm();
        navigateTo('articles');
    } catch (err) {
        toast(err.message, 'error');
    }
});

async function editArticle(id) {
    try {
        const article = await api(`/api/articles/${id}`);
        document.getElementById('articleId').value = article.id;
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleSummary').value = article.summary;
        document.getElementById('articleContent').value = article.content;
        document.getElementById('articleImage').value = article.image;
        document.getElementById('articleSection').value = article.section_id;
        document.getElementById('articleFeatured').checked = article.is_featured;
        document.getElementById('articleBreaking').checked = article.is_breaking;
        document.getElementById('articleSlider').checked = article.is_slider;
        document.getElementById('articleStatus').value = article.status;
        document.getElementById('articleAuthor').value = article.author_name;
        document.getElementById('articleFormTitle').textContent = 'تعديل الخبر #' + id;

        if (article.image) {
            document.getElementById('imagePreview').style.display = 'flex';
            document.getElementById('previewImg').src = article.image;
        }

        navigateTo('add-article');
    } catch (err) {
        toast('خطأ في تحميل الخبر', 'error');
    }
}

async function deleteArticle(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
        await api(`/api/articles/${id}`, { method: 'DELETE' });
        toast('تم حذف الخبر', 'success');
        loadArticles(articlesPage);
        if (currentPage === 'dashboard') loadDashboard();
    } catch (err) {
        toast('خطأ في الحذف', 'error');
    }
}

function resetArticleForm() {
    document.getElementById('articleForm').reset();
    document.getElementById('articleId').value = '';
    document.getElementById('articleFormTitle').textContent = 'إضافة خبر جديد';
    document.getElementById('imagePreview').style.display = 'none';
}

// Image upload
document.getElementById('articleImageFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch(API + '/api/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('articleImage').value = data.url;
            document.getElementById('imagePreview').style.display = 'flex';
            document.getElementById('previewImg').src = data.url;
            toast('تم رفع الصورة', 'success');
        } else {
            toast(data.error, 'error');
        }
    } catch (err) {
        toast('خطأ في رفع الصورة', 'error');
    }
});

function clearImage() {
    document.getElementById('articleImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('articleImageFile').value = '';
}

// Image preview on URL change
document.getElementById('articleImage')?.addEventListener('change', function () {
    if (this.value) {
        document.getElementById('imagePreview').style.display = 'flex';
        document.getElementById('previewImg').src = this.value;
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }
});

// ===== OPINIONS =====
async function loadOpinions() {
    try {
        const opinions = await api('/api/opinions?limit=100');
        const html = opinions.map(o => `
            <tr>
                <td>${o.id}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:30px;height:30px;background:${o.author_color};color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">${o.author_letter}</div>
                        ${escapeHtml(o.author_name)}
                    </div>
                </td>
                <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(o.title)}</td>
                <td><span class="badge badge-${o.status}">${o.status === 'published' ? 'منشور' : 'مسودة'}</span></td>
                <td>${formatDate(o.created_at)}</td>
                <td class="action-btns">
                    <button class="btn btn-sm" onclick="editOpinion(${o.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOpinion(${o.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        document.getElementById('opinionsTableBody').innerHTML = html || '<tr><td colspan="6" class="empty-state"><p>لا توجد مقالات</p></td></tr>';
    } catch (err) {
        toast('خطأ في تحميل المقالات', 'error');
    }
}

document.getElementById('opinionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('opinionId').value;
    const data = {
        title: document.getElementById('opinionTitle').value,
        summary: document.getElementById('opinionSummary').value,
        content: document.getElementById('opinionContent').value,
        author_name: document.getElementById('opinionAuthor').value,
        author_letter: document.getElementById('opinionLetter').value,
        author_color: document.getElementById('opinionColor').value,
        image: document.getElementById('opinionImage').value,
        status: document.getElementById('opinionStatus').value
    };

    try {
        if (id) {
            await api(`/api/opinions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            toast('تم تحديث المقال', 'success');
        } else {
            await api('/api/opinions', { method: 'POST', body: JSON.stringify(data) });
            toast('تم إضافة المقال', 'success');
        }
        resetOpinionForm();
        navigateTo('opinions');
    } catch (err) {
        toast(err.message, 'error');
    }
});

async function editOpinion(id) {
    try {
        const o = await api(`/api/opinions/${id}`);
        document.getElementById('opinionId').value = o.id;
        document.getElementById('opinionTitle').value = o.title;
        document.getElementById('opinionSummary').value = o.summary;
        document.getElementById('opinionContent').value = o.content;
        document.getElementById('opinionAuthor').value = o.author_name;
        document.getElementById('opinionLetter').value = o.author_letter;
        document.getElementById('opinionColor').value = o.author_color;
        document.getElementById('opinionImage').value = o.image;
        document.getElementById('opinionStatus').value = o.status;
        document.getElementById('opinionFormTitle').textContent = 'تعديل مقال #' + id;
        navigateTo('add-opinion');
    } catch (err) {
        toast('خطأ في تحميل المقال', 'error');
    }
}

async function deleteOpinion(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    try {
        await api(`/api/opinions/${id}`, { method: 'DELETE' });
        toast('تم حذف المقال', 'success');
        loadOpinions();
    } catch (err) {
        toast('خطأ في الحذف', 'error');
    }
}

function resetOpinionForm() {
    document.getElementById('opinionForm').reset();
    document.getElementById('opinionId').value = '';
    document.getElementById('opinionFormTitle').textContent = 'إضافة مقال رأي';
}

function prepareOpinionForm() {
    if (!document.getElementById('opinionId').value) {
        document.getElementById('opinionFormTitle').textContent = 'إضافة مقال رأي';
    }
}

// ===== SECTIONS PAGE =====
async function loadSectionsPage() {
    try {
        const allSections = await api('/api/sections');
        const stats = await api('/api/stats');
        const countMap = {};
        stats.sections.forEach(s => countMap[s.slug] = s.article_count);

        const html = allSections.map(s => `
            <tr>
                <td>${s.id}</td>
                <td style="font-size:24px;">${getSectionIcon(s.slug)}</td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td><code>/${s.slug}</code></td>
                <td>${s.sort_order}</td>
                <td>${countMap[s.slug] || 0}</td>
                <td><span class="badge badge-${s.is_active ? 'active' : 'inactive'}">${s.is_active ? 'مفعّل' : 'معطّل'}</span></td>
                <td class="action-btns">
                    <button class="btn btn-sm" onclick="toggleSection(${s.id}, ${s.is_active})">${s.is_active ? '⏸️' : '▶️'}</button>
                </td>
            </tr>
        `).join('');
        document.getElementById('sectionsTableBody').innerHTML = html;
    } catch (err) {
        toast('خطأ في تحميل الأقسام', 'error');
    }
}

async function toggleSection(id, currentState) {
    try {
        await api(`/api/sections/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: currentState ? 0 : 1 })
        });
        toast(currentState ? 'تم تعطيل القسم' : 'تم تفعيل القسم', 'success');
        loadSectionsPage();
        await loadSections();
    } catch (err) {
        toast('خطأ', 'error');
    }
}

// ===== MEDIA PAGE =====
async function loadMedia() {
    try {
        const articles = await api('/api/articles?limit=200');
        const images = articles.filter(a => a.image).map(a => a.image);
        const html = images.map(img => `
            <div class="media-item">
                <img src="${img}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
                <div class="media-overlay">${img.split('/').pop()}</div>
            </div>
        `).join('');
        document.getElementById('mediaGrid').innerHTML = html || '<div class="empty-state"><div class="empty-icon">🖼️</div><p>لا توجد صور مرفوعة</p></div>';
    } catch (err) {
        toast('خطأ في تحميل الصور', 'error');
    }
}

// Bulk upload
document.getElementById('bulkUploadInput')?.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

    try {
        const res = await fetch(API + '/api/upload-multiple', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            toast(`تم رفع ${data.urls.length} صورة`, 'success');
            loadMedia();
        } else {
            toast(data.error, 'error');
        }
    } catch (err) {
        toast('خطأ في الرفع', 'error');
    }
});

// ===== SETTINGS =====
async function loadSettings() {
    try {
        const settings = await api('/api/settings');
        document.getElementById('settingSiteName').value = settings.site_name || '';
        document.getElementById('settingTagline').value = settings.site_tagline || '';
        document.getElementById('settingDescription').value = settings.site_description || '';
    } catch (err) {
        toast('خطأ في تحميل الإعدادات', 'error');
    }
}

document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await api('/api/settings', {
            method: 'PUT',
            body: JSON.stringify({
                site_name: document.getElementById('settingSiteName').value,
                site_tagline: document.getElementById('settingTagline').value,
                site_description: document.getElementById('settingDescription').value
            })
        });
        toast('تم حفظ الإعدادات', 'success');
    } catch (err) {
        toast('خطأ في الحفظ', 'error');
    }
});

// ===== HELPERS =====
function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n || 0;
}

function formatDate(d) {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getSectionIcon(slug) {
    const icons = {
        'local': '🏛️', 'economy': '💰', 'sports': '⚽', 'international': '🌍',
        'jobs': '💼', 'entertainment': '🎭', 'misc': '📰', 'tourism': '✈️',
        'society': '👥', 'worldcup': '🏆'
    };
    return icons[slug] || '📂';
}

function copyShareLink(id, title) {
    const url = window.location.origin + '/article/' + id;
    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    };

    // Show share dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    dialog.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:25px;max-width:400px;width:90%;direction:rtl;font-family:'Noto Kufi Arabic',sans-serif;">
            <h3 style="margin-bottom:15px;font-size:16px;">مشاركة الخبر</h3>
            <p style="font-size:13px;color:#666;margin-bottom:15px;word-break:break-all;">${url}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:15px;">
                <a href="${shareUrls.twitter}" target="_blank" style="background:#000;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">𝕏 تويتر</a>
                <a href="${shareUrls.facebook}" target="_blank" style="background:#1877f2;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">f فيسبوك</a>
                <a href="${shareUrls.whatsapp}" target="_blank" style="background:#25d366;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">📱 واتساب</a>
                <a href="${shareUrls.telegram}" target="_blank" style="background:#0088cc;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">✈️ تلجرام</a>
            </div>
            <div style="display:flex;gap:8px;">
                <button onclick="navigator.clipboard.writeText('${url}');this.textContent='تم النسخ ✅'" style="flex:1;background:#d71920;color:#fff;border:none;padding:10px;border-radius:6px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;">🔗 نسخ الرابط</button>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;background:#eee;border:none;padding:10px;border-radius:6px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;">إغلاق</button>
            </div>
        </div>
    `;
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.remove(); });
    document.body.appendChild(dialog);
}

function getCategoryName(slug) {
    const names = { auto: 'تلقائي', local: 'المحليات', economy: 'الاقتصاد', sports: 'رياضة', international: 'مدارات عالمية', entertainment: 'الترفيه', tourism: 'سياحة وسفر', jobs: 'وظائف', misc: 'منوعات', society: 'مجتمع', worldcup: 'المونديال' };
    return names[slug] || slug;
}

// ===== NEWS SOURCES =====
async function loadSources() {
    try {
        const sources = await api('/api/sources');
        const html = sources.map(s => `
            <tr>
                <td>${s.id}</td>
                <td><strong>${escapeHtml(s.name)}</strong><br><small style="color:#888;font-size:10px;">${escapeHtml(s.url).substring(0, 60)}...</small></td>
                <td><span class="badge" style="background:${s.type === 'rss' ? '#eff6ff' : '#f5f3ff'};color:${s.type === 'rss' ? '#3b82f6' : '#8b5cf6'};">${s.type === 'rss' ? '📡 RSS' : '🕸️ Web'}</span></td>
                <td>${getCategoryName(s.default_category)}</td>
                <td>${s.last_fetch ? formatDate(s.last_fetch) : '<span style="color:#ccc;">لم يُجلب</span>'}</td>
                <td>${s.last_count || 0}</td>
                <td>${s.is_active ? '<span class="badge badge-active">مفعّل</span>' : '<span class="badge badge-inactive">معطّل</span>'}</td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-success" onclick="fetchSingleSource(${s.id})" title="جلب">🔄</button>
                    <button class="btn btn-sm" onclick="toggleSourceActive(${s.id},${s.is_active})">${s.is_active ? '⏸️' : '▶️'}</button>
                    <button class="btn btn-sm" onclick="editSource(${s.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSource(${s.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        document.getElementById('sourcesTableBody').innerHTML = html || '<tr><td colspan="8" class="empty-state"><p>لا توجد مصادر</p></td></tr>';
        const status = await api('/api/sources/scheduler/status');
        document.getElementById('schedulerEnabled').checked = status.enabled;
        document.getElementById('schedulerInterval').value = status.interval;
        document.getElementById('schedulerStatus').textContent = status.enabled ? '✅ الجلب التلقائي مفعّل - ' + status.nextRun : '⏸️ الجلب التلقائي معطّل';
    } catch (err) { toast('خطأ', 'error'); }
}

async function loadFetchLogs() {
    try {
        const logs = await api('/api/fetch-logs?limit=30');
        document.getElementById('fetchLogsBody').innerHTML = logs.map(l => `
            <tr>
                <td>${escapeHtml(l.source_name || '-')}</td>
                <td><span class="fetch-status ${l.status}">${l.status === 'success' ? '✅' : '❌'}</span></td>
                <td><strong>${l.new_count}</strong></td>
                <td class="log-detail" title="${escapeHtml(l.details || '')}">${escapeHtml(l.error_message || '-')}</td>
                <td>${formatDate(l.created_at)}</td>
            </tr>
        `).join('') || '<tr><td colspan="5">لا سجلات</td></tr>';
    } catch (e) {}
}

function showAddSourceModal() { document.getElementById('sourceId').value=''; document.getElementById('sourceForm').reset(); document.getElementById('sourceModalTitle').textContent='إضافة مصدر'; document.getElementById('selectorsGroup').style.display='none'; document.getElementById('sourceModal').style.display='flex'; }
function closeSourceModal() { document.getElementById('sourceModal').style.display='none'; }

async function editSource(id) {
    const sources = await api('/api/sources');
    const s = sources.find(x => x.id === id);
    if (!s) return;
    ['sourceId','sourceName','sourceUrl','sourceType','sourceCategory','sourceMaxItems','sourceInterval','sourceAttribution','sourceImage','sourceFullContent','sourceSelectors'].forEach(k => {
        const el = document.getElementById(k);
        if (el.type === 'checkbox') el.checked = s[k.replace('source','').replace(/^./,c=>c.toLowerCase()).replace('FullContent','fetch_full_content').replace('MaxItems','max_items').replace('Interval','fetch_interval').replace('Attribution','attribution').replace('Image','default_image').replace('Selectors','selectors')] || s.fetch_full_content;
        else el.value = s[k.replace('source','').replace(/^./,c=>c.toLowerCase()).replace('Id','id').replace('Name','name').replace('Url','url').replace('Type','type').replace('Category','default_category').replace('MaxItems','max_items').replace('Interval','fetch_interval').replace('Attribution','attribution').replace('Image','default_image').replace('Selectors','selectors')] || '';
    });
    document.getElementById('sourceId').value = s.id;
    document.getElementById('sourceName').value = s.name;
    document.getElementById('sourceUrl').value = s.url;
    document.getElementById('sourceType').value = s.type;
    document.getElementById('sourceCategory').value = s.default_category;
    document.getElementById('sourceMaxItems').value = s.max_items;
    document.getElementById('sourceInterval').value = s.fetch_interval;
    document.getElementById('sourceAttribution').value = s.attribution || '';
    document.getElementById('sourceImage').value = s.default_image || '';
    document.getElementById('sourceFullContent').checked = s.fetch_full_content;
    document.getElementById('sourceSelectors').value = s.selectors || '';
    document.getElementById('sourceModalTitle').textContent = 'تعديل: ' + s.name;
    document.getElementById('selectorsGroup').style.display = s.type === 'web' ? 'block' : 'none';
    document.getElementById('sourceModal').style.display = 'flex';
}

document.getElementById('sourceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('sourceId').value;
    const data = {
        name: document.getElementById('sourceName').value,
        url: document.getElementById('sourceUrl').value,
        type: document.getElementById('sourceType').value,
        default_category: document.getElementById('sourceCategory').value,
        max_items: parseInt(document.getElementById('sourceMaxItems').value),
        fetch_interval: parseInt(document.getElementById('sourceInterval').value),
        attribution: document.getElementById('sourceAttribution').value,
        default_image: document.getElementById('sourceImage').value,
        fetch_full_content: document.getElementById('sourceFullContent').checked,
        selectors: document.getElementById('sourceSelectors').value,
    };
    try {
        if (id) await api('/api/sources/'+id, { method:'PUT', body:JSON.stringify(data) });
        else await api('/api/sources', { method:'POST', body:JSON.stringify(data) });
        toast(id ? 'تم التحديث' : 'تمت الإضافة', 'success');
        closeSourceModal(); loadSources();
    } catch (err) { toast(err.message, 'error'); }
});

document.getElementById('sourceType')?.addEventListener('change', function() { document.getElementById('selectorsGroup').style.display = this.value === 'web' ? 'block' : 'none'; });

async function deleteSource(id) { if (!confirm('حذف المصدر؟')) return; await api('/api/sources/'+id,{method:'DELETE'}); toast('تم الحذف','success'); loadSources(); }
async function toggleSourceActive(id, cur) { await api('/api/sources/'+id,{method:'PUT',body:JSON.stringify({is_active:cur?0:1})}); loadSources(); }

async function fetchSingleSource(id) { toast('جاري الجلب...','info'); const r = await api('/api/sources/'+id+'/fetch',{method:'POST'}); toast('تم جلب '+(r.newCount||0)+' خبر','success'); loadSources(); loadFetchLogs(); }

async function fetchAllSources() {
    const btn = document.getElementById('fetchAllBtn'); btn.disabled=true; btn.textContent='⏳ جاري...';
    const r = await api('/api/sources/fetch-all',{method:'POST'}); toast('تم جلب '+r.totalNew+' خبر','success');
    btn.disabled=false; btn.textContent='🔄 جلب الكل الآن'; loadSources(); loadFetchLogs();
}

async function toggleScheduler() {
    const enabled = document.getElementById('schedulerEnabled').checked;
    const interval = parseInt(document.getElementById('schedulerInterval').value);
    await api('/api/sources/scheduler',{method:'POST',body:JSON.stringify({enabled,interval})});
    toast(enabled ? 'تم التفعيل' : 'تم التعطيل','success'); loadSources();
}

function showPresetsModal() { document.getElementById('presetsModal').style.display='flex'; loadPresets(); }
function closePresetsModal() { document.getElementById('presetsModal').style.display='none'; }

async function loadPresets() {
    const presets = await api('/api/sources/presets');
    const existing = await api('/api/sources');
    const urls = new Set(existing.map(s=>s.url));
    document.getElementById('presetsList').innerHTML = presets.map((p,i) => `
        <label class="source-card ${urls.has(p.url)?'selected':''}">
            <input type="checkbox" class="source-check" value="${i}" ${urls.has(p.url)?'checked disabled':''}>
            <div class="source-icon">${p.type==='rss'?'📡':'🕸️'}</div>
            <div class="source-info"><h4>${p.name}</h4><small>${p.url}</small></div>
            <span class="badge" style="background:#f0f0f0;">${getCategoryName(p.default_category)}</span>
        </label>
    `).join('');
}

async function addSelectedPresets() {
    const cbs = document.querySelectorAll('#presetsList .source-check:checked:not(:disabled)');
    if (!cbs.length) return toast('اختر مصادر','info');
    const presets = await api('/api/sources/presets');
    let n=0;
    for (const cb of cbs) { try { await api('/api/sources',{method:'POST',body:JSON.stringify(presets[parseInt(cb.value)])}); n++; } catch(e){} }
    toast('تم إضافة '+n+' مصدر','success'); closePresetsModal(); loadSources();
}

// Navigate to sources
function navigateToSources() { navigateTo('sources'); loadSources(); loadFetchLogs(); }

function toast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
