/**
 * Prototype polish for scenario copy (no LLM). Trims, normalizes inline spaces,
 * collapses extra blank lines, capitalizes each paragraph, and appends a period
 * when the block ends with a word or digit but no sentence punctuation.
 */

function polishParagraphBlock(text: string): string {
  const raw = text.replace(/\r\n/g, '\n').trim();
  if (!raw) return '';

  return raw
    .split(/\n{2,}/)
    .map((p) => {
      let block = p.trim().replace(/[ \t\f\v]+/g, ' ').replace(/\n+/g, '\n');
      if (!block) return '';
      block = block.charAt(0).toUpperCase() + block.slice(1);
      const flat = block.replace(/\s+/g, ' ').trim();
      if (/[A-Za-z0-9)]$/.test(flat) && !/[.!?…]$/.test(flat)) {
        block = `${block}.`;
      }
      return block;
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Split on sentence boundaries for English prose (heuristic; no LLM). */
function splitSentences(text: string): string[] {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return [];
  return t
    .split(/(?<=[.!?])\s+(?=[A-Z"(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function finishSentence(s: string): string {
  let x = s.trim();
  if (!x) return '';
  x = x.charAt(0).toUpperCase() + x.slice(1);
  if (/[.!?…]$/.test(x)) return x;
  return `${x}.`;
}

const ELABORATION_LINE =
  'Use realistic pacing, ask clarifying questions when inputs are ambiguous, and stay within organizational policies and guardrails.';

const GENERIC_PASS_LINE =
  'The test passes when the agent completes the workflow accurately with correct information and without harmful or non-compliant behavior.';

/**
 * Merges instructions + expected outcome, polishes, then distributes into a concise
 * 2–3 line prompt: two lines in `instructions`, one line in `expectedOutcome`.
 */
export function polishScenarioCopy(instructions: string, expectedOutcome: string): {
  instructions: string;
  expectedOutcome: string;
} {
  const mergedRaw = [instructions, expectedOutcome]
    .map((s) => s.replace(/\r\n/g, '\n').trim())
    .filter(Boolean)
    .join('\n\n');

  if (!mergedRaw) {
    return { instructions: '', expectedOutcome: '' };
  }

  const polishedFlat = polishParagraphBlock(mergedRaw).replace(/\n+/g, ' ').trim();
  let sentences = splitSentences(polishedFlat);
  if (sentences.length === 0) {
    sentences = [polishedFlat];
  }

  if (sentences.length === 1) {
    const s1 = finishSentence(sentences[0]);
    return {
      instructions: `${s1}\n${ELABORATION_LINE}`,
      expectedOutcome: GENERIC_PASS_LINE,
    };
  }

  if (sentences.length === 2) {
    return {
      instructions: `${finishSentence(sentences[0])}\n${ELABORATION_LINE}`,
      expectedOutcome: finishSentence(sentences[1]),
    };
  }

  const instructionsLines = `${finishSentence(sentences[0])}\n${finishSentence(sentences[1])}`;
  const outcomeRest = sentences.slice(2).join(' ');
  return {
    instructions: instructionsLines,
    expectedOutcome: finishSentence(outcomeRest),
  };
}

/** Simulates latency; swap for a real optimize API when available. */
export async function optimizeScenarioCopyAsync(
  instructions: string,
  expectedOutcome: string,
  signal?: AbortSignal,
): Promise<{ instructions: string; expectedOutcome: string }> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  await new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, 750);
    const onAbort = () => {
      window.clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
  return polishScenarioCopy(instructions, expectedOutcome);
}
