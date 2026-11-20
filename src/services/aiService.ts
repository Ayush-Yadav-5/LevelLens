import { GoogleGenAI } from '@google/genai';
import { Student, ReadingLevel, MathLevel } from '../types';

// Retrieve Gemini API Key strictly in local development.
// In production, all AI calls are safely proxied through /api/gemini to prevent client key exposure.
const apiKey = import.meta.env.DEV ? (import.meta.env.VITE_GEMINI_API_KEY || '') : '';

const isGeminiKeyConfigured = Boolean(
  apiKey && 
  apiKey.trim() !== '' && 
  !apiKey.includes('YOUR_GEMINI_API_KEY')
);

let aiClient: GoogleGenAI | null = null;
if (isGeminiKeyConfigured) {
  try {
    aiClient = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'levellens-app',
        },
      },
    });
  } catch (err) {
    console.warn('Gemini client initialization error:', err);
  }
}

export interface AdaptiveReadingTest {
  id: string;
  title: string;
  passage: string;
  words: string[];
  targetWordCount: number;
  difficultyTier: string;
  tierNumber: number;
  totalTiers: number;
  targetWpm: number;
  phonicsFocus: string;
  gradeCeiling: number;
  adaptedReason: string;
  isAiGenerated: boolean;
}

export interface AdaptiveMathQuestion {
  id: number;
  prompt: string;
  answer: number;
  options: number[];
  skillConcept: string;
  hint: string;
}

export interface AdaptiveMathTest {
  id: string;
  difficultyTier: string;
  tierNumber: number;
  totalTiers: number;
  targetLatencyMs: number;
  gradeCeiling: number;
  adaptedReason: string;
  questions: AdaptiveMathQuestion[];
  isAiGenerated: boolean;
}

export interface DiagnosticAiReport {
  studentName: string;
  grade: number;
  summary: string;
  strengths: string[];
  cognitiveHurdles: string[];
  podRecommendation: {
    readingPod: string;
    mathPod: string;
    rationale: string;
  };
  actionableTeacherTips: string[];
  nextTargetMilestone: string;
}

export interface GeneratedStory {
  title: string;
  passage: string;
  targetWpm: number;
  grade: number;
}

// Progressive Reading Tier Metadata
const READING_TIERS: { level: ReadingLevel; label: string; minGrade: number; maxGrade: number; targetWpm: number; focus: string }[] = [
  { level: 'PRE_WORD', label: 'Basics: CVC & Letter Sounds', minGrade: 1, maxGrade: 2, targetWpm: 20, focus: 'Short vowels (a, e, i, o, u) & 3-letter blends' },
  { level: 'WORD', label: 'Level 2: Common Sight Words & Digraphs', minGrade: 1, maxGrade: 3, targetWpm: 30, focus: 'High frequency sight words & 4-letter blends' },
  { level: 'SENTENCE', label: 'Level 3: Fluent Compound Sentences', minGrade: 2, maxGrade: 5, targetWpm: 42, focus: 'Punctuation pause, compound clauses & multisyllabic words' },
  { level: 'GRADE_LEVEL', label: 'Level 4: Narrative Expressive Comprehension', minGrade: 3, maxGrade: 5, targetWpm: 55, focus: 'Complex story context, dialogue & expressive intonation' },
];

// Progressive Math Tier Metadata
const MATH_TIERS: { level: MathLevel; label: string; minGrade: number; maxGrade: number; targetLatency: number; focus: string }[] = [
  { level: 'COUNT_20', label: 'Basics: Number Bonds ≤ 20', minGrade: 1, maxGrade: 2, targetLatency: 4500, focus: 'Single digit addition/subtraction and counting' },
  { level: 'PATTERN_OPS', label: 'Level 2: 2-Digit Ops Without Regrouping', minGrade: 2, maxGrade: 4, targetLatency: 3500, focus: 'Tens patterns, place value, 2-digit basic operations' },
  { level: 'BORROW_OPS', label: 'Level 3: Multi-Digit Regrouping & Borrowing', minGrade: 3, maxGrade: 5, targetLatency: 2800, focus: 'Dynamic carryover addition & borrowing subtraction' },
];

