import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, type ReactNode, forwardRef, Fragment } from 'react';

// ── Button ────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type BtnSize    = 'xs' | 'sm' | 'md' | 'lg';

const bv: Record<BtnVariant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-800 border-transparent shadow-sm',
  secondary: 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
  danger:    'bg-danger-400 text-white hover:bg-danger-600 border-transparent',
  ghost:     'bg-transparent text-gray-500 hover:bg-gray-100 border-transparent',
  success:   'bg-success-600 text-white hover:bg-success-800 border-transparent',
};
const bs: Record<BtnSize, string> = {
  xs: 'text-[11px] px-2.5 py-1 rounded-md gap-1',
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-lg gap-2',
  lg: 'text-sm px-5 py-2.5 rounded-lg gap-2',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...p }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium border transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
        bv[variant], bs[size], className,
      )}
      {...p}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

// ── Badge ─────────────────────────────────────────────────
type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';
const badgeV: Record<BadgeVariant, string> = {
  green:  'bg-success-50 text-success-800',
  amber:  'bg-warn-50 text-warn-800',
  red:    'bg-danger-50 text-danger-800',
  blue:   'bg-blue-50 text-blue-700',
  purple: 'bg-primary-50 text-primary-800',
  gray:   'bg-gray-100 text-gray-500',
};
export function Badge({
  variant = 'gray', children, className,
}: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full',
      badgeV[variant], className,
    )}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, className, padding = true }: {
  children: ReactNode; className?: string; padding?: boolean;
}) {
  return (
    <div className={cn(
      'bg-white border border-gray-100 rounded-xl shadow-sm',
      padding && 'p-4', className,
    )}>
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────
export function StatCard({ label, value, sub, subVariant = 'neutral', icon }: {
  label: string; value: string | number; sub?: string;
  subVariant?: 'up' | 'warn' | 'neutral'; icon?: ReactNode;
}) {
  const sc = { up: 'text-success-600', warn: 'text-warn-600', neutral: 'text-gray-400' }[subVariant];
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-start">
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {sub && <p className={cn('text-xs mt-1', sc)}>{sub}</p>}
      </div>
      {icon && <div className="text-gray-300 mt-0.5">{icon}</div>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────
export function Input({ label, error, className, ...p }:
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <input
        className={cn(
          'h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
          'placeholder:text-gray-300',
          error && 'border-danger-400',
          className,
        )}
        {...p}
      />
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────
export function Select({ label, error, children, className, ...p }:
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; children: ReactNode }
) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <select
        className={cn(
          'h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-400',
          className,
        )}
        {...p}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-3 h-3 border', md: 'w-5 h-5 border-2', lg: 'w-8 h-8 border-2' }[size];
  return <div className={cn('animate-spin rounded-full border-current border-t-transparent', s)} />;
}

// ── Empty State ───────────────────────────────────────────
export function EmptyState({ message, icon = '📭' }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-gray-400">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string;
  children: ReactNode; footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ── SectionTitle ─────────────────────────────────────────
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
      {children}
    </h2>
  );
}
