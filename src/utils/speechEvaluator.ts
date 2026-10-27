// Phonetic & Speech Diagnostic Evaluator for Primary Reading
export interface WordEvaluation {
  id: number;
  word: string;
  cleanWord: string;
  status: 'pending' | 'active' | 'correct' | 'error' | 'skipped';
  phonemeError?: string;
  confidence?: number;
  durationMs?: number;
}

export function cleanWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
}

// Levenshtein distance for fuzzy matching spoken words against target words
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check if a spoken word matches target with phonetic tolerance
export function isPhoneticMatch(spoken: string, target: string): boolean {
  const cleanSpoken = cleanWord(spoken);
  const cleanTarget = cleanWord(target);

  if (cleanSpoken === cleanTarget) return true;
  if (!cleanSpoken || !cleanTarget) return false;

  // Exact substring match for prefixes
  if (cleanTarget.startsWith(cleanSpoken) && cleanSpoken.length >= 3) return true;

  // Levenshtein distance check: allow 1 edit for words <= 4 chars, 2 edits for longer
  const distance = levenshteinDistance(cleanSpoken, cleanTarget);
  const maxAllowedEdits = cleanTarget.length <= 4 ? 1 : 2;
  return distance <= maxAllowedEdits;
}

// Calculate reading level band based on FLN parameters
export function evaluateReadingBand(wpm: number, accuracy: number): 'PRE_WORD' | 'WORD' | 'SENTENCE' | 'GRADE_LEVEL' {
  if (accuracy < 60 || wpm < 18) {
    return 'PRE_WORD';
  }
  if (wpm < 32 || accuracy < 75) {
    return 'WORD';
  }
  if (wpm < 48 || accuracy < 85) {
    return 'SENTENCE';
  }
  return 'GRADE_LEVEL';
}

// Evaluate math band based on latency and correct count
export function evaluateMathBand(
  correctCount: number, 
  avgLatencyMs: number, 
  totalQuestions: number = 3
): 'COUNT_20' | 'PATTERN_OPS' | 'BORROW_OPS' {
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  
  // Under 50% accuracy: Student needs foundational number sense & counting
  if (accuracy < 50) {
    return 'COUNT_20';
  }

  // 100% accuracy (e.g. 3/3): Student has mastered operations
  if (accuracy >= 95) {
    // Fluent rapid recall (<= 5.5s) -> Advanced BORROW_OPS
    // Deliberate solving (e.g. 5.5s - 12s) -> Solid PATTERN_OPS
    return avgLatencyMs <= 5500 ? 'BORROW_OPS' : 'PATTERN_OPS';
  }

  // Good accuracy (e.g. 2/3, 66%)
  if (accuracy >= 66) {
    if (avgLatencyMs <= 4000) {
      return 'BORROW_OPS';
    }
    if (avgLatencyMs <= 9000) {
      return 'PATTERN_OPS';
    }
    return 'COUNT_20';
  }

  // Moderate accuracy (50%-65%)
  if (accuracy >= 50 && avgLatencyMs <= 5000) {
    return 'PATTERN_OPS';
  }

  return 'COUNT_20';
}

// Speech recognition feature detection
export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}
