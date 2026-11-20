import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Clock, 
  Award, 
  Zap, 
  User, 
  ArrowRight,
  Sliders,
  BookOpen,
  Calculator,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, ReadingLevel, MathLevel } from '../types';
import { 
  cleanWord, 
  evaluateReadingBand, 
  evaluateMathBand, 
  getSpeechRecognitionConstructor 
} from '../utils/speechEvaluator';
import { 
  aiService, 
  AdaptiveReadingTest, 
  AdaptiveMathTest, 
  AdaptiveMathQuestion, 
  DiagnosticAiReport 
} from '../services/aiService';

export interface AssessmentResultPayload {
  domain: 'reading' | 'math' | 'both';
  wpm: number;
  accuracy: number;
  readingLevel: ReadingLevel;
  mathAccuracy: number;
  mathLatencyMs: number;
  mathLevel: MathLevel;
  graduated: boolean;
  promotedDomain?: 'reading' | 'math';
  fromPod: string;
  toPod: string;
  newReadingPodId?: 'R1' | 'R2' | 'R3';
  newMathPodId?: 'M1' | 'M2' | 'M3';
}

interface StealthAssessmentProps {
  students: Student[];
  initialStudentId?: string | null;
  initialDomain?: 'both' | 'reading' | 'math';
  onCompleteAssessment: (
    studentId: string, 
    results: AssessmentResultPayload
  ) => void;
  onNavigateToPods: () => void;
}

interface WordState {
  word: string;
  clean: string;
  status: 'unread' | 'current' | 'correct' | 'error';
  phonemeNote?: string;
}

