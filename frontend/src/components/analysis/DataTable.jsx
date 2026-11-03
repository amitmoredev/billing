import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

const compare = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/**
 * A plain table that scrolls sideways on narrow screens. Columns with `sort`
 * sort on click (first click: highest first); only the first `pageSize` rows
 * show until the reader asks for the rest.
 *
 * columns: [{ key, label, align?, render(row), sort?(row), csv?(row) }]
 */
export default function DataTable({ columns, rows, rowKey, initialSort = null, pageSize = 10, empty }) {
  const [sort, setSort] = useState(initialSort); // { key, dir: 'asc' | 'desc' }
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const column = sort && columns.find((c) => c.key === sort.key);
    if (!column?.sort) return rows;
    // Missing values sink to the bottom whichever way the column is sorted.
    const missingLast = (a, b) => (column.sort(a) == null) - (column.sort(b) == null);
    const direction = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => missingLast(a, b) || compare(column.sort(a), column.sort(b)) * direction);
  }, [rows, columns, sort]);

  if (!rows.length) {
    return <p className="px-5 py-10 text-center text-sm text-subtle">{empty ?? 'Nothing to show.'}</p>;
  }

  const visible = showAll ? sorted : sorted.slice(0, pageSize);
  const toggle = (key) =>
    setSort((prev) => (prev?.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-line bg-sunken/60">
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const SortIcon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`label-caps whitespace-nowrap px-4 py-3 first:pl-5 last:pr-5
                      ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {column.sort ? (
                      <button
                        type="button"
                        onClick={() => toggle(column.key)}
                        className={`focus-ring inline-flex items-center gap-1 rounded uppercase hover:text-ink
                          ${active ? 'text-ink' : ''}`}
                      >
                        {column.label}
                        <SortIcon className={`size-3 ${active ? '' : 'opacity-40'}`} />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line transition-colors last:border-0 hover:bg-hover">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap px-4 py-3 text-ink first:pl-5 last:pr-5
                      ${column.align === 'right' ? 'num text-right' : ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > pageSize && (
        <div className="border-t border-line px-5 py-2.5 text-center">
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="focus-ring rounded text-sm font-semibold text-accent-fg hover:underline"
          >
            {showAll ? 'Show fewer' : `Show all ${rows.length}`}
          </button>
        </div>
      )}
    </div>
  );
}
