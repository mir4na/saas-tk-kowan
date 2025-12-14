import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  registerOptions: (data) => api.post('/auth/register/options', data),
  registerVerify: (data) => api.post('/auth/register/verify', data),
  loginOptions: (data) => api.post('/auth/login/options', data),
  loginVerify: (data) => api.post('/auth/login/verify', data),
  getMe: () => api.get('/auth/me'),
};

export const profileAPI = {
  updateName: (data) => api.put('/profile/name', data),
  updatePhoto: (formData) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    return api.put('/profile/photo', formData, config);
  },
  deletePhoto: () => api.delete('/profile/photo'),
};

export const notesAPI = {
  getAll: () => api.get('/notes'),
  getOne: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export default api;
