import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

// ── Button ────────────────────────────────────────────────
type BV = 'primary' | 'success' | 'danger' | 'secondary' | 'ghost';
const bv: Record<BV, string> = {
  primary:   'bg-primary-600 text-white active:bg-primary-800 shadow-sm shadow-primary-200',
  success:   'bg-success-600 text-white active:bg-success-800 shadow-sm shadow-success-200',
  danger:    'bg-danger-400  text-white active:bg-danger-600',
  secondary: 'bg-white text-gray-700 border border-gray-200 active:bg-gray-50',
  ghost:     'bg-transparent text-gray-500 active:bg-gray-100',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BV;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...p }, ref) => {
    const sz = {
      sm: 'h-9  px-4 text-sm rounded-xl',
      md: 'h-11 px-5 text-sm rounded-xl',
      lg: 'h-13 px-6 text-base rounded-2xl',
      xl: 'h-16 px-6 text-lg rounded-2xl font-semibold',
    }[size];
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.97] disabled:opacity-50',
          bv[variant], sz, fullWidth && 'w-full', className,
        )}
        {...p}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

// ── Badge ─────────────────────────────────────────────────
type BadgeV = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';
const badgeV: Record<BadgeV, string> = {
  green:  'bg-success-50 text-success-600',
  amber:  'bg-warn-50    text-warn-600',
  red:    'bg-danger-50  text-danger-600',
  blue:   'bg-blue-50    text-blue-700',
  purple: 'bg-primary-50 text-primary-600',
  gray:   'bg-gray-100   text-gray-500',
};
export function Badge({ variant = 'gray', children, className }: {
  variant?: BadgeV; children: ReactNode; className?: string;
}) {
  return (
    <span className={cn('inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full', badgeV[variant], className)}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100 p-4', className)}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm:'w-4 h-4 border-2', md:'w-6 h-6 border-2', lg:'w-10 h-10 border-3' }[size];
  return <div className={cn('animate-spin rounded-full border-current border-t-transparent', s)} />;
}

// ── InfoRow ───────────────────────────────────────────────
export function InfoRow({ label, value, valueClass }: {
  label: string; value: string | ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={cn('text-sm font-medium text-gray-800', valueClass)}>{value}</span>
    </div>
  );
}

// ── PanicButton ───────────────────────────────────────────
export function PanicButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="relative w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm font-semibold active:bg-danger-100 transition-colors"
    >
      🚨 Alerta de pánico
    </button>
  );
}

// ── QuickReply ────────────────────────────────────────────
const RESPUESTAS = [
  'Ya voy, dame 2 min',
  'Estoy afuera',
  'No te encuentro, ¿dónde estás?',
  'Hay tráfico, tardo un poco',
  'Llegué al destino',
  'Ok, entendido',
];
export function QuickReplies({ onSelect }: { onSelect: (msg: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {RESPUESTAS.map((r) => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 active:bg-gray-100 transition-colors"
        >
          {r}
        </button>
      ))}
    </div>
  );
}
