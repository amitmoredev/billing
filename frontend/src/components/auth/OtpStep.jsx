import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import OtpInput from './OtpInput.jsx';

const secondsUntil = (timestamp) => Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));

/**
 * Seconds left until `resendAt`. The value is derived on every render and the
 * interval only forces the re-render, so a new deadline restarts it for free.
 */
const useCountdown = (resendAt) => {
  const [, tick] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (secondsUntil(resendAt) <= 0) window.clearInterval(id);
      tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendAt]);

  return secondsUntil(resendAt);
};

export default function OtpStep({
  phone,
  resendAt,
  loading,
  resending,
  error,
  onVerify,
  onResend,
  onBack,
}) {
  const [otp, setOtp] = useState('');
  const secondsLeft = useCountdown(resendAt);
  const lastError = useRef(null);

  // A rejected code should be cleared, not edited digit by digit.
  useEffect(() => {
    if (error && error !== lastError.current) setOtp('');
    lastError.current = error;
  }, [error]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (otp.length === 6) onVerify(otp);
      }}
      className="rise-in"
    >
      <button
        type="button"
        onClick={onBack}
        className="focus-ring -ml-1 mb-5 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm
          font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Change number
      </button>

      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        Enter the code
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sent on WhatsApp to <span className="font-semibold text-ink">+91 {phone}</span>
      </p>

      <div className="mt-7">
        <OtpInput
          value={otp}
          onChange={setOtp}
          onComplete={(code) => !loading && onVerify(code)}
          disabled={loading}
          invalid={Boolean(error)}
        />
      </div>

      {error && <ErrorNote message={error} />}

      <Button
        type="submit"
        size="lg"
        loading={loading}
        disabled={otp.length !== 6}
        className="mt-6 w-full"
      >
        {!loading && <ShieldCheck className="size-4" />}
        Verify and sign in
      </Button>

      <p className="mt-5 text-center text-sm text-muted">
        {secondsLeft > 0 ? (
          <>
            Resend available in <span className="font-semibold text-ink">{secondsLeft}s</span>
          </>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="focus-ring rounded-lg px-1 font-semibold text-ink underline underline-offset-4
              transition hover:opacity-70 disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </form>
  );
}
