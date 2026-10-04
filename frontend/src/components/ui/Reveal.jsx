import { useInView } from '../../hooks/useInView.js';

const EFFECTS = {
  up: 'reveal-up', // text and cards
  scale: 'reveal-scale', // product previews
};

/** Animates its content in the first time it scrolls into view. `delay` staggers siblings. */
export default function Reveal({
  as: Tag = 'div',
  effect = 'up',
  delay = 0,
  className = '',
  children,
  ...props
}) {
  const [ref, inView] = useInView();

  return (
    <Tag
      ref={ref}
      {...props}
      style={inView && delay ? { animationDelay: `${delay}ms` } : undefined}
      className={`${inView ? EFFECTS[effect] : 'opacity-0'} ${className}`}
    >
      {children}
    </Tag>
  );
}
