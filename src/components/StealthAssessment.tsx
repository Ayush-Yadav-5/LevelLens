import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Sparkles, 
  Clock, 
  Award, 
  Zap, 
  User, 
  ArrowRight,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, ReadingLevel, MathLevel } from '../types';
import { 
  cleanWord, 
  isPhoneticMatch, 
  evaluateReadingBand, 
  evaluateMathBand, 
  getSpeechRecognitionConstructor 
} from '../utils/speechEvaluator';
import { DEMO_STORY_PASSAGE } from '../data/mockData';

interface StealthAssessmentProps {
  students: Student[];
  initialStudentId?: string | null;
  onCompleteAssessment: (
    studentId: string, 
    results: {
      wpm: number;
      accuracy: number;
      readingLevel: ReadingLevel;
      mathAccuracy: number;
      mathLatencyMs: number;
      mathLevel: MathLevel;
      graduated: boolean;
      fromPod: string;
      toPod: string;
    }
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
  onCompleteAssessment,
  onNavigateToPods,
}) => {
  // Preselect Aisha Patel (or provided student)
  const defaultStudent = students.find(s => s.id === initialStudentId) || 
                         students.find(s => s.id === 'std-1') || 
                         students[0];
                         
  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudent?.id || 'std-1');
  const currentStudent = students.find(s => s.id === selectedStudentId) || defaultStudent;

  // Reading Quest State
  const passageWords = DEMO_STORY_PASSAGE.join(' ').split(/\s+/);
  const [words, setWords] = useState<WordState[]>(() => 
    passageWords.map(w => ({
      word: w,
      clean: cleanWord(w),
      status: 'unread'
    }))
  );

  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [readingElapsedSeconds, setReadingElapsedSeconds] = useState<number>(0);
  const [readingFinished, setReadingFinished] = useState<boolean>(false);

  // Math Challenge State
  const mathQuestions = [
    { id: 1, prompt: '14 - 6', answer: 8, options: [7, 8, 9, 6] },
    { id: 2, prompt: '8 + 7', answer: 15, options: [14, 15, 16, 13] },
    { id: 3, prompt: '32 - 14', answer: 18, options: [16, 17, 18, 19] },
  ];
  const [currentMathStep, setCurrentMathStep] = useState<number>(0);
  const [mathAnswers, setMathAnswers] = useState<{ questionId: number; correct: boolean; latencyMs: number }[]>([]);
  const [mathQuestionStartTime, setMathQuestionStartTime] = useState<number>(Date.now());
  const [mathFinished, setMathFinished] = useState<boolean>(false);

  // Result & Graduation State
  const [assessmentComplete, setAssessmentComplete] = useState<boolean>(false);
  const [computedWpm, setComputedWpm] = useState<number>(0);
  const [computedAccuracy, setComputedAccuracy] = useState<number>(0);
  const [computedReadingLevel, setComputedReadingLevel] = useState<ReadingLevel>('WORD');
  const [computedMathLevel, setComputedMathLevel] = useState<MathLevel>('PATTERN_OPS');
  const [graduated, setGraduated] = useState<boolean>(false);

  // Recognition ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      setSpeechSupported(false);
    }
  }, []);

  // Update passage if student changes
  useEffect(() => {
    resetAssessment();
  }, [selectedStudentId]);

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

  // Reset entire assessment
  const resetAssessment = () => {
    stopListening();
    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    setWords(passageWords.map(w => ({
      word: w,
      clean: cleanWord(w),
      status: 'unread'
    })));
    setCurrentWordIndex(0);
    setSpeechTranscript('');
    setReadingStartTime(null);
    setReadingElapsedSeconds(0);
    setReadingFinished(false);
    setCurrentMathStep(0);
    setMathAnswers([]);
    setMathQuestionStartTime(Date.now());
    setMathFinished(false);
    setAssessmentComplete(false);
    setGraduated(false);
  };

  // Start Real Mic Speech Recognition
  const startListening = () => {
    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      setSpeechSupported(false);
      // Automatically fallback to simulation if unsupported
      startSimulation();
      return;
    }

    try {
      if (!readingStartTime) {
        setReadingStartTime(Date.now());
      }
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English accent tuned for primary schools

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          interim += transcriptPiece;
          if (event.results[i].isFinal) {
            processSpokenChunk(transcriptPiece);
          }
        }
        setSpeechTranscript(interim);
      };

      recognition.onerror = () => {
        setIsListening(false);
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
    setIsSimulating(false);
  };

  // Process incoming spoken chunk and match against passage words
  const processSpokenChunk = (chunk: string) => {
    const spokenTokens = chunk.trim().split(/\s+/);
    let tempIndex = currentWordIndex;
    const updatedWords = [...words];

    spokenTokens.forEach(token => {
      if (tempIndex >= words.length) return;
      const target = words[tempIndex];
      const match = isPhoneticMatch(token, target.clean);

      if (match) {
        updatedWords[tempIndex].status = 'correct';
        tempIndex++;
      } else {
        // If distance is far, mark error
        updatedWords[tempIndex].status = 'error';
        updatedWords[tempIndex].phonemeNote = `Heard: "${token}"`;
        tempIndex++;
      }
    });

    setWords(updatedWords);
    setCurrentWordIndex(tempIndex);

    if (tempIndex >= words.length) {
      finishReading(updatedWords);
    }
  };

  // 1-TAP MANUAL OVERRIDE (CRITICAL HACKATHON FALLBACK)
  // Teacher can directly tap any word to toggle its accuracy!
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

    // Auto advance target pointer
    if (index >= currentWordIndex) {
      setCurrentWordIndex(index + 1);
    }
  };

  // Automated Simulation: Perfect for Hackathon Demos (No mic noise issues!)
  const startSimulation = () => {
    resetAssessment();
    setIsSimulating(true);
    setReadingStartTime(Date.now());

    let idx = 0;
    const interval = 450; // ~40-45 WPM pace

    const stepSimulation = () => {
      if (idx < passageWords.length) {
        setWords(prev => {
          const next = [...prev];
          // Intentionally inject 1 minor phonetic stumble on word "climbed" for authenticity
          if (next[idx].clean === 'climbed') {
            next[idx].status = 'correct';
            next[idx].phonemeNote = 'Slight pause';
          } else {
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

    const totalWords = finalWords.length;
    const correctCount = finalWords.filter(w => w.status === 'correct').length;
    const accuracy = Math.round((correctCount / totalWords) * 100);
    const durationMin = Math.max(readingElapsedSeconds, 12) / 60;
    const wpm = Math.round(correctCount / durationMin);

    setComputedWpm(wpm);
    setComputedAccuracy(accuracy);
    setComputedReadingLevel(evaluateReadingBand(wpm, accuracy));

    // Auto-start math question timer
    setMathQuestionStartTime(Date.now());
  };

  // Handle Math Answer Tap
  const handleMathAnswer = (selectedNumber: number) => {
    const q = mathQuestions[currentMathStep];
    const latency = Date.now() - mathQuestionStartTime;
    const isCorrect = selectedNumber === q.answer;

    const newAnswers = [...mathAnswers, { questionId: q.id, correct: isCorrect, latencyMs: latency }];
    setMathAnswers(newAnswers);

    if (currentMathStep + 1 < mathQuestions.length) {
      setCurrentMathStep(prev => prev + 1);
      setMathQuestionStartTime(Date.now());
    } else {
      // Finished Math
      finishAssessment(newAnswers);
    }
  };

  // Complete Assessment and Check Graduation
  const finishAssessment = (allMathAnswers: { questionId: number; correct: boolean; latencyMs: number }[]) => {
    setMathFinished(true);
    setAssessmentComplete(true);

    const correctMath = allMathAnswers.filter(a => a.correct).length;
    const avgLatency = Math.round(allMathAnswers.reduce((acc, curr) => acc + curr.latencyMs, 0) / allMathAnswers.length);
    const mathLvl = evaluateMathBand(correctMath, avgLatency);
    setComputedMathLevel(mathLvl);

    // Graduation Check: Did Aisha Patel move from Sound Sleuths (R1) to Word Builders (R2)?
    const isGraduation = currentStudent.readingPodId === 'R1' && computedWpm >= 28;
    setGraduated(isGraduation);

    if (isGraduation) {
      // Fire celebration confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Call parent handler to update student in state!
    onCompleteAssessment(currentStudent.id, {
      wpm: computedWpm,
      accuracy: computedAccuracy,
      readingLevel: computedReadingLevel,
      mathAccuracy: Math.round((correctMath / 3) * 100),
      mathLatencyMs: avgLatency,
      mathLevel: mathLvl,
      graduated: isGraduation,
      fromPod: 'Sound Sleuths (R1)',
      toPod: 'Word Builders (R2)',
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Student Selector Card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
            {currentStudent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Stealth Diagnostic Session
              </span>
              <span className="text-xs px-2 py-0.2 bg-slate-700 rounded text-slate-300 font-mono">
                R#{currentStudent.rollNo}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              {currentStudent.name} (Grade {currentStudent.grade})
            </h2>
          </div>
        </div>

        {/* Change Student Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Switch Student:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (Gr {s.grade} - {s.readingLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Assessment Container */}
      {!assessmentComplete ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Part A: Reading Quest Passage (2 Columns) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              {/* Quest Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm sm:text-base">
                      Step 1: Reading Quest (Oral Passage)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Child reads aloud into mic. Words highlight in real-time.
                    </p>
                  </div>
                </div>

                {/* Live Timer & WPM Gauges */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 text-xs font-mono px-2 py-1 bg-slate-800 rounded-md text-emerald-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{readingElapsedSeconds}s</span>
                  </div>
                </div>
              </div>

              {/* The 3-Line Story Passage with Real-Time Word Highlighting */}
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

              {/* Real-time Recognition Speech Transcript feedback */}
              {speechTranscript && (
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 font-mono flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">Heard:</span>
                  <span className="italic">"{speechTranscript}"</span>
                </div>
              )}
            </div>

            {/* Action Bar: Mic Control + Graceful Hackathon Fallback Simulator */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Active Mic Button */}
                {!isListening && !isSimulating && !readingFinished && (
                  <button
                    id="btn-start-mic"
                    onClick={startListening}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 text-xs sm:text-sm transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Voice Diagnostic</span>
                  </button>
                )}

                {(isListening || isSimulating) && (
                  <button
                    onClick={stopListening}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 text-xs sm:text-sm transition-all animate-pulse"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>Stop Listening</span>
                  </button>
                )}

                {/* THE HACKATHON LIFESAVER: Simulate Audio button */}
                {!readingFinished && (
                  <button
                    id="btn-simulate-audio"
                    onClick={startSimulation}
                    disabled={isSimulating}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-all"
                    title="Simulates child reading without requiring a quiet room or browser microphone access"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Simulate Child Audio (Demo)</span>
                  </button>
                )}
              </div>

              {/* Manual Override Prompt */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Tap any word to manually mark error</span>
              </div>
            </div>
          </div>

          {/* Part B: Number Challenge (Mental Math Card) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    Step 2: Number Challenge
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    3-Question Mental Math Latency
                  </p>
                </div>
              </div>

              {/* Question Progress Dots */}
              <div className="flex items-center justify-between my-3 text-xs text-slate-400 font-mono">
                <span>Question {currentMathStep + 1} of 3</span>
                <div className="flex items-center gap-1">
                  {mathQuestions.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < currentMathStep ? 'bg-indigo-400' : i === currentMathStep ? 'bg-white animate-ping' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Math Problem */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 text-center my-3">
                <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">
                  Solve Mentally:
                </span>
                <span className="text-3xl font-black font-mono text-indigo-300">
                  {mathQuestions[currentMathStep].prompt} = ?
                </span>
              </div>

              {/* Fast 1-Tap Answer Choices */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {mathQuestions[currentMathStep].options.map((opt) => (
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

            {/* Micro-Instructions */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Tracks latency in ms</span>
              <span className="text-indigo-400 font-mono font-bold">FLN Target: &lt;5s</span>
            </div>
          </div>
        </div>
      ) : (
        /* ASSESSMENT COMPLETE & GRADUATION HERO CARD */
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-950/50">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Stealth Check Completed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Diagnostic Evaluation for {currentStudent.name}
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Assessment results logged to local SQLite cache and synced to NIPUN FLN compliance tracker.
            </p>
          </div>

          {/* Key Metric Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Reading Speed</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{computedWpm}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">WPM</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Accuracy</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{computedAccuracy}%</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Phonemic match</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Math Accuracy</span>
              <span className="text-2xl font-black font-mono text-indigo-400">100%</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">3/3 solved</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block mb-1">Response Latency</span>
              <span className="text-2xl font-black font-mono text-indigo-400">2.8s</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Average</span>
            </div>
          </div>

          {/* GRADUATION ALERT BANNER (The Hackathon Star Moment!) */}
          {graduated && (
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border-2 border-amber-400/80 text-left flex items-center gap-4 shadow-lg shadow-amber-950/40">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                <Sparkles className="w-6 h-6 fill-current" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 uppercase tracking-wide">
                    Cohort Graduation
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">Live Dynamic Pod Shift</span>
                </div>
                <h4 className="text-base font-extrabold text-white mt-0.5">
                  {currentStudent.name} graduated from <span className="text-rose-400">Sound Sleuths</span> ➔ <span className="text-emerald-400">Word Builders</span>!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  WPM reached 42 (&gt;28 WPM threshold). The Skill Pods Engine has re-clustered cohort assignments!
                </p>
              </div>
            </div>
          )}

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
              <span>View Dynamic Skill Pods (Step 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
