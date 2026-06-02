import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { finanzasApi, despachoApi, usersApi } from '@/lib/api';
import { Card, StatCard, SectionTitle, Spinner } from '@/components/ui';
import { TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';
import type { Carrera, User, ReporteFinanciero } from '@/types';

// ── Colores de la paleta CoopTaxi ─────────────────────────
const COLORS = {
  primary: '#534AB7',
  success: '#1D9E75',
  warn:    '#BA7517',
  danger:  '#E24B4A',
  gray:    '#9CA3AF',
};
const PIE_COLORS = [COLORS.success, COLORS.primary, COLORS.warn, COLORS.danger, COLORS.gray];

// ── Helpers para construir datos de gráficas ─────────────
function buildCarrerasPorDia(carreras: Carrera[]) {
  const map: Record<string, { dia: string; total: number; completadas: number }> = {};
  // Últimos 7 días
  for (let i = 6; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('DD/MM');
    map[d] = { dia: d, total: 0, completadas: 0 };
  }
  carreras.forEach((c) => {
    const d = dayjs(c.created_at).format('DD/MM');
    if (map[d]) {
      map[d].total++;
      if (c.estado === 'COMPLETADA') map[d].completadas++;
    }
  });
  return Object.values(map);
}

function buildTopChoferes(carreras: Carrera[]) {
  const map: Record<string, { nombre: string; carreras: number; rating: number }> = {};
  carreras.forEach((c) => {
    if (!c.chofer_id || !c.chofer) return;
    if (!map[c.chofer_id]) {
      map[c.chofer_id] = { nombre: c.chofer.nombre, carreras: 0, rating: c.chofer.rating_promedio };
    }
    map[c.chofer_id].carreras++;
  });
  return Object.values(map)
    .sort((a, b) => b.carreras - a.carreras)
    .slice(0, 8);
}

function buildDistribucionEstados(carreras: Carrera[]) {
  const estados: Record<string, number> = {
    COMPLETADA: 0, EN_RUTA: 0, PENDIENTE: 0, CANCELADA: 0,
  };
  carreras.forEach((c) => { if (estados[c.estado] !== undefined) estados[c.estado]++; });
  return Object.entries(estados).map(([name, value]) => ({ name, value }));
}

// ── Tooltip personalizado ─────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function ReportesPage() {
  const hoy   = dayjs().startOf('month').format('YYYY-MM-DD');
  const fin   = dayjs().endOf('month').format('YYYY-MM-DD');
  const desde = dayjs().subtract(7, 'day').toISOString();

  const { data: carrerasRes, isLoading: loadC } = useQuery({
    queryKey: ['carreras-reporte'],
    queryFn:  () => despachoApi.carreras({ desde, limit: 500 }),
  });

  const { data: reporteRes, isLoading: loadR } = useQuery({
    queryKey: ['reporte-mes'],
    queryFn:  () => finanzasApi.reporte(hoy, fin),
  });

  const { data: sociosRes } = useQuery({
    queryKey: ['socios-reporte'],
    queryFn:  () => usersApi.list({ rol: 'CHOFER', limit: 50 }),
  });

  const carreras = (carrerasRes?.data?.data ?? []) as Carrera[];
  const reporte  = reporteRes?.data as ReporteFinanciero | undefined;
  const socios   = (sociosRes?.data?.data ?? []) as User[];

  const porDia        = buildCarrerasPorDia(carreras);
  const topChoferes   = buildTopChoferes(carreras);
  const distribucion  = buildDistribucionEstados(carreras);

  const totalCarreras  = carreras.length;
  const completadas    = carreras.filter((c) => c.estado === 'COMPLETADA').length;
  const tasaExito      = totalCarreras > 0 ? Math.round((completadas / totalCarreras) * 100) : 0;
  const ratingPromedio = socios.length > 0
    ? (socios.reduce((s, u) => s + u.rating_promedio, 0) / socios.length).toFixed(1)
    : '—';

  const isLoading = loadC || loadR;

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-primary-600" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Reportes</h1>
          <p className="text-xs text-gray-400">Últimos 7 días · Mes actual</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      )}

      {!isLoading && (
        <>
          {/* KPIs */}
          <section>
            <SectionTitle>Indicadores clave</SectionTitle>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard
                label="Carreras (7 días)"
                value={totalCarreras}
                sub={`${completadas} completadas`}
                subVariant="up"
              />
              <StatCard
                label="Tasa de éxito"
                value={`${tasaExito}%`}
                subVariant={tasaExito >= 80 ? 'up' : 'warn'}
                sub={tasaExito >= 80 ? 'Por encima del objetivo' : 'Revisar cancelaciones'}
              />
              <StatCard
                label="Recaudado este mes"
                value={`$${reporte?.total_recaudado ?? 0}`}
                subVariant="up"
              />
              <StatCard
                label="Rating promedio flota"
                value={`★ ${ratingPromedio}`}
                subVariant="up"
              />
            </div>
          </section>

          {/* Gráfica 1 — Carreras por día (área) */}
          <section>
            <SectionTitle>Carreras por día — últimos 7 días</SectionTitle>
            <Card>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={porDia} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.success} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="#E5E7EB" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#E5E7EB" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone" dataKey="total" name="Total"
                    stroke={COLORS.primary} fill="url(#gradTotal)" strokeWidth={2}
                  />
                  <Area
                    type="monotone" dataKey="completadas" name="Completadas"
                    stroke={COLORS.success} fill="url(#gradComp)" strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Gráfica 2 — Top choferes (barras) */}
            <section>
              <SectionTitle>Top choferes por carreras</SectionTitle>
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={topChoferes}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#E5E7EB" />
                    <YAxis
                      dataKey="nombre" type="category"
                      tick={{ fontSize: 11 }} width={90}
                      stroke="#E5E7EB"
                      tickFormatter={(v: string) => v.split(' ')[0]} // Solo primer nombre
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="carreras" name="Carreras" fill={COLORS.primary} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </section>

            {/* Gráfica 3 — Distribución por estado (pie) */}
            <section>
              <SectionTitle>Distribución por estado</SectionTitle>
              <Card className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={distribucion}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={3} dataKey="value"
                    >
                      {distribucion.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Carreras']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Stats debajo del pie */}
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {distribucion.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-500 truncate">{d.name}</span>
                      <span className="text-xs font-semibold text-gray-800 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </div>

          {/* Gráfica 4 — Cuotas e ingresos del mes */}
          <section>
            <SectionTitle>Finanzas del mes</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total recaudado</p>
                <p className="text-2xl font-bold text-gray-900">${reporte?.total_recaudado ?? 0}</p>
                <p className="text-xs text-success-600 mt-1">Este mes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Cuotas cobradas</p>
                <p className="text-2xl font-bold text-gray-900">{reporte?.cuotas_cobradas ?? 0}</p>
                <p className="text-xs text-gray-400 mt-1">de socios</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Socios en mora</p>
                <p className="text-2xl font-bold text-gray-900">{reporte?.socios_en_mora ?? 0}</p>
                <p className={`text-xs mt-1 ${(reporte?.socios_en_mora ?? 0) > 0 ? 'text-warn-600' : 'text-success-600'}`}>
                  {(reporte?.socios_en_mora ?? 0) > 0 ? 'Requieren atención' : 'Todo al día'}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
