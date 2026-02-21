import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, History, Loader2, AlertCircle, Terminal, CheckCircle2, Download, Video, Settings2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import puter from "@heyputer/puter.js";

const WORD_TYPES = [
  "Relationship", "Family", "Friendship", "Romance", "Work/Career", "Business", "Finance", "Economics", "Law/Legal", "Government/Politics", "Education", "Science", "Technology", "Health", "Medicine", "Fitness", "Nutrition", "Psychology", "Mental health", "Religion", "Spirituality", "Ethics", "Philosophy", "Art", "Music", "Literature", "Film/TV", "Media/Journalism", "Entertainment", "Sports", "Travel", "Leisure", "Food/Culinary", "Fashion", "Beauty", "Home/Housing", "Real estate", "Environment", "Nature/Wildlife", "Agriculture", "Transportation", "Safety", "Danger/Risk", "Security (physical/cyber)", "Emergency/Disaster", "History", "Culture", "Language/Linguistics", "Society/Social issues", "Demographics", "Community", "Parenting", "Childhood", "Aging/Elder care", "Hobbies", "Crafts/DIY", "Gardening", "Retail/Shopping", "Marketing/Advertising", "Sales", "Customer service", "Manufacturing/Industry", "Energy/Utilities", "Finance products (banking, insurance, investing)", "Cryptocurrency/Blockchain", "Realities (urban/rural)", "Infrastructure", "Urban planning", "Religion-related (sects, denominations)"
];

interface WordData {
  word: string;
  banglaMeaning: string;
  partOfSpeech: string;
  example: string;
  exampleBangla: string;
}

interface AutomationRecord {
  id: string;
  timestamp: string;
  data: WordData[];
}

