import { Link } from 'react-router-dom';
import { useSitePaths } from '../../hooks/useSitePaths.js';
import { formatChange, siteLabel } from '../../utils/format.js';

// Small pieces the Analysis tables share.

/** Site on top, consumer number under it — how a connection is named everywhere on the page. */
export function ConnectionCell({ connection: { site, customerNumber, consumerName } }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-ink">{siteLabel(site) || 'Unassigned'}</p>
      <p className="truncate text-xs text-subtle" title={consumerName || undefined}>
        Consumer no. {customerNumber || '—'}
      </p>
    </div>
  );
}

/** Opens the bill, inside whichever area (dashboard or admin) the page is in. */
export function BillLink({ bill, children }) {
  const paths = useSitePaths();
  return (
    <Link to={paths.bill(bill)} className="focus-ring rounded font-semibold text-accent-fg hover:underline">
      {children}
    </Link>
  );
}

/** A site's page, or the unassigned bills when `site` is null. */
export function SiteLink({ site, children }) {
  const paths = useSitePaths();
  return (
    <Link to={paths.site(site?.id)} className="focus-ring rounded font-semibold text-accent-fg hover:underline">
      {children}
    </Link>
  );
}

/** A % change, red when consumption rose and green when it fell. */
export function Change({ value }) {
  const tone = value == null || value === 0 ? 'text-subtle' : value > 0 ? 'text-danger-fg' : 'text-ok-fg';
  return <span className={`num font-semibold ${tone}`}>{formatChange(value)}</span>;
}
