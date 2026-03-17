import React, { useState, useRef, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import Home from "./Home";
import Templates, { templates } from "./Templates";
import Ads from "./Ads";
import Settings from "./Settings";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { censorText, defaultMappings } from "@/lib/censor";

// --- Types & Interfaces ---
interface AutoRecord {
  id: string;
  url: string;
  title: string;
  imageUrl: string;
  previewUrl: string;
  timestamp: string;
  postTime?: string;
  contentId?: number;
}

interface BGArchiveItem {
  ContentID: number;
  Slug: string;
  ContentHeading: string;
  ImageBgPath: string;
  create_date?: string;
}

interface LogEntry {
  message: string;
  timestamp: number;
  type?: 'info' | 'success' | 'error' | 'process';
}

const FREQ_OPTIONS = [
  { id: '1m3p', label: '1m 3p', interval: 60000, limit: 3 },
  { id: '2m6p', label: '2m 6p', interval: 120000, limit: 6 },
  { id: '3m6p', label: '3m 6p', interval: 180000, limit: 6 }
];

// --- Constants ---
const DB_NAME = 'SecretBGDB';
const STORE_NAME = 'photocards';
const ENC_PW = "MDE1MjIxMDUzNzM="; // btoa("01522105373")

const ADS_DB_NAME = 'AdImagesDB';
const ADS_STORE_NAME = 'ads';

// --- Database Helpers ---
const initDB = (dbName: string, storeName: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAdBlob = async (id: string): Promise<Blob | null> => {
  try {
    const db = await initDB(ADS_DB_NAME, ADS_STORE_NAME);
    return new Promise((resolve) => {
      const tx = db.transaction(ADS_STORE_NAME, 'readonly');
      const store = tx.objectStore(ADS_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
};

const Secret = () => {
  const [activePage, setActivePage] = useState('home');
  const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('bg_authorized') === 'true');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared Application State
  const [postUrl, setPostUrl] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoRecords, setAutoRecords] = useState<AutoRecord[]>([]);
  const [autoLogs, setAutoLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [autoModeActive, setAutoModeActive] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<Map<string, number>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isAutoCheckingRef = useRef(false);
  const nextFetchLimitRef = useRef<number | null>(null);
  const processedUrlsRef = useRef<Map<string, number>>(new Map());
  const backupInitializedRef = useRef(false);

  // Sync Ref
  useEffect(() => { processedUrlsRef.current = processedUrls; }, [processedUrls]);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await initDB(DB_NAME, STORE_NAME);
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          const sorted = (request.result as AutoRecord[]).sort((a, b) => {
            const aVal = a.contentId || new Date(a.timestamp).getTime();
            const bVal = b.contentId || new Date(b.timestamp).getTime();
            return bVal - aVal;
          });
          setAutoRecords(sorted);
        };
      } catch (e) {}

      const savedUrls = localStorage.getItem('bg_secret_processed_urls');
      if (savedUrls) {
        try {
          const parsed = JSON.parse(savedUrls);
          const map = new Map<string, number>();
          parsed.forEach((item: any) => map.set(item.url, item.timestamp || Date.now()));
          setProcessedUrls(map);
        } catch (e) {}
      }

      if (localStorage.getItem('bg_secret_auto_active') === 'true') {
        setAutoModeActive(true);
      }
    };
    loadData();
  }, []);

  // Save Cache
  useEffect(() => {
    const data = Array.from(processedUrls.entries()).map(([url, timestamp]) => ({ url, timestamp }));
    localStorage.setItem('bg_secret_processed_urls', JSON.stringify(data));
  }, [processedUrls]);

  useEffect(() => {
    localStorage.setItem('bg_secret_auto_active', String(autoModeActive));
  }, [autoModeActive]);

  // Automation logic
  useEffect(() => {
    if (!autoModeActive) return;

    let wakeLock: any = null;
    const controller = new AbortController();

    const start = async () => {
      if ('wakeLock' in navigator) {
        try { wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (e) {}
      }

      const freqId = localStorage.getItem('bg_secret_automation_frequency') || '1m3p';
      const freq = FREQ_OPTIONS.find(o => o.id === freqId) || FREQ_OPTIONS[0];

      if ('locks' in navigator) {
        navigator.locks.request('bg_photocard_automation', { signal: controller.signal }, async () => {
          setIsLeader(true);
          addLog("Took leadership of automation.", "success");

          const workerCode = `
            let i;
            self.onmessage = (e) => {
              if (e.data === 'start') {
                self.postMessage('tick');
                i = setInterval(() => self.postMessage('tick'), ${freq.interval});
              } else if (e.data === 'stop') clearInterval(i);
            };
          `;
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          const worker = new Worker(url);
          worker.onmessage = (e) => { if (e.data === 'tick') checkAndGenerate(); };
          worker.postMessage('start');

          await new Promise(res => controller.signal.addEventListener('abort', res));
          worker.postMessage('stop');
          worker.terminate();
          URL.revokeObjectURL(url);
          setIsLeader(false);
        }).catch(() => setIsLeader(false));
      } else {
        setIsLeader(true);
      }
    };

    start();
    return () => {
      controller.abort();
      if (wakeLock) wakeLock.release();
    };
  }, [autoModeActive]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setAutoLogs(prev => [{ message, timestamp: Date.now(), type }, ...prev].slice(0, 100));
  };

  // --- Scrapers & Helpers ---

  const getMetadata = async (targetUrl: string) => {
    const proxies = [
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`
    ];
    let html = '';
    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy(targetUrl));
        if (res.ok) { html = await res.text(); break; }
      } catch (e) {}
    }
    if (!html) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return {
      title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.querySelector('title')?.textContent || '',
      image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      publishDate: doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || ''
    };
  };

  const scrapeLatestLinks = async (fetchLimit: number) => {
    try {
      const res = await fetch("https://backoffice.channel24bd.tv/api-en/archive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: fetchLimit, offset: 0 })
      });
      const data = await res.json();
      return (data.archive_data || []).map((item: BGArchiveItem) => ({
        url: `https://www.channel24bd.tv/english-news/${item.Slug}/${item.ContentID}`,
        title: item.ContentHeading,
        image: `https://backoffice.channel24bd.tv/media/imgAll/${item.ImageBgPath}`,
        postTime: item.create_date ? formatPostTime(item.create_date) : '',
        contentId: item.ContentID
      }));
    } catch (e) { return null; }
  };

  const scrapeSitemapLinks = async () => {
    const now = new Date();
    const url = `https://www.channel24bd.tv/english-sitemap/sitemap-daily-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.xml`;
    try {
      const res = await fetch(url);
      const xml = await res.text();
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      const urls = Array.from(doc.getElementsByTagName("url"));
      return urls.map(u => {
         const loc = u.getElementsByTagName("loc")[0]?.textContent || '';
         const img = u.getElementsByTagName("image:loc")[0]?.textContent || '';
         const date = u.getElementsByTagName("lastmod")[0]?.textContent || '';
         return {
           url: loc.trim(), title: '', image: img.trim(),
           postTime: date ? formatSitemapTime(date) : '',
           contentId: parseInt(loc.split('/').pop() || '0')
         };
      }).filter(i => i.url && i.image).reverse();
    } catch (e) { return []; }
  };

  const checkAndGenerate = async () => {
    if (isAutoCheckingRef.current) return;
    isAutoCheckingRef.current = true;
    const mode = localStorage.getItem('bg_secret_automation_mode') || 'main';
    const freqId = localStorage.getItem('bg_secret_automation_frequency') || '1m3p';
    const limit = nextFetchLimitRef.current || FREQ_OPTIONS.find(o => o.id === freqId)?.limit || 3;
    nextFetchLimitRef.current = null;

    addLog(`Checking for new posts (${mode.toUpperCase()})...`, "process");
    try {
      let articles = (mode === 'main') ? await scrapeLatestLinks(limit) : await scrapeSitemapLinks();
      if (!articles || articles.length === 0) { addLog("No new posts."); }
      else {
        const newOnes = articles.filter(a => !processedUrlsRef.current.has(a.url.trim().replace(/\/$/,''))).slice(0, limit).reverse();
        if (newOnes.length === 0) addLog("No new posts.");
        else {
          addLog(`Found ${newOnes.length} new post(s).`);
          for (const art of newOnes) {
            let t = art.title, i = art.image;
            if (!t || !i) {
               const m = await getMetadata(art.url);
               if (m) { t = t || m.title; i = i || m.image; }
            }
            if (t && i) {
              const restrictions = JSON.parse(localStorage.getItem('bg_secret_word_restrictions') || '{}');
              const censored = censorText(t, restrictions);
              const preview = await generatePhotoCardInternal(censored, i);
              const record: AutoRecord = {
                id: Math.random().toString(36).substr(2, 9),
                url: art.url, title: censored, imageUrl: i, previewUrl: preview,
                timestamp: new Date().toISOString(), postTime: art.postTime, contentId: art.contentId
              };
              await saveRecord(record);
              setAutoRecords(prev => [record, ...prev].slice(0, 50));
              setProcessedUrls(prev => { const n = new Map(prev); n.set(art.url.trim().replace(/\/$/,''), Date.now()); return n; });
              toast.success(`Auto-generated: ${censored}`);
              new Audio(localStorage.getItem('bg_secret_audio') || '/Alert.mp3').play().catch(()=>{});
            }
          }
        }
      }
    } catch (e) { addLog("Automation error", "error"); }
    finally { isAutoCheckingRef.current = false; }
  };

  const fetchPostData = async () => {
    const trimmed = postUrl.trim().replace(/\/$/,'');
    if (!trimmed) return toast.error("Enter URL");
    setIsFetching(true);
    try {
      const cid = trimmed.split('/').pop();
      const res = await fetch("https://backoffice.channel24bd.tv/api-en/archive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: 50, offset: 0 })
      });
      const data = await res.json();
      const art = (data.archive_data || []).find((i: BGArchiveItem) => String(i.ContentID) === cid);

      let t = '', img = '', pt = '';
      if (art) {
        t = art.ContentHeading;
        img = `https://backoffice.channel24bd.tv/media/imgAll/${art.ImageBgPath}`;
        pt = art.create_date ? formatPostTime(art.create_date) : '';
      } else {
        const m = await getMetadata(trimmed);
        if (m) { t = m.title; img = m.image; if (m.publishDate) pt = formatSitemapTime(m.publishDate); }
      }

      if (t && img) {
        setTitle(t);
        setImageUrl(img);
        toast.success("Post data fetched");
      } else toast.error("Post not found");
    } catch (e) { toast.error("Failed to fetch"); }
    finally { setIsFetching(false); }
  };

  const saveRecord = async (record: AutoRecord) => {
    const db = await initDB(DB_NAME, STORE_NAME);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    await new Promise(r => tx.oncomplete = r);
  };

  // --- Generation Core ---

  const generatePhotoCardInternal = async (targetTitle: string, targetImageUrl: string): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found");
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Context not found");

    const templateId = localStorage.getItem('bg_selected_template') || 'default';
    const templatePath = templates.find(t => t.id === templateId)?.path || '/PhotocardTemplate.png';
    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.src = templatePath;
    await new Promise((res, rej) => { templateImg.onload = res; templateImg.onerror = rej; });

    const activeAdId = localStorage.getItem('bg_selected_ad');
    let adImg: HTMLImageElement | null = null;
    if (activeAdId) {
      const adBlob = await getAdBlob(activeAdId);
      if (adBlob) {
        adImg = new Image();
        adImg.src = URL.createObjectURL(adBlob);
        await new Promise((res) => { adImg!.onload = res; adImg!.onerror = () => { adImg = null; res(null); }; });
      }
    }

    const CW = 1080;
    let CH = 1080;
    let adH = 0;
    if (adImg) {
      const scale = CW / adImg.width;
      adH = adImg.height * scale;
      CH += adH;
    }

    canvas.width = CW;
    canvas.height = CH;
    ctx.clearRect(0, 0, CW, CH);
    ctx.drawImage(templateImg, 0, 0, 1080, 1080);

    let userImgBlobUrl = (targetImageUrl.startsWith('blob:') || targetImageUrl.startsWith('data:'))
      ? targetImageUrl
      : await fetchImageWithProxy(targetImageUrl);
    const userImg = new Image();
    userImg.src = userImgBlobUrl;
    await new Promise((res, rej) => { userImg.onload = res; userImg.onerror = rej; });

    const BOX = { x: 30, y: 32, w: 1020, h: 574 };
    const s = Math.max(BOX.w / userImg.width, BOX.h / userImg.height);
    const dW = userImg.width * s, dH = userImg.height * s;
    const dX = BOX.x + (BOX.w - dW) / 2, dY = BOX.y + (BOX.h - dH) / 2;

    const r = 35;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(BOX.x + r, BOX.y); ctx.lineTo(BOX.x + BOX.w - r, BOX.y);
    ctx.quadraticCurveTo(BOX.x + BOX.w, BOX.y, BOX.x + BOX.w, BOX.y + r);
    ctx.lineTo(BOX.x + BOX.w, BOX.y + BOX.h - r);
    ctx.quadraticCurveTo(BOX.x + BOX.w, BOX.y + BOX.h, BOX.x + BOX.w - r, BOX.y + BOX.h);
    ctx.lineTo(BOX.x + r, BOX.y + BOX.h);
    ctx.quadraticCurveTo(BOX.x, BOX.y + BOX.h, BOX.x, BOX.y + BOX.h - r);
    ctx.lineTo(BOX.x, BOX.y + r); ctx.quadraticCurveTo(BOX.x, BOX.y, BOX.x + r, BOX.y);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(userImg, dX, dY, dW, dH);
    ctx.restore();
    ctx.lineWidth = 2; ctx.strokeStyle = '#FF0000'; ctx.stroke();

    const fs = Number(localStorage.getItem('bg_font_size')) || 70;
    const ls = Number(localStorage.getItem('bg_title_letter_spacing')) || -2.4;
    const lhf = Number(localStorage.getItem('bg_line_height_factor')) || 0.9;
    const dfs = Number(localStorage.getItem('bg_date_font_size')) || 20;
    const dx = Number(localStorage.getItem('bg_date_x_offset')) || -40;
    const dy = Number(localStorage.getItem('bg_date_y_offset')) || -30;

    ctx.font = `${dfs}px "Cambria"`; ctx.fillStyle = 'white';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(formatDate(new Date()), 88 + dx, 702 + dy);

    ctx.textAlign = 'center'; ctx.letterSpacing = `${ls}px`;
    let curFS = fs, lines: string[] = [], maxW = 980, attempts = 0;
    while (attempts < 10) {
      ctx.font = `bold ${curFS}px "Cambria"`;
      lines = wrapText(ctx, targetTitle, maxW);
      let mLW = 0; lines.forEach(l => mLW = Math.max(mLW, ctx.measureText(l).width));
      if (lines.length <= 3 && mLW <= maxW) break;
      curFS *= 0.9; attempts++;
    }
    const lh = curFS * lhf, totalH = (lines.length - 1) * lh, startY = 860 - (totalH / 2);
    lines.forEach((l, i) => ctx.fillText(l, 540, startY + (i * lh)));

    if (adImg) ctx.drawImage(adImg, 0, 1080, CW, adH);
    if (userImgBlobUrl.startsWith('blob:') && userImgBlobUrl !== targetImageUrl) URL.revokeObjectURL(userImgBlobUrl);
    if (adImg && adImg.src.startsWith('blob:')) URL.revokeObjectURL(adImg.src);

    return canvas.toDataURL('image/png');
  };

  const generatePhotoCard = async () => {
    const finalImg = uploadedImage || imageUrl;
    if (!title || !finalImg) return toast.error("Provide title and image");
    setIsGenerating(true);
    try {
      const restrictions = JSON.parse(localStorage.getItem('bg_secret_word_restrictions') || '{}');
      const censored = censorText(title, restrictions);
      const url = await generatePhotoCardInternal(censored, finalImg);
      setPreviewUrl(url);
      setGeneratedTitle(censored);

      const record: AutoRecord = {
        id: Math.random().toString(36).substr(2, 9),
        url: postUrl || 'manual', title: censored, imageUrl: finalImg, previewUrl: url,
        timestamp: new Date().toISOString()
      };
      await saveRecord(record);
      setAutoRecords(prev => [record, ...prev].slice(0, 50));
      toast.success("Generated!");
      new Audio(localStorage.getItem('bg_secret_audio') || '/Alert.mp3').play().catch(()=>{});
    } catch (e) { toast.error("Failed"); }
    finally { setIsGenerating(false); }
  };

  const fetchImageWithProxy = async (url: string) => {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  const wrapText = (ctx: any, text: string, maxW: number) => {
    const words = text.split(' ');
    const lines = []; let cur = '';
    for (let w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW) { lines.push(cur); cur = w; }
      else cur = t;
    }
    lines.push(cur); return lines;
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]} | ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatPostTime = (str: string) => {
    try {
      const parts = str.split(','); if (parts.length < 3) return '';
      const t = parts[parts.length - 1].trim(), [h, m] = t.split(':');
      const h12 = parseInt(h) % 12 || 12, ampm = parseInt(h) >= 12 ? 'PM' : 'AM';
      return `[${h12}:${m} ${ampm}] [Today]`; // Simplified for refactor
    } catch (e) { return ''; }
  };

  const formatSitemapTime = (iso: string) => {
    const d = new Date(iso), h = d.getHours();
    const h12 = h % 12 || 12, m = String(d.getMinutes()).padStart(2, '0'), ampm = h >= 12 ? 'PM' : 'AM';
    return `[${h12}:${m} ${ampm}] [Today]`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === atob(ENC_PW)) {
      setIsAuthorized(true);
      localStorage.setItem('bg_authorized', 'true');
    } else toast.error("Invalid key");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
           <div className="flex flex-col items-center gap-6">
             <img src="/Logoicon.svg" className="w-16 h-16" />
             <h1 className="text-xl font-bold text-white">Channel 24 Photocard Tool</h1>
           </div>
           <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2">
               <Label htmlFor="password-input">Security Key</Label>
               <Input id="password-input" placeholder="Enter Key" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="bg-zinc-800 border-zinc-700" />
             </div>
             <Button type="submit" className="w-full h-12 rounded-xl font-bold">Access Tool</Button>
           </form>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch(activePage) {
      case 'home': return (
        <Home
          postUrl={postUrl} setPostUrl={setPostUrl} title={title} setTitle={setTitle}
          imageUrl={imageUrl} setImageUrl={setImageUrl} uploadedImage={uploadedImage} setUploadedImage={setUploadedImage}
          isFetching={isFetching} fetchPostData={fetchPostData} isGenerating={isGenerating} generatePhotoCard={generatePhotoCard}
          previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} setGeneratedTitle={setGeneratedTitle}
          clearAll={() => { setPostUrl(''); setTitle(''); setImageUrl(''); setUploadedImage(null); setPreviewUrl(null); }}
          autoModeActive={autoModeActive} setAutoModeActive={setAutoModeActive} isLeader={isLeader}
          automationMode={localStorage.getItem('bg_secret_automation_mode') || 'main'}
          showLogs={showLogs} setShowLogs={setShowLogs} autoLogs={autoLogs} autoRecords={autoRecords}
          handleDelete={async (id) => {
            const db = await initDB(DB_NAME, STORE_NAME);
            db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
            setAutoRecords(prev => prev.filter(r => r.id !== id));
          }}
          clearRecords={async () => {
            const db = await initDB(DB_NAME, STORE_NAME);
            db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
            setAutoRecords([]);
          }}
          checkAndGenerate={checkAndGenerate} nextFetchLimitRef={nextFetchLimitRef}
          copyToClipboard={(text) => { navigator.clipboard.writeText(text); toast.success("Copied"); }}
          fileInputRef={fileInputRef}
          handleImageUpload={(e) => {
             const file = e.target.files?.[0];
             if (file) { setUploadedImage(URL.createObjectURL(file)); setImageUrl(''); }
          }}
        />
      );
      case 'templates': return <Templates />;
      case 'ads': return <Ads />;
      case 'settings': return <Settings />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden group/sidebar">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 ml-16 group-hover/sidebar:ml-64 transition-all duration-300 p-8 lg:p-12 min-w-0">
        {renderPage()}
      </main>
      <canvas ref={canvasRef} className="hidden" />
      <Sonner />
    </div>
  );
};

export default Secret;
