import axios from 'axios';
export const api = axios.create({ baseURL: '/api' });
const token = localStorage.getItem('adminToken');
if (token) api.defaults.headers.common['x-admin-token'] = token;
