import { Files } from 'lucide-react';

export default function EmptyState({ icon: IconComponent = Files, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-sunken text-subtle ring-1 ring-line">
        <IconComponent className="size-7" />
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-lg font-bold text-ink">{title}</p>
        {description && <p className="mx-auto max-w-md text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
