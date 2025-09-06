import axios from 'axios';
import { environment } from '../../environments/environment';

export const api = axios.create({
  baseURL: environment.apiBase,
  timeout: 15000,
});

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err?.response?.data ?? err)
);
