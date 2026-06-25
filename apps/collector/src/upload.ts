import { request } from 'undici';

export async function uploadLines(url: string, uploadedBy: string, lines: { sourceFile: string; rawJson: Record<string, unknown> }[]): Promise<void> {
  if (lines.length === 0) return;
  const res = await request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ uploadedBy, lines }),
  });
  if (res.statusCode >= 300) {
    const body = await res.body.text();
    throw new Error(`ingest failed: ${res.statusCode} ${body}`);
  }
  await res.body.text();
}
