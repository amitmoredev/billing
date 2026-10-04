import { LoaderCircle } from 'lucide-react';

export default function Spinner({ className = 'size-5' }) {
  return (
    <LoaderCircle role="status" aria-label="Loading" className={`animate-spin text-ink ${className}`} />
  );
}
