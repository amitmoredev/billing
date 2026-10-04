import BrandMark from '../ui/BrandMark.jsx';

/** Brand mark with an "Admin" tag, so it's always clear which side of the app this is. */
export default function AdminBrand() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark size="sm" />
      <span className="rounded-full border border-line bg-sunken px-2.5 py-0.5 text-xs font-semibold text-muted">
        Admin
      </span>
    </span>
  );
}
