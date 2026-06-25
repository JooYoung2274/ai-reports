import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPrompts, getOverview } from '../api/reports';
import { DateRangePicker } from '../components/DateRangePicker';

export function PromptHistory() {
  const [range, setRange] = useState({ from: '', to: '' });
  const [q, setQ] = useState('');
  const [userId, setUserId] = useState('');
  const [project, setProject] = useState('');
  const { data: ov } = useQuery({ queryKey: ['overview-users', range], queryFn: () => getOverview(range) });
  const { data } = useQuery({ queryKey: ['prompts', range, q, userId, project], queryFn: () => getPrompts({ ...range, q: q || undefined, userId: userId || undefined, project: project || undefined }) });
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">프롬프트 이력</h1>
        <div className="flex gap-2">
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="border rounded px-2 py-1">
            <option value="">전체 사용자</option>
            {(ov?.ranking ?? []).map((r: { userId: string; email: string }) => (<option key={r.userId} value={r.userId}>{r.email}</option>))}
          </select>
          <input placeholder="프로젝트" value={project} onChange={(e) => setProject(e.target.value)} className="border rounded px-2 py-1" />
          <input placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} className="border rounded px-2 py-1" />
          <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
        </div>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-gray-500"><th>시각</th><th>사용자</th><th>프로젝트</th><th>프롬프트</th><th>토큰</th></tr></thead>
        <tbody>{(data?.items ?? []).map((it: { id: string; eventAt: string; email: string; projectPath: string; sessionId: string; text: string; inputTokens: number | null; outputTokens: number | null }) => (
          <tr key={it.id} className="border-t align-top">
            <td className="whitespace-nowrap">{new Date(it.eventAt).toLocaleString()}</td>
            <td>{it.email}</td><td className="text-gray-500">{it.projectPath}</td>
            <td className="max-w-xl"><details><summary className="truncate cursor-pointer">{String(it.text).slice(0, 80)}</summary><pre className="whitespace-pre-wrap mt-1">{it.text}</pre></details></td>
            <td className="whitespace-nowrap">{it.inputTokens ?? '-'}/{it.outputTokens ?? '-'}</td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}
