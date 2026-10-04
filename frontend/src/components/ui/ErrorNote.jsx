import { CircleAlert } from 'lucide-react';

export default function ErrorNote({ message, className = 'mt-4' }) {
  return (
    <p
      role="alert"
      className={`flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-sm
        text-danger-fg ring-1 ring-danger-line ${className}`}
    >
      <CircleAlert className="mt-0.5 size-4.5 shrink-0" />
      {message}
    </p>
  );
}
