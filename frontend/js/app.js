/**
 * FundAI - Frontend JavaScript
 * API calls, authentication, and UI utilities
 */

// ============== CONFIGURATION ==============
const API_BASE = 'http://localhost:5000/api';

// ============== API CALLS ==============
const api = {
    // Auth
    async signup(data) {
        return this._post('/auth/signup', data);
    },

    async login(data) {
        return this._post('/auth/login', data);
    },

    // Profile
    async getProfile(userId) {
        return this._get(`/profile/${userId}`);
    },

    async updateProfile(userId, data) {
        return this._put(`/profile/${userId}`, data);
    },

    async uploadAvatar(userId, file) {
        const formData = new FormData();
        formData.append('avatar', file);
        return this._upload(`/profile/${userId}/avatar`, formData);
    },

    // Campaigns
    async getCampaigns(filters = {}) {
        const params = new URLSearchParams(filters);
        const result = await this._get(`/campaigns?${params}`);
        return result.campaigns;
    },

    async getCampaign(id) {
        return this._get(`/campaigns/${id}`);
    },

    async createCampaign(data) {
        return this._post('/campaigns', data);
    },

    async evaluateCampaign(id) {
        return this._post(`/campaigns/${id}/evaluate`);
    },

    async getUserCampaigns(userId) {
        const result = await this._get(`/campaigns/user/${userId}`);
        return result.campaigns;
    },

    // Campaign Images
    async getCampaignImages(campaignId) {
        return this._get(`/campaigns/${campaignId}/images`);
    },

    async uploadCampaignImage(campaignId, file, isPrimary = false, caption = '') {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('is_primary', isPrimary);
        formData.append('caption', caption);
        return this._upload(`/campaigns/${campaignId}/images`, formData);
    },

    // Campaign Updates
    async getCampaignUpdates(campaignId) {
        return this._get(`/campaigns/${campaignId}/updates`);
    },

    async createCampaignUpdate(campaignId, data) {
        return this._post(`/campaigns/${campaignId}/updates`, data);
    },

    async deleteCampaignUpdate(campaignId, updateId) {
        return this._delete(`/campaigns/${campaignId}/updates/${updateId}`);
    },

    // Comments
    async getCampaignComments(campaignId) {
        return this._get(`/campaigns/${campaignId}/comments`);
    },

    async createComment(campaignId, data) {
        return this._post(`/campaigns/${campaignId}/comments`, data);
    },

    async deleteComment(commentId) {
        return this._delete(`/comments/${commentId}`);
    },

    // Bookmarks
    async getUserBookmarks(userId) {
        return this._get(`/user/${userId}/bookmarks`);
    },

    async toggleBookmark(userId, campaignId) {
        return this._post('/bookmarks', { user_id: userId, campaign_id: campaignId });
    },

    async checkBookmark(userId, campaignId) {
        return this._get(`/user/${userId}/bookmarks/${campaignId}`);
    },

    // Reviews
    async getUserReviews(userId) {
        return this._get(`/user/${userId}/reviews`);
    },

    async createReview(data) {
        return this._post('/reviews', data);
    },

    // Milestones
    async getMilestones(campaignId) {
        return this._get(`/campaigns/${campaignId}/milestones`);
    },

    async createMilestone(campaignId, data) {
        return this._post(`/campaigns/${campaignId}/milestones`, data);
    },

    // Rewards
    async getRewards(campaignId) {
        return this._get(`/campaigns/${campaignId}/rewards`);
    },

    async createReward(campaignId, data) {
        return this._post(`/campaigns/${campaignId}/rewards`, data);
    },

    // Notifications
    async getNotifications(userId) {
        return this._get(`/user/${userId}/notifications`);
    },

    async markNotificationRead(notificationId) {
        return this._post(`/notifications/${notificationId}/read`);
    },

    async markAllNotificationsRead(userId) {
        return this._post(`/user/${userId}/notifications/read-all`);
    },

    // Payments
    async processPayment(data) {
        return this._post('/payments/process', data);
    },

    // Investments
    async getUserInvestments(userId) {
        return this._get(`/user/${userId}/investments`);
    },

    async getCampaignInvestments(campaignId) {
        return this._get(`/campaigns/${campaignId}/investments`);
    },

    // Search
    async search(params) {
        const queryString = new URLSearchParams(params);
        return this._get(`/search?${queryString}`);
    },

    // Dashboard
    async getDashboard(userId) {
        return this._get(`/user/${userId}/dashboard`);
    },

    async getCampaignAnalytics(campaignId) {
        return this._get(`/campaigns/${campaignId}/analytics`);
    },

    // Admin
    async getAdminStats() {
        return this._get('/admin/stats');
    },

    async getAllUsers() {
        return this._get('/admin/users');
    },

    async getAllCampaigns() {
        return this._get('/admin/campaigns');
    },

    async toggleFeatured(campaignId) {
        return this._post(`/admin/campaigns/${campaignId}/feature`);
    },

    async verifyCampaign(campaignId) {
        return this._post(`/admin/campaigns/${campaignId}/verify`);
    },

    // ============== PHASE 2 FEATURES ==============

    // Edit Campaign
    async updateCampaign(campaignId, data) {
        return this._put(`/campaigns/${campaignId}`, data);
    },

    // Drafts
    async publishCampaign(campaignId) {
        return this._post(`/campaigns/${campaignId}/publish`);
    },

    async getUserDrafts(userId) {
        return this._get(`/user/${userId}/drafts`);
    },

    // Email Verification
    async sendVerificationEmail(email) {
        return this._post('/auth/send-verification', { email });
    },

    async verifyEmail(email, token) {
        return this._post('/auth/verify-email', { email, token });
    },

    // FAQs
    async getCampaignFAQs(campaignId) {
        return this._get(`/campaigns/${campaignId}/faqs`);
    },

    async addCampaignFAQ(campaignId, data) {
        return this._post(`/campaigns/${campaignId}/faqs`, data);
    },

    async updateFAQ(faqId, data) {
        return this._put(`/faqs/${faqId}`, data);
    },

    async deleteFAQ(faqId) {
        return this._delete(`/faqs/${faqId}`);
    },

    // Messages
    async sendMessage(data) {
        return this._post('/messages', data);
    },

    async getUserMessages(userId) {
        return this._get(`/user/${userId}/messages`);
    },

    async markMessageRead(messageId) {
        return this._post(`/messages/${messageId}/read`);
    },

    // Categories
    async getCampaignsByCategory(category) {
        return this._get(`/campaigns/category/${encodeURIComponent(category)}`);
    },

    // Similar Campaigns
    async getSimilarCampaigns(campaignId) {
        return this._get(`/campaigns/${campaignId}/similar`);
    },

    // Scheduled Updates
    async scheduleUpdate(campaignId, data) {
        return this._post(`/campaigns/${campaignId}/updates/schedule`, data);
    },

    async getScheduledUpdates(campaignId) {
        return this._get(`/campaigns/${campaignId}/updates/scheduled`);
    },

    // Enhanced Analytics
    async getDetailedAnalytics(campaignId) {
        return this._get(`/campaigns/${campaignId}/analytics/detailed`);
    },

    async trackEvent(campaignId, eventType, userId = null, amount = null) {
        return this._post(`/campaigns/${campaignId}/track`, {
            event_type: eventType,
            user_id: userId,
            amount: amount
        });
    },

    // Utilities
    async getCategories() {
        const result = await this._get('/categories');
        return result.categories;
    },

    async getCountries() {
        const result = await this._get('/countries');
        return result.countries;
    },

    async healthCheck() {
        return this._get('/health');
    },

    // Team Members
    async getTeamMembers(campaignId) {
        return this._get(`/campaigns/${campaignId}/team`);
    },

    async addTeamMember(campaignId, data) {
        return this._post(`/campaigns/${campaignId}/team`, data);
    },

    async removeTeamMember(memberId) {
        return this._delete(`/team/${memberId}`);
    },

    // Referrals
    async getUserReferral(userId) {
        return this._get(`/user/${userId}/referral`);
    },

    async validateReferral(code) {
        return this._get(`/referral/${code}/validate`);
    },

    async useReferral(code, data) {
        return this._post(`/referral/${code}/use`, data);
    },

    // Helper methods
    async _get(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    },

    async _post(endpoint, data = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    },

    async _put(endpoint, data = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    },

    async _delete(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    },

    async _upload(endpoint, formData) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        return response.json();
    }
};


