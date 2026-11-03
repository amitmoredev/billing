import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import Panel from './Panel.jsx';
import { ASSUMPTION_FIELDS, DEFAULT_ASSUMPTIONS } from '../../constants/analytics.constants.js';

/**
 * The thresholds and rates behind alerts and savings, edited as a draft and
 * applied together, so the dashboard doesn't refetch on every keystroke.
 */
export default function AssumptionsPanel({ values, onApply }) {
  const [draft, setDraft] = useState(values);
  const changed = ASSUMPTION_FIELDS.some((field) => String(draft[field.name]) !== String(values[field.name]));

  return (
    <Panel
      title="Assumptions"
      description="Saved in this browser."
      actions={
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={() => {
            setDraft(DEFAULT_ASSUMPTIONS);
            onApply(DEFAULT_ASSUMPTIONS);
          }}
        >
          Reset
        </Button>
      }
    >
      <form
        className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          onApply(draft);
        }}
      >
        {ASSUMPTION_FIELDS.map((field) => (
          <TextField
            key={field.name}
            label={field.label}
            type="number"
            unit={field.unit}
            hint={field.hint}
            step={field.step ?? 'any'}
            min={field.min}
            max={field.max}
            value={draft[field.name]}
            placeholder={field.defaultValue == null ? 'Not set' : undefined}
            onChange={(e) => setDraft((prev) => ({ ...prev, [field.name]: e.target.value }))}
          />
        ))}
        <div className="flex justify-end sm:col-span-2 lg:col-span-3 2xl:col-span-6">
          <Button type="submit" disabled={!changed}>
            Apply
          </Button>
        </div>
      </form>
    </Panel>
  );
}
