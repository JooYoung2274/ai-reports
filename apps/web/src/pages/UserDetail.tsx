import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getOverview, getUserDetail } from '../api/reports';
import { DateRangePicker } from '../components/DateRangePicker';

export function UserDetail() {
  const [range, setRange] = useState({ from: '', to: '' });
  const [userId, setUserId] = useState('');
  const { data: ov } = useQuery({ queryKey: ['overview-users', range], queryFn: () => getOverview(range) });
  const { data } = useQuery({ queryKey: ['user', userId, range], queryFn: () => getUserDetail(userId, range), enabled: !!userId });
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">사용자별 상세</h1>
        <div className="flex gap-2">
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="border rounded px-2 py-1">
            <option value="">사용자 선택</option>
            {(ov?.ranking ?? []).map((r: { userId: string; email: string }) => (<option key={r.userId} value={r.userId}>{r.email}</option>))}
          </select>
          <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
        </div>
      </div>
      {data && (
        <div className="rounded-lg border p-4 bg-white">
          <h2 className="font-semibold mb-2">일별 추이</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.daily}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
              <Line dataKey="prompts" stroke="#2563eb" /><Line dataKey="input" stroke="#16a34a" /><Line dataKey="output" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
