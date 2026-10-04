import { useState } from 'react';
import { Download, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import { isPdf } from '../../utils/format.js';

const ZOOM_STEP = 0.2;
const ZOOM_RANGE = [0.6, 3];

/** Left pane: the bill itself, with zoom controls and a download escape hatch. */
export default function BillViewer({ file, fileUrl }) {
  const [zoom, setZoom] = useState(1);
  const pdf = isPdf(file.mimeType);

  const changeZoom = (delta) =>
    setZoom((z) => Math.min(ZOOM_RANGE[1], Math.max(ZOOM_RANGE[0], +(z + delta).toFixed(2))));

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-line
        bg-zinc-900 shadow-raised dark:bg-black"
    >
      <div className="flex-1 overflow-auto p-4">
        {pdf ? (
          <object
            data={`${fileUrl}#toolbar=0&view=FitH`}
            type="application/pdf"
            className="mx-auto block h-full w-full rounded-lg bg-white"
            style={{ minHeight: '70vh', width: `${zoom * 100}%` }}
          >
            <p className="p-6 text-sm text-white">
              Preview unavailable.{' '}
              <a href={fileUrl} target="_blank" rel="noreferrer" className="underline">
                Open the PDF
              </a>
            </p>
          </object>
        ) : (
          <img
            src={fileUrl}
            alt={file.originalName}
            style={{ width: `${zoom * 100}%` }}
            className="mx-auto block rounded-lg bg-white shadow-float transition-[width] duration-200"
          />
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-black/25 px-3 py-2.5 backdrop-blur">
        <a
          href={fileUrl}
          download={file.originalName}
          className="focus-ring inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium
            text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Download className="size-4" />
          Download
        </a>

        <div className="flex items-center gap-1.5">
          <ZoomButton onClick={() => changeZoom(-ZOOM_STEP)} label="Zoom out" icon={ZoomOut} />
          <span className="w-12 text-center text-xs font-medium text-white/70">
            {Math.round(zoom * 100)}%
          </span>
          <ZoomButton onClick={() => changeZoom(ZOOM_STEP)} label="Zoom in" icon={ZoomIn} />
          <ZoomButton onClick={() => setZoom(1)} label="Reset zoom" icon={Maximize} />
        </div>
      </div>
    </div>
  );
}

function ZoomButton({ onClick, label, icon: IconComponent }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="focus-ring grid size-8 place-items-center rounded-lg bg-white/10 text-white
        transition hover:bg-white/20"
    >
      <IconComponent className="size-4" />
    </button>
  );
}
