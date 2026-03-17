import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { censorText } from "@/lib/censor";
import { Download, RefreshCw, Image as ImageIcon, ChevronUp, ChevronDown, ChevronRight, ClipboardPaste, List, Zap, Play, Square, Trash2, Copy, Trash } from "lucide-react";
import { toast } from "sonner";

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

interface AdData {
  id: string;
  name: string;
  data: string;
}

const DB_NAME = 'SecretBGDB';
const STORE_NAME = 'photocards';

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

  const allRecords = await new Promise<AutoRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (allRecords.length >= 50) {
    const sorted = allRecords.sort((a, b) => {
      const aVal = a.contentId || new Date(a.timestamp).getTime();
      const bVal = b.contentId || new Date(b.timestamp).getTime();
      return aVal - bVal;
    });
    const toDeleteCount = (allRecords.length - 50) + 1;
    const deleteTx = db.transaction(STORE_NAME, 'readwrite');
    const deleteStore = deleteTx.objectStore(STORE_NAME);
    for (let i = 0; i < toDeleteCount; i++) {
      deleteStore.delete(sorted[i].id);
    }
    await new Promise((resolve) => { deleteTx.oncomplete = resolve; });
  }

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

const AD_DB_NAME = 'AdImagesDB';
const AD_STORE_NAME = 'ads';

const initAdDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AD_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AD_STORE_NAME)) {
        db.createObjectStore(AD_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getSelectedAd = async (id: string): Promise<AdData | undefined> => {
  const db = await initAdDB();
  return new Promise<AdData | undefined>((resolve, reject) => {
    const tx = db.transaction(AD_STORE_NAME, 'readonly');
    const store = tx.objectStore(AD_STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const FREQ_OPTIONS = [
  { id: '1m3p', label: '1m 3p', interval: 60000, limit: 3 },
  { id: '2m6p', label: '2m 6p', interval: 120000, limit: 6 },
  { id: '3m6p', label: '3m 6p', interval: 180000, limit: 6 }
];

const Home = () => {
  const [postUrl, setPostUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState('');

  const [autoModeActive, setAutoModeActive] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const isAutoCheckingRef = useRef(false);
  const [autoRecords, setAutoRecords] = useState<AutoRecord[]>([]);
  const [autoLogs, setAutoLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<Map<string, number>>(new Map());
  const processedUrlsRef = useRef<Map<string, number>>(new Map());

  const nextFetchLimitRef = useRef<number | null>(null);
  const backupInitializedRef = useRef(false);

  // Settings loaded from localStorage
  const [wordRestrictions, setWordRestrictions] = useState<Record<string, string>>({});
  const [automationFrequency, setAutomationFrequency] = useState(FREQ_OPTIONS[0]);
  const [automationMode, setAutomationMode] = useState<'main' | 'backup'>('main');
  const [selectedAudio, setSelectedAudio] = useState('/Alert.mp3');

  // Typography Settings
  const [fontSize, setFontSize] = useState(70);
  const [dateXOffset, setDateXOffset] = useState(-40);
  const [dateYOffset, setDateYOffset] = useState(-30);
  const [dateFontSize, setDateFontSize] = useState(20);
  const [titleLetterSpacing, setTitleLetterSpacing] = useState(-2.4);
  const [lineHeightFactor, setLineHeightFactor] = useState(0.9);

  const automationFrequencyRef = useRef(automationFrequency);
  const automationModeRef = useRef<'main' | 'backup'>(automationMode);
  const wordRestrictionsRef = useRef(wordRestrictions);

  useEffect(() => {
    const loadSettings = () => {
      const savedWords = localStorage.getItem('bg_secret_word_restrictions');
      if (savedWords) setWordRestrictions(JSON.parse(savedWords));

      const savedFreq = localStorage.getItem('bg_secret_automation_frequency');
      if (savedFreq) {
        const found = FREQ_OPTIONS.find(opt => opt.id === savedFreq);
        if (found) setAutomationFrequency(found);
      }

      const savedMode = localStorage.getItem('bg_secret_automation_mode') as 'main' | 'backup';
      if (savedMode) setAutomationMode(savedMode);

      setSelectedAudio(localStorage.getItem('bg_secret_audio') || '/Alert.mp3');

      setFontSize(Number(localStorage.getItem('bg_font_size') || 70));
      setTitleLetterSpacing(Number(localStorage.getItem('bg_letter_spacing') || -2.4));
      setLineHeightFactor(Number(localStorage.getItem('bg_line_height') || 0.9));
      setDateFontSize(Number(localStorage.getItem('bg_date_font_size') || 20));
      setDateXOffset(Number(localStorage.getItem('bg_date_x_offset') || -40));
      setDateYOffset(Number(localStorage.getItem('bg_date_y_offset') || -30));
    };

    loadSettings();
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  useEffect(() => {
    processedUrlsRef.current = processedUrls;
    automationModeRef.current = automationMode;
    wordRestrictionsRef.current = wordRestrictions;
    automationFrequencyRef.current = automationFrequency;
  }, [processedUrls, automationMode, wordRestrictions, automationFrequency]);

  useEffect(() => {
    const preloadFonts = async () => {
      try {
        await Promise.all([
          document.fonts.load('bold 70px "Cambria"'),
          document.fonts.load('20px "Cambria"'),
          document.fonts.load('400 16px "Solaiman Lipi"'),
          document.fonts.load('700 16px "Solaiman Lipi"')
        ]);
      } catch (e) { console.warn("Font preloading failed", e); }
    };
    preloadFonts();

    const savedUrls = localStorage.getItem('bg_secret_processed_urls');
    if (savedUrls) {
      try {
        const parsed = JSON.parse(savedUrls);
        const map = new Map<string, number>();
        parsed.forEach((item: { url: string; timestamp?: number }) => map.set(item.url, item.timestamp || Date.now()));
        setProcessedUrls(map);
      } catch (e) { console.error("Failed to parse processed URLs", e); }
    }

    if (localStorage.getItem('bg_secret_auto_active') === 'true') setAutoModeActive(true);

    getAllRecordsDB().then(records => {
      setAutoRecords(records.sort((a, b) => (b.contentId || new Date(b.timestamp).getTime()) - (a.contentId || new Date(a.timestamp).getTime())));
    });
  }, []);

  useEffect(() => {
    const data = Array.from(processedUrls.entries()).map(([url, timestamp]) => ({ url, timestamp }));
    localStorage.setItem('bg_secret_processed_urls', JSON.stringify(data));
  }, [processedUrls]);

  useEffect(() => {
    localStorage.setItem('bg_secret_auto_active', String(autoModeActive));
  }, [autoModeActive]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setAutoLogs(prev => [{ message, timestamp: Date.now(), type }, ...prev.slice(0, 99)]);
  }, []);

  const playNotification = useCallback(() => {
    new Audio(selectedAudio).play().catch(e => console.warn("Audio play failed", e));
  }, [selectedAudio]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
      setUploadedImage(URL.createObjectURL(file));
      setImageUrl('');
      toast.success("Image uploaded");
    }
  };

  const clearUploadedImage = () => {
    if (uploadedImage) URL.revokeObjectURL(uploadedImage);
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const getRelativeDateStr = (date: Date) => {
    const diffDays = Math.floor((new Date().setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return diffDays < 7 ? `${diffDays} days ago` : diffDays === 7 ? 'A week ago' : `${Math.floor(diffDays/7)} weeks ago`;
  };

  const formatSitemapTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const h = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      const relative = getRelativeDateStr(date);
      return `[${h12}:${minutes} ${ampm}] [${relative}]`;
    } catch (e) { return ''; }
  };

  const fetchImageWithProxy = async (url: string): Promise<string> => {
    const proxies = [
      (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    ];
    if (!url.includes('bangladeshguardian.com')) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) return URL.createObjectURL(await res.blob());
      } catch (e) { console.warn("Direct fetch failed", e); }
    }
    for (const p of proxies) {
      try {
        const res = await fetch(p(url));
        if (res.ok) return URL.createObjectURL(await res.blob());
      } catch (e) { console.warn("Proxy failed", e); }
    }
    throw new Error("Failed to load image");
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' '), lines = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth) { lines.push(currentLine); currentLine = word; }
      else currentLine = test;
    }
    lines.push(currentLine);
    return lines;
  };

  const generatePhotoCardInternal = useCallback(async (targetTitle: string, targetImageUrl: string): Promise<string> => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    // Load Template
    const templateName = localStorage.getItem('bg_selected_template') || 'PhotocardTemplate.png';
    const template = new Image();
    template.crossOrigin = "anonymous";
    template.src = `/${templateName}`;
    await new Promise(r => { template.onload = r; });

    // Load Ad
    let adImg: HTMLImageElement | null = null;
    const selectedAdId = localStorage.getItem('bg_selected_ad');
    if (selectedAdId) {
      const adData = await getSelectedAd(selectedAdId);
      if (adData) {
        adImg = new Image();
        adImg.src = adData.data;
        await new Promise(r => { adImg!.onload = r; });
      }
    }

    const adHeight = adImg ? (CANVAS_WIDTH / adImg.width) * adImg.height : 0;
    canvas.height = CANVAS_HEIGHT + adHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (adImg) {
      ctx.drawImage(adImg, 0, CANVAS_HEIGHT, CANVAS_WIDTH, adHeight);
    }

    const userImgBlobUrl = (targetImageUrl.startsWith('blob:') || targetImageUrl.startsWith('data:')) ? targetImageUrl : await fetchImageWithProxy(targetImageUrl);
    const userImg = new Image();
    userImg.src = userImgBlobUrl;
    await new Promise(r => { userImg.onload = r; });

    const scale = Math.max(BOX.w / userImg.width, BOX.h / userImg.height);
    const drawW = userImg.width * scale, drawH = userImg.height * scale;
    const drawX = BOX.x + (BOX.w - drawW) / 2, drawY = BOX.y + (BOX.h - drawH) / 2;

    const radius = 35;
    ctx.save();
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
    ctx.clip();
    ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    ctx.font = `${dateFontSize}px "Cambria"`; ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(formatDate(new Date()), DATE_X + dateXOffset, DATE_Y + dateYOffset);

    let curFS = fontSize; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.letterSpacing = `${titleLetterSpacing}px`;
    let lines: string[] = [];
    for (let i=0; i<10; i++) {
      ctx.font = `bold ${curFS}px "Cambria"`;
      lines = wrapText(ctx, targetTitle, 980);
      if (lines.length <= 3 && Math.max(...lines.map(l => ctx.measureText(l).width)) <= 980) break;
      curFS *= 0.9;
    }
    const lh = curFS * lineHeightFactor;
    lines.forEach((l, i) => ctx.fillText(l, TITLE_X, TITLE_Y - ((lines.length - 1) * lh / 2) + (i * lh)));

    if (userImgBlobUrl.startsWith('blob:') && userImgBlobUrl !== targetImageUrl) URL.revokeObjectURL(userImgBlobUrl);
    return canvas.toDataURL('image/png');
  }, [dateFontSize, dateXOffset, dateYOffset, fontSize, lineHeightFactor, titleLetterSpacing]);

  const generatePhotoCard = useCallback(async (isLive = false) => {
    const finalImg = uploadedImage || imageUrl;
    if (!title || !finalImg) { if (!isLive) toast.error("Provide title and image"); return; }
    if (!isLive) setIsGenerating(true);
    try {
      const censored = censorText(title, wordRestrictionsRef.current);
      const dataUrl = await generatePhotoCardInternal(censored, finalImg);
      setPreviewUrl(dataUrl); setGeneratedTitle(censored);
      if (!isLive) {
        const now = new Date();
        const manualTime = `[Manually Generated at ${now.getHours()%12||12}:${now.getMinutes().toString().padStart(2,'0')} ${now.getHours()>=12?'PM':'AM'}] [${getRelativeDateStr(now)}]`;
        const record = { id: Math.random().toString(36).substr(2, 9), url: postUrl || 'manual', title: censored, imageUrl: finalImg, previewUrl: dataUrl, timestamp: now.toISOString(), postTime: manualTime };
        await saveRecordDB(record);
        setAutoRecords(prev => [record, ...prev].slice(0, 50));
        toast.success("Generated!"); playNotification();
      }
    } catch (e) { if (!isLive) { console.error(e); toast.error("Failed to generate"); } }
    finally { if (!isLive) setIsGenerating(false); }
  }, [uploadedImage, imageUrl, title, postUrl, playNotification, generatePhotoCardInternal]);

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
          html = proxy.type === 'json' ? (await response.json()).contents : await response.text();
          if (html && (html.includes('<title>') || html.includes('og:title'))) break;
        }
      } catch (e) {}
    }
    if (!html) return null;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return {
      title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.querySelector('title')?.textContent || '',
      image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '',
      publishDate: doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || doc.querySelector('meta[name="publish-date"]')?.getAttribute('content') || ''
    };
  };

  const fetchPostData = async () => {
    const trimmedUrl = postUrl.trim().replace(/\/$/, '');
    if (!trimmedUrl) { toast.error("Please enter a Post URL"); return; }
    setIsFetching(true);
    try {
      const contentId = trimmedUrl.split('/').pop();
      const response = await fetch("https://backoffice.bangladeshguardian.com/api-en/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: 50, offset: 0 })
      });
      const data = await response.json();
      const article = (data.archive_data || []).find((item: BGArchiveItem) => String(item.ContentID) === contentId);

      let eTitle = '', eImage = '', postTime = '';
      if (article) {
        eTitle = article.ContentHeading;
        eImage = `https://backoffice.bangladeshguardian.com/media/imgAll/${article.ImageBgPath}`;
        postTime = article.create_date ? formatSitemapTime(article.create_date) : '';
      } else {
        const meta = await getMetadata(trimmedUrl);
        if (meta && meta.title && meta.image) {
          eTitle = meta.title; eImage = meta.image;
          if (meta.publishDate) postTime = formatSitemapTime(meta.publishDate);
        } else { toast.error("Post not found."); return; }
      }

      const censored = censorText(eTitle, wordRestrictionsRef.current);
      const dataUrl = await generatePhotoCardInternal(censored, eImage);
      setPreviewUrl(dataUrl); setGeneratedTitle(censored);
      const record = { id: Math.random().toString(36).substr(2, 9), url: trimmedUrl, title: censored, imageUrl: eImage, previewUrl: dataUrl, timestamp: new Date().toISOString(), postTime, contentId: parseInt(contentId || '0') };
      await saveRecordDB(record);
      setAutoRecords(prev => [record, ...prev].slice(0, 50));
      setProcessedUrls(prev => new Map(prev).set(trimmedUrl, Date.now()));
      toast.success("Generated!"); playNotification();
    } catch (error) { toast.error("Failed to fetch post data."); } finally { setIsFetching(false); }
  };

  const scrapeLatestLinks = async (fetchLimit: number = 3) => {
    try {
      const response = await fetch("https://backoffice.bangladeshguardian.com/api-en/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: fetchLimit, offset: 0 })
      });
      const data = await response.json();
      return (data.archive_data || []).map((item: BGArchiveItem) => ({
        url: `https://www.bangladeshguardian.com/${item.Slug}/${item.ContentID}`,
        title: item.ContentHeading,
        image: `https://backoffice.bangladeshguardian.com/media/imgAll/${item.ImageBgPath}`,
        postTime: item.create_date ? formatSitemapTime(item.create_date) : '',
        contentId: item.ContentID
      }));
    } catch (e) { return null; }
  };

  const scrapeSitemapLinks = async () => {
    const now = new Date();
    const sitemapUrl = `https://www.bangladeshguardian.com/english-sitemap/sitemap-daily-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xml`;
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) return [];
      const xmlDoc = new DOMParser().parseFromString(await response.text(), "text/xml");
      return Array.from(xmlDoc.getElementsByTagName("url")).map(node => {
        const loc = node.getElementsByTagName("loc")[0]?.textContent || '';
        return {
          url: loc.trim(),
          title: '',
          image: node.getElementsByTagName("image:loc")[0]?.textContent || '',
          postTime: node.getElementsByTagName("lastmod")[0]?.textContent ? formatSitemapTime(node.getElementsByTagName("lastmod")[0].textContent!) : '',
          contentId: parseInt(loc.replace(/\/$/, '').split('/').pop() || '0')
        };
      }).filter(i => i.url && i.image).reverse();
    } catch (e) { return []; }
  };

  const checkAndGenerate = useCallback(async () => {
    if (isAutoCheckingRef.current) return;
    isAutoCheckingRef.current = true; setIsAutoChecking(true);
    const limit = nextFetchLimitRef.current || automationFrequencyRef.current.limit;
    nextFetchLimitRef.current = null;
    addLog(`Checking for new posts (${automationModeRef.current.toUpperCase()} MODE)...`, "process");
    try {
      if (automationModeRef.current === 'backup' && !backupInitializedRef.current) {
        addLog("Initializing Backup mode...", "process");
        const articles = await scrapeSitemapLinks();
        const nextMap = new Map(processedUrlsRef.current);
        articles.forEach(art => nextMap.set(art.url, Date.now()));
        setProcessedUrls(nextMap);
        backupInitializedRef.current = true;
        addLog(`Backup mode initialized with ${articles.length} posts.`, "success");
        return;
      }
      const articles = automationModeRef.current === 'main' ? await scrapeLatestLinks(limit) : await scrapeSitemapLinks();
      const newArticles = (articles || []).filter(art => !processedUrlsRef.current.has(art.url)).slice(0, limit).reverse();
      if (newArticles.length === 0) addLog("No new posts found.");
      else {
        addLog(`Found ${newArticles.length} new post(s).`);
        for (const article of newArticles) {
          let artTitle = article.title, artImage = article.image;
          if (!artTitle || !artImage) {
            const meta = await getMetadata(article.url);
            if (meta) { artTitle = artTitle || meta.title; artImage = artImage || meta.image; }
          }
          if (artTitle && artImage) {
            const censored = censorText(artTitle, wordRestrictionsRef.current);
            const dataUrl = await generatePhotoCardInternal(censored, artImage);
            const record = { id: Math.random().toString(36).substr(2, 9), url: article.url, title: censored, imageUrl: artImage, previewUrl: dataUrl, timestamp: new Date().toISOString(), postTime: article.postTime, contentId: article.contentId };
            await saveRecordDB(record);
            setAutoRecords(prev => [record, ...prev].slice(0, 50));
            setProcessedUrls(prev => new Map(prev).set(article.url, Date.now()));
            toast.success(`Auto-generated: ${censored}`); playNotification();
          }
        }
      }
    } catch (e) { addLog("Automation error.", "error"); } finally { setIsAutoChecking(false); isAutoCheckingRef.current = false; }
  }, [addLog, generatePhotoCardInternal, playNotification]);

  useEffect(() => {
    if (!autoModeActive) return;
    let wakeLock: any = null;
    let isMounted = true;
    const controller = new AbortController();
    const startAutomation = (intervalMs: number) => {
      const blob = new Blob([`let i; self.onmessage=e=>{if(e.data==='start'){self.postMessage('tick');i=setInterval(()=>self.postMessage('tick'),${intervalMs})}else if(e.data==='stop')clearInterval(i)}`], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      worker.onmessage = e => { if (e.data === 'tick') checkAndGenerate(); };
      worker.postMessage('start');
      return { worker, url };
    };
    let workerInstance: any = null;
    const init = async () => {
      try { if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (err) {}
      try {
        if ('locks' in navigator) {
          navigator.locks.request('bg_photocard_automation', { signal: controller.signal }, async () => {
            if (!isMounted) return; setIsLeader(true); addLog("Took leadership of automation.", "success");
            workerInstance = startAutomation(automationFrequency.interval);
            await new Promise(resolve => controller.signal.addEventListener('abort', resolve));
            setIsLeader(false);
          }).catch(err => { if (err.name !== 'AbortError') { setIsLeader(false); addLog("Automation standby (Active in another tab)", "info"); } });
        } else { setIsLeader(true); workerInstance = startAutomation(automationFrequency.interval); }
      } catch (err) { setIsLeader(true); workerInstance = startAutomation(automationFrequency.interval); }
    };
    init();
    return () => { isMounted = false; controller.abort(); if (wakeLock) wakeLock.release().catch(() => {}); if (workerInstance) { workerInstance.worker.postMessage('stop'); workerInstance.worker.terminate(); URL.revokeObjectURL(workerInstance.url); } };
  }, [autoModeActive, automationFrequency.interval, checkAndGenerate, addLog]);

  useEffect(() => {
    const finalImg = uploadedImage || imageUrl;
    if (!localStorage.getItem('bg_live_preview') || !title || !finalImg) return;
    const t = setTimeout(() => generatePhotoCard(true), 500);
    return () => clearTimeout(t);
  }, [title, imageUrl, uploadedImage, generatePhotoCard]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>News post URL</Label>
              <div className="flex gap-2">
                <Textarea value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://..." className="bg-zinc-800 border-zinc-700 min-h-[80px]" />
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigator.clipboard.readText().then(setPostUrl)}><ClipboardPaste className="w-4 h-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={fetchPostData} disabled={isFetching || !postUrl}>
                    {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative py-2 text-center"><span className="text-[10px] text-zinc-500 uppercase tracking-widest">OR MANUAL</span><div className="absolute inset-y-1/2 left-0 right-0 border-t border-zinc-800 -z-10"></div></div>
            <div className="space-y-2">
              <Label>Title Text</Label>
              <div className="flex gap-2">
                <Textarea value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..." className="bg-zinc-800 border-zinc-700 min-h-[80px]" />
                <Button variant="outline" size="icon" onClick={() => navigator.clipboard.readText().then(setTitle)}><ClipboardPaste className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL..." className="bg-zinc-800 border-zinc-700 h-12" disabled={!!uploadedImage} />
                <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => fileInputRef.current?.click()}><ImageIcon className="w-4 h-4" /></Button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => generatePhotoCard()} disabled={isGenerating}>{isGenerating ? <RefreshCw className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />} Generate Preview</Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => { setTitle(''); setImageUrl(''); setPreviewUrl(null); setPostUrl(''); clearUploadedImage(); }}><Trash2 className="w-4 h-4" /></Button>
          </div>
          {previewUrl && <Button variant="secondary" className="w-full h-12 rounded-xl" onClick={() => { const a = document.createElement('a'); a.download='card.png'; a.href=previewUrl; a.click(); }}><Download className="mr-2" /> Download PNG</Button>}
        </div>

        <div className="w-full md:w-[400px] space-y-6">
          <div className="aspect-square bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex items-center justify-center shadow-2xl relative">
            {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" /> : <div className="text-zinc-600 flex flex-col items-center gap-4"><ImageIcon className="w-16 h-16 opacity-20" /><span className="text-sm">Preview will appear here</span></div>}
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden" />
          </div>
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary"><Zap className="w-4 h-4" /> AUTOMATION</h3>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", !autoModeActive ? 'bg-zinc-600' : isLeader ? 'bg-green-500 animate-pulse' : 'bg-amber-500')} />
                <span className="text-[10px] uppercase font-bold">{!autoModeActive ? 'Idle' : isLeader ? `Active (${automationMode})` : 'Standby'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant={autoModeActive ? "destructive" : "default"} className="flex-1 h-11 rounded-xl" onClick={() => setAutoModeActive(!autoModeActive)}>{autoModeActive ? <><Square className="w-4 h-4 mr-2"/> STOP</> : <><Play className="w-4 h-4 mr-2"/> START</>}</Button>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => setShowLogs(!showLogs)}><List className="w-4 h-4" /></Button>
            </div>
            {showLogs && (
              <div className="bg-black/40 rounded-xl p-4 h-40 overflow-y-auto font-mono text-[10px] space-y-1">
                {autoLogs.length ? autoLogs.map((l, i) => <div key={i} className={cn(l.type==='success'?'text-green-500':l.type==='error'?'text-red-500':l.type==='process'?'text-primary':'text-zinc-500')}>[{new Date(l.timestamp).toLocaleTimeString()}] {l.message}</div>) : <div className="italic text-zinc-700 text-center py-8">No logs yet</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-12">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3"><List className="w-6 h-6 text-primary" /> GENERATIONS</h2>
          <Button variant="destructive" size="sm" className="rounded-xl px-4" onClick={() => { if(window.confirm('Clear all?')) { clearRecordsDB(); setAutoRecords([]); } }}><Trash className="w-4 h-4 mr-2" /> CLEAR ALL</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {autoRecords.map(r => (
            <div key={r.id} className="group flex flex-col bg-zinc-900/40 rounded-3xl border border-zinc-800/50 p-4 transition-all hover:bg-zinc-900/60 hover:scale-[1.02]">
              <div className="mb-4 flex items-start gap-3">
                <button onClick={() => { navigator.clipboard.writeText(r.url); toast.success("URL copied"); }} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><Copy className="w-3 h-3" /></button>
                <div className="flex-1 min-w-0"><h3 className="text-sm font-bold line-clamp-2 leading-tight">{r.title}</h3><p className="text-[10px] text-zinc-500 mt-1">{r.postTime}</p></div>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-inner group-hover:shadow-2xl transition-all"><img src={r.previewUrl} alt={r.title} className="w-full h-full object-contain" /></div>
              <div className="mt-4 flex gap-2">
                <Button variant="destructive" className="flex-1 h-10 rounded-xl text-xs" onClick={() => { const a=document.createElement('a'); a.download=`${r.title}.png`; a.href=r.previewUrl; a.click(); }}><Download className="w-3.5 h-3.5 mr-2" /> DOWNLOAD</Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => { if(window.confirm('Delete?')) { deleteRecordDB(r.id); setAutoRecords(prev => prev.filter(x => x.id !== r.id)); } }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
