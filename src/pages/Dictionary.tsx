import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, X, Volume2, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Phonetic {
  text?: string;
  audio?: string;
}

interface Definition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  origin?: string;
  meanings: Meaning[];
}

interface ApiError {
  title: string;
  message: string;
  resolution: string;
}

const Dictionary = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<DictionaryEntry[] | null>(null);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const fetchDefinition = async (word: string) => {
    if (!word.trim()) {
      setResults(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
        setError(null);
        // Preload audio
        data.forEach((entry: DictionaryEntry) => {
          entry.phonetics.forEach((p) => {
            if (p.audio && !audioRefs.current[p.audio]) {
              const audio = new Audio(p.audio);
              audio.preload = "auto";
              audioRefs.current[p.audio] = audio;
            }
          });
        });
      } else {
        setResults(null);
        setError(data);
      }
    } catch (err) {
      setResults(null);
      setError("Something is not right. Please come back later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchDefinition(searchTerm);
      } else {
        setResults(null);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = () => {
    fetchDefinition(searchTerm);
  };

  const playAudio = (url: string) => {
    const audio = audioRefs.current[url];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    } else {
      const newAudio = new Audio(url);
      newAudio.play();
      audioRefs.current[url] = newAudio;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <div className="max-w-3xl mx-auto pt-6 md:pt-20 px-4">
        <header className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate("/")}
            className="p-2.5 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <div className="min-w-0">
            <h1 className="text-2xl md:text-5xl font-bold font-mono truncate gradient-text">
              My Dictionary
            </h1>
            <p className="text-muted-foreground font-mono text-[10px] md:text-sm truncate">
              {"// Exploration of words and meanings"}
            </p>
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative mb-10 flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex h-14 w-full rounded-2xl border border-border bg-surface-1 px-12 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="h-14 w-14 inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shrink-0 shadow-none"
            title="Search"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-8 min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="font-mono text-muted-foreground">Fetching data from the grid...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="terminal-window p-8 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-destructive shrink-0" size={24} />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-destructive font-mono">
                    {typeof error === "string" ? "SYSTEM_ERROR" : error.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {typeof error === "string" ? error : error.message}
                  </p>
                  {typeof error !== "string" && error.resolution && (
                    <p className="text-sm font-mono text-muted-foreground/80 mt-4 italic">
                      {">"} {error.resolution}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isLoading && results && results.map((entry, index) => (
            <div key={index} className="terminal-window shadow-none backdrop-blur-none bg-card animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="terminal-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary">WORD::{entry.word.toUpperCase()}</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="w-2 h-2 rounded-full bg-border" />
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-bold mb-2">{entry.word}</h2>
                    <p className="text-primary font-mono text-lg">{entry.phonetic}</p>
                  </div>
                  <div className="flex gap-2">
                    {entry.phonetics.filter(p => p.audio).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => playAudio(p.audio!)}
                        className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all group"
                        title="Play Phonetic"
                      >
                        <Volume2 size={20} className="text-primary group-hover:scale-110 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                {entry.origin && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">Origin</p>
                    <p className="text-sm italic">{entry.origin}</p>
                  </div>
                )}

                <div className="space-y-8">
                  {entry.meanings.map((meaning, mIndex) => (
                    <div key={mIndex} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono font-bold text-accent italic px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                          {meaning.partOfSpeech}
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>

                      <ul className="space-y-6">
                        {meaning.definitions.map((def, dIndex) => (
                          <li key={dIndex} className="relative pl-6">
                            <div className="absolute left-0 top-2.5 w-1.5 h-1.5 rounded-full bg-primary/40" />
                            <div className="space-y-2">
                              <p className="text-foreground leading-relaxed">
                                {def.definition}
                              </p>
                              {def.example && (
                                <p className="text-muted-foreground text-sm border-l-2 border-border pl-4 py-1 italic">
                                  "{def.example}"
                                </p>
                              )}
                              {(def.synonyms.length > 0 || def.antonyms.length > 0) && (
                                <div className="flex flex-wrap gap-4 pt-2">
                                  {def.synonyms.length > 0 && (
                                    <div className="flex gap-2 items-center flex-wrap">
                                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Synonyms:</span>
                                      {def.synonyms.slice(0, 5).map((s, si) => (
                                        <button
                                          key={si}
                                          onClick={() => {
                                            setSearchTerm(s);
                                            fetchDefinition(s);
                                          }}
                                          className="text-[10px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 hover:bg-primary/20 transition-all active:scale-95"
                                        >
                                          {s}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {def.antonyms.length > 0 && (
                                    <div className="flex gap-2 items-center flex-wrap">
                                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Antonyms:</span>
                                      {def.antonyms.slice(0, 5).map((a, ai) => (
                                        <button
                                          key={ai}
                                          onClick={() => {
                                            setSearchTerm(a);
                                            fetchDefinition(a);
                                          }}
                                          className="text-[10px] font-mono text-destructive bg-destructive/5 px-1.5 py-0.5 rounded border border-destructive/10 hover:bg-destructive/20 transition-all active:scale-95"
                                        >
                                          {a}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Meaning level synonyms/antonyms */}
                      {(meaning.synonyms && meaning.synonyms.length > 0) && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/10">
                          <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider self-center">Synonyms:</span>
                          {meaning.synonyms.map(syn => (
                            <button
                              key={syn}
                              onClick={() => {
                                setSearchTerm(syn);
                                fetchDefinition(syn);
                              }}
                              className="text-[10px] font-mono bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 rounded transition-colors"
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      )}

                      {(meaning.antonyms && meaning.antonyms.length > 0) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[10px] font-mono font-bold text-destructive uppercase tracking-wider self-center">Antonyms:</span>
                          {meaning.antonyms.map(ant => (
                            <button
                              key={ant}
                              onClick={() => {
                                setSearchTerm(ant);
                                fetchDefinition(ant);
                              }}
                              className="text-[10px] font-mono bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-0.5 rounded transition-colors"
                            >
                              {ant}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {!isLoading && !results && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mb-4">
                <Search size={40} className="text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-mono text-muted-foreground">Waiting for input...</h3>
              <p className="text-sm text-muted-foreground/60 max-w-xs">
                Type a word in the search bar above to explore its meaning and origin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dictionary;
