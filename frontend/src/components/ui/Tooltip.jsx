import { useId } from 'react';

const SIDES = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
};

const ALIGNS = {
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0', // for triggers at a container's right edge, where a centred tip would be clipped
};

/**
 * A small styled label shown on hover and on keyboard focus — the native
 * `title` tooltip can't be styled. Wraps its trigger; the trigger should be
 * focusable so keyboard users get the label too.
 */
export default function Tooltip({ label, side = 'top', align = 'center', children, className = '' }) {
  const id = useId();

  return (
    <span className={`group/tip relative inline-flex ${className}`} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs
          font-medium text-canvas opacity-0 shadow-float transition duration-150
          group-hover/tip:opacity-100 group-has-focus-visible/tip:opacity-100
          ${side === 'top' ? 'translate-y-0.5' : '-translate-y-0.5'}
          group-hover/tip:translate-y-0 group-has-focus-visible/tip:translate-y-0
          ${SIDES[side]} ${ALIGNS[align]}`}
      >
        {label}
      </span>
    </span>
  );
}