// Deterministic fallback banks for offline resilience or quota exhaustion
const FALLBACK_READING_BANK: Record<ReadingLevel, Array<{ title: string; passage: string; focus: string }>> = {
  PRE_WORD: [
    { title: 'The Red Hen', passage: 'A red hen sat in the warm sun. A fat pig had a big bun. The hen ran fast to the tub.', focus: 'Short vowels (e, a, u, i)' },
    { title: 'Pip the Pup', passage: 'Pip is a wet pup. Pip can run and hop in the mud. Ten bugs sit on a big log.', focus: 'Short vowels and CVC words' },
    { title: 'The Big Cat', passage: 'Sam has a fat cat. The cat sat on a red mat. It saw a rat and ran to dad.', focus: 'CVC rhyming word families' },
  ],
  WORD: [
    { title: 'Ravi and the Duck', passage: 'Ravi saw a yellow duck near the blue pond. The duck ate bread from his hand and swam away quickly.', focus: 'Sight words & consonant digraphs (ck, th, qu)' },
    { title: 'The Clay Pot', passage: 'Radha made a small pot of wet red clay. She kept it in the warm sun to dry. A tiny bird sat on the rim.', focus: 'Initial consonant blends (cl, sm, br)' },
    { title: 'A Rainy Walk', passage: 'Meena took her green umbrella to the village shop. Fresh drops fell on the leaves and washed the dusty road clean.', focus: 'Double vowels & compound words' },
  ],
  SENTENCE: [
    { title: 'The Kite Festival', passage: 'High above the rooftops, colorful kites danced against the blue sky. Arjun pulled the strong string gently, watching his red diamond soar above the temple trees.', focus: 'Compound sentences & descriptive adjectives' },
    { title: 'The Village Library', passage: 'Every Saturday, children gather under the banyan tree to borrow picture books. Ananya chose a tale about a baby elephant that learned to cross the river.', focus: 'Multi-clause sentence structures' },
    { title: 'The School Garden', passage: 'During the afternoon recess, Rohan and Priya watered the marigold flowers. Small yellow butterflies fluttered around the fresh buds as the teacher smiled.', focus: 'Adverbial phrasing & prepositions' },
  ],
  GRADE_LEVEL: [
    { title: 'Under the Banyan Tree', passage: 'Under the spreading banyan tree, the children gathered ripe fruit while cool monsoon winds rustled through the branches. Vikram carefully shared sweet mango slices with his classmates before the final school bell chimed across the courtyard.', focus: 'Advanced vocabulary, complex syntax & expressive reading' },
    { title: 'The Pottery Workshop', passage: 'Master craftsperson Shanti spun the wooden wheel with steady precision, molding humble gray clay into magnificent decorative urns. The eager students watched intently, marveling at how gentle finger pressure could transform simple earth into art.', focus: 'Polysyllabic words & conceptual prose' },
  ],
};

const FALLBACK_MATH_BANK: Record<MathLevel, AdaptiveMathQuestion[][]> = {
  COUNT_20: [
    [
      { id: 1, prompt: '6 + 7', answer: 13, options: [12, 13, 14, 11], skillConcept: 'Single digit addition near ten', hint: 'Make a ten: 6 + 4 is 10, then add 3 more.' },
      { id: 2, prompt: '15 - 8', answer: 7, options: [6, 7, 8, 9], skillConcept: 'Subtraction bridging ten', hint: 'Count backwards from 15: subtract 5 to get 10, then subtract 3.' },
      { id: 3, prompt: '9 + 5', answer: 14, options: [13, 14, 15, 12], skillConcept: 'Number bonds to twenty', hint: '9 needs 1 more to make 10. 10 + 4 is 14.' },
    ],
  ],
  PATTERN_OPS: [
    [
      { id: 1, prompt: '24 + 13', answer: 37, options: [35, 36, 37, 38], skillConcept: '2-digit addition without regrouping', hint: 'Add tens: 20 + 10 = 30. Add ones: 4 + 3 = 7. Result is 37.' },
      { id: 2, prompt: '48 - 25', answer: 23, options: [21, 22, 23, 24], skillConcept: '2-digit subtraction without regrouping', hint: '40 - 20 = 20. 8 - 5 = 3. Together 23.' },
      { id: 3, prompt: '35 + 20', answer: 55, options: [45, 50, 55, 65], skillConcept: 'Adding multiples of ten', hint: 'Only the tens digit changes: 3 tens + 2 tens = 5 tens.' },
    ],
  ],
  BORROW_OPS: [
    [
      { id: 1, prompt: '32 - 14', answer: 18, options: [16, 17, 18, 19], skillConcept: '2-digit subtraction with regrouping', hint: 'Regroup 1 ten into 10 ones: 12 - 4 = 8. 2 tens - 1 ten = 1 ten.' },
      { id: 2, prompt: '47 + 28', answer: 75, options: [65, 74, 75, 76], skillConcept: '2-digit addition with carry', hint: '7 + 8 = 15 (write 5, carry 1 ten). 4 + 2 + 1 = 7 tens.' },
      { id: 3, prompt: '61 - 25', answer: 36, options: [34, 35, 36, 37], skillConcept: 'Tens borrowing subtraction', hint: '11 - 5 = 6. 5 tens - 2 tens = 3 tens.' },
    ],
  ],
};

