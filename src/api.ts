import axios from 'axios';

export const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const isLogin = typeof err.config?.url === 'string' && err.config.url.includes('/auth/login');
    if (err.response?.status === 401 && !isLogin) {
      localStorage.removeItem('token');
      window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) return 'Le serveur ne répond pas. Vérifiez la connexion et réessayez.';
    return (e.response.data as { message?: string })?.message ?? 'Une erreur est survenue.';
  }
  return 'Une erreur est survenue.';
}

export const get = <T,>(url: string, params?: Record<string, string>) =>
  http.get<T>(url, { params }).then((r) => r.data);