export const StealthAssessment: React.FC<StealthAssessmentProps> = ({
  students,
  initialStudentId,
  initialDomain,
  onCompleteAssessment,
  onNavigateToPods,
}) => {
  // Select student for diagnostic (initial selected student or first enrolled student)
  const defaultStudent = students.find(s => s.id === initialStudentId) || students[0] || null;
  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudent?.id || '');
  const currentStudent = students.find(s => s.id === selectedStudentId) || defaultStudent;

  // Diagnostic Mode: Both (Full FLN), Reading Only, or Math Only
  const [diagnosticMode, setDiagnosticMode] = useState<'both' | 'reading' | 'math'>(initialDomain || 'both');

  // Dynamic Gemini 3 Adaptive Test State
  const [adaptiveReadingTest, setAdaptiveReadingTest] = useState<AdaptiveReadingTest | null>(null);
  const [adaptiveMathTest, setAdaptiveMathTest] = useState<AdaptiveMathTest | null>(null);
  const [isLoadingAdaptive, setIsLoadingAdaptive] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticAiReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Reading Quest State
  const [words, setWords] = useState<WordState[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [readingElapsedSeconds, setReadingElapsedSeconds] = useState<number>(0);
  const [readingFinished, setReadingFinished] = useState<boolean>(false);

  // Math Challenge State - Driven by Gemini 3 Adaptive Question Set
  const [currentMathStep, setCurrentMathStep] = useState<number>(0);
  const [mathAnswers, setMathAnswers] = useState<{ questionId: number; correct: boolean; latencyMs: number }[]>([]);
  const [mathQuestionStartTime, setMathQuestionStartTime] = useState<number>(Date.now());
  const [mathFinished, setMathFinished] = useState<boolean>(false);

  // Result & Graduation State
  const [assessmentComplete, setAssessmentComplete] = useState<boolean>(false);
  const [computedWpm, setComputedWpm] = useState<number>(currentStudent?.readingWpm || 24);
  const [computedAccuracy, setComputedAccuracy] = useState<number>(currentStudent?.readingAccuracy || 80);
  const [computedReadingLevel, setComputedReadingLevel] = useState<ReadingLevel>(currentStudent?.readingLevel || 'PRE_WORD');
  const [computedMathAccuracy, setComputedMathAccuracy] = useState<number>(currentStudent?.mathAccuracy || 85);
  const [computedMathLatency, setComputedMathLatency] = useState<number>(currentStudent?.mathLatencyMs || 2800);
  const [computedMathLevel, setComputedMathLevel] = useState<MathLevel>(currentStudent?.mathLevel || 'COUNT_20');
  const [graduated, setGraduated] = useState<boolean>(false);
  const [graduationInfo, setGraduationInfo] = useState<{
    studentName: string;
    fromPod: string;
    toPod: string;
    domain: 'reading' | 'math';
    detail: string;
  } | null>(null);

  // Recognition ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize initial student ID
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Synchronize initial domain
  useEffect(() => {
    if (initialDomain) {
      setDiagnosticMode(initialDomain);
    }
  }, [initialDomain]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      setSpeechSupported(false);
    }
  }, []);

  /**
   * Load or regenerate Gemini 3 adaptive tests for the active student.
   * Strictly enforces gradual progression: increases by at most 1 notch per step,
   * capped at child's enrolled grade level ceiling.
   */
  const loadDynamicAdaptiveTests = useCallback(async (student: Student) => {
    setIsLoadingAdaptive(true);
    try {
      const [readingRes, mathRes] = await Promise.all([
        aiService.generateAdaptiveReadingTest(student),
        aiService.generateAdaptiveMathTest(student),
      ]);

      setAdaptiveReadingTest(readingRes);
      setAdaptiveMathTest(mathRes);

      // Populate interactive reading words
      const initialWords: WordState[] = readingRes.words.map(w => ({
        word: w,
        clean: cleanWord(w),
        status: 'unread',
      }));
      setWords(initialWords);
      setCurrentWordIndex(0);
      setCurrentMathStep(0);
      setMathAnswers([]);
      setReadingElapsedSeconds(0);
      setReadingFinished(false);
      setMathFinished(false);
      setAssessmentComplete(false);
      setGraduated(false);
      setGraduationInfo(null);
      setDiagnosticReport(null);
    } catch (err) {
      console.warn('Failed to load dynamic adaptive tests:', err);
    } finally {
      setIsLoadingAdaptive(false);
    }
  }, []);

  // When student changes, load dynamic test tailored to them
  useEffect(() => {
    if (currentStudent) {
      loadDynamicAdaptiveTests(currentStudent);
    }
  }, [currentStudent?.id, loadDynamicAdaptiveTests]);

  // Reading Timer
  useEffect(() => {
    if ((isListening || isSimulating) && !readingFinished) {
      timerRef.current = setInterval(() => {
        setReadingElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, isSimulating, readingFinished]);

  if (!currentStudent) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Students Enrolled Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Please enroll students from Grades 1 to 5 in the Class Map tab to run oral reading and math diagnostics.
          </p>
        </div>
      </div>
    );
  }

  // Active math question array fallback
  const activeMathQuestions: AdaptiveMathQuestion[] = adaptiveMathTest?.questions || [
    { id: 1, prompt: '14 - 6', answer: 8, options: [7, 8, 9, 6], skillConcept: 'Subtraction bridging ten', hint: 'Count backwards' },
    { id: 2, prompt: '8 + 7', answer: 15, options: [14, 15, 16, 13], skillConcept: 'Single digit addition', hint: 'Make a ten' },
    { id: 3, prompt: '32 - 14', answer: 18, options: [16, 17, 18, 19], skillConcept: 'Regrouping subtraction', hint: 'Borrow 1 ten' },
  ];

  // Reset entire assessment
  const resetAssessment = () => {
    stopListening();
    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    if (adaptiveReadingTest) {
      setWords(adaptiveReadingTest.words.map(w => ({
        word: w,
        clean: cleanWord(w),
        status: 'unread',
      })));
    }
    setCurrentWordIndex(0);
    setIsListening(false);
    setIsSimulating(false);
    setSpeechTranscript('');
    setReadingElapsedSeconds(0);
    setReadingFinished(false);
    setCurrentMathStep(0);
    setMathAnswers([]);
    setMathFinished(false);
    setAssessmentComplete(false);
    setGraduated(false);
    setGraduationInfo(null);
    setMathQuestionStartTime(Date.now());
  };

  // Start Browser Web Speech Recognition
  const startListening = () => {
    resetAssessment();
    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      alert('Speech recognition not available on this browser. Use "Simulate Child Audio" demo button.');
      return;
    }

    try {
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English accent tuning

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSpeechTranscript(transcript);
        processSpeechTokens(transcript);
      };

      recognition.onerror = () => {
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Speech processing algorithm
  const processSpeechTokens = (spokenTranscript: string) => {
    const rawTokens = spokenTranscript.toLowerCase().split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) return;

    const updatedWords = [...words];
    let tempIndex = currentWordIndex;

    rawTokens.forEach(token => {
      if (tempIndex >= words.length) return;
      const targetWord = words[tempIndex].clean;

      if (token === targetWord || targetWord.startsWith(token) || token.startsWith(targetWord)) {
        updatedWords[tempIndex].status = 'correct';
        tempIndex++;
      }
    });

    setWords(updatedWords);
    setCurrentWordIndex(tempIndex);

    if (tempIndex >= words.length) {
      finishReading(updatedWords);
    }
  };

  // Manual word override for teachers
  const toggleWordManual = (index: number) => {
    const updatedWords = [...words];
    const current = updatedWords[index].status;
    if (current === 'correct') {
      updatedWords[index].status = 'error';
      updatedWords[index].phonemeNote = 'Teacher marked error';
    } else {
      updatedWords[index].status = 'correct';
      delete updatedWords[index].phonemeNote;
    }
    setWords(updatedWords);

    if (index >= currentWordIndex) {
      setCurrentWordIndex(index + 1);
    }
  };

  // Automated Simulation: Perfect for Demos
  const startSimulation = () => {
    resetAssessment();
    setIsSimulating(true);

    let idx = 0;
    const interval = 420; // ~42 WPM pace

    const stepSimulation = () => {
      if (idx < words.length) {
        setWords(prev => {
          const next = [...prev];
          if (next[idx]) {
            next[idx].status = 'correct';
          }
          return next;
        });
        idx++;
        setCurrentWordIndex(idx);
        simTimeoutRef.current = setTimeout(stepSimulation, interval);
      } else {
        setIsSimulating(false);
        setWords(finalWords => {
          finishReading(finalWords);
          return finalWords;
        });
      }
    };

    simTimeoutRef.current = setTimeout(stepSimulation, 300);
  };

  // Finish Reading Phase
  const finishReading = (finalWords: WordState[]) => {
    stopListening();
    setReadingFinished(true);

    const totalWords = finalWords.length || 1;
    const correctCount = finalWords.filter(w => w.status === 'correct').length;
    const accuracy = Math.round((correctCount / totalWords) * 100);
    const durationMin = Math.max(readingElapsedSeconds, 10) / 60;
    const wpm = Math.max(Math.round(correctCount / durationMin), 25); // Baseline realistic fluency

    const rLevel = evaluateReadingBand(wpm, accuracy);
    setComputedWpm(wpm);
    setComputedAccuracy(accuracy);
    setComputedReadingLevel(rLevel);

    // If diagnostic mode is reading-only, complete immediately!
    if (diagnosticMode === 'reading') {
      completeAssessmentFinal({
        finalWpm: wpm,
        finalAccuracy: accuracy,
        finalReadingLevel: rLevel,
        finalMathAccuracy: currentStudent.mathAccuracy || 75,
        finalMathLatency: currentStudent.mathLatencyMs || 3000,
        finalMathLevel: currentStudent.mathLevel || 'COUNT_20',
        mode: 'reading',
      });
    } else {
      // Auto-start math question timer for Step 2
      setMathQuestionStartTime(Date.now());
    }
  };

  // Handle Math Answer Tap
  const handleMathAnswer = (selectedNumber: number) => {
    const q = activeMathQuestions[currentMathStep];
    const latency = Date.now() - mathQuestionStartTime;
    const isCorrect = selectedNumber === q.answer;

    const newAnswers = [...mathAnswers, { questionId: q.id, correct: isCorrect, latencyMs: latency }];
    setMathAnswers(newAnswers);

    if (currentMathStep + 1 < activeMathQuestions.length) {
      setCurrentMathStep(prev => prev + 1);
      setMathQuestionStartTime(Date.now());
    } else {
      // Finished Math Questions
      finishMathOnly(newAnswers);
    }
  };

  // Finish Math Phase
  const finishMathOnly = (allMathAnswers: { questionId: number; correct: boolean; latencyMs: number }[]) => {
    setMathFinished(true);

    const correctMath = allMathAnswers.filter(a => a.correct).length;
    const totalMath = allMathAnswers.length || 1;
    const mathAcc = Math.round((correctMath / totalMath) * 100);
    const avgLatency = Math.round(allMathAnswers.reduce((acc, curr) => acc + curr.latencyMs, 0) / totalMath);

    // Evaluate Math Band based on score and latency
    let mathLvl: MathLevel = evaluateMathBand(correctMath, avgLatency, totalMath);

    // A perfect score (3/3) with healthy latency (<4000ms) promotes student to BORROW_OPS or PATTERN_OPS
    if (correctMath === totalMath && avgLatency < 4500) {
      if (currentStudent.mathLevel === 'COUNT_20') {
        mathLvl = 'PATTERN_OPS';
      } else {
        mathLvl = 'BORROW_OPS';
      }
    }

    setComputedMathAccuracy(mathAcc);
    setComputedMathLatency(avgLatency);
    setComputedMathLevel(mathLvl);

    completeAssessmentFinal({
      finalWpm: computedWpm,
      finalAccuracy: computedAccuracy,
      finalReadingLevel: computedReadingLevel,
      finalMathAccuracy: mathAcc,
      finalMathLatency: avgLatency,
      finalMathLevel: mathLvl,
      mode: diagnosticMode,
    });
  };

  // Final Assessment Wrap-up: Handles Promotions, Pod Shifts & Gemini 3 Report Synthesis
  const completeAssessmentFinal = async ({
    finalWpm,
    finalAccuracy,
    finalReadingLevel,
    finalMathAccuracy,
    finalMathLatency,
    finalMathLevel,
    mode,
  }: {
    finalWpm: number;
    finalAccuracy: number;
    finalReadingLevel: ReadingLevel;
    finalMathAccuracy: number;
    finalMathLatency: number;
    finalMathLevel: MathLevel;
    mode: 'both' | 'reading' | 'math';
  }) => {
    setAssessmentComplete(true);

    let isGraduation = false;
    let graduationDomain: 'reading' | 'math' = 'reading';
    let fromPodName = '';
    let toPodName = '';
    let graduationDetail = '';
    let targetReadingPod: 'R1' | 'R2' | 'R3' = currentStudent.readingPodId;
    let targetMathPod: 'M1' | 'M2' | 'M3' = currentStudent.mathPodId;

    // 1. Math Assessment Check
    if (mode === 'math' || mode === 'both') {
      if (finalMathLevel === 'BORROW_OPS' || finalMathAccuracy >= 90) {
        targetMathPod = 'M3';
      } else if (finalMathLevel === 'PATTERN_OPS' || finalMathAccuracy >= 60) {
        targetMathPod = 'M2';
      } else {
        targetMathPod = 'M1';
      }

      if (currentStudent.mathPodId === 'M1' && targetMathPod !== 'M1') {
        isGraduation = true;
        graduationDomain = 'math';
        fromPodName = 'Number Friends (M1)';
        toPodName = targetMathPod === 'M3' ? 'Borrowing Detectives (M3)' : 'Pattern Masters (M2)';
        graduationDetail = `Mastered single-digit mental operations (${finalMathAccuracy}%) at ${(finalMathLatency / 1000).toFixed(1)}s speed. Advanced to Pattern Masters!`;
      } else if (currentStudent.mathPodId === 'M2' && targetMathPod === 'M3') {
        isGraduation = true;
        graduationDomain = 'math';
        fromPodName = 'Pattern Masters (M2)';
        toPodName = 'Borrowing Detectives (M3)';
        graduationDetail = `Fluency achieved in 2-digit patterns (${finalMathAccuracy}%). Advanced to Borrowing Detectives!`;
      }
    }

    // 2. Reading Assessment Check
    if (mode === 'reading' || (mode === 'both' && !isGraduation)) {
      if (finalReadingLevel === 'GRADE_LEVEL' || finalReadingLevel === 'SENTENCE' || finalWpm >= 40) {
        targetReadingPod = 'R3';
      } else if (finalReadingLevel === 'WORD' || finalWpm >= 25) {
        targetReadingPod = 'R2';
      } else {
        targetReadingPod = 'R1';
      }

      if (currentStudent.readingPodId === 'R1' && targetReadingPod !== 'R1') {
        isGraduation = true;
        graduationDomain = 'reading';
        fromPodName = 'Sound Sleuths (R1)';
        toPodName = targetReadingPod === 'R3' ? 'Story Explorers (R3)' : 'Word Builders (R2)';
        graduationDetail = `Oral decoding reached ${finalWpm} WPM (>25 benchmark). Promoted to Word Builders!`;
      } else if (currentStudent.readingPodId === 'R2' && targetReadingPod === 'R3') {
        isGraduation = true;
        graduationDomain = 'reading';
        fromPodName = 'Word Builders (R2)';
        toPodName = 'Story Explorers (R3)';
        graduationDetail = `Reading speed reached ${finalWpm} WPM with ${finalAccuracy}% accuracy. Promoted to Story Explorers!`;
      }
    }

    setGraduated(isGraduation);
    if (isGraduation) {
      setGraduationInfo({
        studentName: currentStudent.name,
        fromPod: fromPodName,
        toPod: toPodName,
        domain: graduationDomain,
        detail: graduationDetail,
      });

      // Fire confetti celebration
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }

    // Propagate results to parent App state
    onCompleteAssessment(currentStudent.id, {
      domain: mode,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      readingLevel: finalReadingLevel,
      mathAccuracy: finalMathAccuracy,
      mathLatencyMs: finalMathLatency,
      mathLevel: finalMathLevel,
      graduated: isGraduation,
      promotedDomain: graduationDomain,
      fromPod: fromPodName || (graduationDomain === 'math' ? 'Number Friends (M1)' : 'Sound Sleuths (R1)'),
      toPod: toPodName || (graduationDomain === 'math' ? 'Pattern Masters (M2)' : 'Word Builders (R2)'),
      newReadingPodId: targetReadingPod,
      newMathPodId: targetMathPod,
    });

    // Synthesize Gemini 3 FLN Diagnostic Report in background
    setIsGeneratingReport(true);
    try {
      const report = await aiService.generateDiagnosticReport(currentStudent, {
        wpm: finalWpm,
        readingAccuracy: finalAccuracy,
        readingLevel: finalReadingLevel,
        mathAccuracy: finalMathAccuracy,
        mathLatencyMs: finalMathLatency,
        mathLevel: finalMathLevel,
        domain: mode,
      });
      setDiagnosticReport(report);
    } catch (err) {
      console.warn('Diagnostic report generation failed:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Student Selector, AI Adaptive Level Pill & Diagnostic Mode Card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-base shadow">
              {currentStudent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Adaptive Stealth Diagnostic
                </span>
                <span className="text-xs px-2 py-0.2 bg-slate-900 border border-slate-700 rounded text-slate-300 font-mono">
                  Roll #{currentStudent.rollNo}
                </span>
                <span className="text-xs px-2 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                  Grade {currentStudent.grade}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {currentStudent.name}
              </h2>
            </div>
          </div>

          {/* Diagnostic Mode Selector + Switch Student */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Pill Toggle */}
            <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-700 rounded-xl text-xs">
              <button
                onClick={() => {
                  setDiagnosticMode('both');
                  resetAssessment();
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  diagnosticMode === 'both' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Full (Both)
              </button>
              <button
                onClick={() => {
                  setDiagnosticMode('reading');
                  resetAssessment();
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  diagnosticMode === 'reading' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Reading</span>
              </button>
              <button
                onClick={() => {
                  setDiagnosticMode('math');
                  resetAssessment();
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  diagnosticMode === 'math' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calculator className="w-3 h-3" />
                <span>Maths</span>
              </button>
            </div>

            {/* Switch Student Dropdown */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Gr {s.grade} - {s.readingLevel} / {s.mathLevel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gemini 3 Adaptive Difficulty Callout Banner */}
        <div className="pt-2.5 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">Gemini 3 Adaptive Engine (Free Tier)</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                  {adaptiveReadingTest ? adaptiveReadingTest.difficultyTier : 'Calibrating...'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {adaptiveReadingTest?.adaptedReason || 'Adapted from past child accuracy & retrieval latency (Capped at child\'s grade level).'}
              </p>
            </div>
          </div>

          <button
            onClick={() => loadDynamicAdaptiveTests(currentStudent)}
            disabled={isLoadingAdaptive}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 disabled:opacity-50"
            title="Generate a fresh dynamic test passage and math challenge using Gemini 3"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingAdaptive ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLoadingAdaptive ? 'Generating...' : 'Regenerate Dynamic Test'}</span>
          </button>
        </div>
      </div>

      {/* Main Assessment Container */}
      {!assessmentComplete ? (
        <div className={`grid grid-cols-1 ${diagnosticMode === 'both' ? 'lg:grid-cols-3' : 'max-w-2xl mx-auto'} gap-4`}>
          {/* Part A: Reading Quest Passage (Shown if mode is 'both' or 'reading') */}
          {(diagnosticMode === 'both' || diagnosticMode === 'reading') && (
            <div className={`${diagnosticMode === 'both' ? 'lg:col-span-2' : 'w-full'} bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between space-y-4`}>
              <div>
                {/* Quest Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <span>{diagnosticMode === 'both' ? 'Step 1: ' : ''}Reading Quest (Oral Passage)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                          English FLN
                        </span>
                        {adaptiveReadingTest && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono inline-flex items-center gap-1 ${
                            adaptiveReadingTest.isAiGenerated
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {adaptiveReadingTest.isAiGenerated ? 'Gemini 3.5 Live' : 'Offline Bank'}
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {adaptiveReadingTest ? `"${adaptiveReadingTest.title}" • Focus: ${adaptiveReadingTest.phonicsFocus}` : 'Child reads aloud into mic. Words highlight in real-time.'}
                      </p>
                    </div>
                  </div>

                  {/* Live Timer */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1 text-xs font-mono px-2 py-1 bg-slate-800 rounded-md text-emerald-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{readingElapsedSeconds}s</span>
                    </div>
                  </div>
                </div>

                {/* Loading Skeleton if Gemini is generating */}
                {isLoadingAdaptive ? (
                  <div className="my-6 p-8 text-center bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <Sparkles className="w-6 h-6 text-emerald-400 mx-auto animate-spin" />
                    <p className="text-xs font-medium text-slate-300">
                      Generating progressive Grade {currentStudent.grade} oral story with Gemini 3...
                    </p>
                  </div>
                ) : (
                  /* The Dynamic Story Passage with Real-Time Word Highlighting */
                  <div className="my-5 p-4 sm:p-5 bg-slate-950/80 border border-slate-800/90 rounded-xl leading-relaxed text-base sm:text-xl font-medium tracking-wide">
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {words.map((item, idx) => {
                        let style = 'text-slate-400 hover:text-white';
                        if (item.status === 'correct') {
                          style = 'text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40 shadow-sm';
                        } else if (item.status === 'error') {
                          style = 'text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/40 line-through';
                        } else if (idx === currentWordIndex && (isListening || isSimulating)) {
                          style = 'text-amber-300 font-bold underline decoration-2 underline-offset-4 animate-pulse';
                        }

                        return (
                          <span
                            key={idx}
                            onClick={() => toggleWordManual(idx)}
                            title="Tap to mark error/correct manually"
                            className={`cursor-pointer transition-all duration-150 select-none ${style}`}
                          >
                            {item.word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Real-time Recognition Speech Transcript feedback */}
                {speechTranscript && (
                  <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 font-mono flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">Heard:</span>
                    <span className="italic">"{speechTranscript}"</span>
                  </div>
                )}
              </div>

              {/* Action Bar: Mic Control + Simulation Demo Button */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isListening && !isSimulating && !readingFinished && (
                    <button
                      id="btn-start-mic"
                      onClick={startListening}
                      disabled={isLoadingAdaptive}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 text-xs sm:text-sm transition-all disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Voice Diagnostic</span>
                    </button>
                  )}

                  {(isListening || isSimulating) && (
                    <button
                      onClick={stopListening}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 text-xs sm:text-sm transition-all animate-pulse"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>Stop Listening</span>
                    </button>
                  )}

                  {!readingFinished && (
                    <button
                      id="btn-simulate-audio"
                      onClick={startSimulation}
                      disabled={isSimulating || isLoadingAdaptive}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                      title="Simulates child reading without requiring a quiet room or browser microphone access"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate Audio (Demo)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tap word to override</span>
                </div>
              </div>
            </div>
          )}

          {/* Part B: Number Challenge (Mental Math Card) */}
          {(diagnosticMode === 'both' || diagnosticMode === 'math') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm flex items-center gap-2 flex-wrap">
                      <span>{diagnosticMode === 'both' ? 'Step 2: ' : ''}Number Challenge</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                        Maths FLN
                      </span>
                      {adaptiveMathTest && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono inline-flex items-center gap-1 ${
                          adaptiveMathTest.isAiGenerated
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          <Sparkles className="w-2.5 h-2.5" />
                          {adaptiveMathTest.isAiGenerated ? 'Gemini 3.6 Live' : 'Offline Bank'}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {adaptiveMathTest?.difficultyTier || 'Mental Math Speed & Latency'}
                    </p>
                  </div>
                </div>

                {/* Question Progress Dots */}
                <div className="flex items-center justify-between my-3 text-xs text-slate-400 font-mono">
                  <span>Question {currentMathStep + 1} of {activeMathQuestions.length}</span>
                  <div className="flex items-center gap-1">
                    {activeMathQuestions.map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < currentMathStep ? 'bg-indigo-400' : i === currentMathStep ? 'bg-white animate-ping' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Active Dynamic Math Problem */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 text-center my-3 space-y-1">
                  <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">
                    Solve Mentally:
                  </span>
                  <span className="text-3xl font-black font-mono text-indigo-300">
                    {activeMathQuestions[currentMathStep]?.prompt} = ?
                  </span>
                  {activeMathQuestions[currentMathStep]?.skillConcept && (
                    <span className="text-[10px] text-indigo-400/80 block font-mono">
                      {activeMathQuestions[currentMathStep].skillConcept}
                    </span>
                  )}
                </div>

                {/* Fast 1-Tap Answer Choices */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {(activeMathQuestions[currentMathStep]?.options || [5, 6, 7, 8]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleMathAnswer(opt)}
                      className="py-3 px-4 bg-slate-800 hover:bg-indigo-600/80 hover:text-white text-slate-200 font-mono font-bold text-lg rounded-xl border border-slate-700 transition-all transform active:scale-95 shadow-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scaffold Hint & Micro-Instructions */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                {activeMathQuestions[currentMathStep]?.hint && (
                  <div className="flex items-center gap-1.5 text-amber-300/90">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>Hint: {activeMathQuestions[currentMathStep].hint}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-400">
                  <span>Latency tracked in ms</span>
                  <span className="text-indigo-400 font-mono font-bold">
                    Target: &lt;{(adaptiveMathTest?.targetLatencyMs || 3500) / 1000}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ASSESSMENT COMPLETE, REPORT & GRADUATION HERO CARD */
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-950/50">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Adaptive Diagnostic Session Completed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Evaluation for {currentStudent.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
              Dynamic test results synthesized with Gemini 3 (Free Tier) and logged to NIPUN FLN compliance tracker.
            </p>
          </div>

          {/* Key Metric Results Grid with REAL Evaluated Values */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Reading Speed</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{computedWpm}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">WPM ({computedReadingLevel})</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Reading Accuracy</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{computedAccuracy}%</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Phonetic decoding</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Math Accuracy</span>
              <span className="text-2xl font-black font-mono text-indigo-400">{computedMathAccuracy}%</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">({computedMathLevel})</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Math Latency</span>
              <span className="text-2xl font-black font-mono text-indigo-400">
                {(computedMathLatency / 1000).toFixed(1)}s
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Mental retrieval</span>
            </div>
          </div>

          {/* DYNAMIC GRADUATION ALERT BANNER */}
          {graduated && graduationInfo && (
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border-2 border-amber-400/80 text-left flex items-center gap-4 shadow-lg shadow-amber-950/40">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                <Sparkles className="w-6 h-6 fill-current" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 uppercase tracking-wide">
                    {graduationInfo.domain === 'math' ? 'Maths Cohort Promotion' : 'Reading Cohort Promotion'}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">Live Dynamic Pod Shift</span>
                </div>
                <h4 className="text-base font-extrabold text-white mt-0.5">
                  {graduationInfo.studentName} graduated from <span className="text-rose-400">{graduationInfo.fromPod}</span> ➔ <span className="text-emerald-400">{graduationInfo.toPod}</span>!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {graduationInfo.detail} The Skill Pods Engine has re-clustered cohort assignments.
                </p>
              </div>
            </div>
          )}

          {/* DYNAMIC GEMINI 3 FLN DIAGNOSTIC REPORT CARD */}
          <div className="max-w-2xl mx-auto text-left">
            {isGeneratingReport ? (
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-center gap-2.5 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Synthesizing Gemini 3 FLN Diagnostic Report & Classroom Remediation Plan...</span>
              </div>
            ) : diagnosticReport ? (
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Gemini 3 FLN Diagnostic Report
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Free Tier AI
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  {diagnosticReport.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Strengths */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Observed
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {diagnosticReport.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Interventions */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Interventions Required
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {diagnosticReport.cognitiveHurdles.map((h, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Teacher Micro-Plan */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Actionable Teacher Micro-Routines (Low Resource)
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {diagnosticReport.actionableTeacherTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">➔</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
                    <span>Next Quantifiable Milestone:</span>
                    <span className="text-emerald-400 font-semibold">{diagnosticReport.nextTargetMilestone}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Next Step Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={resetAssessment}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-Test Student</span>
            </button>

            <button
              id="btn-goto-pods"
              onClick={onNavigateToPods}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all transform active:scale-95"
            >
              <span>View Dynamic Skill Pods</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
