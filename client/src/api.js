import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

// Campaigns
export const createCampaign = (data) => api.post('/campaigns', data);
export const getCampaigns = () => api.get('/campaigns');
export const getCampaign = (id) => api.get(`/campaigns/${id}`);
export const updateCampaign = (id, data) => api.put(`/campaigns/${id}`, data);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);
export const bulkDeleteCampaigns = (ids) => api.post('/campaigns/bulk-delete', { ids });
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`);
export const getCampaignStatus = (id) => api.get(`/campaigns/${id}/status`);
export const pauseCampaign = (id) => api.post(`/campaigns/${id}/pause`);

// Contacts
export const uploadContacts = (formData) => api.post('/contacts/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const saveContacts = (data) => api.post('/contacts/save', data);
export const getCampaignContacts = (campaignId) => api.get(`/contacts/campaign/${campaignId}`);

// Media
export const uploadMedia = (formData) => api.post('/media/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getCampaignMedia = (campaignId) => api.get(`/media/campaign/${campaignId}`);
export const deleteMedia = (id) => api.delete(`/media/${id}`);

// AI
export const enhanceMessage = (data) => api.post('/ai/enhance', data);

// Reports
export const getReports = () => api.get('/reports');
export const getReport = (id) => api.get(`/reports/${id}`);

// Templates
export const getTemplates = () => api.get('/templates');
export const saveTemplate = (data) => api.post('/templates', data);
export const loadTemplate = (id, data) => api.post(`/templates/${id}/load`, data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);

export default api;
