import SelectField from '../ui/SelectField.jsx';
import TextField from '../ui/TextField.jsx';
import { PERIOD_MODES } from '../../constants/analytics.constants.js';
import { fyLabel, fyOptions } from '../../utils/period.js';
import { siteLabel } from '../../utils/format.js';

/** Site details the filters narrow by, in the order they show. The API matches them ignoring case. */
const SITE_DETAILS = [
  { key: 'organisation', label: 'Organisation', all: 'All organisations' },
  { key: 'state', label: 'State', all: 'All states' },
  { key: 'discom', label: 'DISCOM', all: 'All DISCOMs' },
  { key: 'consumerCategory', label: 'Consumer category', all: 'All categories' },
];

const same = (a, b) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

/** Does `site` match every site-detail filter that is set? */
const matches = (site, filters) => SITE_DETAILS.every(({ key }) => !filters[key] || same(site[key], filters[key]));

/**
 * Organisation, state, site, DISCOM, consumer category and period. Each
 * site-detail list offers only values some site actually has, and the site
 * list narrows to the sites that match the details picked. `firstMonth` (the
 * earliest bill on record) decides how far back the financial years go.
 */
export default function AnalysisFilters({ filters, onChange, sites, firstMonth }) {
  const optionsFor = (key) =>
    [...new Set(sites.map((site) => site[key]).filter(Boolean))].sort().map((value) => ({ value, label: value }));
  const siteOptions = sites
    .filter((site) => matches(site, filters))
    .map((site) => ({ value: site.id, label: siteLabel(site) }));

  // A detail that doesn't cover the chosen site would match nothing, so the site resets.
  const pickDetail = (key, value) => {
    const site = sites.find((s) => s.id === filters.site);
    const keepsSite = !site || matches(site, { ...filters, [key]: value });
    onChange({ [key]: value, ...(keepsSite ? {} : { site: '' }) });
  };

  const detail = ({ key, label, all }) => (
    <SelectField
      key={key}
      label={label}
      value={filters[key]}
      onChange={(e) => pickDetail(key, e.target.value)}
      placeholder={all}
      options={optionsFor(key)}
    />
  );

  return (
    <div className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {SITE_DETAILS.slice(0, 2).map(detail)}
      <SelectField
        label="Site"
        value={filters.site}
        onChange={(e) => onChange({ site: e.target.value })}
        placeholder="All sites"
        options={siteOptions}
      />
      {SITE_DETAILS.slice(2).map(detail)}
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
