import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

// ── Button ────────────────────────────────────────────────
type BV = 'brand' | 'primary' | 'danger' | 'secondary' | 'ghost';
const bv: Record<BV, string> = {
  brand:     'bg-brand-400 text-white active:bg-brand-600 shadow-sm',
  primary:   'bg-primary-600 text-white active:bg-primary-800 shadow-sm',
  danger:    'bg-danger-400 text-white active:bg-danger-600',
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
  ({ variant = 'brand', size = 'md', loading, fullWidth, className, children, disabled, ...p }, ref) => {
    const sz = {
      sm: 'h-9  px-4 text-sm  rounded-xl',
      md: 'h-11 px-5 text-sm  rounded-xl',
      lg: 'h-13 px-6 text-base rounded-2xl',
      xl: 'h-16 px-6 text-lg  rounded-2xl font-semibold',
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

// ── Card ──────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-4', className)}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-2' }[size];
  return <div className={cn('animate-spin rounded-full border-current border-t-transparent', s)} />;
}

// ── SearchingDots ─────────────────────────────────────────
export function SearchingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-brand-400 bounce-dot" />
      <div className="w-2 h-2 rounded-full bg-brand-400 bounce-dot-2" />
      <div className="w-2 h-2 rounded-full bg-brand-400 bounce-dot-3" />
    </div>
  );
}

// ── StarRating ────────────────────────────────────────────
export function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-3 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="text-4xl transition-transform active:scale-110"
        >
          <span className={star <= value ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  );
}

// ── LocationInput ─────────────────────────────────────────
export function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  iconColor = 'text-brand-400',
}: {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  icon:        ReactNode;
  iconColor?:  string;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
      <div className={cn('flex-shrink-0', iconColor)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm font-medium text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-300"
        />
      </div>
    </div>
  );
}

// ── ChoferCard ────────────────────────────────────────────
export function ChoferCard({
  nombre,
  rating,
  placa,
  vehiculo,
}: {
  nombre:   string;
  rating:   number;
  placa:    string;
  vehiculo: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      {/* Avatar */}
      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">👨‍✈️</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{nombre}</p>
        <p className="text-xs text-gray-400 truncate">{vehiculo}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-amber-400 text-xs">★ {rating.toFixed(1)}</span>
          <span className="text-gray-200">·</span>
          <span className="text-xs font-mono font-medium text-gray-600">{placa}</span>
        </div>
      </div>
    </Card>
  );
}
