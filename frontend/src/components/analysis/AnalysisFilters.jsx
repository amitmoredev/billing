import { useMemo } from 'react';
import SelectField from '../ui/SelectField.jsx';
import TextField from '../ui/TextField.jsx';
import { PERIOD_MODES } from '../../constants/analytics.constants.js';
import { fyLabel, fyOptions } from '../../utils/period.js';
import { siteLabel } from '../../utils/format.js';

/**
 * Site, DISCOM and period. Picking a DISCOM narrows the site list to its sites.
 * `firstMonth` (the earliest bill on record) decides how far back the
 * financial years go.
 */
export default function AnalysisFilters({ filters, onChange, sites, firstMonth }) {
  const discoms = useMemo(
    () => [...new Set(sites.map((site) => site.discom).filter(Boolean))].sort(),
    [sites]
  );
  const siteOptions = sites
    .filter((site) => !filters.discom || site.discom?.toLowerCase() === filters.discom.toLowerCase())
    .map((site) => ({ value: site.id, label: siteLabel(site) }));

  // A DISCOM that doesn't cover the chosen site would match nothing, so the site resets.
  const pickDiscom = (discom) => {
    const site = sites.find((s) => s.id === filters.site);
    const keepsSite = !discom || site?.discom?.toLowerCase() === discom.toLowerCase();
    onChange({ discom, ...(keepsSite ? {} : { site: '' }) });
  };

  return (
    <div className="card grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
      <SelectField
        label="Site"
        value={filters.site}
        onChange={(e) => onChange({ site: e.target.value })}
        placeholder="All sites"
        options={siteOptions}
      />
      <SelectField
        label="DISCOM"
        value={filters.discom}
        onChange={(e) => pickDiscom(e.target.value)}
        placeholder="All DISCOMs"
        options={discoms.map((discom) => ({ value: discom, label: discom }))}
      />
      <SelectField
        label="Period"
        value={filters.period}
        onChange={(e) => onChange({ period: e.target.value })}
        options={PERIOD_MODES}
      />

      {filters.period === 'fy' && (
        <SelectField
          label="Financial year"
          value={filters.fy}
          onChange={(e) => onChange({ fy: e.target.value })}
          options={fyOptions(firstMonth).map((year) => ({ value: String(year), label: fyLabel(year) }))}
        />
      )}
      {filters.period === 'month' && (
        <TextField
          label="Billing month"
          type="month"
          value={filters.month}
          onChange={(e) => onChange({ month: e.target.value })}
        />
      )}
      {filters.period === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <TextField label="From" type="month" value={filters.from} onChange={(e) => onChange({ from: e.target.value })} />
          <TextField
            label="To"
            type="month"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
