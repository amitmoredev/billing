import { Zap } from 'lucide-react';
import { BRAND } from '../../constants/brand.constants.js';

const SIZES = {
  sm: { box: 'size-9 rounded-xl', icon: 'size-4.5' },
  md: { box: 'size-10 rounded-2xl', icon: 'size-5' },
};

/**
 * Logo tile plus product name. The only place the brand is drawn. `subtitle`
 * replaces the tagline line, e.g. to say which area of the app this is.
 */
export default function BrandMark({
  size = 'md',
  showName = true,
  showTagline = false,
  subtitle,
  className = '',
}) {
  const secondLine = subtitle ?? (showTagline ? BRAND.tagline : null);
  const { box, icon } = SIZES[size];

  return (
    <span className={`flex min-w-0 items-center gap-3 ${className}`}>
      <span className={`grid shrink-0 place-items-center bg-accent text-on-accent ${box}`}>
        <Zap className={icon} strokeWidth={2.4} />
      </span>

      {showName && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-display text-base font-bold tracking-tight text-ink">
            {BRAND.name}
          </span>
          {secondLine && (
            <span className="block truncate text-xs font-medium text-subtle">{secondLine}</span>
          )}
        </span>
      )}
    </span>
  );
}
