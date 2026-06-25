export function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (r: { from: string; to: string }) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <input type="date" value={from} onChange={(e) => onChange({ from: e.target.value, to })} className="border rounded px-2 py-1" />
      <span>~</span>
      <input type="date" value={to} onChange={(e) => onChange({ from, to: e.target.value })} className="border rounded px-2 py-1" />
    </div>
  );
}
