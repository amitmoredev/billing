import { useCallback, useRef, useState } from 'react';
import { useUploadBill } from '../queries/bill.query.js';
import { useToast } from '../context/toast.context.js';
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from '../constants/bill.constants.js';

const validate = (file) => {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) return 'Only PDF, JPG, PNG or WEBP files';
  if (file.size > MAX_UPLOAD_BYTES) return 'File is larger than 20 MB';
  return null;
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Uploads files one by one. Outcomes are reported through toasts rather than a
 * persistent panel; the only on-page state is the live progress of the file
 * currently in flight, which the dropzone renders inline.
 */
export const useBillUpload = () => {
  const [current, setCurrent] = useState(null); // { name, progress, index, total }
  const { mutateAsync } = useUploadBill();
  const toast = useToast();
  const busy = useRef(false);

  /** `siteId` (optional) files every bill in the batch under that site. */
  const upload = useCallback(
    async (fileList, siteId) => {
      const files = Array.from(fileList);
      if (!files.length || busy.current) return;

      busy.current = true;
      const failures = [];
      let uploaded = 0;

      try {
        for (const [index, file] of files.entries()) {
          const invalid = validate(file);
          if (invalid) {
            failures.push({ name: file.name, reason: invalid });
            continue;
          }

          setCurrent({ name: file.name, progress: 0, index: index + 1, total: files.length });

          try {
            await mutateAsync({
              file,
              siteId,
              onProgress: (progress) => setCurrent((prev) => prev && { ...prev, progress }),
            });
            uploaded += 1;
          } catch (err) {
            failures.push({ name: file.name, reason: err.message });
          }
        }
      } finally {
        setCurrent(null);
        busy.current = false;
      }

      if (uploaded) {
        toast.success(
          uploaded === 1 ? 'Bill uploaded' : `${plural(uploaded, 'bill')} uploaded`,
          uploaded === 1
            ? 'Open it to fill in the billing parameters.'
            : 'Open each one to fill in the billing parameters.'
        );
      }

      if (failures.length === 1) {
        toast.error(`Could not upload ${failures[0].name}`, failures[0].reason);
      } else if (failures.length > 1) {
        toast.error(
          `${plural(failures.length, 'file')} failed to upload`,
          failures.map((f) => `${f.name} — ${f.reason}`).join(' · ')
        );
      }
    },
    [mutateAsync, toast]
  );

  return { current, uploading: current !== null, upload };
};
