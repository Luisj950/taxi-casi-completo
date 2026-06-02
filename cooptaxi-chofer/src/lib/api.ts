// ── lib/api.ts ─────────────────────────────────────────────
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({ baseURL: BASE, timeout: 10_000 });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
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
  login:  (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me:     () => api.get('/auth/me'),
};

export const despachoApi = {
  responder:    (id: string, accion: 'ACEPTAR' | 'RECHAZAR') =>
    api.patch(`/despacho/carreras/${id}/responder`, { accion }),
  completar:    (id: string, calificacion: number, comentario?: string) =>
    api.patch(`/despacho/carreras/${id}/completar`, { calificacion, comentario }),
  misCarreras:  (params?: object) =>
    api.get('/despacho/carreras', { params }),
};

export const seguridadApi = {
  panico:    (lat: number, lng: number, carrera_id?: string) =>
    api.post('/seguridad/panico', { lat, lng, carrera_id }),
  incidente: (data: object) => api.post('/seguridad/incidentes', data),
};

export const altaDemandaApi = {
  responder: () => api.post('/alta-demanda/responder'),
};
