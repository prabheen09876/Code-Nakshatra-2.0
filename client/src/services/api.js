import axios from 'axios';

// Create an Axios instance
// Note: Vite proxy forwards /api to http://localhost:8788 in dev
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token and fix Content-Type for FormData
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // When sending FormData (e.g. file upload), let the browser set Content-Type
        // with the correct multipart boundary. Otherwise the server won't see the file.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear token if it's invalid or expired
            localStorage.removeItem('token');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }
        return Promise.reject(error);
    }
);

// ------------- Auth API endpoints -------------
export const authAPI = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// ------------- Project API endpoints -------------
export const projectAPI = {
    createProject: async (projectData) => {
        const response = await api.post('/projects', projectData);
        return response.data;
    },
    getProjectById: async (id) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },
    approveProject: async (id, body = {}) => {
        const response = await api.patch(`/projects/${id}/approve`, body);
        return response.data;
    },
    completeProject: async (id) => {
        const response = await api.patch(`/projects/${id}/complete`);
        return response.data;
    },
    addChangeRequest: async (id, changeRequestData) => {
        const response = await api.post(`/projects/${id}/change-requests`, changeRequestData);
        return response.data;
    },
    classifyChangeRequest: async (projectId, changeRequestId, data) => {
        const response = await api.patch(`/projects/${projectId}/change-requests/${changeRequestId}/classify`, data);
        return response.data;
    },
    incrementRevision: async (id) => {
        const response = await api.patch(`/projects/${id}/revisions`);
        return response.data;
    },
    getUserProjects: async () => {
        const response = await api.get('/projects');
        return response.data;
    },
    addDeliverable: async (projectId, payload) => {
        const response = await api.post(`/projects/${projectId}/deliverables`, payload);
        return response.data;
    },
    acceptDeliverable: async (projectId, deliverableId) => {
        const response = await api.patch(`/projects/${projectId}/deliverables/${deliverableId}/accept`);
        return response.data;
    },
    requestDeliverableRevision: async (projectId, deliverableId, feedback) => {
        const response = await api.patch(`/projects/${projectId}/deliverables/${deliverableId}/request-revision`, { feedback });
        return response.data;
    },
    getProjectMessages: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/messages`);
        return response.data;
    },
    sendProjectMessage: async (projectId, content) => {
        const response = await api.post(`/projects/${projectId}/messages`, { content });
        return response.data;
    },
};

// ------------- Users API (freelancer search, profile) -------------
export const usersAPI = {
    getFreelancers: async (query = '') => {
        const params = query ? { q: query } : {};
        const response = await api.get('/users/freelancers', { params });
        return response.data;
    },
    getUserProfile: async (userId) => {
        const response = await api.get(`/users/${userId}`);
        return response.data;
    },
    getFreelancerProjects: async (freelancerId) => {
        const response = await api.get(`/users/${freelancerId}/projects`);
        return response.data;
    },
    /** Freelancer: Daily Gig mode + skills */
    patchMe: async (body) => {
        const response = await api.patch('/users/me', body);
        return response.data;
    },
};

/** Client posts instant gigs; freelancers receive offers */
export const gigsAPI = {
    postGig: async (payload) => {
        const response = await api.post('/gigs', payload);
        return response.data;
    },
    getFreelancerOffers: async () => {
        const response = await api.get('/gigs/freelancer/offers');
        return response.data;
    },
    respondToOffer: async (offerId, action) => {
        const response = await api.post(`/gigs/offers/${offerId}/respond`, { action });
        return response.data;
    },
    getRecruiterAlerts: async (unreadOnly = false) => {
        const response = await api.get('/gigs/recruiter/alerts', {
            params: unreadOnly ? { unread: '1' } : {},
        });
        return response.data;
    },
    markRecruiterAlertRead: async (alertId) => {
        const response = await api.patch(`/gigs/recruiter/alerts/${alertId}/read`);
        return response.data;
    },
};

// ------------- Conversations API (user-to-user chat) -------------
// ------------- ORION (Gemini), POST /maya/* -------------
export const mayaAPI = {
    chat: async ({ mode = 'chat', messages }) => {
        const response = await api.post('/maya/chat', { mode, messages });
        return response.data;
    },
    match: async ({ brief }) => {
        const response = await api.post('/maya/match', { brief });
        return response.data;
    },
};

export const conversationAPI = {
    getConversations: async () => {
        const response = await api.get('/conversations');
        return response.data;
    },
    getOrCreateConversation: async (otherUserId) => {
        const response = await api.post('/conversations', { otherUserId });
        return response.data;
    },
    getMessages: async (conversationId) => {
        const response = await api.get(`/conversations/${conversationId}/messages`);
        return response.data;
    },
    sendMessage: async (conversationId, content) => {
        const response = await api.post(`/conversations/${conversationId}/messages`, { content });
        return response.data;
    },
};

export default api;
