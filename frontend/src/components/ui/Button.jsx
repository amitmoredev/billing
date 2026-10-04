import { LoaderCircle } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-accent text-on-accent shadow-card hover:bg-accent-hover',
  secondary: 'bg-surface text-ink ring-1 ring-line hover:bg-hover hover:ring-line-strong',
  ghost: 'text-muted hover:bg-hover hover:text-ink',
  danger: 'bg-danger-soft text-danger-fg ring-1 ring-danger-line hover:brightness-105',
};

const SIZES = {
  sm: 'h-9 gap-1.5 px-3.5 text-sm',
  md: 'h-11 gap-2 px-4.5 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: IconComponent,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`focus-ring inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl font-semibold
        transition disabled:cursor-not-allowed disabled:opacity-45
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? (
        <LoaderCircle className="size-4.5 animate-spin" />
      ) : (
        IconComponent && <IconComponent className="size-4.5" />
      )}
      {children}
    </button>
  );
}
