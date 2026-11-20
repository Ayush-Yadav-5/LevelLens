# LevelLens Version 2 Architecture & Changelog Blueprint

> **Vision:** Complete elimination of external cloud AI (Google Gemini), transitioning to a **100% offline, zero-cost, privacy-first, on-device intelligence architecture** powered by local machine learning, multi-topic FLN mathematics, and an asymptotic psychometric learning curve engine.

---

## 1. Executive Summary: The Version 2 Paradigm Shift

| Vector | Version 1 (Current Prototype) | Version 2 (Production Edge AI) |
| :--- | :--- | :--- |
| **AI Backbone** | Google Gemini 3.5 / 3.6 API via Cloud Proxy | **100% Local Intelligence** (Quantized SLM + Rule Engine) |
| **API Costs & Quotas** | Subject to rate limits (429), token bills, & RTT latency | **$0.00 / month forever**; zero external API dependencies |
| **Connectivity** | Requires internet for test generation & grading | **100% Offline-First** (works in remote rural schools) |
| **Math Scope** | Single/double-digit addition and subtraction | **7 Core FLN Math Pillars** (mult, div, fractions, place value, etc.) |
| **Scoring Model** | Discrete categorical levels (`PRE_WORD`, `WORD`, etc.) | **Asymptotic ML Learning Curve ($0$ to $100$)** with EMA damping |
| **Pod Placement** | Static / manual teacher grouping | **Autonomous Dynamic Pod Reassignment** with hysteresis |
| **Voice Processing** | Web Speech API fallback + simulated audio | **Edge Acoustic Phoneme Alignment** (100% private, on-device) |
| **Data Engine** | Hardcoded prompts | **Open-Web Continual Learning Pipeline** (NCERT/StoryWeaver) |

---

## 2. Dynamic, Non-Duplicative Test Generation Engine

### Problem in V1
Repeatedly prompting a general LLM with short CVC instructions often yields predictable, nursery-style cliches ("The fat cat sat on a mat").

### Version 2 Solution: High-Entropy Multi-Layered Procedural Generator
To guarantee tests never repeat over 12+ weeks while keeping storage under **15 MB**, Version 2 implements a two-tier hybrid generator:

1. **Deterministic Phonics Grammar Engine (Primary / Ultra-Fast):**
   * **Context-Free Grammar (CFG)** that dynamically maps Indian cultural themes (village markets, school gardens, train journeys, festivals, animals).
   * **Phonetic Matrix:** Combinatorial slots combining 18 onsets, 5 short/long vowels, and 16 codas with grammatical connective tissue.
   * **Mathematical Variety:** $18 \times 5 \times 16 \times 40 \text{ narrative templates} = > 576,000$ unique phonetic sentence permutations generated in **< 2 milliseconds**.
2. **Anti-Repetition LRU Memory Cache:**
   * Every student's record maintains a lightweight local rolling vector of the last 150 tested words and story themes.
   * If a newly composed passage shares $> 25\%$ bigram similarity with an assessment taken in the past 60 days, it is instantly re-seeded.
3. **Local Quantized SLM (Secondary / Offline Edge):**
   * A quantized 4-bit **SmolLM2 (360M / 1.7B)** or **Qwen 2.5 (0.5B)** running locally in-browser via WebAssembly / ONNX Runtime.
   * Generates expressive, rich multi-sentence narratives with variable temperature ($T = 0.85$) and top-$p$ nucleus sampling, ensuring fresh vocabulary and storylines every session.

---

## 3. Comprehensive Multi-Topic FLN Mathematics Curriculum

Version 2 expands far beyond basic addition and subtraction to cover the full National Education Policy (NEP) & NIPUN Bharat primary standards:

```
                                  FLN MATH ROADMAP
  ┌───────────────────────┬───────────────────────┬───────────────────────┐
  │   Foundational (G1)   │   Preparatory (G2-3)  │    Advanced (G4-5)    │
  ├───────────────────────┼───────────────────────┼───────────────────────┤
  │ 1. Place Value        │ 3. Skip Count & Mult  │ 6. Fractions & Halves │
  │ 2. Number Bonds <= 20 │ 4. Equal Share & Div  │ 7. Time & Measurement │
  │                       │ 5. Pattern Sequences  │ 8. Real-World Word Qs │
  └───────────────────────┴───────────────────────┴───────────────────────┘
```

