import axios from 'axios';
import { supabase } from '../lib/supabase';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      '请求失败';
    return Promise.reject(new Error(message));
  },
);

export default http;
