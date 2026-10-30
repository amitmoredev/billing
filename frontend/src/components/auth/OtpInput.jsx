import { useRef } from 'react';

const LENGTH = 6;

/**
 * Six boxes that behave like one field: typing advances, backspace retreats,
 * and pasting a whole code fills everything at once.
 */
export default function OtpInput({ value, onChange, onComplete, disabled, invalid }) {
  const boxes = useRef([]);

  const commit = (next) => {
    onChange(next);
    if (next.length === LENGTH) onComplete?.(next);
  };

  const focusBox = (index) => boxes.current[Math.min(Math.max(index, 0), LENGTH - 1)]?.focus();

  const handleChange = (index, raw) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;

    // Replace from this box onward so a paste lands whole.
    const next = (value.slice(0, index) + digits).slice(0, LENGTH);
    commit(next);
    focusBox(next.length);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      // Empty box: clear the one before it and step back.
      const target = value[index] ? index : index - 1;
      if (target < 0) return;
      commit(value.slice(0, target) + value.slice(target + 1));
      focusBox(target);
    }
    if (event.key === 'ArrowLeft') focusBox(index - 1);
    if (event.key === 'ArrowRight') focusBox(index + 1);
  };

  return (
    <div className="flex justify-between gap-2" dir="ltr">
      {Array.from({ length: LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => (boxes.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={LENGTH} // lets a full paste reach onChange
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          value={value[index] ?? ''}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className={`num h-14 w-full min-w-0 rounded-xl bg-surface text-center text-xl font-semibold
            text-ink ring-1 transition focus:outline-none focus:ring-2 disabled:opacity-50
            ${invalid ? 'ring-danger-line focus:ring-red-400' : 'ring-line focus:ring-accent focus:shadow-focus'}`}
        />
      ))}
    </div>
  );
}
