import { useEffect, useState } from 'react';

/**
 * True once `pending` has lasted `delay` ms. The API sleeps when idle (Render's
 * free plan) and the first request can take up to a minute, so screens use
 * this to say why they're waiting instead of looking frozen.
 */
export const useSlowHint = (pending, delay = 4000) => {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!pending) return undefined;
    const timer = window.setTimeout(() => setSlow(true), delay);
    return () => {
      window.clearTimeout(timer);
      setSlow(false); // reset for the next wait
    };
  }, [pending, delay]);

  // Gated on `pending`, so the hint is gone the moment the wait ends.
  return pending && slow;
};

export const WAKING_SERVER_HINT =
  'Waking up the server — the first request after a quiet spell can take up to a minute.';