function safeParseJson<T>(rawText: string, fallback: T): T {
  try {
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

/**
 * Resilient API execution:
 * 1. Attempts the secure serverless backend proxy (/api/gemini) first to protect keys from client exposure.
 * 2. Falls back to client-side GoogleGenAI if running locally in offline/prototype mode.
 * 3. Gracefully defaults to deterministic curriculum banks if all endpoints are unavailable.
 */
async function callGeminiWithFallback(prompt: string, primaryModel: string): Promise<string | null> {
  // 1. Primary: Try secure serverless proxy (/api/gemini)
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: primaryModel }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.text) {
        return data.text;
      }
    }
  } catch {
    // Backend endpoint not responding (e.g. static dev server), proceed to local client fallback
  }

  // 2. Secondary fallback: Local browser client (dev mode)
  if (!aiClient) return null;

  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.8-flash'
  ]));

  for (const model of candidateModels) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      const isThrottled = 
        err?.status === 'RESOURCE_EXHAUSTED' || 
        err?.message?.includes('429') || 
        err?.status === 'UNAVAILABLE' || 
        err?.message?.includes('503');

      if (isThrottled) {
        console.warn(`[Gemini API] ${model} unavailable or rate-limited. Trying next model pool...`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }

      console.warn(`[Gemini API] Call error with ${model}:`, err?.message || err);
      break;
    }
  }

  return null;
}

