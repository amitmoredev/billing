import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';

const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 10);

export default function PhoneStep({
  title = 'Sign in',
  note = 'No access? Ask your administrator to add your number.',
  defaultValue = '',
  loading,
  error,
  onSubmit,
}) {
  const [phone, setPhone] = useState(defaultValue);
  const isComplete = phone.length === 10;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isComplete) onSubmit(phone);
      }}
      className="rise-in"
    >
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">
        We&apos;ll send a 6-digit code to your WhatsApp.
      </p>

      <label className="mt-7 block">
        <span className="mb-2 block text-sm font-semibold text-muted">Mobile number</span>

        <div
          className="flex h-13 items-center rounded-xl bg-surface ring-1 ring-line transition
            focus-within:ring-2 focus-within:ring-ink hover:ring-line-strong"
        >
          <span className="grid h-full place-items-center border-r border-line px-3.5 text-sm font-semibold text-muted">
            +91
          </span>
          <input
            autoFocus
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={phone}
            onChange={(event) => setPhone(digitsOnly(event.target.value))}
            className="num h-full w-full bg-transparent px-3.5 text-base font-medium text-ink
              placeholder:text-subtle focus:outline-none"
          />
        </div>
      </label>

      {error && <ErrorNote message={error} />}

      <Button
        type="submit"
        size="lg"
        loading={loading}
        disabled={!isComplete}
        className="mt-6 w-full"
      >
        Send code
        {!loading && <ArrowRight className="size-4.5" />}
      </Button>

      {note && <p className="mt-5 text-center text-xs text-subtle">{note}</p>}
    </form>
  );
}
