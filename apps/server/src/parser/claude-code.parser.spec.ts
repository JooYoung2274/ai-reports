import { parseClaudeLine, isHumanPrompt } from './claude-code.parser';

const userPrompt = {
  uuid: 'u1', parentUuid: null, sessionId: 's1', type: 'user',
  timestamp: '2026-06-25T01:00:00.000Z', cwd: '/home/joo/proj', gitBranch: 'main', version: '1.2.3',
  message: { role: 'user', content: '리포트 만들어줘' },
};
const toolResult = {
  uuid: 'u2', sessionId: 's1', type: 'user', timestamp: '2026-06-25T01:00:01.000Z',
  message: { role: 'user', content: [{ type: 'tool_result', content: 'ok' }] },
};
const metaLine = {
  uuid: 'u3', sessionId: 's1', type: 'user', isMeta: true, timestamp: '2026-06-25T01:00:02.000Z',
  message: { role: 'user', content: '<command-name>/clear</command-name>' },
};
const assistant = {
  uuid: 'a1', parentUuid: 'u1', sessionId: 's1', type: 'assistant', timestamp: '2026-06-25T01:00:03.000Z',
  message: { role: 'assistant', model: 'claude-opus-4-8', content: [{ type: 'text', text: '네' }],
    usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 5, cache_read_input_tokens: 3 } },
};

// Extra fixtures derived from real transcript inspection

// Slash-command line WITHOUT isMeta (common in real transcripts)
const slashCmdNoMeta = {
  uuid: 'u4', sessionId: 's1', type: 'user', timestamp: '2026-06-25T01:00:04.000Z',
  message: { role: 'user', content: '<command-name>/plugin</command-name>\n<command-message>plugin</command-message>' },
};

// local-command-stdout line (no isMeta, still meta)
const localCmdStdout = {
  uuid: 'u5', sessionId: 's1', type: 'user', timestamp: '2026-06-25T01:00:05.000Z',
  message: { role: 'user', content: '<local-command-stdout>ok</local-command-stdout>' },
};

// [Request interrupted by user] — text-array, isMeta absent — must NOT be a real prompt
const interrupted = {
  uuid: 'u6', sessionId: 's1', type: 'user', timestamp: '2026-06-25T01:00:06.000Z',
  message: { role: 'user', content: [{ type: 'text', text: '[Request interrupted by user]' }] },
};

// isMeta:true with text array (skill base directory injection)
const metaTextArray = {
  uuid: 'u7', sessionId: 's1', type: 'user', isMeta: true, timestamp: '2026-06-25T01:00:07.000Z',
  message: { role: 'user', content: [{ type: 'text', text: 'Base directory for this skill: /foo/bar' }] },
};

// Real user prompt delivered as array of text blocks (future-proofing)
const userPromptTextArray = {
  uuid: 'u8', parentUuid: null, sessionId: 's1', type: 'user',
  timestamp: '2026-06-25T01:00:08.000Z', cwd: '/home/joo/proj', gitBranch: 'main', version: '1.2.3',
  message: { role: 'user', content: [{ type: 'text', text: '파싱해줘' }] },
};

describe('isHumanPrompt', () => {
  it('true for real user prompt (plain string)', () => expect(isHumanPrompt(userPrompt)).toBe(true));
  it('false for tool_result', () => expect(isHumanPrompt(toolResult)).toBe(false));
  it('false for meta/command line (isMeta:true, string content)', () => expect(isHumanPrompt(metaLine)).toBe(false));
  it('false for assistant', () => expect(isHumanPrompt(assistant)).toBe(false));
  it('false for slash-command line without isMeta', () => expect(isHumanPrompt(slashCmdNoMeta)).toBe(false));
  it('false for local-command-stdout line', () => expect(isHumanPrompt(localCmdStdout)).toBe(false));
  it('false for [Request interrupted by user] text-array', () => expect(isHumanPrompt(interrupted)).toBe(false));
  it('false for isMeta:true with text array', () => expect(isHumanPrompt(metaTextArray)).toBe(false));
  it('true for real user prompt delivered as text array', () => expect(isHumanPrompt(userPromptTextArray)).toBe(true));
});

describe('parseClaudeLine', () => {
  it('parses user prompt text (string content)', () => {
    const p = parseClaudeLine(userPrompt)!;
    expect(p.isPrompt).toBe(true);
    expect(p.text).toBe('리포트 만들어줘');
    expect(p.sessionId).toBe('s1');
    expect(p.projectPath).toBe('/home/joo/proj');
  });
  it('parses user prompt text (text-array content)', () => {
    const p = parseClaudeLine(userPromptTextArray)!;
    expect(p.isPrompt).toBe(true);
    expect(p.text).toBe('파싱해줘');
  });
  it('parses assistant tokens', () => {
    const p = parseClaudeLine(assistant)!;
    expect(p.isPrompt).toBe(false);
    expect(p.model).toBe('claude-opus-4-8');
    expect(p.tokens).toEqual({ input: 100, output: 20, cacheCreation: 5, cacheRead: 3 });
  });
  it('returns null for summary/unknown', () => {
    expect(parseClaudeLine({ type: 'summary', summary: 'x' })).toBeNull();
  });
  it('returns null when required fields missing', () => {
    expect(parseClaudeLine({ type: 'user', sessionId: 's1' })).toBeNull(); // missing uuid + timestamp
  });
  it('tool_result line is parsed but isPrompt=false, text=null', () => {
    const p = parseClaudeLine(toolResult)!;
    expect(p).not.toBeNull();
    expect(p.isPrompt).toBe(false);
    expect(p.text).toBeNull();
  });
  it('slash-command line is parsed but isPrompt=false', () => {
    const p = parseClaudeLine(slashCmdNoMeta)!;
    expect(p).not.toBeNull();
    expect(p.isPrompt).toBe(false);
  });
  it('interrupted line is parsed but isPrompt=false', () => {
    const p = parseClaudeLine(interrupted)!;
    expect(p).not.toBeNull();
    expect(p.isPrompt).toBe(false);
  });
});
