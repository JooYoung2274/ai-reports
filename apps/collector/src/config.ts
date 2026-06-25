import { homedir } from 'os';
import { join } from 'path';

export const config = {
  ingestUrl: process.env.INGEST_URL ?? 'http://localhost:3000/ingest',
  uploadedBy: process.env.UPLOADED_BY ?? '',
  claudeDir: process.env.CLAUDE_DIR || join(homedir(), '.claude', 'projects'),
  offsetsPath: join(homedir(), '.ai-report', 'offsets.json'),
};
