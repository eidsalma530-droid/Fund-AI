const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// Get token from localStorage (Zustand persist key)
function getStoredToken() {
    try {
        const stored = JSON.parse(localStorage.getItem('fundai-auth'));
        return stored?.state?.token || null;
    } catch {
        return null;
    }
}

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = getStoredToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        ...options,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        // Auto-logout on 401 (expired/invalid token)
        if (response.status === 401 && !endpoint.includes('/auth/')) {
            try {
                const stored = JSON.parse(localStorage.getItem('fundai-auth'));
                if (stored?.state?.token) {
                    localStorage.setItem('fundai-auth', JSON.stringify({
                        ...stored,
                        state: { ...stored.state, user: null, token: null, isAuthenticated: false }
                    }));
                    window.location.href = '/login';
                }
            } catch { /* ignore */ }
        }
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Auth API
export const authAPI = {
    signup: (data) => fetchAPI('/auth/signup', { method: 'POST', body: data }),
    login: (data) => fetchAPI('/auth/login', { method: 'POST', body: data }),
    firebaseLogin: (idToken) => fetchAPI('/auth/firebase-login', { method: 'POST', body: { idToken } }),
    completeProfile: (data) => fetchAPI('/auth/complete-profile', { method: 'POST', body: data }),
    verifyToken: () => fetchAPI('/auth/verify-token', { method: 'POST' }),
    changePassword: (data) => fetchAPI('/auth/change-password', { method: 'POST', body: data }),
    sendVerification: (email) => fetchAPI('/auth/send-verification', { method: 'POST', body: { email } }),
    verifyEmail: (email, token) => fetchAPI('/auth/verify-email', { method: 'POST', body: { email, token } }),
};

// Campaigns API
export const campaignsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/campaigns${query ? `?${query}` : ''}`);
    },
    getOne: (id) => fetchAPI(`/campaigns/${id}`),
    create: (data) => fetchAPI('/campaigns', { method: 'POST', body: data }),
    update: (id, data) => fetchAPI(`/campaigns/${id}`, { method: 'PUT', body: data }),
    delete: (id, userId) => fetchAPI(`/campaigns/${id}`, { method: 'DELETE', body: { user_id: userId } }),
    endEarly: (id, userId) => fetchAPI(`/campaigns/${id}/end`, { method: 'POST', body: { user_id: userId } }),
    evaluate: (id) => fetchAPI(`/campaigns/${id}/evaluate`, { method: 'POST' }),
    publish: (id) => fetchAPI(`/campaigns/${id}/publish`, { method: 'POST' }),
    getByCategory: (category) => fetchAPI(`/campaigns/category/${encodeURIComponent(category)}`),
    getSimilar: (id) => fetchAPI(`/campaigns/${id}/similar`),
    getUserCampaigns: (userId) => fetchAPI(`/campaigns/user/${userId}`),
    // Images
    getImages: (id) => fetchAPI(`/campaigns/${id}/images`),
    uploadImage: (id, formData) => fetch(`${API_BASE}/campaigns/${id}/images`, { method: 'POST', body: formData }),
};

// Investments API
export const investmentsAPI = {
    invest: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/invest`, { method: 'POST', body: data }),
    getCampaignInvestments: (campaignId) => fetchAPI(`/campaigns/${campaignId}/investments`),
};

// Campaign Updates API
export const updatesAPI = {
    getAll: (campaignId) => fetchAPI(`/campaigns/${campaignId}/updates`),
    create: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/updates`, { method: 'POST', body: data }),
    delete: (campaignId, updateId) => fetchAPI(`/campaigns/${campaignId}/updates/${updateId}`, { method: 'DELETE' }),
    schedule: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/schedule-update`, { method: 'POST', body: data }),
    getScheduled: (campaignId) => fetchAPI(`/campaigns/${campaignId}/scheduled-updates`),
};

// Comments API
export const commentsAPI = {
    getAll: (campaignId) => fetchAPI(`/campaigns/${campaignId}/comments`),
    create: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/comments`, { method: 'POST', body: data }),
    delete: (commentId) => fetchAPI(`/comments/${commentId}`, { method: 'DELETE' }),
};

// Bookmarks API
export const bookmarksAPI = {
    getAll: (userId) => fetchAPI(`/user/${userId}/bookmarks`),
    toggle: (data) => fetchAPI('/bookmarks', { method: 'POST', body: data }),
    check: (userId, campaignId) => fetchAPI(`/user/${userId}/bookmarks/${campaignId}`),
};

// Reviews API
export const reviewsAPI = {
    getForUser: (userId) => fetchAPI(`/user/${userId}/reviews`),
    create: (data) => fetchAPI('/reviews', { method: 'POST', body: data }),
};

// Milestones API
export const milestonesAPI = {
    getAll: (campaignId) => fetchAPI(`/campaigns/${campaignId}/milestones`),
    create: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/milestones`, { method: 'POST', body: data }),
};

