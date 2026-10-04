import { CircleCheck, Clock, Layers } from 'lucide-react';

const TILES = [
  {
    key: 'total',
    label: 'Total bills',
    hint: 'Everything uploaded so far',
    icon: Layers,
    tone: 'bg-accent-soft text-ink ring-accent-line',
  },
  {
    key: 'uploaded',
    label: 'Pending details',
    hint: 'Waiting for parameters',
    icon: Clock,
    tone: 'bg-warn-soft text-warn-fg ring-warn-line',
  },
  {
    key: 'submitted',
    label: 'Verified bills',
    hint: 'Parameters submitted',
    icon: CircleCheck,
    tone: 'bg-ok-soft text-ok-fg ring-ok-line',
  },
];

// Always three across: on a phone the tiles drop their icon and hint rather
// than stacking into a tall column above the table.
export default function BillStats({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5">
      {TILES.map((tile, index) => {
        const IconComponent = tile.icon;

        return (
          <div
            key={tile.key}
            style={{ animationDelay: `${index * 60}ms` }}
            className="card rise-in group relative overflow-hidden p-4 transition duration-300
              hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised sm:px-6 sm:py-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight text-muted sm:truncate sm:text-sm">
                  {tile.label}
                </p>
                <p className="num mt-2 text-2xl font-semibold leading-none text-ink sm:mt-1.5 sm:text-4xl">
                  {stats?.[tile.key] ?? '—'}
                </p>
                <p className="mt-2 hidden truncate text-xs text-subtle sm:block">{tile.hint}</p>
              </div>

              <span
                className={`hidden size-12 shrink-0 place-items-center rounded-2xl ring-1 ring-inset transition
                  group-hover:scale-105 sm:grid ${tile.tone}`}
              >
                <IconComponent className="size-6" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
