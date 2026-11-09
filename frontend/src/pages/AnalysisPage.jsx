import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  BellRing,
  Calculator,
  ChartColumn,
  FileX2,
  Gauge,
  IndianRupee,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  PiggyBank,
  SlidersHorizontal,
  Timer,
  TrendingUp,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import AnalysisFilters from '../components/analysis/AnalysisFilters.jsx';
import AssumptionsPanel from '../components/analysis/AssumptionsPanel.jsx';
import KpiTiles from '../components/analysis/KpiTiles.jsx';
import TrendPanel from '../components/analysis/TrendPanel.jsx';
import PowerFactorPanel from '../components/analysis/PowerFactorPanel.jsx';
import DemandPanel from '../components/analysis/DemandPanel.jsx';
import BenchmarkPanel from '../components/analysis/BenchmarkPanel.jsx';
import ComingSoon from '../components/analysis/ComingSoon.jsx';
import { RankCard } from '../components/analysis/OverviewCards.jsx';
import { demandRows, topSitesRows, worstPfRows } from '../components/analysis/rankRows.js';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAnalytics } from '../queries/analytics.query.js';
import { useSites } from '../queries/site.query.js';
import { useSitePaths } from '../hooks/useSitePaths.js';
import { DEFAULT_ASSUMPTIONS } from '../constants/analytics.constants.js';
import { currentMonth, fyStartYear, toRange } from '../utils/period.js';
import { formatMonth, formatNumber } from '../utils/format.js';

const ASSUMPTIONS_KEY = 'analysis.assumptions';

// Assumptions are a per-viewer convenience, so they live in this browser only.
const loadAssumptions = () => {
  try {
    return { ...DEFAULT_ASSUMPTIONS, ...JSON.parse(localStorage.getItem(ASSUMPTIONS_KEY) ?? '{}') };
  } catch {
    return DEFAULT_ASSUMPTIONS;
  }
};

const saveAssumptions = (values) => {
  try {
    localStorage.setItem(ASSUMPTIONS_KEY, JSON.stringify(values));
  } catch {
    // Storage blocked (private window): they still apply for this visit.
  }
};

const TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'alerts', label: 'Alerts', icon: BellRing, soon: true },
  { value: 'pf', label: 'Power factor', icon: Gauge },
  { value: 'demand', label: 'Contract demand', icon: Activity },
  { value: 'savings', label: 'Savings', icon: PiggyBank, soon: true },
  { value: 'sites', label: 'Sites', icon: MapPin },
];

/** The tabs not switched on yet, and what each will offer. */
const COMING_SOON = {
  alerts: {
    icon: BellRing,
    title: 'Smart alerts',
    description: 'Get told the moment a site needs attention, before it shows up on the next bill.',
    features: [
      { icon: Gauge, label: 'PF below target' },
      { icon: Activity, label: 'Contract demand exceeded' },
      { icon: TrendingUp, label: 'Sudden consumption jumps' },
      { icon: FileX2, label: 'Missing bills' },
      { icon: MessageCircle, label: 'WhatsApp & email notifications' },
    ],
  },
  savings: {
    icon: PiggyBank,
    title: 'Savings finder',
    description: 'See what each site could save in a year, what it would cost to fix and how fast it pays back.',
    features: [
      { icon: IndianRupee, label: 'Avoidable cost' },
      { icon: Zap, label: 'Capacitor sizing' },
      { icon: Activity, label: 'Contract demand right-sizing' },
      { icon: Calculator, label: 'Estimated annual savings' },
      { icon: Timer, label: 'Payback period' },
    ],
  },
};

const plural = (count, word) => `${formatNumber(count)} ${word}${count === 1 ? '' : 's'}`;

/**
 * Energy analysis over verified bills, in tabs: an overview, then alerts,
 * power factor, contract demand, savings and a site-by-site comparison.
 * Filters and the open tab live in the URL, so a view can be bookmarked or sent on.
 */
