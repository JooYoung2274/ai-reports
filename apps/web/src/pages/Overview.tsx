import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getOverview } from '../api/reports';
import { KpiCard } from '../components/KpiCard';
import { DateRangePicker } from '../components/DateRangePicker';

export function Overview() {
  const [range, setRange] = useState({ from: '', to: '' });
  const { data } = useQuery({ queryKey: ['overview', range], queryFn: () => getOverview(range) });
  if (!data) return <div>로딩…</div>;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">개요</h1>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="총 프롬프트" value={data.totals.prompts} />
        <KpiCard label="입력 토큰" value={data.totals.inputTokens} />
        <KpiCard label="출력 토큰" value={data.totals.outputTokens} />
        <KpiCard label="활성 사용자" value={data.totals.activeUsers} />
      </div>
      <div className="rounded-lg border p-4 bg-white">
        <h2 className="font-semibold mb-2">일별 프롬프트 수</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.dailyPrompts}><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="count" stroke="#2563eb" /></LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border p-4 bg-white">
        <h2 className="font-semibold mb-2">일별 토큰</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.dailyTokens}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="input" stackId="t" fill="#2563eb" /><Bar dataKey="output" stackId="t" fill="#16a34a" /><Bar dataKey="cache" stackId="t" fill="#9ca3af" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border p-4 bg-white">
        <h2 className="font-semibold mb-2">사용자 랭킹</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th>사용자</th><th>프롬프트</th><th>토큰</th></tr></thead>
          <tbody>{data.ranking.map((r: { userId: string; email: string; prompts: number; tokens: number }) => (<tr key={r.userId} className="border-t"><td>{r.email}</td><td>{r.prompts}</td><td>{r.tokens}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
