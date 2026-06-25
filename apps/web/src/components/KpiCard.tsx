export function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4 bg-white shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
