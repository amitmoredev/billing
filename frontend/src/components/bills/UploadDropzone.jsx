import { useRef, useState } from 'react';
import { CloudUpload, FileUp, Upload } from 'lucide-react';
import { ACCEPTED_MIME_TYPES } from '../../constants/bill.constants.js';

/**
 * A slim drop strip above the bills table. While a file is in flight the
 * strip swaps its contents for a progress readout of the same height, so the
 * page never jumps; the outcome is reported by a toast.
 */
export default function UploadDropzone({ onFiles, current }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files?.length) onFiles(event.dataTransfer.files);
  };

  if (current) return <UploadProgress current={current} />;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label="Upload bills"
      className={`focus-ring group flex cursor-pointer items-center gap-4 rounded-card border border-dashed
        px-4 py-4 transition duration-200 sm:px-6 sm:py-5
        ${
          dragging
            ? 'border-ink bg-accent-soft shadow-raised'
            : 'border-line-strong bg-surface hover:border-ink/40 hover:bg-hover'
        }`}
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl transition duration-200
          ${
            dragging
              ? 'scale-110 bg-accent text-on-accent'
              : 'bg-accent-soft text-ink ring-1 ring-inset ring-accent-line group-hover:scale-105'
          }`}
      >
        <CloudUpload className="size-6" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-ink">
          {dragging ? (
            'Drop to upload'
          ) : (
            <>
              {/* Phones have nothing to drag from, so they get the plain instruction. */}
              <span className="sm:hidden">Tap to upload bills</span>
              <span className="hidden sm:inline">Drag and drop bills here</span>
            </>
          )}
        </p>
        <p className="mt-0.5 text-sm text-subtle">PDF, JPG, PNG or WEBP · up to 20 MB each</p>
      </div>

      <span
        className="hidden h-10 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold
          text-on-accent shadow-card transition group-hover:bg-accent-hover sm:inline-flex"
      >
        <Upload className="size-4" />
        Browse files
      </span>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_MIME_TYPES.join(',')}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = ''; // allow re-picking the same file
        }}
      />
    </div>
  );
}

function UploadProgress({ current }) {
  return (
    <div
      className="card flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-4 sm:w-80">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-ink ring-1 ring-inset ring-accent-line">
          <FileUp className="size-6 animate-pulse" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink">{current.name}</p>
          <p className="mt-0.5 text-sm text-subtle">
            {current.total > 1 ? `Uploading ${current.index} of ${current.total}` : 'Uploading…'}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-4">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-hover ring-1 ring-inset ring-line"
          role="progressbar"
          aria-valuenow={current.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${current.progress}%` }}
          />
        </div>
        <span className="num w-12 text-right text-sm font-semibold text-ink">{current.progress}%</span>
      </div>
    </div>
  );
}
