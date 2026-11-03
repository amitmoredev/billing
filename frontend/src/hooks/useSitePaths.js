import { useLocation } from 'react-router-dom';

/** URL segment standing in for a site id when a bill has no site yet. */
export const UNASSIGNED_SITE = 'unassigned';

/**
 * Builds links into the Sites & Bills area. The same pages serve the dashboard
 * (/sites/...) and the admin console (/admin/sites/...), so every link stays in
 * whichever area the user is already in.
 */
export const useSitePaths = () => {
  const { pathname } = useLocation();
  const base = pathname.startsWith('/admin') ? '/admin/sites' : '/sites';

  return {
    sites: base,
    /** The temporary bulk "Assign bills" screen. */
    assign: `${base}/assign`,
    /** `siteId` null or undefined = the unassigned bills. */
    site: (siteId) => `${base}/${siteId ?? UNASSIGNED_SITE}`,
    /** Where a bill lives: under its own site, whatever URL it was reached by. */
    bill: (bill) => `${base}/${bill.site?.id ?? UNASSIGNED_SITE}/bills/${bill.id}`,
  };
};
