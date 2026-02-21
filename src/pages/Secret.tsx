import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { censorText } from "@/lib/censor";
import { Download, RefreshCw, Image as ImageIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings2, X, ClipboardPaste, History, Clock, AlertCircle, List, Zap, Play, Square, Trash2, Lock, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface AutoRecord {
  id: string;
  url: string;
  title: string;
  imageUrl: string;
  previewUrl: string;
  timestamp: string;
}

interface BGArchiveItem {
  ContentID: number;
  Slug: string;
  ContentHeading: string;
  ImageBgPath: string;
}

interface LogEntry {
  message: string;
  timestamp: number;
  type?: 'info' | 'success' | 'error' | 'process';
}

const DB_NAME = 'SecretBGDB';
const STORE_NAME = 'photocards';

const ENC_PW = "MDE1MjIxMDUzNzM="; // btoa("01522105373")

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteRecordDB = async (id: string) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const clearRecordsDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const saveRecordDB = async (record: AutoRecord) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const getAllRecordsDB = async (): Promise<AutoRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const Secret = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');

  const [postUrl, setPostUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fontSize, setFontSize] = useState(70);
  const [dateXOffset, setDateXOffset] = useState(-40);
  const [dateYOffset, setDateYOffset] = useState(-30);
  const [dateFontSize, setDateFontSize] = useState(20);
  const [titleLetterSpacing, setTitleLetterSpacing] = useState(-2.4);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState('');

  // Audio State
  const [selectedAudio, setSelectedAudio] = useState(localStorage.getItem('bg_secret_audio') || '/Alert.mp3');

  // Automation State
  const [autoModeActive, setAutoModeActive] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const isAutoCheckingRef = useRef(false);
  const [autoRecords, setAutoRecords] = useState<AutoRecord[]>([]);
  const [autoLogs, setAutoLogs] = useState<LogEntry[]>([]);
  const [processedUrls, setProcessedUrls] = useState<Set<string>>(new Set());
  const processedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    processedUrlsRef.current = processedUrls;
  }, [processedUrls]);

  useEffect(() => {
    const savedUrls = localStorage.getItem('bg_secret_processed_urls');
    if (savedUrls) {
      try {
        const urls = JSON.parse(savedUrls);
        setProcessedUrls(new Set(urls));
      } catch (e) {
        console.error("Failed to load processed URLs", e);
      }
    }

    const savedAutoActive = localStorage.getItem('bg_secret_auto_active');
    if (savedAutoActive === 'true') {
      setAutoModeActive(true);
    }

    getAllRecordsDB().then(records => {
      const sorted = records.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setAutoRecords(sorted);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('bg_secret_processed_urls', JSON.stringify(Array.from(processedUrls)));
  }, [processedUrls]);

  useEffect(() => {
    localStorage.setItem('bg_secret_auto_active', String(autoModeActive));
  }, [autoModeActive]);

  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      setAutoLogs(prev => prev.filter(log => log.timestamp > oneHourAgo));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = { message, timestamp: Date.now(), type };
    setAutoLogs(prev => [newLog, ...prev]);
  };

  const playNotification = (file?: string) => {
    const audio = new Audio(file || selectedAudio);
    audio.play().catch(e => console.warn("Audio play failed:", e));
  };

  const saveAudioSetting = (file: string) => {
    setSelectedAudio(file);
    localStorage.setItem('bg_secret_audio', file);
    toast.success("Audio setting saved");
  };

  const getMetadata = async (targetUrl: string) => {
    let html = '';
    const proxies = [
      { url: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, type: 'text' },
      { url: (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`, type: 'text' },
      { url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, type: 'json' },
      { url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, type: 'text' }
    ];

    for (const proxy of proxies) {
      try {
        const response = await fetch(proxy.url(targetUrl));
        if (response.ok) {
          if (proxy.type === 'json') {
            const data = await response.json();
            html = data.contents;
          } else {
            html = await response.text();
          }
          if (html && (html.includes('<title>') || html.includes('og:title'))) break;
        }
      } catch (e) {
        console.warn("Proxy failed for metadata fetch:", e);
      }
    }

    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="og:title"]')?.getAttribute('content');
    const metaTitle = doc.querySelector('title')?.textContent;
    const h1Title = doc.querySelector('h1')?.textContent;

    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="og:image"]')?.getAttribute('content');
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

    return {
      title: ogTitle || metaTitle || h1Title || '',
      image: ogImage || twitterImage || ''
    };
  };

  const fetchPostData = async () => {
    const trimmedUrl = postUrl.trim();
    if (!trimmedUrl) {
      toast.error("Please enter a Post URL");
      return;
    }
    if (!trimmedUrl.includes('bangladeshguardian.com')) {
      toast.error("Only bangladeshguardian.com links are supported");
      return;
    }

    setIsFetching(true);
    let html = '';
    const proxies = [
      { url: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, type: 'text' },
      { url: (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`, type: 'text' },
      { url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, type: 'json' },
      { url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, type: 'text' }
    ];

    try {
      for (const proxy of proxies) {
        try {
          const response = await fetch(proxy.url(trimmedUrl));
          if (response.ok) {
            if (proxy.type === 'json') {
              const data = await response.json();
              html = data.contents;
            } else {
              html = await response.text();
            }
            if (html && (html.includes('<title>') || html.includes('og:title'))) break;
          }
        } catch (e) {
          console.warn("Proxy failed for HTML fetch:", e);
        }
      }

      if (!html) throw new Error("Failed to fetch page content from all proxies");

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                      doc.querySelector('meta[name="og:title"]')?.getAttribute('content');
      const metaTitle = doc.querySelector('title')?.textContent;
      const h1Title = doc.querySelector('h1')?.textContent;
      const extractedTitle = ogTitle || metaTitle || h1Title || '';

      const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                      doc.querySelector('meta[name="og:image"]')?.getAttribute('content');
      const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
      const extractedImage = ogImage || twitterImage || '';

      if (extractedTitle) setTitle(censorText(extractedTitle));
      if (extractedImage) setImageUrl(extractedImage);

      if (extractedTitle || extractedImage) {
        toast.success("Data fetched successfully!");
      } else {
        toast.warn("Could not find title or image on this page.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch post data.");
    } finally {
      setIsFetching(false);
    }
  };

  const handlePaste = async (setter: (val: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setter(text);
        toast.success("Pasted from clipboard");
      }
    } catch (err) {
      toast.error("Failed to paste.");
    }
  };

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1080;
  const BOX = { x: 30, y: 32, w: 1020, h: 574 };
  const GRAY_BAR_Y = 660;
  const GRAY_BAR_H = 85;
  const DATE_X = 88;
  const DATE_Y = GRAY_BAR_Y + (GRAY_BAR_H / 2);
  const TITLE_X = CANVAS_WIDTH / 2;
  const TITLE_Y = 860;

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]} | ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const fetchImageWithProxy = async (url: string): Promise<string> => {
    const proxies = [
      (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    ];

    const isRestricted = url.includes('bangladeshguardian.com') || url.includes('backoffice.bangladeshguardian.com');
    if (!isRestricted) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      } catch (e) {}
    }

    for (const proxy of proxies) {
      try {
        const proxiedUrl = proxy(url);
        const response = await fetch(proxiedUrl);
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      } catch (e) {}
    }
    throw new Error("Failed to load image.");
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const generatePhotoCardInternal = async (targetTitle: string, targetImageUrl: string): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found");
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Context not found");

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let userImgBlobUrl = '';
    try {
      const template = new Image();
      template.crossOrigin = "anonymous";
      template.src = "/PhotocardTemplate.png";
      await new Promise((resolve, reject) => {
        template.onload = resolve;
        template.onerror = reject;
      });
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      await Promise.all([
        document.fonts.load(`bold ${fontSize}px "Cambria"`),
        document.fonts.load(`${dateFontSize}px "Cambria"`)
      ]);

      userImgBlobUrl = await fetchImageWithProxy(targetImageUrl);
      const userImg = new Image();
      userImg.src = userImgBlobUrl;
      await new Promise((resolve, reject) => {
        userImg.onload = resolve;
        userImg.onerror = reject;
      });

      const scale = Math.max(BOX.w / userImg.width, BOX.h / userImg.height);
      const drawW = userImg.width * scale;
      const drawH = userImg.height * scale;
      const drawX = BOX.x + (BOX.w - drawW) / 2;
      const drawY = BOX.y + (BOX.h - drawH) / 2;

      const radius = 35;
      const defineBoxPath = () => {
        ctx.beginPath();
        ctx.moveTo(BOX.x + radius, BOX.y);
        ctx.lineTo(BOX.x + BOX.w - radius, BOX.y);
        ctx.quadraticCurveTo(BOX.x + BOX.w, BOX.y, BOX.x + BOX.w, BOX.y + radius);
        ctx.lineTo(BOX.x + BOX.w, BOX.y + BOX.h - radius);
        ctx.quadraticCurveTo(BOX.x + BOX.w, BOX.y + BOX.h, BOX.x + BOX.w - radius, BOX.y + BOX.h);
        ctx.lineTo(BOX.x + radius, BOX.y + BOX.h);
        ctx.quadraticCurveTo(BOX.x, BOX.y + BOX.h, BOX.x, BOX.y + BOX.h - radius);
        ctx.lineTo(BOX.x, BOX.y + radius);
        ctx.quadraticCurveTo(BOX.x, BOX.y, BOX.x + radius, BOX.y);
        ctx.closePath();
      };

      ctx.save();
      defineBoxPath();
      ctx.clip();
      ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      ctx.save();
      defineBoxPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FF0000';
      ctx.stroke();
      ctx.restore();

      ctx.font = `${dateFontSize}px "Cambria"`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatDate(new Date()), DATE_X + dateXOffset, DATE_Y + dateYOffset);

      let currentFontSize = fontSize;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = `${titleLetterSpacing}px`;

      const maxW = 980;
      let lines: string[] = [];
      let attempts = 0;
      while (attempts < 10) {
        ctx.font = `bold ${currentFontSize}px "Cambria"`;
        lines = wrapText(ctx, targetTitle, maxW);
        let maxLineW = 0;
        lines.forEach(l => { maxLineW = Math.max(maxLineW, ctx.measureText(l).width); });
        if (lines.length <= 3 && maxLineW <= maxW) break;
        if (lines.length > 3) currentFontSize *= 0.9;
        else if (maxLineW > maxW) currentFontSize *= (maxW / maxLineW);
        attempts++;
      }

      const lineHeight = currentFontSize * 0.9;
      const totalHeight = (lines.length - 1) * lineHeight;
      const startY = TITLE_Y - (totalHeight / 2);
      lines.forEach((line, index) => {
        ctx.fillText(line, TITLE_X, startY + (index * lineHeight));
      });

      ctx.letterSpacing = "0px";
      return canvas.toDataURL('image/png');
    } finally {
      if (userImgBlobUrl && userImgBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(userImgBlobUrl);
      }
    }
  };

  const generatePhotoCard = async () => {
    if (!title || !imageUrl) {
      toast.error("Please provide both title and image URL");
      return;
    }
    setIsGenerating(true);
    try {
      const censoredTitle = censorText(title);
      const dataUrl = await generatePhotoCardInternal(censoredTitle, imageUrl);
      setPreviewUrl(dataUrl);
      setGeneratedTitle(censoredTitle);

      const newRecord: AutoRecord = {
        id: Math.random().toString(36).substr(2, 9),
        url: postUrl || 'manual',
        title: censoredTitle,
        imageUrl: imageUrl,
        previewUrl: dataUrl,
        timestamp: new Date().toISOString()
      };

      await saveRecordDB(newRecord);
      setAutoRecords(prev => [newRecord, ...prev]);

      if (postUrl && postUrl.includes('bangladeshguardian.com')) {
        setProcessedUrls(prev => {
          const next = new Set(prev);
          next.add(postUrl.trim());
          return next;
        });
      }

      toast.success("Photocard generated!");
      playNotification();
    } catch (error) {
      toast.error("Failed to generate photocard.");
    } finally {
      setIsGenerating(false);
    }
  };

  const scrapeLatestLinks = async () => {
    try {
      const response = await fetch("https://backoffice.bangladeshguardian.com/api-en/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: 12, offset: 0 })
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      return (data.archive_data || []).map((item: BGArchiveItem) => ({
        url: `https://www.bangladeshguardian.com/${item.Slug}/${item.ContentID}`,
        title: item.ContentHeading,
        image: `https://backoffice.bangladeshguardian.com/media/imgAll/${item.ImageBgPath}`
      }));
    } catch (e) {
      return [];
    }
  };

  const checkAndGenerate = async () => {
    if (isAutoCheckingRef.current) return;
    isAutoCheckingRef.current = true;
    setIsAutoChecking(true);
    addLog("Checking for new posts...", "process");

    try {
      const articles = await scrapeLatestLinks();
      const newArticles = articles.filter(art => !processedUrlsRef.current.has(art.url));

      if (newArticles.length === 0) {
        addLog("No new posts found.");
      } else {
        addLog(`Found ${newArticles.length} new post(s).`);
        for (const article of newArticles) {
          if (article.title && article.image) {
            const censoredTitle = censorText(article.title);
            const dataUrl = await generatePhotoCardInternal(censoredTitle, article.image);
            const newRecord: AutoRecord = {
              id: Math.random().toString(36).substr(2, 9),
              url: article.url,
              title: censoredTitle,
              imageUrl: article.image,
              previewUrl: dataUrl,
              timestamp: new Date().toISOString()
            };
            await saveRecordDB(newRecord);
            setAutoRecords(prev => [newRecord, ...prev]);
            setProcessedUrls(prev => {
              const next = new Set(prev);
              next.add(article.url);
              return next;
            });
            toast.success(`Auto-generated: ${censoredTitle}`);
            playNotification();
          }
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } catch (e) {
      addLog("Automation error.", "error");
    } finally {
      setIsAutoChecking(false);
      isAutoCheckingRef.current = false;
    }
  };

  useEffect(() => {
    if (!autoModeActive) return;
    const workerCode = `
      let interval;
      self.onmessage = (e) => {
        if (e.data === 'start') {
          self.postMessage('tick');
          interval = setInterval(() => self.postMessage('tick'), 60000);
        } else if (e.data === 'stop') {
          clearInterval(interval);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    worker.onmessage = (e) => { if (e.data === 'tick') checkAndGenerate(); };
    worker.postMessage('start');
    return () => {
      worker.postMessage('stop');
      worker.terminate();
      URL.revokeObjectURL(url);
    };
  }, [autoModeActive]);

  const handleDelete = async (id: string) => {
    try {
      await deleteRecordDB(id);
      setAutoRecords(prev => prev.filter(r => r.id !== id));
      toast.success("Photocard deleted");
    } catch (e) {
      toast.error("Failed to delete.");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === atob(ENC_PW)) {
      setIsAuthorized(true);
    } else {
      toast.error("Incorrect Password");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-solaiman-regular">
        <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h1>
            <p className="text-zinc-500 text-sm text-center">You need Permission to view this page.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Security Key</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">Initialize Access</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen light-theme bg-background text-foreground p-3 md:p-8 font-solaiman-regular">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="rounded-xl overflow-hidden shadow-xl">
          <div className="bg-black py-6 flex items-center justify-center relative">
            <img src="/logo.png" alt="Logo" className="h-16 md:h-20 object-contain" />
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="text-white hover:bg-white/10"
              >
                <Settings2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 bg-card p-5 md:p-6 rounded-2xl border shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postUrl">News post</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="postUrl"
                    placeholder="https://www.bangladeshguardian.com/..."
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    className="bg-surface-2 min-h-[80px]"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="icon" onClick={() => handlePaste(setPostUrl)}>
                      <ClipboardPaste className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={fetchPostData} disabled={isFetching || !postUrl}>
                      {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t"></div>
                <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase tracking-widest">OR MANUAL</span>
                <div className="flex-grow border-t"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title Text</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="title"
                    placeholder="Enter photocard title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-surface-2 min-h-[80px]"
                    rows={2}
                  />
                  <Button variant="outline" size="icon" onClick={() => handlePaste(setTitle)}>
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-surface-2 min-h-[80px]"
                    rows={2}
                  />
                  <Button variant="outline" size="icon" onClick={() => handlePaste(setImageUrl)}>
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={generatePhotoCard} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
              Generate Preview
            </Button>

            {previewUrl && (
              <Button variant="secondary" className="w-full" onClick={() => {
                const link = document.createElement('a');
                link.download = `${generatedTitle || title || 'photocard'}.png`;
                link.href = previewUrl;
                link.click();
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            )}
          </div>

          <div className="flex flex-col space-y-6">
            <div className="relative w-full aspect-square border-2 border-dashed rounded-2xl overflow-hidden flex items-center justify-center bg-surface-1 shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <ImageIcon className="h-12 w-12 opacity-20" />
                  <span>Preview will appear here</span>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden" />

            <div className="bg-card p-5 space-y-4 rounded-2xl border shadow-sm">
              <div className="flex items-center justify-between border-b pb-2.5">
                <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" />
                  AUTOMATION
                </h3>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", autoModeActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-400')} />
                  <span className="text-[10px] uppercase font-bold">{autoModeActive ? 'Active' : 'Idle'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant={autoModeActive ? "secondary" : "default"} size="sm" className="flex-1 text-[10px]" onClick={() => setAutoModeActive(true)} disabled={autoModeActive}>
                  <Play className="h-3 w-3 mr-1" /> START
                </Button>
                <Button variant={!autoModeActive ? "secondary" : "destructive"} size="sm" className="flex-1 text-[10px]" onClick={() => setAutoModeActive(false)} disabled={!autoModeActive}>
                  <Square className="h-3 w-3 mr-1" /> STOP
                </Button>
              </div>
              <div className="bg-surface-2 rounded-lg p-3 h-32 overflow-y-auto scrollbar-hide text-[10px] space-y-1">
                {autoLogs.length === 0 ? <div className="text-muted-foreground italic">Waiting for activity...</div> : autoLogs.map((log, i) => (
                  <div key={i} className={cn(log.type === 'success' ? 'text-green-600' : log.type === 'error' ? 'text-red-600' : log.type === 'process' ? 'text-primary' : 'text-muted-foreground')}>
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {autoRecords.length > 0 && (
          <div className="space-y-6 pt-8 border-t">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <List className="h-6 w-6 text-primary" /> GENERATIONS
              </h2>
              <Button variant="destructive" size="sm" onClick={async () => {
                if (window.confirm("Clear all?")) { await clearRecordsDB(); setAutoRecords([]); }
              }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> CLEAR ALL
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {autoRecords.map((record) => (
                <div key={record.id} className="flex flex-col animate-fade-in-up group">
                  <div className="mb-2 px-1">
                    <h3 className="text-[11px] font-bold text-primary line-clamp-2 leading-tight min-h-[2.4em]">
                      {record.url && record.url !== 'manual' ? (
                        <a href={record.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {record.title}
                        </a>
                      ) : (
                        record.title
                      )}
                    </h3>
                  </div>
                  <div className="rounded-2xl overflow-hidden aspect-square relative bg-surface-1 border shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={record.previewUrl} alt={record.title} className="w-full h-full object-contain" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1 text-[10px] h-9" onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${record.title}.png`;
                      link.href = record.previewUrl;
                      link.click();
                    }}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> DOWNLOAD
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1 text-[10px] h-9" onClick={() => {
                      if (window.confirm("Delete?")) handleDelete(record.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> DELETE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b flex items-center justify-between bg-surface-1">
              <h3 className="font-bold flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                SETTINGS
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Notification Audio</Label>
                <div className="space-y-3">
                  {[
                    { name: 'Alert (Default)', file: '/Alert.mp3' },
                    { name: 'Instant', file: '/Instant.mp3' },
                    { name: 'Loud', file: '/Loud.mp3' }
                  ].map((audio) => (
                    <div key={audio.file} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-2 border border-transparent hover:border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", selectedAudio === audio.file ? "bg-primary" : "bg-transparent")} />
                        <span className="text-sm">{audio.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => playNotification(audio.file)}>
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedAudio === audio.file ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => saveAudioSetting(audio.file)}
                        >
                          {selectedAudio === audio.file ? "SAVED" : "SELECT"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-2">Note: All audio files are Copyright free.</p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Canvas Layout</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px]">Title Size</Label>
                    <Input type="number" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 70)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px]">Spacing</Label>
                    <Input type="number" step="0.1" value={titleLetterSpacing} onChange={(e) => setTitleLetterSpacing(parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>

              <Button onClick={() => setShowSettings(false)} className="w-full">Close Settings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secret;
