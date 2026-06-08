// ── lib/api.ts ─────────────────────────────────────────────
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export const api = axios.create({ baseURL: BASE, timeout: 10_000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('access_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error();
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refresh });
        localStorage.setItem('access_token', data.access_token);
        orig.headers.Authorization = `Bearer ${data.access_token}`;
        return api(orig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login:    (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (d: object) => api.post('/auth/register', d),
  logout:   () => api.post('/auth/logout'),
  me:       () => api.get('/auth/me'),
};

export const despachoApi = {
  solicitar: (d: object) => api.post('/despacho/carreras', d),
  cancelar:  (id: string) => api.patch(`/despacho/carreras/${id}/cancelar`),
  calificar: (id: string, calificacion: number, comentario?: string) =>
    api.patch(`/despacho/carreras/${id}/completar`, { calificacion, comentario }),
  miCarrera: (id: string) => api.get(`/despacho/carreras/${id}`),
};
