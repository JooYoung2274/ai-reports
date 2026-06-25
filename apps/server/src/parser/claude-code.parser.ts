export interface ParsedEvent {
  sessionId: string;
  eventAt: Date;
  role: string;
  type: string;
  messageUuid: string;
  parentUuid: string | null;
  isPrompt: boolean;
  text: string | null;
  model: string | null;
  tokens: { input: number | null; output: number | null; cacheCreation: number | null; cacheRead: number | null };
  projectPath: string | null;
  gitBranch: string | null;
  ccVersion: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/**
 * Extracts plain text from a content value that may be:
 *   - a string
 *   - an array of {type:'text', text:string} blocks
 * Returns null if no text can be extracted.
 */
function contentToText(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts = content
      .filter((b) => b && typeof b === 'object' && b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string);
    return parts.length ? parts.join('\n') : null;
  }
  return null;
}

/**
 * Returns true if any item in an array-typed content is a tool_result block.
 * Real transcripts show: content: [{type:'tool_result', content:'...' | [...]}]
 */
function hasToolResult(content: unknown): boolean {
  return (
    Array.isArray(content) &&
    content.some((b) => b && typeof b === 'object' && b.type === 'tool_result')
  );
}

/**
 * Patterns that mark a user line as a system/meta output rather than a real human prompt:
 *   - <command-name>   : slash-command invocation  (e.g. /clear, /plugin)
 *   - <command-message>: paired with command-name
 *   - <local-command-  : local command stdout/caveat blocks
 *
 * Additionally from real transcripts:
 *   - [Request interrupted by user] : auto-injected system text, not a human prompt
 */
const COMMAND_TAG = /<command-name>|<command-message>|<local-command-/;
const INTERRUPTED_PATTERN = /^\[Request interrupted by user\]$/;

/**
 * Decides whether a raw jsonl line represents a real human-typed prompt.
 *
 * Exclusion rules (any one → false):
 *   1. type !== 'user'
 *   2. isMeta === true
 *   3. content is an array containing a tool_result item
 *   4. text is empty/null after extraction
 *   5. text matches a slash-command / local-command XML tag
 *   6. text matches [Request interrupted by user] (system-injected, isMeta absent in real data)
 */
export function isHumanPrompt(raw: Raw): boolean {
  if (raw?.type !== 'user') return false;
  if (raw?.isMeta === true) return false;

  const content = raw?.message?.content;
  if (hasToolResult(content)) return false;

  const text = contentToText(content);
  if (!text || !text.trim()) return false;
  if (COMMAND_TAG.test(text)) return false;
  if (INTERRUPTED_PATTERN.test(text.trim())) return false;

  return true;
}

/**
 * Parses a single Claude Code jsonl line into a ParsedEvent.
 * Returns null for non-conversational lines (type: summary, mode, attachment, etc.)
 * or lines missing required identity fields.
 */
export function parseClaudeLine(raw: Raw): ParsedEvent | null {
  const type = raw?.type;
  if (type !== 'user' && type !== 'assistant' && type !== 'system') return null;

  const uuid = raw?.uuid;
  const sessionId = raw?.sessionId;
  const ts = raw?.timestamp;
  if (!uuid || !sessionId || !ts) return null;

  const msg = raw?.message ?? {};
  const usage = msg?.usage ?? {};
  const prompt = isHumanPrompt(raw);

  return {
    sessionId,
    eventAt: new Date(ts as string),
    role: msg?.role ?? type,
    type,
    messageUuid: uuid,
    parentUuid: raw?.parentUuid ?? null,
    isPrompt: prompt,
    text: prompt ? contentToText(msg?.content) : null,
    model: msg?.model ?? null,
    tokens: {
      input: (usage?.input_tokens as number) ?? null,
      output: (usage?.output_tokens as number) ?? null,
      cacheCreation: (usage?.cache_creation_input_tokens as number) ?? null,
      cacheRead: (usage?.cache_read_input_tokens as number) ?? null,
    },
    projectPath: raw?.cwd ?? null,
    gitBranch: raw?.gitBranch ?? null,
    ccVersion: raw?.version ?? null,
  };
}