export const aiService = {
  isConfigured: () => isGeminiKeyConfigured || import.meta.env.PROD,

  calculateNextReadingTier: (student: Student): { targetLevel: ReadingLevel; tierIndex: number; reason: string } => {
    const grade = student.grade;
    const levelOrder: ReadingLevel[] = ['PRE_WORD', 'WORD', 'SENTENCE', 'GRADE_LEVEL'];
    const currentIdx = Math.max(0, levelOrder.indexOf(student.readingLevel));

    let maxAllowedIdx = 3;
    if (grade === 1) maxAllowedIdx = 1;
    else if (grade === 2) maxAllowedIdx = 2;
    else maxAllowedIdx = 3;

    const lastAcc = student.readingAccuracy ?? 75;
    const lastWpm = student.readingWpm ?? 25;

    let targetIdx = currentIdx;
    let reason = '';

    if (lastAcc >= 85 && lastWpm >= (READING_TIERS[currentIdx]?.targetWpm || 25)) {
      if (currentIdx < maxAllowedIdx) {
        targetIdx = currentIdx + 1;
        reason = `High accuracy (${lastAcc}%) & fluency (${lastWpm} WPM). Stepping up +1 notch to ${READING_TIERS[targetIdx].label}.`;
      } else {
        targetIdx = currentIdx;
        reason = `Mastery confirmed (${lastAcc}% Acc). Capped at Grade ${grade} developmental ceiling.`;
      }
    } else if (lastAcc < 65 || lastWpm < 16) {
      targetIdx = Math.max(0, currentIdx - 1);
      reason = `Accuracy ${lastAcc}% below baseline. Reinforcing foundational phonics at ${READING_TIERS[targetIdx].label}.`;
    } else {
      targetIdx = currentIdx;
      reason = `Solid baseline (${lastAcc}% Acc, ${lastWpm} WPM). Consolidating ${READING_TIERS[targetIdx].label} with fresh vocabulary.`;
    }

    return {
      targetLevel: levelOrder[targetIdx],
      tierIndex: targetIdx,
      reason,
    };
  },

  calculateNextMathTier: (student: Student): { targetLevel: MathLevel; tierIndex: number; reason: string } => {
    const grade = student.grade;
    const mathOrder: MathLevel[] = ['COUNT_20', 'PATTERN_OPS', 'BORROW_OPS'];
    const currentIdx = Math.max(0, mathOrder.indexOf(student.mathLevel));

    let maxAllowedIdx = 2;
    if (grade === 1) maxAllowedIdx = 0;
    else if (grade === 2) maxAllowedIdx = 1;
    else maxAllowedIdx = 2;

    const lastAcc = student.mathAccuracy ?? 80;
    const latencySec = (student.mathLatencyMs || 3000) / 1000;

    let targetIdx = currentIdx;
    let reason = '';

    if (lastAcc >= 85 && latencySec <= 3.8) {
      if (currentIdx < maxAllowedIdx) {
        targetIdx = currentIdx + 1;
        reason = `Fast mental recall (${latencySec.toFixed(1)}s, ${lastAcc}% Acc). Incrementing +1 notch to ${MATH_TIERS[targetIdx].label}.`;
      } else {
        targetIdx = currentIdx;
        reason = `Strong numeracy fluency (${lastAcc}% Acc). Maintaining Grade ${grade} syllabus ceiling.`;
      }
    } else if (lastAcc < 60 || latencySec > 5.0) {
      targetIdx = Math.max(0, currentIdx - 1);
      reason = `Latency ${latencySec.toFixed(1)}s indicates cognitive load. Reinforcing basics at ${MATH_TIERS[targetIdx].label}.`;
    } else {
      targetIdx = currentIdx;
      reason = `Steady retrieval speed (${latencySec.toFixed(1)}s). Consolidating ${MATH_TIERS[targetIdx].label}.`;
    }

    return {
      targetLevel: mathOrder[targetIdx],
      tierIndex: targetIdx,
      reason,
    };
  },

  // Primary: gemini-3.5-flash-lite (lowest latency, dedicated quota pool)
  generateAdaptiveReadingTest: async (student: Student): Promise<AdaptiveReadingTest> => {
    const { targetLevel, tierIndex, reason } = aiService.calculateNextReadingTier(student);
    const tierMeta = READING_TIERS[tierIndex];

    const fallbackList = FALLBACK_READING_BANK[targetLevel] || FALLBACK_READING_BANK.PRE_WORD;
    const randomFallback = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    const fallbackWords = randomFallback.passage.split(/\s+/).filter(Boolean);

    if (aiClient) {
      try {
        const prompt = `You are an expert Indian Primary School FLN curriculum designer for NIPUN Bharat.
Generate an adaptive, age-appropriate oral reading test passage for:
Student: ${student.name}
Grade: ${student.grade}
Current Diagnostic Level: ${student.readingLevel}
Target Adaptive Step: ${tierMeta.label} (Tier ${tierIndex + 1} of 4)
Target Fluency Benchmark: ${tierMeta.targetWpm} WPM
Phonics Focus: ${tierMeta.focus}
Past Performance: Accuracy ${student.readingAccuracy || 75}%, WPM ${student.readingWpm || 24}
Known Phonetic Hurdles: ${student.phoneticFlags.join(', ') || 'None flagged'}

Return valid JSON with:
{
  "title": "Short Fun Title",
  "passage": "Full passage text with clean punctuation.",
  "phonicsFocus": "Specific phonemes or blends tested",
  "targetWordCount": 25
}`;

        const rawJson = await callGeminiWithFallback(prompt, 'gemini-3.5-flash-lite');
        if (rawJson) {
          const parsed = safeParseJson<any>(rawJson, null);
          if (parsed && parsed.passage) {
            const passage = parsed.passage.trim();
            const words = passage.split(/\s+/).filter(Boolean);

            return {
              id: `read-gemini-${Date.now()}`,
              title: parsed.title || randomFallback.title,
              passage,
              words,
              targetWordCount: words.length,
              difficultyTier: tierMeta.label,
              tierNumber: tierIndex + 1,
              totalTiers: 4,
              targetWpm: tierMeta.targetWpm,
              phonicsFocus: parsed.phonicsFocus || tierMeta.focus,
              gradeCeiling: student.grade,
              adaptedReason: reason,
              isAiGenerated: true,
            };
          }
        }
      } catch (err) {
        console.warn('Gemini reading test generation fallback:', err);
      }
    }

    return {
      id: `read-offline-${Date.now()}`,
      title: randomFallback.title,
      passage: randomFallback.passage,
      words: fallbackWords,
      targetWordCount: fallbackWords.length,
      difficultyTier: tierMeta.label,
      tierNumber: tierIndex + 1,
      totalTiers: 4,
      targetWpm: tierMeta.targetWpm,
      phonicsFocus: randomFallback.focus,
      gradeCeiling: student.grade,
      adaptedReason: reason,
      isAiGenerated: false,
    };
  },

  // Primary: gemini-3.6-flash (consistent numerical reasoning, dedicated quota pool)
  generateAdaptiveMathTest: async (student: Student): Promise<AdaptiveMathTest> => {
    const { targetLevel, tierIndex, reason } = aiService.calculateNextMathTier(student);
    const tierMeta = MATH_TIERS[tierIndex];

    const fallbackPacks = FALLBACK_MATH_BANK[targetLevel] || FALLBACK_MATH_BANK.COUNT_20;
    const randomPack = fallbackPacks[Math.floor(Math.random() * fallbackPacks.length)];

    if (aiClient) {
      try {
        const prompt = `You are a primary school mathematics assessment specialist for NIPUN Bharat FLN.
Generate a dynamic 3-question mental math diagnostic check for:
Student: ${student.name}
Grade: ${student.grade}
Current Numeracy Level: ${student.mathLevel}
Target Adaptive Step: ${tierMeta.label}
Target Latency Speed: < ${(tierMeta.targetLatency / 1000).toFixed(1)}s
Skill Concept: ${tierMeta.focus}

Return valid JSON with:
{
  "questions": [
    {
      "id": 1,
      "prompt": "14 - 8",
      "answer": 6,
      "options": [5, 6, 7, 8],
      "skillConcept": "Subtracting bridging ten",
      "hint": "Count backwards from 14"
    }
  ]
}`;

        const rawJson = await callGeminiWithFallback(prompt, 'gemini-3.6-flash');
        if (rawJson) {
          const parsed = safeParseJson<any>(rawJson, null);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
            const cleanQuestions: AdaptiveMathQuestion[] = parsed.questions.slice(0, 3).map((q: any, i: number) => ({
              id: i + 1,
              prompt: String(q.prompt || '5 + 5'),
              answer: Number(q.answer) || 10,
              options: Array.isArray(q.options) && q.options.length >= 4 
                ? q.options.slice(0, 4).map(Number) 
                : [Number(q.answer) - 1, Number(q.answer), Number(q.answer) + 1, Number(q.answer) + 2],
              skillConcept: q.skillConcept || tierMeta.focus,
              hint: q.hint || 'Use mental number line',
            }));

            return {
              id: `math-gemini-${Date.now()}`,
              difficultyTier: tierMeta.label,
              tierNumber: tierIndex + 1,
              totalTiers: 3,
              targetLatencyMs: tierMeta.targetLatency,
              gradeCeiling: student.grade,
              adaptedReason: reason,
              questions: cleanQuestions,
              isAiGenerated: true,
            };
          }
        }
      } catch (err) {
        console.warn('Gemini math test generation fallback:', err);
      }
    }

    return {
      id: `math-offline-${Date.now()}`,
      difficultyTier: tierMeta.label,
      tierNumber: tierIndex + 1,
      totalTiers: 3,
      targetLatencyMs: tierMeta.targetLatency,
      gradeCeiling: student.grade,
      adaptedReason: reason,
      questions: randomPack,
      isAiGenerated: false,
    };
  },

  // Primary: gemini-3.8-flash (maximum qualitative synthesis, dedicated quota pool)
  generateDiagnosticReport: async (
    student: Student,
    results: {
      wpm: number;
      readingAccuracy: number;
      readingLevel: ReadingLevel;
      mathAccuracy: number;
      mathLatencyMs: number;
      mathLevel: MathLevel;
      domain: 'both' | 'reading' | 'math';
    }
  ): Promise<DiagnosticAiReport> => {
    if (aiClient) {
      try {
        const prompt = `You are an expert diagnostic evaluator for NIPUN Bharat Primary FLN.
Synthesize an insightful teacher diagnostic evaluation for:
Student: ${student.name} (Grade ${student.grade}, Roll #${student.rollNo})
Results: Reading ${results.wpm} WPM, ${results.readingAccuracy}% Accuracy (${results.readingLevel}); Math ${results.mathAccuracy}% Accuracy, ${(results.mathLatencyMs / 1000).toFixed(1)}s Latency (${results.mathLevel}).

Return structured JSON with keys: summary, strengths (string array), cognitiveHurdles (string array), podRecommendation ({ readingPod, mathPod, rationale }), actionableTeacherTips (string array), nextTargetMilestone.`;

        const rawJson = await callGeminiWithFallback(prompt, 'gemini-3.8-flash');
        if (rawJson) {
          const parsed = safeParseJson<any>(rawJson, null);
          if (parsed && parsed.summary) {
            return {
              studentName: student.name,
              grade: student.grade,
              summary: parsed.summary,
              strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Phonetic letter sound recognition', 'Quick single-digit addition'],
              cognitiveHurdles: Array.isArray(parsed.cognitiveHurdles) ? parsed.cognitiveHurdles : ['Regrouping across tens places under time pressure'],
              podRecommendation: parsed.podRecommendation || {
                readingPod: `${student.readingPodId} Pod`,
                mathPod: `${student.mathPodId} Pod`,
                rationale: 'Clustered based on current decoding accuracy and retrieval speed.',
              },
              actionableTeacherTips: Array.isArray(parsed.actionableTeacherTips) ? parsed.actionableTeacherTips : [
                'Pair with a peer for 10 minutes of daily slate board akshar blending.',
                'Use bottle caps to practice grouping in tens before introducing written carry-over math.'
              ],
              nextTargetMilestone: parsed.nextTargetMilestone || `Reach ${results.wpm + 6} WPM and <3.5s mental math response time.`,
            };
          }
        }
      } catch (err) {
        console.warn('Gemini diagnostic report generation fallback:', err);
      }
    }

    const readingStrengths = results.readingAccuracy >= 80 
      ? ['Strong phonetic decoding with minimal hesitation', 'Accurate short vowel recognition']
      : ['Engaged effort in oral reading', 'Good recognition of initial consonant sounds'];

    const mathStrengths = results.mathAccuracy >= 80
      ? ['Fast mental number bond recall under 3.5 seconds', 'Consistent addition fact mastery']
      : ['Clear understanding of single-digit quantities', 'Willingness to attempt mental calculations'];

    const hurdles: string[] = [];
    if (results.readingAccuracy < 80) hurdles.push('Consonant digraph blending (sh, ch, th) requires reinforcement');
    if (results.mathLatencyMs > 4000) hurdles.push('Mental math retrieval hesitation when crossing decade numbers (e.g. 14 - 6)');
    if (hurdles.length === 0) hurdles.push('Ready for multi-clause sentence structures and multi-step word problems');

    return {
      studentName: student.name,
      grade: student.grade,
      summary: `${student.name} is performing at ${results.readingLevel.replace('_', ' ')} for oral reading (${results.wpm} WPM) and ${results.mathLevel.replace('_', ' ')} for mental numeracy with ${(results.mathLatencyMs / 1000).toFixed(1)}s latency.`,
      strengths: [...readingStrengths.slice(0, 1), ...mathStrengths.slice(0, 1)],
      cognitiveHurdles: hurdles,
      podRecommendation: {
        readingPod: student.readingPodId,
        mathPod: student.mathPodId,
        rationale: 'Fluid grouping maintains targeted peer practice without cross-grade stigma.',
      },
      actionableTeacherTips: [
        'Conduct 5 minutes of daily slate-board phonetic blending for short vowels and high-frequency sight words.',
        'Use counting pebbles or bottle caps in bundles of 10 to strengthen place value visualization before timed operations.'
      ],
      nextTargetMilestone: `Reach ${results.wpm + 8} WPM and maintain mental math recall under 3.2s.`,
    };
  },

  generateReadingPassage: async (grade: number, readingLevel: ReadingLevel): Promise<GeneratedStory> => {
    const fallbackList = FALLBACK_READING_BANK[readingLevel] || FALLBACK_READING_BANK.PRE_WORD;
    const item = fallbackList[0];
    return {
      title: item.title,
      passage: item.passage,
      targetWpm: READING_TIERS.find(t => t.level === readingLevel)?.targetWpm || 30,
      grade,
    };
  },

  generateRemediationAdvice: async (
    studentName: string, 
    readingLevel: ReadingLevel, 
    mathLevel: MathLevel, 
    wpm: number
  ): Promise<string> => {
    return `Pair ${studentName} with a peer for 10 minutes of daily slate board akshar blending. Use bottle caps to practice grouping in tens before introducing written carry-over math.`;
  }
};