const VideoAutomation = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"start" | "records">("start");
  const [logs, setLogs] = useState<{ message: string; type: "info" | "success" | "error" | "process" }[]>([]);
  const [rawLogs, setRawLogs] = useState<{ label: string; content: any }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<WordData[] | null>(null);
  const [records, setRecords] = useState<AutomationRecord[]>([]);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Settings State
  const [selectedWordTypes, setSelectedWordTypes] = useState<string[]>([]);
  const [isWordTypeModalOpen, setIsWordTypeModalOpen] = useState(false);
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [isRawLogsExpanded, setIsRawLogsExpanded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const savedRecords = localStorage.getItem("video_automation_records");
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  const addLog = (message: string, type: "info" | "success" | "error" | "process" = "info") => {
    setLogs((prev) => [...prev, { message, type }]);
  };

  const fetchOpenRouter = async (prompt: string) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not found in environment.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://abdullah.ami.bd",
        "X-Title": "Abdullah Portfolio Video Automation",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-vl-30b-a3b-thinking",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const parseJsonFromAi = (text: string) => {
    try {
      const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch) return JSON.parse(markdownMatch[1].trim());
      const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/{[\s\S]*}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0].trim());
      return JSON.parse(text.trim());
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Failed to parse AI response as JSON.");
    }
  };

  const fetchDictionary = async (word: string) => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) return null;
      const data = await response.json();
      const entry = data[0];
      const meaning = entry.meanings[0];
      const definition = meaning.definitions[0];

      return {
        word: entry.word,
        definition: definition.definition,
        partOfSpeech: meaning.partOfSpeech,
        example: definition.example || ""
      };
    } catch (e) {
      return null;
    }
  };

  const handleStart = async () => {
    if (isProcessing) return;
    if (selectedWordTypes.length === 0) {
      addLog("Please select at least one word type.", "error");
      setIsWordTypeModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setRawLogs([]);
    setCurrentResult(null);
    setVideoUrl(null);
    addLog("Initializing video automation sequence...", "process");

    try {
      addLog("Step 1: Requesting 10 unique words from AI (Qwen)...", "info");
      const firstPrompt = `Return ONLY a valid JSON array of 10 unique English words (C1 and C2 levels) related to: ${selectedWordTypes.join(', ')}.
NO introductory or concluding text. NO conversational filler.
Example format: ["word1", "word2", ..., "word10"]`;

      setRawLogs(prev => [...prev, { label: "STEP_1_PROMPT", content: firstPrompt }]);

      const wordsResponse = await fetchOpenRouter(firstPrompt);
      addLog("Words received from AI.", "success");

      setRawLogs(prev => [...prev, { label: "STEP_1_RAW_RESPONSE", content: wordsResponse }]);

      const wordsList = parseJsonFromAi(wordsResponse);
      const wordsArray = Array.isArray(wordsList) ? wordsList : wordsList.words || [];

      if (!wordsArray.length) throw new Error("Received empty word list from AI.");

      addLog(`Extracted ${wordsArray.length} words: ${wordsArray.join(", ")}`, "info");

      addLog("Step 2: Fetching data from Dictionary API...", "info");
      const enrichedWords = [];
      for (const word of wordsArray) {
        addLog(`Processing word: ${word}...`, "process");
        const data = await fetchDictionary(word);
        if (data) {
          enrichedWords.push(data);
        } else {
          addLog(`Could not find data for "${word}", will let AI generate details.`, "info");
          enrichedWords.push({
            word,
            definition: "",
            partOfSpeech: "",
            example: ""
          });
        }
      }

      if (enrichedWords.length === 0) throw new Error("Could not fetch data for any of the words.");

      setRawLogs(prev => [...prev, { label: "STEP_2_ENRICHED_DATA", content: enrichedWords }]);

      addLog("Step 3: Translating and refining with AI...", "info");
      const secondPrompt = `Return ONLY a valid JSON array of objects. NO introductory or concluding text. NO conversational filler.

Each object in the array must have these EXACT keys:
- "partOfSpeech": (string) The part of speech in English.
- "word": (string) The English word provided.
- "banglaMeaning": (string) A refined Bangla meaning/definition (not just a literal translation).
- "example": (string) The English use example sentence. IF the input data has an example, you can use or refine it. IF there is no example provided, you MUST create one yourself.
- "exampleBangla": (string) Bangla translation of the example sentence.

Special Instruction: IF there is no example of the word provided to you, then make one yourself and attach the bangla translation.

Input Data: ${JSON.stringify(enrichedWords)}`;

      setRawLogs(prev => [...prev, { label: "STEP_3_PROMPT", content: secondPrompt }]);

      const translationResponse = await fetchOpenRouter(secondPrompt);
      addLog("Translation received from AI.", "success");

      setRawLogs(prev => [...prev, { label: "STEP_3_RAW_RESPONSE", content: translationResponse }]);

      const finalJson = parseJsonFromAi(translationResponse);

      setRawLogs(prev => [...prev, { label: "STEP_3_PARSED_JSON", content: finalJson }]);

      const formattedResult: WordData[] = finalJson.map((item: any) => ({
        word: item.word || item.english_word || "",
        banglaMeaning: item.banglaMeaning || item.bangla_meaning || item.meaning_bangla || item.meaning || "",
        partOfSpeech: item.partOfSpeech || item.part_of_speech || item.pos || "",
        example: item.example || item.use_example || item.example_en || "",
        exampleBangla: item.exampleBangla || item.bangla_translation_of_example || item.example_bn || item.example_bangla || ""
      }));

      setRawLogs(prev => [...prev, { label: "FINAL_FORMATTED_RESULT", content: formattedResult }]);

      setCurrentResult(formattedResult);
      addLog("Automation sequence completed successfully!", "success");

      const newRecord: AutomationRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: formattedResult
      };
      const updatedRecords = [newRecord, ...records];
      setRecords(updatedRecords);
      localStorage.setItem("video_automation_records", JSON.stringify(updatedRecords));

    } catch (error: any) {
      addLog(`ERROR: ${error.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleWordType = (type: string) => {
    setSelectedWordTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const drawJustifiedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    alpha: number = 1
  ) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    ctx.save();
    ctx.globalAlpha = alpha;
    let currentY = y;
    lines.forEach((line, index) => {
      const isLastLine = index === lines.length - 1;
      const lineWords = line.split(' ');

      if (isLastLine || lineWords.length === 1) {
        ctx.textAlign = 'center';
        ctx.fillText(line, x + maxWidth / 2, currentY);
      } else {
        const totalWordsWidth = lineWords.reduce((acc, w) => acc + ctx.measureText(w).width, 0);
        const totalSpacing = maxWidth - totalWordsWidth;
        const spacingPerWord = totalSpacing / (lineWords.length - 1);

        let currentX = x;
        ctx.textAlign = 'left';
        lineWords.forEach((word) => {
          ctx.fillText(word, currentX, currentY);
          currentX += ctx.measureText(word).width + spacingPerWord;
        });
      }
      currentY += lineHeight;
    });
    ctx.restore();
    return currentY;
  };

  const generateVideo = async () => {
    if (!currentResult || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    addLog("Starting video generation process...", "process");

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Setup Audio
      const audioCtx = new AudioContext();
      const destination = audioCtx.createMediaStreamDestination();

      // Setup MediaRecorder
      const stream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);

      const mimeType = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ].find(m => MediaRecorder.isTypeSupported(m));

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType || undefined
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      const videoPromise = new Promise<string>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(URL.createObjectURL(blob));
        };
      });

      const bgImg = new Image();
      bgImg.src = "/reel-bg.png";
      await new Promise((res) => { bgImg.onload = res; bgImg.onerror = res; });

      // Ensure fonts are loaded
      await Promise.all([
        document.fonts.load('bold 90px Inter'),
        document.fonts.load('60px Kalpurush'),
        document.fonts.load('50px Inter'),
        document.fonts.load('bold 40px "JetBrains Mono"')
      ]);

      // 1. Pre-fetch all audio segments to avoid choppiness during recording
      addLog("Step 1: Pre-fetching all audio segments...", "process");
      const allAudioSegments: { wordIdx: number; type: string; audio: HTMLAudioElement | null }[] = [];

      for (let i = 0; i < currentResult.length; i++) {
        const item = currentResult[i];
        const parts = [
          { text: item.word, lang: "en-US", type: "word" },
          { text: item.banglaMeaning, lang: "bn-IN", type: "meaning" },
          { text: item.example, lang: "en-US", type: "example" },
          { text: item.exampleBangla, lang: "bn-IN", type: "translation" }
        ];

        for (const part of parts) {
          addLog(`Fetching audio for: ${item.word} (${part.type})...`, "process");
          try {
            // @ts-ignore
            const audio = await puter.ai.txt2speech(part.text, part.lang);
          if (audio) {
            audio.crossOrigin = "anonymous";
            // Wait for audio metadata to load to ensure duration is available if needed
            await new Promise((res) => {
              audio.onloadedmetadata = res;
              // Timeout as fallback
              setTimeout(res, 1000);
            });
          }
            allAudioSegments.push({ wordIdx: i, type: part.type, audio });
          } catch (err) {
            console.error("TTS fetch error", err);
            allAudioSegments.push({ wordIdx: i, type: part.type, audio: null });
          }
        }
      }

    const renderFrame = (item: WordData, visibleParts: string[]) => {
      // Clear and Draw BG
      ctx.clearRect(0, 0, 1080, 1920);
      if (bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, 1080, 1920);
      } else {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, 1080, 1920);
      }

      // Draw Text Elements
      let currentY = 500;

      if (visibleParts.includes("word")) {
        ctx.fillStyle = "black";
        ctx.font = "bold 90px Inter";
        ctx.textAlign = "center";
        ctx.fillText(item.word, 540, currentY);
        currentY += 120;
      }

      if (visibleParts.includes("meaning")) {
        ctx.fillStyle = "black";
        ctx.font = "60px Kalpurush";
        ctx.textAlign = "center";
        ctx.fillText(item.banglaMeaning, 540, currentY);
        currentY += 200;
      }

      if (visibleParts.includes("example")) {
        ctx.fillStyle = "black";
        ctx.font = "italic 45px Inter";
        currentY = drawJustifiedText(ctx, `"${item.example}"`, 140, currentY, 800, 60);
        currentY += 40;
      }

      if (visibleParts.includes("translation")) {
        ctx.fillStyle = "black";
        ctx.font = "40px Kalpurush";
        currentY = drawJustifiedText(ctx, item.exampleBangla, 140, currentY, 800, 55);
      }
    };

      // 2. Start recording
      addLog("Step 2: Starting recording sequence...", "success");
      recorder.start();

      for (let i = 0; i < currentResult.length; i++) {
        const item = currentResult[i];
        addLog(`Recording word ${i + 1}/${currentResult.length}: ${item.word}`, "info");

        const visibleParts: string[] = [];
        const wordSegments = allAudioSegments.filter(s => s.wordIdx === i);

        for (const segment of wordSegments) {
          visibleParts.push(segment.type);

          if (segment.audio) {
            const audio = segment.audio;
            const audioSource = audioCtx.createMediaElementSource(audio);
            audioSource.connect(destination);
            audioSource.connect(audioCtx.destination);

            await new Promise<void>((res) => {
            let isDone = false;
              audio.onended = () => {
              if (isDone) return;
              isDone = true;
                audioSource.disconnect();
                res();
              };

            const loop = () => {
              if (isDone) return;
              renderFrame(item, visibleParts);
              requestAnimationFrame(loop);
              };

              audio.play().catch(e => {
                console.error("Audio play failed", e);
              if (!isDone) {
                isDone = true;
                res();
              }
              });
            requestAnimationFrame(loop);

            // Safety timeout if audio fails to end
            setTimeout(() => {
              if (!isDone) {
                isDone = true;
                audio.pause();
                audioSource.disconnect();
                res();
              }
            }, (audio.duration || 5) * 1000 + 1000);
            });
          } else {
            // Fallback if audio failed to load
          addLog(`Audio missing for ${item.word} (${segment.type}), using fallback delay.`, "error");
          const startTime = Date.now();
          const duration = 2000;
          await new Promise<void>((res) => {
            const loop = () => {
              if (Date.now() - startTime >= duration) {
                res();
                return;
              }
              renderFrame(item, visibleParts);
              requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
          });
          }
        }
        // Short gap between words
      const gapStart = Date.now();
      await new Promise<void>((res) => {
        const loop = () => {
          if (Date.now() - gapStart >= 1000) {
            res();
            return;
          }
          renderFrame(item, ["word", "meaning", "example", "translation"]);
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
      }

      recorder.stop();
      const finalUrl = await videoPromise;
      setVideoUrl(finalUrl);
      addLog("Video generated successfully!", "success");

    } catch (err: any) {
      addLog(`Generation error: ${err.message}`, "error");
      console.error(err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <div className="max-w-4xl mx-auto pt-6 md:pt-20 px-4">
        <header className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate("/")}
            className="p-2.5 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group shrink-0"
          >
            <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-5xl font-bold font-mono truncate gradient-text">
              Video Automation
            </h1>
            <p className="text-muted-foreground font-mono text-[10px] md:text-sm truncate">
              {"// Educational reel generation system"}
            </p>
          </div>
        </header>

        {/* Settings Bar */}
        {view === "start" && (
          <div className="mb-8 p-4 rounded-2xl bg-surface-1 border border-border space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Settings2 size={18} className="text-primary" />
                <span className="text-sm font-mono font-bold uppercase tracking-wider">Automation Settings</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Word Type Selector Button */}
                <button
                  onClick={() => setIsWordTypeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border hover:border-primary/50 transition-all active:scale-95"
                >
                  <span className="text-xs font-mono font-bold uppercase">
                    Word Types ({selectedWordTypes.length || "All"})
                  </span>
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {selectedWordTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                {selectedWordTypes.map(type => (
                  <span
                    key={type}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary"
                  >
                    {type}
                    <button onClick={() => toggleWordType(type)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedWordTypes([])}
                  className="text-[10px] font-mono text-destructive hover:underline ml-2"
                >
                  CLEAR_ALL
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => {
              setView("start");
              handleStart();
            }}
            disabled={isProcessing}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg",
              view === "start" && !isProcessing
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                : "bg-surface-1 border border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
            Start Automation
          </button>
          <button
            onClick={() => setView("records")}
            disabled={isProcessing}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg",
              view === "records"
                ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent/20"
                : "bg-surface-1 border border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            <History size={20} />
            View Records
          </button>
        </div>

        {/* Live Logs */}
        {logs.length > 0 && view === "start" && (
          <div className="terminal-window mb-6">
            <div
              className="terminal-header flex items-center justify-between cursor-pointer hover:bg-secondary/70 transition-colors"
              onClick={() => setIsLogsExpanded(!isLogsExpanded)}
            >
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-primary" />
                <span className="text-xs font-mono font-bold">LIVE_PROCESS_LOGS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 mr-2">
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="w-2 h-2 rounded-full bg-border" />
                </div>
                {isLogsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
            {isLogsExpanded && (
              <div className="p-4 bg-black/40 font-mono text-xs md:text-sm space-y-2 animate-in slide-in-from-top-2 duration-200">
                {logs.map((log, i) => (
                  <div key={i} className={cn(
                    "flex gap-2",
                    log.type === "success" && "text-primary",
                    log.type === "error" && "text-destructive",
                    log.type === "process" && "text-accent",
                    log.type === "info" && "text-muted-foreground"
                  )}>
                    <span className="shrink-0">{">"}</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Raw Logs Audit */}
        {rawLogs.length > 0 && view === "start" && (
          <div className="terminal-window mb-10 border-amber-500/30">
            <div
              className="terminal-header flex items-center justify-between bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-colors"
              onClick={() => setIsRawLogsExpanded(!isRawLogsExpanded)}
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="text-xs font-mono font-bold text-amber-500">RAW_AUDIT_LOGS</span>
              </div>
              {isRawLogsExpanded ? <ChevronUp size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-amber-500" />}
            </div>
            {isRawLogsExpanded && (
              <div className="p-4 bg-black/60 font-mono text-[10px] space-y-4 animate-in slide-in-from-top-2 duration-200">
                {rawLogs.map((log, i) => (
                  <div key={i} className="space-y-1 border-b border-border/30 pb-4 last:border-0">
                    <div className="text-amber-500/70 font-bold flex items-center gap-2">
                      <span className="bg-amber-500/20 px-1 rounded text-[8px]">LOG_{i + 1}</span>
                      {log.label}
                    </div>
                    <pre className="text-muted-foreground whitespace-pre-wrap break-all bg-black/20 p-2 rounded border border-border/10 overflow-x-auto">
                      {typeof log.content === "string" ? log.content : JSON.stringify(log.content, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-8 min-h-[400px]">
          {view === "start" ? (
            currentResult ? (
              <div className="animate-fade-in space-y-6 text-center">
                <h3 className="text-xl font-bold font-mono text-primary flex items-center justify-center gap-2">
                  <CheckCircle2 size={24} />
                  GENERATION_COMPLETE
                </h3>

                <div className="grid gap-6">
                  {currentResult.map((item, idx) => (
                    <WordCard key={idx} item={item} index={idx} />
                  ))}
                </div>

                {!videoUrl ? (
                  <div className="pt-6">
                    <button
                      onClick={generateVideo}
                      disabled={isGeneratingVideo}
                      className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                    >
                      {isGeneratingVideo ? <Loader2 className="animate-spin" size={24} /> : <Video size={24} />}
                      Generate Reel Video
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 pt-6">
                    <div className="relative max-w-[270px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden border-4 border-accent shadow-2xl">
                      <video src={videoUrl} controls className="w-full h-full object-cover" />
                    </div>
                    <a
                      href={videoUrl}
                      download="educational-reel.webm"
                      className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg"
                    >
                      <Download size={24} />
                      Download Video
                    </a>
                  </div>
                )}
              </div>
            ) : !isProcessing && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mb-4 text-muted-foreground/30">
                  <Play size={40} />
                </div>
                <h3 className="text-xl font-mono text-muted-foreground">Ready to start</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs">
                  Select word types and click start to generate content for your reel.
                </p>
              </div>
            )
          ) : (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-mono text-accent">PAST_RECORDS</h3>
                {records.length > 0 && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("video_automation_records");
                      setRecords([]);
                    }}
                    className="text-xs font-mono text-destructive hover:underline"
                  >
                    CLEAR_ALL
                  </button>
                )}
              </div>

              {records.length > 0 ? (
                <div className="space-y-12">
                  {records.map((record) => (
                    <div key={record.id} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono px-2 py-1 rounded bg-secondary border border-border text-muted-foreground">
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                      <div className="grid gap-6">
                        {record.data.map((item, idx) => (
                          <div key={idx} className="relative group">
                            <WordCard item={item} index={idx} />
                            <button
                              onClick={() => {
                                setCurrentResult(record.data);
                                setView("start");
                                setVideoUrl(null);
                              }}
                              className="absolute top-2 right-2 p-2 rounded-lg bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title="Load this record"
                            >
                              <Play size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mb-4 text-muted-foreground/30">
                    <History size={40} />
                  </div>
                  <h3 className="text-xl font-mono text-muted-foreground">No records found</h3>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden Canvas for Video Generation (not using 'hidden' to avoid browser throttling) */}
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="fixed -left-[5000px] -top-[5000px] pointer-events-none opacity-0"
        />
      </div>

      {/* Word Type Selection Modal */}
      {isWordTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsWordTypeModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-bold font-mono">SELECT WORD TYPES</h3>
              <button onClick={() => setIsWordTypeModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-2">
              {WORD_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleWordType(type)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-left text-xs font-mono",
                    selectedWordTypes.includes(type) ? "bg-primary/10 border-primary text-primary" : "bg-surface-1 border-border"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-border flex gap-4">
              <button onClick={() => setSelectedWordTypes(WORD_TYPES)} className="flex-1 py-3 border border-border rounded-xl font-mono text-sm">ALL</button>
              <button onClick={() => setIsWordTypeModalOpen(false)} className="flex-[2] py-3 bg-primary text-primary-foreground rounded-xl font-mono text-sm font-bold">DONE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WordCard = ({ item, index }: { item: WordData; index: number }) => (
  <div className="terminal-window bg-card/40 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
    <div className="terminal-header flex items-center justify-between py-2 px-4">
      <span className="text-[10px] font-mono text-primary">WORD::{item.word.toUpperCase()}</span>
      <span className="text-[10px] font-mono text-muted-foreground italic">{item.partOfSpeech}</span>
    </div>
    <div className="p-6 space-y-4">
      <div className="space-y-1 text-left">
        <h4 className="text-2xl font-bold">{item.word}</h4>
        <p className="text-xl font-bangla text-primary">{item.banglaMeaning}</p>
      </div>
      <div className="space-y-2 pt-2 border-t border-border/30 text-left">
        <p className="text-sm text-muted-foreground italic">"{item.example}"</p>
        <p className="text-sm font-bangla text-muted-foreground/80">{item.exampleBangla}</p>
      </div>
    </div>
  </div>
);

export default VideoAutomation;
