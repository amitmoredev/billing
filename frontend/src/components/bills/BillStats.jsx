import { CircleCheck, Clock, Layers } from 'lucide-react';

/**
 * Three filled cards from one blue family — brand blue, indigo-blue and sky
 * blue — so the row reads as a set. The fills are muted on purpose (calm, not
 * neon), a shade softer still in dark, where bright colour glares on navy.
 * What each counts is carried by its label and icon; the status colours stay
 * on badges.
 */
const TILES = [
  {
    key: 'total',
    label: 'Total bills',
    hint: 'Everything uploaded so far',
    icon: Layers,
    fill: 'from-[#3a64c4] to-[#2f53a8] dark:from-[#2f5bc4] dark:to-[#284e9f]',
    glow: 'shadow-[0_10px_28px_-12px_rgb(47_83_168/0.45)]',
  },
  {
    key: 'uploaded',
    label: 'Pending details',
    icon: Clock,
    fill: 'from-[#5559b4] to-[#464a98] dark:from-[#4a4fae] dark:to-[#3d418f]',
    glow: 'shadow-[0_10px_28px_-12px_rgb(70_74_152/0.45)]',
  },
  {
    key: 'submitted',
    label: 'Verified bills',
    icon: CircleCheck,
    fill: 'from-[#327fae] to-[#2a6b93] dark:from-[#2b72a0] dark:to-[#245f86]',
    glow: 'shadow-[0_10px_28px_-12px_rgb(42_107_147/0.45)]',
  },
];

// Always three across: on a phone the tiles drop their icon and hint rather
// than stacking into a tall column above the table.
export default function BillStats({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5">
      {TILES.map((tile, index) => {
        const IconComponent = tile.icon;
        const value = stats?.[tile.key];
        const share = stats?.total ? Math.round(((value ?? 0) / stats.total) * 100) : 0;
        const isTotal = tile.key === 'total';

        return (
          <div
            key={tile.key}
            style={{ animationDelay: `${index * 60}ms` }}
            className={`rise-in group relative overflow-hidden rounded-card bg-linear-to-br p-4 text-white
              ring-1 ring-inset ring-white/10 transition duration-300 hover:-translate-y-0.5 sm:px-6 sm:py-5
              dark:text-on-accent dark:shadow-card ${tile.fill} ${tile.glow}`}
          >
            {/* Soft light in the corner, for depth — fainter in dark. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/10 blur-2xl
                transition-transform duration-500 group-hover:scale-110 dark:bg-white/5"
            />
            {/* A fine highlight along the top edge. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20 dark:bg-white/10"
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight text-white/80 sm:truncate sm:text-sm dark:text-on-accent/75">
                  {tile.label}
                </p>
                <p className="num mt-2 text-2xl font-semibold leading-none sm:mt-1.5 sm:text-4xl">
                  {value ?? '—'}
                </p>
                <p className="mt-2 hidden truncate text-xs text-white/70 sm:block dark:text-on-accent/60">
                  {isTotal ? tile.hint : `${share}% of all bills`}
                </p>
              </div>

              <span
                className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-inset
                  ring-white/15 transition group-hover:scale-105 sm:grid dark:bg-white/10 dark:ring-white/10"
              >
                <IconComponent className="size-6" />
              </span>
            </div>

            {/* Share of all bills, on the two status cards. */}
            {!isTotal && (
              <div className="relative mt-3 hidden h-1 overflow-hidden rounded-full bg-white/20 sm:block dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-white/90 transition-[width] duration-500 dark:bg-on-accent/80"
                  style={{ width: `${share}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