export default function AnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    site: searchParams.get('site') ?? '',
    discom: searchParams.get('discom') ?? '',
    organisation: searchParams.get('organisation') ?? '',
    state: searchParams.get('state') ?? '',
    consumerCategory: searchParams.get('consumerCategory') ?? '',
    period: searchParams.get('period') ?? 'all',
    fy: searchParams.get('fy') ?? String(fyStartYear(currentMonth())),
    month: searchParams.get('month') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  };
  const tab = searchParams.get('tab') ?? 'overview';

  const setParams = (changes) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true }
    );
  const openTab = (value, extra = {}) => setParams({ tab: value === 'overview' ? '' : value, ...extra });

  const [assumptions, setAssumptions] = useState(loadAssumptions);
  const [editingAssumptions, setEditingAssumptions] = useState(false);
  const applyAssumptions = (values) => {
    setAssumptions(values);
    saveAssumptions(values);
  };
  // Saved values outlive the visit, so the button says when they differ from the defaults.
  const customised = Object.keys(DEFAULT_ASSUMPTIONS).some(
    (key) => String(assumptions[key] ?? '') !== String(DEFAULT_ASSUMPTIONS[key] ?? '')
  );

  const range = toRange(filters);
  const invalidRange = range.from && range.to && range.from > range.to;
  const { data: sites = [] } = useSites();
  const { data, isLoading, isFetching, error } = useAnalytics({
    site: filters.site || undefined,
    discom: filters.discom || undefined,
    organisation: filters.organisation || undefined,
    state: filters.state || undefined,
    consumerCategory: filters.consumerCategory || undefined,
    ...(invalidRange ? {} : range),
    ...assumptions,
  });
  const hasBills = Boolean(data?.summary.bills);

  return (
    <div className="page-x w-full space-y-6 py-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Analysis</h1>
          <p className="mt-1.5 text-sm text-muted">
            {hasBills
              ? [
                  `${formatMonth(data.period.from)} – ${formatMonth(data.period.to)}`,
                  plural(data.summary.sites, 'site'),
                  plural(data.summary.connections, 'connection'),
                  plural(data.summary.bills, 'verified bill'),
                ].join(' · ')
              : 'Consumption, power factor, demand and savings across your verified bills.'}
          </p>
        </div>
        <Button
          variant={editingAssumptions ? 'primary' : 'secondary'}
          icon={SlidersHorizontal}
          onClick={() => setEditingAssumptions((open) => !open)}
          aria-expanded={editingAssumptions}
        >
          Assumptions
          {customised && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide
                ${editingAssumptions ? 'bg-white/20 text-on-accent' : 'bg-warn-soft text-warn-fg ring-1 ring-inset ring-warn-line'}`}
            >
              Custom
            </span>
          )}
        </Button>
      </header>

      <AnalysisFilters filters={filters} onChange={setParams} sites={sites} firstMonth={data?.available.from} />
      {invalidRange && <p className="text-sm text-danger-fg">The end month is before the start month.</p>}

      {editingAssumptions && <AssumptionsPanel values={assumptions} onApply={applyAssumptions} />}

      {hasBills && (
        // A segmented bar: the open tab is a raised pill on a sunken track. It
        // scrolls sideways on a phone rather than wrapping onto two rows.
        <nav aria-label="Analysis sections" className="overflow-x-auto">
          <div role="tablist" className="inline-flex min-w-max gap-1 rounded-xl bg-sunken p-1 ring-1 ring-inset ring-line">
            {TABS.map(({ value, label, icon: IconComponent, soon }) => {
              const active = tab === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => openTab(value)}
                  className={`focus-ring inline-flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition
                    ${active ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:bg-hover hover:text-ink'}`}
                >
                  <IconComponent className={`size-4 ${active ? 'text-accent-fg' : ''}`} />
                  {label}
                  {soon && (
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-accent-fg ring-1 ring-inset ring-accent-line">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <Body
        data={data}
        loading={isLoading}
        error={error}
        refreshing={isFetching}
        tab={tab}
        openTab={openTab}
      />
    </div>
  );
}

function Body({ data, loading, error, refreshing, tab, openTab }) {
  const paths = useSitePaths();

  if (loading) {
    return (
      <div className="card grid place-items-center gap-3 py-24">
        <Spinner className="size-7" />
        <p className="text-sm font-medium text-subtle">Crunching bills…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <EmptyState icon={TriangleAlert} title="Could not load analysis" description={error.message} />
      </div>
    );
  }

  if (!data.summary.bills) {
    return (
      <div className="card">
        <EmptyState
          icon={ChartColumn}
          title="No verified bills here"
          description="Only bills whose details have been submitted are analysed. Try a wider period, or verify more bills."
        />
      </div>
    );
  }

  const target = data.assumptions.pfTarget;

  return (
    <div key={tab} className={`page-in space-y-6 transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
      {tab === 'overview' && (
        <>
          <TrendPanel summary={data.summary} trend={data.trend} comparison={data.comparison} />

          <KpiTiles data={data} />

          <div className="grid gap-4 lg:grid-cols-3">
            <RankCard
              title="Sites by consumption"
              rows={topSitesRows(data.benchmark, paths.site)}
              more="Compare all sites"
              onMore={() => openTab('sites')}
            />
            <RankCard
              title="Lowest power factor"
              rows={worstPfRows(data.connections, target, paths.bill)}
              empty={`Every connection meets the ${target} target.`}
              more="Power factor details"
              onMore={() => openTab('pf')}
            />
            <RankCard
              title="Demand against contract"
              rows={demandRows(data.connections, paths.bill)}
              empty="No bills have both contract demand and MD."
              more="Contract demand details"
              onMore={() => openTab('demand')}
            />
          </div>
        </>
      )}


      {tab === 'pf' && (
        <PowerFactorPanel summary={data.summary} belowTarget={data.powerFactor.belowTarget} pfTarget={target} />
      )}

      {tab === 'demand' && <DemandPanel connections={data.connections} assumptions={data.assumptions} />}


      {tab === 'sites' && <BenchmarkPanel benchmark={data.benchmark} />}

      {COMING_SOON[tab] && <ComingSoon {...COMING_SOON[tab]} />}

    </div>
  );
}
