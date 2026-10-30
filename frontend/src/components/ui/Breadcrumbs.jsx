import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Where-am-I trail: `items` is [{ label, to?, icon? }], last item = this page.
 * Earlier crumbs truncate first, so the current page keeps its name on a phone.
 */
export default function Breadcrumbs({ items, className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          const IconComponent = item.icon;
          const content = (
            <>
              {IconComponent && <IconComponent className="size-4 shrink-0" />}
              <span className="truncate">{item.label}</span>
            </>
          );

          return (
            <li key={`${index}-${item.label}`} className={`flex min-w-0 items-center gap-1 ${last ? 'shrink-0 max-w-[60%]' : ''}`}>
              {last || !item.to ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={`flex min-w-0 items-center gap-1.5 px-1.5 py-1 ${
                    last ? 'font-semibold text-ink' : 'text-muted'
                  }`}
                >
                  {content}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="focus-ring flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-muted
                    transition hover:bg-hover hover:text-ink"
                >
                  {content}
                </Link>
              )}
              {!last && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-subtle" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