### Detailed Topic Specifications:

1. **Place Value & Number Sense:**
   * Tens and Ones decomposition ($47 = 4 \text{ tens} + 7 \text{ ones}$).
   * Comparing 2-digit and 3-digit magnitudes ($>, <, =$ using visual base-10 block icons).
2. **Mental Multiplication & Arrays:**
   * Repeated addition concepts ($3 \times 4 = 4 + 4 + 4$).
   * Array visualizations (e.g., 3 rows of 5 dots) and skip counting ($2, 4, 6, 8 \dots$).
3. **Equal Sharing & Division Foundations:**
   * Grouping mechanics: "Share 12 mangoes equally among 3 children. How many does each child get?"
   * Basic inverse operations ($15 \div 5 = ?$ because $5 \times 3 = 15$).
4. **Fractions & Proportional Reasoning:**
   * Identification of unit fractions: $\frac{1}{2}$, $\frac{1}{3}$, $\frac{1}{4}$ using geometric pizza/bar slices.
   * Equivalent visual parts and halves comparison.
5. **Pattern Recognition & Sequences:**
   * Arithmetic leaps ($5, 10, 15, \underline{\hspace{0.5cm}}, 25$).
   * Alternating visual/numerical rules ($2, 4, 3, 5, 4, 6, \underline{\hspace{0.5cm}}$).
6. **Time, Currency & Measurement:**
   * Reading analog clock intervals (hours, half-hours, 15-minute quarters).
   * Indian Currency calculations (making ₹50 with ₹10 and ₹20 notes).
   * Standard metric comparisons (cm vs. m, grams vs. kilograms).
7. **Contextual Word Challenges:**
   * Single-sentence, age-appropriate story problems testing situational logic rather than rote calculation.

---

## 4. On-Device Voice, Latency Analysis & Psychometric Scoring

