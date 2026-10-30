import { LoaderCircle } from 'lucide-react';

// Rings are inset so a bordered button is exactly as big as a filled one.
const VARIANTS = {
  primary: 'bg-accent text-on-accent shadow-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-ink shadow-card ring-1 ring-inset ring-line hover:bg-hover hover:ring-line-strong',
  ghost: 'text-muted hover:bg-hover hover:text-ink',
  danger: 'bg-danger-soft text-danger-fg ring-1 ring-inset ring-danger-line hover:brightness-105',
};

const SIZES = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-11 gap-2 rounded-[0.625rem] px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[0.9375rem]',
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
      aria-busy={loading || undefined}
      className={`focus-ring inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap
        font-medium tracking-[-0.006em] transition-[background-color,box-shadow,color,transform,opacity]
        duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        IconComponent && <IconComponent className="size-4" strokeWidth={2.25} />
      )}
      {children}
    </button>
  );
}
