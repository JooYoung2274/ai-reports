export interface IngestLineDto { sourceFile: string; rawJson: Record<string, unknown>; }
export interface IngestDto { uploadedBy: string; lines: IngestLineDto[]; }
export interface IngestResult { received: number; inserted: number; duplicates: number; }
