import axios from 'axios';
import { environment } from '../../environments/environment';

export const api = axios.create({
  baseURL: environment.apiBase, // Ora sarà http://localhost:8000/api
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err?.response?.data ?? err)
);