// Rewards API
export const rewardsAPI = {
    getAll: (campaignId) => fetchAPI(`/campaigns/${campaignId}/rewards`),
    create: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/rewards`, { method: 'POST', body: data }),
    add: (campaignId, data) => {
        // Transform frontend field names to backend expectations
        const transformedData = {
            ...data,
            min_amount: data.amount || data.min_amount,
        };
        return fetchAPI(`/campaigns/${campaignId}/rewards`, { method: 'POST', body: transformedData });
    },
    delete: (campaignId, rewardId) => fetchAPI(`/campaigns/${campaignId}/rewards/${rewardId}`, { method: 'DELETE' }),
};

// FAQs API
export const faqsAPI = {
    getAll: (campaignId) => fetchAPI(`/campaigns/${campaignId}/faqs`),
    create: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/faqs`, { method: 'POST', body: data }),
    update: (faqId, data) => fetchAPI(`/faqs/${faqId}`, { method: 'PUT', body: data }),
    delete: (faqId) => fetchAPI(`/faqs/${faqId}`, { method: 'DELETE' }),
};

// Team Members API
export const teamAPI = {
    getAll: (campaignId) => fetchAPI(`/campaigns/${campaignId}/team`),
    add: (campaignId, data) => fetchAPI(`/campaigns/${campaignId}/team`, { method: 'POST', body: data }),
    remove: (memberId) => fetchAPI(`/team/${memberId}`, { method: 'DELETE' }),
};

// Notifications API
export const notificationsAPI = {
    getAll: (userId) => fetchAPI(`/user/${userId}/notifications`),
    markRead: (notificationId) => fetchAPI(`/notifications/${notificationId}/read`, { method: 'POST' }),
    markAllRead: (userId) => fetchAPI(`/user/${userId}/notifications/read-all`, { method: 'POST' }),
};

// Messages API
export const messagesAPI = {
    getAll: (userId) => fetchAPI(`/user/${userId}/messages`),
    send: (data) => fetchAPI('/messages', { method: 'POST', body: data }),
    markRead: (messageId) => fetchAPI(`/messages/${messageId}/read`, { method: 'POST' }),
};

// Payments API
export const paymentsAPI = {
    process: (data) => fetchAPI('/payments/process', { method: 'POST', body: data }),
};

// Search API
export const searchAPI = {
    search: (query, filters = {}) => {
        const params = new URLSearchParams({ q: query, ...filters }).toString();
        return fetchAPI(`/search?${params}`);
    },
};

// Analytics API
export const analyticsAPI = {
    getBasic: (campaignId) => fetchAPI(`/campaigns/${campaignId}/analytics`),
    getDetailed: (campaignId) => fetchAPI(`/campaigns/${campaignId}/analytics/detailed`),
    track: (campaignId, eventType) => fetchAPI(`/campaigns/${campaignId}/track`, { method: 'POST', body: { event_type: eventType } }),
};

// User API
export const userAPI = {
    getProfile: (userId) => fetchAPI(`/profile/${userId}`),
    updateProfile: (userId, data) => fetchAPI(`/profile/${userId}`, { method: 'PUT', body: data }),
    uploadAvatar: (userId, formData) => {
        const token = getStoredToken();
        return fetch(`${API_BASE}/profile/${userId}/avatar`, {
            method: 'POST',
            body: formData,
            ...(token ? { headers: { 'Authorization': `Bearer ${token}` } } : {}),
        });
    },
    getDashboard: (userId) => fetchAPI(`/user/${userId}/dashboard`),
    getNotifications: (userId) => fetchAPI(`/user/${userId}/notifications`),
    getBookmarks: (userId) => fetchAPI(`/user/${userId}/bookmarks`),
    getMessages: (userId) => fetchAPI(`/user/${userId}/messages`),
    getInvestments: (userId) => fetchAPI(`/user/${userId}/investments`),
    getDrafts: (userId) => fetchAPI(`/user/${userId}/drafts`),
};

// Referrals API
export const referralsAPI = {
    get: (userId) => fetchAPI(`/user/${userId}/referral`),
    validate: (code) => fetchAPI(`/referral/${code}`),
    use: (code, data) => fetchAPI(`/referral/${code}/use`, { method: 'POST', body: data }),
};

// Admin API
export const adminAPI = {
    getStats: () => fetchAPI('/admin/stats'),
    getUsers: () => fetchAPI('/admin/users'),
    getCampaigns: () => fetchAPI('/admin/campaigns'),
    toggleFeatured: (campaignId) => fetchAPI(`/admin/campaigns/${campaignId}/feature`, { method: 'POST' }),
    verifyCampaign: (campaignId) => fetchAPI(`/admin/campaigns/${campaignId}/verify`, { method: 'POST' }),
};

// Utility functions
export const getCategories = () => fetchAPI('/categories');
export const getCountries = () => fetchAPI('/countries');
export const healthCheck = () => fetchAPI('/health');

export default {
    auth: authAPI,
    campaigns: campaignsAPI,
    investments: investmentsAPI,
    updates: updatesAPI,
    comments: commentsAPI,
    bookmarks: bookmarksAPI,
    reviews: reviewsAPI,
    milestones: milestonesAPI,
    rewards: rewardsAPI,
    faqs: faqsAPI,
    team: teamAPI,
    notifications: notificationsAPI,
    messages: messagesAPI,
    payments: paymentsAPI,
    search: searchAPI,
    analytics: analyticsAPI,
    user: userAPI,
    referrals: referralsAPI,
    admin: adminAPI,
};
