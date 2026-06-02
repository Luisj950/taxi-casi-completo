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

export const usersApi = {
  list:      (p?: object) => api.get('/users', { params: p }),
  get:       (id: string) => api.get(`/users/${id}`),
  create:    (d: unknown) => api.post('/users', d),
  update:    (id: string, d: unknown) => api.patch(`/users/${id}`, d),
  setEstado: (id: string, activo: boolean) => api.patch(`/users/${id}/estado`, { activo }),
};

export const despachoApi = {
  cola:      () => api.get('/despacho/cola'),
  carreras:  (p?: object) => api.get('/despacho/carreras', { params: p }),
  solicitar: (d: unknown) => api.post('/despacho/carreras', d),
  responder: (id: string, accion: 'ACEPTAR' | 'RECHAZAR') =>
    api.patch(`/despacho/carreras/${id}/responder`, { accion }),
  completar: (id: string, d: unknown) =>
    api.patch(`/despacho/carreras/${id}/completar`, d),
};

export const documentosApi = {
  list:   (p?: object) => api.get('/documentos', { params: p }),
  create: (d: unknown) => api.post('/documentos', d),
  update: (id: string, d: unknown) => api.patch(`/documentos/${id}`, d),
};

export const finanzasApi = {
  cuotas:  (p?: object) => api.get('/finanzas/cuotas', { params: p }),
  crear:   (d: unknown) => api.post('/finanzas/cuotas', d),
  pagar:   (id: string, d: unknown) => api.post(`/finanzas/cuotas/${id}/pagar`, d),
  reporte: (desde: string, hasta: string) =>
    api.get('/finanzas/reporte', { params: { desde, hasta } }),
};

export const flotaApi = {
  vehiculos:     (p?: object) => api.get('/flota/vehiculos', { params: p }),
  vehiculo:      (id: string) => api.get(`/flota/vehiculos/${id}`),
  crear:         (d: unknown) => api.post('/flota/vehiculos', d),
  mantenimiento: (id: string, d: unknown) =>
    api.post(`/flota/vehiculos/${id}/mantenimiento`, d),
  historial:     (id: string) =>
    api.get(`/flota/vehiculos/${id}/mantenimiento`),
};

export const seguridadApi = {
  incidentes: (p?: object) => api.get('/seguridad/incidentes', { params: p }),
};

export const altaDemandaApi = {
  estado:   () => api.get('/alta-demanda/estado'),
  activar:  () => api.post('/alta-demanda/activar'),
  historial:(p?: object) => api.get('/alta-demanda/historial', { params: p }),
};
