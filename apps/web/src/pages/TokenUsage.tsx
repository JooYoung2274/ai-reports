import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTokens } from '../api/reports';
import { DateRangePicker } from '../components/DateRangePicker';

export function TokenUsage() {
  const [range, setRange] = useState({ from: '', to: '' });
  const [groupBy, setGroupBy] = useState<'day' | 'user' | 'model'>('day');
  const { data } = useQuery({ queryKey: ['tokens', range, groupBy], queryFn: () => getTokens({ ...range, groupBy }) });
  const rows: { key: string; input: number; output: number; cacheCreation: number; cacheRead: number }[] = data?.rows ?? [];
  const csv = () => {
    const head = 'key,input,output,cacheCreation,cacheRead\n';
    const body = rows.map((r) => `${r.key},${r.input},${r.output},${r.cacheCreation},${r.cacheRead}`).join('\n');
    const url = URL.createObjectURL(new Blob([head + body], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'tokens.csv'; a.click();
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">토큰 사용량</h1>
        <div className="flex gap-2 items-center">
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'day' | 'user' | 'model')} className="border rounded px-2 py-1">
            <option value="day">일별</option><option value="user">사용자별</option><option value="model">모델별</option>
          </select>
          <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
          <button onClick={csv} className="border rounded px-3 py-1">CSV</button>
        </div>
      </div>
      <div className="rounded-lg border p-4 bg-white">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rows}><XAxis dataKey="key" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="input" stackId="t" fill="#2563eb" /><Bar dataKey="output" stackId="t" fill="#16a34a" />
            <Bar dataKey="cacheCreation" stackId="t" fill="#f59e0b" /><Bar dataKey="cacheRead" stackId="t" fill="#9ca3af" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-gray-500"><th>키</th><th>입력</th><th>출력</th><th>캐시생성</th><th>캐시읽기</th></tr></thead>
        <tbody>{rows.map((r) => (<tr key={r.key} className="border-t"><td>{r.key}</td><td>{r.input}</td><td>{r.output}</td><td>{r.cacheCreation}</td><td>{r.cacheRead}</td></tr>))}</tbody>
      </table>
    </div>
  );
}