### Local Acoustic & Voice Engine
* **No Audio Sent to Cloud:** Eliminates latency, server costs, and privacy liabilities (compliant with India's Digital Personal Data Protection Act / DPDP).
* **High-Accuracy Edge Phonetic Alignment:**
  * Uses the browser-native `webkitSpeechRecognition` combined with a local **Levenshtein Word-Error-Rate (WER)** and phonetic distance algorithm (Soundex / Metaphone).
  * Measures precise timestamps per word to calculate instantaneous **Words Per Minute (WPM)** and hesitation pauses ($> 2.5\text{s}$ pause triggers automatic phonetic hurdle flagging).

### The Asymptotic Learning Curve Metric ($0$ to $100$)
Rather than jumping erratically from a single test, the student's mastery score evolves via an **Exponential Moving Average with Asymptotic Damping**:

$$\text{Score}_{t} = \text{Score}_{t-1} + \alpha \cdot (\text{TestPerformance} - \text{Score}_{t-1}) \cdot \left(1 - \frac{\text{Score}_{t-1}}{100}\right)^\gamma$$

* **$\text{Score}_{t}$**: New updated student master score ($0 \le \text{Score} \le 100$).
* **$\text{Score}_{t-1}$**: Prior baseline score.
* **$\alpha$ (Learning Rate, e.g., $0.18$)**: Dampens volatility. One perfect score ($100\%$) moves a student from $50$ to $\approx 59$, never directly to $100$.
* **$\left(1 - \frac{\text{Score}}{100}\right)^\gamma$**: The **Asymptotic Plateau Factor**.
  * Moving from $20 \rightarrow 40$ requires fewer assessments because foundational gains are rapid.
  * Moving from $85 \rightarrow 95$ requires sustained, repeated high-fluency demonstrations, mirroring biological and machine learning skill acquisition curves.

### Autonomous Dynamic Pod Reassignment with Hysteresis
To prevent student discouragement from frequent back-and-forth movement across pods:

| Pod Tier | Score Band | Entrance Threshold | Demotion Buffer | Focus Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Pod 1: Phonics Seeds** | $0 - 30$ | Default | N/A | CVC phonics, single-digit bonds $\le 10$ |
| **Pod 2: Word Builders** | $31 - 60$ | Crosses $\ge 33$ | Drops $< 27$ | Sight words, digraphs, 2-digit basic ops |
| **Pod 3: Sentence Crafters** | $61 - 85$ | Crosses $\ge 64$ | Drops $< 57$ | Multi-clause sentences, multiplication, fractions |
| **Pod 4: Fluency Champions** | $86 - 100$ | Crosses $\ge 89$ | Drops $< 82$ | Expressive reading, word problems, division |

*The $3$-point buffer prevents a student scoring $61$ on Monday and $59$ on Friday from bouncing between pods.*

---

## 5. Complete Elimination of Google Gemini

### Step-by-Step Replacement Architecture:
1. **Frontend Decoupling:**
   * Replace `callGeminiWithFallback` in [`src/services/aiService.ts`](file:///c:/Users/Ayush%20Yadav/Desktop/Startup-LevelLens/LevelLens/src/services/aiService.ts) with the **Local Procedural Engine** for tests and deterministic rule-based generators for reports.
2. **Serverless Cleanup:**
   * Remove [`api/gemini.ts`](file:///c:/Users/Ayush%20Yadav/Desktop/Startup-LevelLens/LevelLens/api/gemini.ts) and the `gemini-dev-proxy` plugin from [`vite.config.ts`](file:///c:/Users/Ayush%20Yadav/Desktop/Startup-LevelLens/LevelLens/vite.config.ts).
   * Remove `@google/genai` from `package.json`.
3. **Local Report Synthesizer:**
   * Replace Gemini's text generation for teacher/parent summaries with an **Extractive Diagnostic Matrix**:
     * Directly inserts specific observed mispronounced phonemes, WPM trends, and math latency figures into structured, high-clarity pedagogical recommendations.

---

## 6. Custom Machine Learning Model Powered by Open-Web Datasets

Rather than relying on manually curated internal data, Version 2 utilizes an automated ingestion pipeline that sources public educational corpora:

### 1. Open Web Ingestion Targets:
* **Pratham StoryWeaver:** Over 50,000 open-licensed (CC-BY 4.0) graded multilingual children's storybooks in English and 14 Indian languages.
* **NCERT & State SCERT Open Textbooks:** Grade 1 to 5 foundational literacy primers and graded word frequency lists.
* **HuggingFace Educational Datasets:** `TinyStories`, `GSM8K-Elementary`, `phoneme-tokenizer` datasets.

### 2. Continual Learning & Self-Improvement Architecture:
```
  ┌───────────────────────────────────────────────────────────┐
  │                 Open Web Data Crawler                     │
  │     (StoryWeaver + NCERT + HuggingFace Educational)       │
  └─────────────────────────────┬─────────────────────────────┘
                                │ Graded Text & Phonics
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │       Base Small Language Model (Qwen 2.5 / SmolLM2)      │
  │                 Fine-Tuned with LoRA / QLoRA              │
  └─────────────────────────────┬─────────────────────────────┘
                                │ Export to ONNX / GGUF
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │             LevelLens In-Browser Inference                │
  │           (ONNX Runtime Web / Transformers.js)            │
  └─────────────────────────────┬─────────────────────────────┘
                                │ Student Interaction Telemetry
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │            Continual Reinforcement Loop (DPO)             │
  │    - Passages with unnatural disfluency are penalized     │
  │    - Questions with optimal discrimination are reinforced │
  └───────────────────────────────────────────────────────────┘
```

* **Direct Preference Optimization (DPO):** Telemetry from assessments (e.g. if students consistently stumble on an unnatural phrase across multiple schools) feeds into a reward model that adjusts passage generation weights.
* **Edge Deployment:** The trained model is quantized into an ultra-lean ONNX or WebGPU bundle cached permanently in the teacher's browser via IndexedDB.

---

## 7. Version 2 Implementation Phases

* [ ] **Phase 2.1:** Implement the 7-pillar FLN Math question generator and local Asymptotic Learning Curve ($0-100$) scoring algorithm.
* [ ] **Phase 2.2:** Build the High-Entropy Procedural Story Generator and dynamic pod reassignment with hysteresis.
* [ ] **Phase 2.3:** Integrate on-device Speech & Audio Analysis (local WER and WPM calculation).
* [ ] **Phase 2.4:** Deprecate Gemini API, serverless endpoints, and external environment variables.
* [ ] **Phase 2.5:** Deploy the Open-Web continual learning crawler and quantized edge ML model.