// ============== AUTHENTICATION ==============
const auth = {
    USER_KEY: 'fundai_user',

    login(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'index.html';
    },

    getUser() {
        const data = localStorage.getItem(this.USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    isLoggedIn() {
        return this.getUser() !== null;
    },

    updateUser(userData) {
        const current = this.getUser();
        if (current) {
            this.login({ ...current, ...userData });
        }
    }
};


// ============== UI UTILITIES ==============

/**
 * Update navbar based on auth state
 */
function updateNavbar() {
    const user = auth.getUser();
    const authNav = document.getElementById('nav-auth');
    const userNav = document.getElementById('nav-user');

    if (!authNav || !userNav) return;

    if (user) {
        authNav.classList.add('hidden');
        userNav.classList.remove('hidden');

        const profileBtn = document.getElementById('nav-profile-btn');
        const userName = document.getElementById('nav-user-name');

        if (profileBtn) {
            profileBtn.textContent = user.name;
        }
        if (userName) {
            userName.textContent = user.name;
        }
    } else {
        authNav.classList.remove('hidden');
        userNav.classList.add('hidden');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${icons[type] || 'ℹ️'}</span>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category) {
    const emojis = {
        'Technology': '💻',
        'Design': '🎨',
        'Games': '🎮',
        'Film & Video': '🎬',
        'Music': '🎵',
        'Food': '🍕',
        'Publishing': '📚',
        'Art': '🖼️',
        'Fashion': '👗'
    };
    return emojis[category] || '✨';
}

/**
 * Get score CSS class
 */
function getScoreClass(score) {
    if (score >= 0.7) return 'score-high';
    if (score >= 0.5) return 'score-medium';
    return 'score-low';
}

/**
 * Format date
 */
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// ============== INITIALIZE ==============
document.addEventListener('DOMContentLoaded', () => {
    // Update navbar on every page
    updateNavbar();

    // Add logout handlers
    const logoutBtns = document.querySelectorAll('#nav-logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => auth.logout());
    });

    // Initialize mobile menu
    initMobileMenu();

    // Initialize back to top button
    initBackToTop();

    // Initialize cookie consent
    initCookieConsent();

    // Initialize navbar scroll effect
    initNavbarScroll();

    // Initialize theme toggle
    initThemeToggle();

    // Initialize social proof (randomly)
    if (Math.random() > 0.5) {
        setTimeout(() => showSocialProof(), 3000);
    }
});


// ============== MOBILE MENU ==============
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}


// ============== BACK TO TOP ==============
function initBackToTop() {
    // Create button if not exists
    let backToTop = document.querySelector('.back-to-top');

    if (!backToTop) {
        backToTop = document.createElement('button');
        backToTop.className = 'back-to-top';
        backToTop.innerHTML = '↑';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.setAttribute('title', 'Back to top');
        document.body.appendChild(backToTop);
    }

    // Show/hide on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // Scroll to top on click
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// ============== COOKIE CONSENT ==============
function initCookieConsent() {
    const COOKIE_KEY = 'fundai_cookie_consent';

    // Check if already consented
    if (localStorage.getItem(COOKIE_KEY)) {
        return;
    }

    // Create cookie banner if not exists
    let cookieBanner = document.querySelector('.cookie-consent');

    if (!cookieBanner) {
        cookieBanner = document.createElement('div');
        cookieBanner.className = 'cookie-consent';
        cookieBanner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-text">
                    <p>🍪 We use cookies to enhance your experience and analyze site usage.
                    By continuing to use our site, you agree to our 
                    <a href="privacy.html">Privacy Policy</a>.</p>
                </div>
                <div class="cookie-buttons">
                    <button class="btn btn-secondary" id="cookie-decline">Decline</button>
                    <button class="btn btn-primary" id="cookie-accept">Accept All</button>
                </div>
            </div>
        `;
        document.body.appendChild(cookieBanner);
    }

    // Show after short delay
    setTimeout(() => {
        cookieBanner.classList.add('show');
    }, 1500);

    // Accept handler
    document.getElementById('cookie-accept').addEventListener('click', () => {
        localStorage.setItem(COOKIE_KEY, 'accepted');
        cookieBanner.classList.remove('show');
        setTimeout(() => cookieBanner.remove(), 300);
    });

    // Decline handler
    document.getElementById('cookie-decline').addEventListener('click', () => {
        localStorage.setItem(COOKIE_KEY, 'declined');
        cookieBanner.classList.remove('show');
        setTimeout(() => cookieBanner.remove(), 300);
    });
}


// ============== NAVBAR SCROLL EFFECT ==============
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}


// ============== SEARCH FUNCTIONALITY ==============
function initSearch(inputSelector, resultsSelector, searchFn) {
    const input = document.querySelector(inputSelector);
    const results = document.querySelector(resultsSelector);

    if (!input || !results) return;

    const performSearch = debounce(async (query) => {
        if (query.length < 2) {
            results.classList.remove('active');
            return;
        }

        try {
            const items = await searchFn(query);

            if (items.length === 0) {
                results.innerHTML = '<div class="search-result-item">No results found</div>';
            } else {
                results.innerHTML = items.map(item => `
                    <div class="search-result-item" data-id="${item.id}">
                        <strong>${escapeHtml(item.name)}</strong>
                        <div class="text-muted" style="font-size: 0.85rem;">${escapeHtml(item.category || '')}</div>
                    </div>
                `).join('');
            }

            results.classList.add('active');
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);

    input.addEventListener('input', (e) => performSearch(e.target.value.trim()));

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.classList.remove('active');
        }
    });
}


// ============== THEME TOGGLE ==============
function initThemeToggle() {
    // Load saved theme
    const savedTheme = localStorage.getItem('fundai_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Create theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    themeToggle.setAttribute('title', 'Toggle light/dark mode');
    themeToggle.innerHTML = `
        <span class="icon-moon">🌙</span>
        <span class="icon-sun">☀️</span>
    `;
    document.body.appendChild(themeToggle);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('fundai_theme', newTheme);
    });
}


// ============== SOCIAL SHARING ==============
function shareOnTwitter(title, url) {
    const text = encodeURIComponent(`Check out "${title}" on FundAI! 🚀`);
    const shareUrl = encodeURIComponent(url || window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank', 'width=600,height=400');
}

function shareOnFacebook(url) {
    const shareUrl = encodeURIComponent(url || window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn(title, url) {
    const shareUrl = encodeURIComponent(url || window.location.href);
    const shareTitle = encodeURIComponent(title || 'FundAI Campaign');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp(title, url) {
    const text = encodeURIComponent(`Check out "${title}" on FundAI! ${url || window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyToClipboard(text) {
    const textToCopy = text || window.location.href;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Link copied to clipboard! 📋', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = textToCopy;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Link copied to clipboard! 📋', 'success');
    });
}


// ============== LIVE VIEWERS ==============
function initLiveViewers(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Simulate random viewer count
    const baseViewers = Math.floor(Math.random() * 20) + 5;
    element.innerHTML = `
        <span class="live-pulse"></span>
        <span>${baseViewers} people viewing</span>
    `;

    // Update every 10-30 seconds
    setInterval(() => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newCount = Math.max(3, baseViewers + change);
        element.querySelector('span:last-child').textContent = `${newCount} people viewing`;
    }, Math.random() * 20000 + 10000);
}


// ============== SOCIAL PROOF NOTIFICATIONS ==============
function showSocialProof() {
    const proofMessages = [
        { icon: '💰', title: 'Sarah just invested $250', time: '2 minutes ago' },
        { icon: '🎉', title: 'New campaign reached 100% funding!', time: '5 minutes ago' },
        { icon: '👋', title: 'John joined as an investor', time: '8 minutes ago' },
        { icon: '🚀', title: 'TechStart campaign went live', time: '15 minutes ago' },
        { icon: '💎', title: 'Premium investor Michael backing campaigns', time: '20 minutes ago' }
    ];

    const proof = proofMessages[Math.floor(Math.random() * proofMessages.length)];

    const proofEl = document.createElement('div');
    proofEl.className = 'social-proof';
    proofEl.innerHTML = `
        <div class="social-proof-icon">${proof.icon}</div>
        <div class="social-proof-content">
            <div class="social-proof-title">${proof.title}</div>
            <div class="social-proof-time">${proof.time}</div>
        </div>
        <button class="social-proof-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(proofEl);

    // Auto remove after animation
    setTimeout(() => {
        if (proofEl.parentElement) {
            proofEl.remove();
        }
    }, 5000);
}


// ============== REFERRAL CODE ==============
function generateReferralCode() {
    const user = auth.getUser();
    if (!user) return null;
    return `FUND${user.id}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function copyReferralCode(code) {
    const referralUrl = `${window.location.origin}?ref=${code}`;
    copyToClipboard(referralUrl);
}


// ============== CURRENCY CONVERSION ==============
const currencyRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.53
};

function convertCurrency(amount, from, to) {
    const inUSD = amount / currencyRates[from];
    return (inUSD * currencyRates[to]).toFixed(2);
}

function formatCurrency(amount, currency = 'USD') {
    const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' };
    return `${symbols[currency] || '$'}${formatNumber(amount)}`;
}


// ============== EMBED CODE GENERATOR ==============
function generateEmbedCode(campaignId, campaignName) {
    const embedUrl = `${window.location.origin}/embed/${campaignId}`;
    return `<iframe src="${embedUrl}" width="350" height="200" frameborder="0" title="${escapeHtml(campaignName)}"></iframe>`;
}

