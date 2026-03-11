import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { censorText, defaultMappings } from "@/lib/censor";
import { Download, RefreshCw, Image as ImageIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings2, X, ClipboardPaste, History, Clock, AlertCircle, List, Zap, Play, Square, Trash2, Volume2, Eye, EyeOff, Copy, Plus, ShieldAlert, ArrowRight, CloudUpload, Link as LinkIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { puter } from '@heyputer/puter.js';

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

const FREQ_OPTIONS = [
  { id: '1m3p', label: '1m 3p', interval: 60000, limit: 3 },
  { id: '2m6p', label: '2m 6p', interval: 120000, limit: 6 },
  { id: '3m6p', label: '3m 6p', interval: 180000, limit: 6 }
];

const Secret = () => {
  const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('bg_authorized') === 'true');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // File Storage State
  const [showStoragePopup, setShowStoragePopup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postUrl, setPostUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fontSize, setFontSize] = useState(70);
  const [dateXOffset, setDateXOffset] = useState(-40);
  const [dateYOffset, setDateYOffset] = useState(-30);
  const [dateFontSize, setDateFontSize] = useState(20);
  const [titleLetterSpacing, setTitleLetterSpacing] = useState(-2.4);
  const [lineHeightFactor, setLineHeightFactor] = useState(0.9);
  const [livePreview, setLivePreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showRestrictionsSettings, setShowRestrictionsSettings] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateRef = useRef<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState('');

  // Audio State
  const [selectedAudio, setSelectedAudio] = useState(localStorage.getItem('bg_secret_audio') || '/Alert.mp3');

  // Word Restrictions State
  const [wordRestrictions, setWordRestrictions] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('bg_secret_word_restrictions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultMappings;
      }
    }
    return defaultMappings;
  });

  useEffect(() => {
    localStorage.setItem('bg_secret_word_restrictions', JSON.stringify(wordRestrictions));
  }, [wordRestrictions]);

  // Automation State
  const [automationMode, setAutomationMode] = useState<'main' | 'backup'>(() => {
    const saved = localStorage.getItem('bg_secret_automation_mode') as 'main' | 'backup';
    const lastSwitch = localStorage.getItem('bg_secret_automation_switch_time');
    if (saved === 'backup' && lastSwitch) {
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      if (parseInt(lastSwitch) < tenMinutesAgo) {
        return 'main';
      }
    }
    return saved || 'main';
  });
  const [autoModeActive, setAutoModeActive] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const isAutoCheckingRef = useRef(false);
  const [autoRecords, setAutoRecords] = useState<AutoRecord[]>([]);
  const [autoLogs, setAutoLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<Map<string, number>>(new Map());
  const processedUrlsRef = useRef<Map<string, number>>(new Map());
  const [automationFrequency, setAutomationFrequency] = useState(() => {
    const saved = localStorage.getItem('bg_secret_automation_frequency');
    if (saved) {
      const found = FREQ_OPTIONS.find(opt => opt.id === saved);
      if (found) return found;
    }
    return FREQ_OPTIONS[0];
  });
  const automationFrequencyRef = useRef(automationFrequency);
  const automationModeRef = useRef<'main' | 'backup'>(automationMode);
  const wordRestrictionsRef = useRef<Record<string, string>>(wordRestrictions);
  const nextFetchLimitRef = useRef<number | null>(null);
  const backupInitializedRef = useRef(false);

  useEffect(() => {
    processedUrlsRef.current = processedUrls;
  }, [processedUrls]);

  useEffect(() => {
    automationModeRef.current = automationMode;
  }, [automationMode]);

  useEffect(() => {
    wordRestrictionsRef.current = wordRestrictions;
  }, [wordRestrictions]);

  useEffect(() => {
    automationFrequencyRef.current = automationFrequency;
    localStorage.setItem('bg_secret_automation_frequency', automationFrequency.id);
  }, [automationFrequency]);

  useEffect(() => {
    // Preload fonts
    const preloadFonts = async () => {
      try {
        await Promise.all([
          document.fonts.load('bold 70px "Cambria"'),
          document.fonts.load('20px "Cambria"'),
          document.fonts.load('400 16px "Solaiman Lipi"'),
          document.fonts.load('700 16px "Solaiman Lipi"')
        ]);
      } catch (e) {
        console.warn("Font preloading failed", e);
      }
    };
    preloadFonts();

    // Preload template
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/PhotocardTemplate.png";
    img.onload = () => {
      templateRef.current = img;
    };

    const savedUrls = localStorage.getItem('bg_secret_processed_urls');
    if (savedUrls) {
      try {
        const parsed = JSON.parse(savedUrls);
        if (Array.isArray(parsed)) {
          const map = new Map<string, number>();
          parsed.forEach((item: any) => {
            if (typeof item === 'string') {
              map.set(item, Date.now());
            } else if (item && typeof item === 'object' && item.url) {
              map.set(item.url, item.timestamp || Date.now());
            }
          });
          setProcessedUrls(map);
        }
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
        const aVal = a.contentId || new Date(a.timestamp).getTime();
        const bVal = b.contentId || new Date(b.timestamp).getTime();
        return bVal - aVal;
      });
      setAutoRecords(sorted);
    });
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!autoModeActive) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoModeActive]);

  useEffect(() => {
    const data = Array.from(processedUrls.entries()).map(([url, timestamp]) => ({ url, timestamp }));
    localStorage.setItem('bg_secret_processed_urls', JSON.stringify(data));
  }, [processedUrls]);

  useEffect(() => {
    localStorage.setItem('bg_secret_auto_active', String(autoModeActive));
  }, [autoModeActive]);

  useEffect(() => {
    localStorage.setItem('bg_secret_automation_mode', automationMode);
    localStorage.setItem('bg_secret_automation_switch_time', Date.now().toString());
  }, [automationMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      setAutoLogs(prev => prev.filter(log => log.timestamp > oneHourAgo));

      // Auto-revert Backup mode every 10 minutes
      const savedMode = localStorage.getItem('bg_secret_automation_mode');
      const lastSwitch = localStorage.getItem('bg_secret_automation_switch_time');
      if (savedMode === 'backup' && lastSwitch) {
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        if (parseInt(lastSwitch) < tenMinutesAgo) {
          setAutomationMode('main');
          addLog("Backup mode expired. Reverting to REGULAR mode.");
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = { message, timestamp: Date.now(), type };
    setAutoLogs(prev => [newLog, ...prev]);
  };

  const cleanOldCache = () => {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    let changed = false;
    const nextMap = new Map(processedUrls);
    for (const [url, timestamp] of nextMap.entries()) {
      if (timestamp < twoDaysAgo) {
        nextMap.delete(url);
        changed = true;
      }
    }
    if (changed) {
      setProcessedUrls(nextMap);
      addLog("Cleaned up old cached URLs.");
    }
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

    const pubDate = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="publish-date"]')?.getAttribute('content');

    return {
      title: ogTitle || metaTitle || h1Title || '',
      image: ogImage || twitterImage || '',
      publishDate: pubDate || ''
    };
  };

  const fetchPostData = async () => {
    const trimmedUrl = postUrl.trim().replace(/\/$/, '');
    if (!trimmedUrl) {
      toast.error("Please enter a Post URL");
      return;
    }
    if (!trimmedUrl.includes('bangladeshguardian.com')) {
      toast.error("Only bangladeshguardian.com links are supported");
      return;
    }

    setIsFetching(true);
    try {
      const urlParts = trimmedUrl.split('/');
      const contentId = urlParts[urlParts.length - 1];

      const response = await fetch("https://backoffice.bangladeshguardian.com/api-en/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: 50, offset: 0 })
      });

      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const articles = data.archive_data || [];
      const article = articles.find((item: BGArchiveItem) => String(item.ContentID) === contentId);

      let extractedTitle = '';
      let extractedImage = '';
      let postTime = '';
      let finalContentId = parseInt(contentId);

      if (article) {
        extractedTitle = article.ContentHeading;
        extractedImage = `https://backoffice.bangladeshguardian.com/media/imgAll/${article.ImageBgPath}`;
        postTime = article.create_date ? formatPostTime(article.create_date) : '';
      } else {
        addLog(`Post ${contentId} not in archive. Scraping metadata...`, "info");
        const meta = await getMetadata(trimmedUrl);
        if (meta && meta.title && meta.image) {
          extractedTitle = meta.title;
          extractedImage = meta.image;
          if (meta.publishDate) {
            postTime = formatSitemapTime(meta.publishDate);
          }
        } else {
          toast.error("Post not found and scraping failed.");
          return;
        }
      }

      const censoredTitle = censorText(extractedTitle, wordRestrictions);
      const dataUrl = await generatePhotoCardInternal(censoredTitle, extractedImage);
      setPreviewUrl(dataUrl);
      setGeneratedTitle(censoredTitle);

      const newRecord: AutoRecord = {
        id: Math.random().toString(36).substr(2, 9),
        url: trimmedUrl,
        title: censoredTitle,
        imageUrl: extractedImage,
        previewUrl: dataUrl,
        timestamp: new Date().toISOString(),
        postTime,
        contentId: finalContentId
      };

      await saveRecordDB(newRecord);
      setAutoRecords(prev => {
        const next = [newRecord, ...prev];
        return next.sort((a, b) => {
          const aVal = a.contentId || new Date(a.timestamp).getTime();
          const bVal = b.contentId || new Date(b.timestamp).getTime();
          return bVal - aVal;
        }).slice(0, 50);
      });

      setProcessedUrls(prev => {
        const next = new Map(prev);
        next.set(trimmedUrl, Date.now());
        return next;
      });

      toast.success("Photocard generated successfully!");
      playNotification();
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

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Puter.js will prompt the user to sign in if they aren't already
      const uploadPath = `uploads/${Date.now()}_${selectedFile.name}`;

      // We use puter.fs.write for single file or puter.fs.upload for multiple
      // puter.fs.write is simpler for a single File object
      await puter.fs.write(uploadPath, selectedFile, {
        createMissingParents: true,
        progress: (opId, progress) => {
          // progress is 0-100 as per puter.js source
          setUploadProgress(Math.round(Number(progress)));
        }
      });

      // Once uploaded, get a public-ish URL
      const url = await puter.fs.getReadURL(uploadPath);
      setUploadedUrl(url);
      setUploadProgress(100);
      toast.success("File uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
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

  const getRelativeDateStr = (date: Date) => {
    if (!date || isNaN(date.getTime())) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays === 7) return 'A week ago';
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  };

  const formatPostTime = (apiDateStr: string) => {
    try {
      // Expected input: "Friday, 27 February 2026, 22:21"
      const parts = apiDateStr.split(',');
      if (parts.length < 3) return '';

      const datePart = parts.slice(1, -1).join(',').trim();
      const timePart = parts[parts.length - 1].trim();
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;

      const dateObj = new Date(`${datePart} ${timePart}`);
      const relative = getRelativeDateStr(dateObj);

      return `[${h12}:${minutes} ${ampm}] [${relative}]`;
    } catch (e) {
      return '';
    }
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
      let template = templateRef.current;
      if (!template) {
        template = new Image();
        template.crossOrigin = "anonymous";
        template.src = "/PhotocardTemplate.png";
        await new Promise((resolve, reject) => {
          template.onload = resolve;
          template.onerror = reject;
        });
        templateRef.current = template;
      }
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Even if preloaded, this ensures they are ready for the current font size/style
      // If already loaded, this resolves instantly
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

      const lineHeight = currentFontSize * lineHeightFactor;
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

  const generatePhotoCard = async (isLive = false) => {
    if (!title || !imageUrl) {
      if (!isLive) toast.error("Please provide both title and image URL");
      return;
    }
    if (!isLive) setIsGenerating(true);
    try {
      const censoredTitle = censorText(title, wordRestrictions);
      const dataUrl = await generatePhotoCardInternal(censoredTitle, imageUrl);
      setPreviewUrl(dataUrl);
      setGeneratedTitle(censoredTitle);

      if (!isLive) {
        const now = new Date();
        const h = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        const relative = getRelativeDateStr(now);
        const manualPostTime = `[Manually Generated at ${h12}:${minutes} ${ampm}] [${relative}]`;

        const newRecord: AutoRecord = {
          id: Math.random().toString(36).substr(2, 9),
          url: postUrl || 'manual',
          title: censoredTitle,
          imageUrl: imageUrl,
          previewUrl: dataUrl,
          timestamp: now.toISOString(),
          postTime: manualPostTime
        };

        await saveRecordDB(newRecord);
        setAutoRecords(prev => {
          const next = [newRecord, ...prev];
          return next.sort((a, b) => {
            const aVal = a.contentId || new Date(a.timestamp).getTime();
            const bVal = b.contentId || new Date(b.timestamp).getTime();
            return bVal - aVal;
          }).slice(0, 50);
        });

        if (postUrl && postUrl.includes('bangladeshguardian.com')) {
          setProcessedUrls(prev => {
            const next = new Map(prev);
            next.set(postUrl.trim(), Date.now());
            return next;
          });
        }

        toast.success("Photocard generated!");
        playNotification();
      }
    } catch (error) {
      if (!isLive) toast.error("Failed to generate photocard.");
    } finally {
      if (!isLive) setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!livePreview || !title || !imageUrl) return;

    const timeoutId = setTimeout(() => {
      generatePhotoCard(true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [title, imageUrl, livePreview, fontSize, titleLetterSpacing, lineHeightFactor, dateFontSize, dateXOffset, dateYOffset]);

  const scrapeLatestLinks = async (fetchLimit: number = 3) => {
    try {
      const response = await fetch("https://backoffice.bangladeshguardian.com/api-en/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: fetchLimit, offset: 0 })
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const articles = data.archive_data || [];
      if (articles.length === 0) return null;

      return articles.map((item: BGArchiveItem) => ({
        url: `https://www.bangladeshguardian.com/${item.Slug}/${item.ContentID}`,
        title: item.ContentHeading,
        image: `https://backoffice.bangladeshguardian.com/media/imgAll/${item.ImageBgPath}`,
        postTime: item.create_date ? formatPostTime(item.create_date) : '',
        contentId: item.ContentID
      }));
    } catch (e) {
      return null;
    }
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
    } catch (e) {
      return '';
    }
  };

  const scrapeSitemapLinks = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const sitemapUrl = `https://www.bangladeshguardian.com/english-sitemap/sitemap-daily-${year}-${month}-${day}.xml`;

    let xmlText = '';
    try {
      const response = await fetch(sitemapUrl);
      if (response.ok) {
        xmlText = await response.text();
      }
    } catch (e) {
      console.warn("Direct sitemap fetch failed:", e);
    }

    if (!xmlText) {
      addLog("Failed to fetch sitemap XML.", "error");
      return [];
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const urls = Array.from(xmlDoc.getElementsByTagName("url"));

      if (urls.length === 0) {
        // Fallback for namespaced tags if getElementsByTagName fails
        const urlset = xmlDoc.documentElement;
        if (urlset) {
          const children = Array.from(urlset.children);
          urls.push(...children.filter(c => c.nodeName === 'url' || c.nodeName.endsWith(':url')));
        }
      }

      const results = urls.map(urlNode => {
        let loc = '';
        let imageLoc = '';
        let lastmod = '';

        // Try getting children manually to handle namespaces
        Array.from(urlNode.children).forEach(child => {
          const name = child.nodeName.split(':').pop();
          if (name === 'loc') loc = child.textContent || '';
          else if (name === 'lastmod') lastmod = child.textContent || '';
          else if (name === 'image' || name === 'image:image') {
            Array.from(child.children).forEach(imgChild => {
              if (imgChild.nodeName.split(':').pop() === 'loc') {
                imageLoc = imgChild.textContent || '';
              }
            });
          }
        });

        // Backup for standard methods
        if (!loc) loc = urlNode.getElementsByTagName("loc")[0]?.textContent || '';
        if (!imageLoc) imageLoc = urlNode.getElementsByTagName("image:loc")[0]?.textContent || '';
        if (!lastmod) lastmod = urlNode.getElementsByTagName("lastmod")[0]?.textContent || '';

        const contentId = parseInt(loc.replace(/\/$/, '').split('/').pop() || '0');

        return {
          url: loc.trim(),
          title: '',
          image: imageLoc.trim(),
          postTime: lastmod ? formatSitemapTime(lastmod) : '',
          contentId: contentId || Date.now()
        };
      }).filter(item => item.url && item.image);

      addLog(`Parsed ${results.length} posts from sitemap.`);
      return results.reverse();
    } catch (e) {
      addLog("Failed to parse sitemap XML.", "error");
      return [];
    }
  };

  const checkAndGenerate = async () => {
    if (isAutoCheckingRef.current) return;
    isAutoCheckingRef.current = true;
    setIsAutoChecking(true);

    const normalizeUrl = (url: string) => url.trim().replace(/\/$/, '');

    const limitToUse = nextFetchLimitRef.current || automationFrequencyRef.current.limit;
    nextFetchLimitRef.current = null;

    addLog(`Checking for new posts (${automationModeRef.current.toUpperCase()} MODE)...`, "process");

    try {
      if (automationModeRef.current === 'backup' && !backupInitializedRef.current) {
        addLog("Initializing Backup mode (Creating baseline cache)...", "process");
        const articles = await scrapeSitemapLinks();
        if (articles && articles.length > 0) {
          const nextMap = new Map(processedUrlsRef.current);
          articles.forEach(art => nextMap.set(normalizeUrl(art.url), Date.now()));
          setProcessedUrls(nextMap);
        }
        backupInitializedRef.current = true;
        addLog(`Backup mode initialized with ${articles?.length || 0} baseline posts.`, "success");
        setIsAutoChecking(false);
        isAutoCheckingRef.current = false;
        return;
      }

      let articles = null;

      if (automationModeRef.current === 'main') {
        articles = await scrapeLatestLinks(limitToUse);
        if (!articles) {
          addLog("Main automation failed.", "error");
        }
      } else {
        articles = await scrapeSitemapLinks();
      }

      if (!articles || articles.length === 0) {
        addLog("No new posts found.");
      } else {
        // Filter out already processed URLs
        const newArticles = (articles || []).filter(art => !processedUrlsRef.current.has(normalizeUrl(art.url)));

        if (newArticles.length === 0) {
          addLog("No new posts found.");
        } else {
          addLog(`Found ${newArticles.length} new post(s).`);

          // If we have a limit, apply it
          const articlesToProcess = newArticles.slice(0, limitToUse).reverse();

          for (const article of articlesToProcess) {
            let articleTitle = article.title;
            let articleImage = article.image;

            if (!articleTitle || !articleImage) {
              addLog(`Scraping metadata for ${article.url}...`, "info");
              const meta = await getMetadata(article.url);
              if (meta) {
                articleTitle = articleTitle || meta.title;
                articleImage = articleImage || meta.image;
                if (!article.postTime && meta.publishDate) {
                  article.postTime = formatSitemapTime(meta.publishDate);
                }
              }
            }

            if (articleTitle && articleImage) {
              const censoredTitle = censorText(articleTitle, wordRestrictionsRef.current);
              const dataUrl = await generatePhotoCardInternal(censoredTitle, articleImage);
              const newRecord: AutoRecord = {
                id: Math.random().toString(36).substr(2, 9),
                url: article.url,
                title: censoredTitle,
                imageUrl: articleImage,
                previewUrl: dataUrl,
                timestamp: new Date().toISOString(),
                postTime: article.postTime,
                contentId: article.contentId
              };
              await saveRecordDB(newRecord);
              setAutoRecords(prev => {
                const next = [newRecord, ...prev];
                return next.sort((a, b) => {
                  const aVal = a.contentId || new Date(a.timestamp).getTime();
                  const bVal = b.contentId || new Date(b.timestamp).getTime();
                  return bVal - aVal;
                }).slice(0, 50);
              });
              setProcessedUrls(prev => {
                const next = new Map(prev);
                next.set(normalizeUrl(article.url), Date.now());
                return next;
              });
              toast.success(`Auto-generated: ${censoredTitle}`);
              playNotification();
            }
            await new Promise(r => setTimeout(r, 1000));
          }
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

    let wakeLock: any = null;
    let isMounted = true;
    const controller = new AbortController();

    const startAutomation = (intervalMs: number) => {
      const workerCode = `
        let interval;
        self.onmessage = (e) => {
          if (e.data === 'start') {
            self.postMessage('tick');
            interval = setInterval(() => self.postMessage('tick'), ${intervalMs});
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
      return { worker, url };
    };

    let workerInstance: { worker: Worker, url: string } | null = null;

    const init = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}

      try {
        if ('locks' in navigator) {
          navigator.locks.request('bg_photocard_automation', { signal: controller.signal }, async (lock) => {
            if (!isMounted) return;
            setIsLeader(true);
            addLog("Took leadership of automation.", "success");
            workerInstance = startAutomation(automationFrequency.interval);

            await new Promise(resolve => {
              controller.signal.addEventListener('abort', resolve);
            });
            setIsLeader(false);
          }).catch(err => {
            if (err.name !== 'AbortError') {
              setIsLeader(false);
              addLog("Automation standby (Active in another tab)", "info");
            }
          });
        } else {
          setIsLeader(true);
          workerInstance = startAutomation(automationFrequency.interval);
        }
      } catch (err) {
        setIsLeader(true);
        workerInstance = startAutomation(automationFrequency.interval);
      }
    };

    init();

    return () => {
      isMounted = false;
      controller.abort();
      if (wakeLock) wakeLock.release().catch(() => {});
      if (workerInstance) {
        workerInstance.worker.postMessage('stop');
        workerInstance.worker.terminate();
        URL.revokeObjectURL(workerInstance.url);
      }
    };
  }, [autoModeActive, automationFrequency.interval]);

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
      localStorage.setItem('bg_authorized', 'true');
    } else {
      toast.error("Incorrect Password");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("URL copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy URL");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-solaiman-regular">
        <div className="w-full max-w-md space-y-8 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-1 bg-gradient-to-tr from-primary/20 to-transparent rounded-full">
              <div className="p-4 bg-zinc-900 rounded-full">
                <img src="/Logoicon.svg" alt="BG Logo" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Bangladesh Guardian's Photocard Automation</h1>
              <p className="text-zinc-400 text-sm">Please enter your security key to access the automation tool.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Security Key</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white pr-10 h-12 rounded-xl focus:ring-primary/20"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02]">Initialize Access</Button>
          </form>

          <div className="pt-6 border-t border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Need Access?</p>
            <a href="mailto:contact@abdullah.ami.bd" className="text-xs text-primary hover:underline">contact@abdullah.ami.bd</a>
          </div>
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
                aria-label="Settings"
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
                      {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
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

            <div className="flex gap-2">
              <Button className="flex-grow" onClick={() => generatePhotoCard()} disabled={isGenerating}>
                {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                Generate Preview
              </Button>
              {(previewUrl || title || imageUrl || postUrl) && (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    setTitle('');
                    setImageUrl('');
                    setPreviewUrl(null);
                    setGeneratedTitle('');
                    setPostUrl('');
                    toast.info("Form cleared");
                  }}
                  title="Clear all inputs and preview"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Zap className="h-4 w-4" />
                    AUTOMATION
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => setShowLogs(!showLogs)}
                    title={showLogs ? "Hide Logs" : "Show Logs"}
                  >
                    {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full",
                    !autoModeActive ? 'bg-zinc-400' :
                    isLeader ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
                  )} />
                  <span className="text-[10px] uppercase font-bold">
                    {!autoModeActive ? 'Idle' : isLeader ? `Active (${automationMode === 'main' ? 'Regular' : 'Backup'})` : 'Standby'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={autoModeActive ? "destructive" : "default"}
                  size="sm"
                  className="flex-1 text-[10px]"
                  onClick={() => {
                    if (!autoModeActive) {
                      cleanOldCache();
                      backupInitializedRef.current = false;
                      setAutoModeActive(true);
                    } else {
                      setAutoModeActive(false);
                    }
                  }}
                >
                  {autoModeActive ? (
                    <><Square className="h-3 w-3 mr-1" /> STOP</>
                  ) : (
                    <><Play className="h-3 w-3 mr-1" /> START</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 text-[10px] font-bold"
                  onClick={() => {
                    nextFetchLimitRef.current = 36;
                    if (!autoModeActive) {
                      cleanOldCache();
                      setAutoModeActive(true);
                    } else {
                      checkAndGenerate();
                    }
                  }}
                  title="Fetch latest 36 posts once"
                >
                  +30
                </Button>
              </div>
              {showLogs && (
                <div className="bg-surface-2 rounded-lg p-3 h-32 overflow-y-auto scrollbar-hide text-[10px] space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {autoLogs.length === 0 ? <div className="text-muted-foreground italic">Waiting for activity...</div> : autoLogs.map((log, i) => (
                    <div key={i} className={cn(log.type === 'success' ? 'text-green-600' : log.type === 'error' ? 'text-red-600' : log.type === 'process' ? 'text-primary' : 'text-muted-foreground')}>
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                    </div>
                  ))}
                </div>
              )}
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
                  <div className="mb-2 px-1 flex items-start gap-2">
                    {record.url && record.url !== 'manual' && (
                      <button
                        onClick={() => copyToClipboard(record.url)}
                        className="mt-0.5 p-1 rounded-md hover:bg-surface-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        title="Copy post URL"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                    <h3 className="text-[11px] font-bold text-primary line-clamp-2 leading-tight min-h-[2.4em]">
                      {record.url && record.url !== 'manual' ? (
                        <a href={record.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {record.title}
                        </a>
                      ) : (
                        record.title
                      )}
                      {record.postTime && (
                        <span className="font-normal text-muted-foreground ml-1.5">
                          {record.postTime}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="rounded-2xl overflow-hidden aspect-square relative bg-surface-1 border shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={record.previewUrl} alt={record.title} className="w-full h-full object-contain" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="destructive" size="sm" className="flex-grow text-[10px] h-9" onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${record.title}.png`;
                      link.href = record.previewUrl;
                      link.click();
                    }}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> DOWNLOAD
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => {
                      if (window.confirm("Delete?")) handleDelete(record.id);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 pb-8 text-center text-[10px] text-muted-foreground font-solaiman-regular">
        <p>© {new Date().getFullYear()} <a href="https://www.facebook.com/share/1Ai3WQCcqc/" target="_blank" rel="noopener noreferrer" className="hover:underline text-primary font-bold">Abdullah Bari Asif</a></p>
      </footer>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex-shrink-0 flex items-center justify-between bg-surface-1">
              <h3 className="font-bold flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                SETTINGS
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
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
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Automation Settings</Label>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Zap className={cn("h-4 w-4", livePreview ? "text-primary animate-pulse" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">Live Preview Mode</span>
                  </div>
                  <Button
                    variant={livePreview ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-[10px] px-4 rounded-full transition-all"
                    onClick={() => setLivePreview(!livePreview)}
                  >
                    {livePreview ? "ENABLED" : "DISABLED"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1">When enabled, photocard generates automatically as you type.</p>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <History className={cn("h-4 w-4", automationMode === 'backup' ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">Automation Mode</span>
                  </div>
                  <div className="flex bg-surface-1 p-1 rounded-lg border">
                    <button
                      onClick={() => !autoModeActive && setAutomationMode('main')}
                      disabled={autoModeActive}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                        automationMode === 'main' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        autoModeActive && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      REGULAR
                    </button>
                    <button
                      onClick={() => !autoModeActive && setAutomationMode('backup')}
                      disabled={autoModeActive}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                        automationMode === 'backup' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        autoModeActive && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      BACKUP
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1">
                  Regular means your website's API is being used. And Backup means your websites sitemap is being used. <span className="text-red-600 font-bold uppercase">Only turn Backup on when Main mode is not working.</span>
                </p>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Clock className={cn("h-4 w-4", autoModeActive ? "text-muted-foreground" : "text-primary")} />
                    <span className="text-sm font-medium">Checking Frequency</span>
                  </div>
                  <div className="flex bg-surface-1 p-1 rounded-lg border">
                    {FREQ_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => !autoModeActive && setAutomationFrequency(opt)}
                        disabled={autoModeActive}
                        className={cn(
                          "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                          automationFrequency.id === opt.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                          autoModeActive && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1">
                  Select how often the automation checks for new posts and how many it fetches.
                </p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Security & Moderation</Label>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl flex items-center justify-between px-4 hover:bg-surface-2 group transition-all"
                  onClick={() => {
                    setShowSettings(false);
                    setShowRestrictionsSettings(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">Word Restrictions</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                <p className="text-[10px] text-muted-foreground italic px-1">Manage restricted words and their usable forms.</p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Appearance Settings</Label>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl flex items-center justify-between px-4 hover:bg-surface-2 group transition-all"
                  onClick={() => {
                    setShowSettings(false);
                    setShowAdvancedSettings(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">Advanced Typography</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                <p className="text-[10px] text-muted-foreground italic px-1">Fine-tune text sizes, spacing, and positions.</p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Utility Features</Label>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl flex items-center justify-between px-4 hover:bg-surface-2 group transition-all"
                  onClick={() => {
                    setShowSettings(false);
                    setShowStoragePopup(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CloudUpload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">File Hosting (Puter)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                <p className="text-[10px] text-muted-foreground italic px-1">Upload files and get a public shareable link.</p>
              </div>

              <Button onClick={() => setShowSettings(false)} className="w-full">Close Settings</Button>
            </div>
          </div>
        </div>
      )}

      {showRestrictionsSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex-shrink-0 flex items-center justify-between bg-surface-1">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                WORD RESTRICTIONS
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowRestrictionsSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Add New Restriction</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Restricted Word"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      className="h-9 text-xs bg-surface-2"
                    />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Usable Form"
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      className="h-9 text-xs bg-surface-2"
                    />
                  </div>
                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => {
                      if (!newWord.trim() || !newReplacement.trim()) {
                        toast.error("Both fields are required");
                        return;
                      }
                      setWordRestrictions(prev => ({ ...prev, [newWord.trim()]: newReplacement.trim() }));
                      setNewWord('');
                      setNewReplacement('');
                      toast.success("Restriction added");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Current Restrictions</Label>
                <div className="space-y-2">
                  {Object.entries(wordRestrictions).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No restrictions added.</p>
                  ) : (
                    Object.entries(wordRestrictions).map(([word, replacement]) => (
                      <div key={word} className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 border border-transparent group">
                        <Input
                          value={word}
                          readOnly
                          className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 w-1/2 font-medium"
                        />
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                          <Input
                            value={replacement}
                            onChange={(e) => setWordRestrictions(prev => ({ ...prev, [word]: e.target.value }))}
                            className="h-8 text-xs bg-surface-1 border-none focus-visible:ring-1"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const next = { ...wordRestrictions };
                            delete next[word];
                            setWordRestrictions(next);
                            toast.success("Restriction removed");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    if (window.confirm("Reset to defaults?")) {
                      setWordRestrictions(defaultMappings);
                      toast.success("Restrictions reset to default");
                    }
                  }}
                  variant="ghost"
                  className="w-full text-[10px] text-muted-foreground hover:text-destructive"
                >
                  Reset to Defaults
                </Button>
              </div>

              <Button onClick={() => setShowRestrictionsSettings(false)} className="w-full">Save & Close</Button>
            </div>
          </div>
        </div>
      )}

      {showAdvancedSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex-shrink-0 flex items-center justify-between bg-surface-1">
              <h3 className="font-bold flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                ADVANCED TYPOGRAPHY
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAdvancedSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Title Typography</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-[11px]">Text Size</Label>
                      <span className="text-[11px] font-mono">{fontSize}px</span>
                    </div>
                    <input
                      type="range" min="40" max="120" step="1"
                      value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-[11px]">Letter Spacing</Label>
                      <span className="text-[11px] font-mono">{titleLetterSpacing}px</span>
                    </div>
                    <input
                      type="range" min="-10" max="10" step="0.1"
                      value={titleLetterSpacing} onChange={(e) => setTitleLetterSpacing(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-[11px]">Line Spacing</Label>
                      <span className="text-[11px] font-mono">{lineHeightFactor.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2" step="0.05"
                      value={lineHeightFactor} onChange={(e) => setLineHeightFactor(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Date Typography</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-[11px]">Date Text Size</Label>
                      <span className="text-[11px] font-mono">{dateFontSize}px</span>
                    </div>
                    <input
                      type="range" min="10" max="40" step="1"
                      value={dateFontSize} onChange={(e) => setDateFontSize(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px]">X Offset</Label>
                      <Input
                        type="number" value={dateXOffset}
                        onChange={(e) => setDateXOffset(Number(e.target.value))}
                        className="h-8 text-[11px] bg-surface-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px]">Y Offset</Label>
                      <Input
                        type="number" value={dateYOffset}
                        onChange={(e) => setDateYOffset(Number(e.target.value))}
                        className="h-8 text-[11px] bg-surface-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    setFontSize(70);
                    setTitleLetterSpacing(-2.4);
                    setLineHeightFactor(0.9);
                    setDateFontSize(20);
                    setDateXOffset(-40);
                    setDateYOffset(-30);
                    toast.success("Settings reset to default");
                  }}
                  variant="ghost"
                  className="w-full text-[10px] text-muted-foreground hover:text-destructive"
                >
                  Reset to Defaults
                </Button>
              </div>

              <Button onClick={() => setShowAdvancedSettings(false)} className="w-full">Save & Close</Button>
            </div>
          </div>
        </div>
      )}
      {showStoragePopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex-shrink-0 flex items-center justify-between bg-surface-1">
              <h3 className="font-bold flex items-center gap-2">
                <CloudUpload className="h-4 w-4" />
                FILE HOSTING (PUTER)
              </h3>
              <Button variant="ghost" size="icon" onClick={() => {
                setShowStoragePopup(false);
                setUploadedUrl(null);
                setSelectedFile(null);
                setUploadProgress(0);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Select File</Label>
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                    selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-surface-2",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setUploadedUrl(null);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <>
                      <FileText className="h-10 w-10 text-primary" />
                      <div className="text-center">
                        <p className="text-sm font-bold truncate max-w-[250px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-10 w-10 text-muted-foreground opacity-20" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Click to browse files</p>
                        <p className="text-[10px] text-muted-foreground">Upload any file to get a shareable link</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-primary">Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadedUrl && (
                <div className="space-y-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <LinkIcon className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Public Link Generated</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={uploadedUrl}
                      className="h-9 text-xs bg-surface-1 border-green-500/20"
                    />
                    <Button
                      size="sm"
                      className="h-9 px-4 shrink-0"
                      onClick={() => {
                        copyToClipboard(uploadedUrl);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      COPY
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Anyone with this link can view/download the file.</p>
                </div>
              )}

              {!uploadedUrl && (
                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full h-11 font-bold rounded-xl"
                >
                  {isUploading ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> UPLOADING...</>
                  ) : (
                    <><CloudUpload className="mr-2 h-4 w-4" /> START UPLOAD</>
                  )}
                </Button>
              )}

              {uploadedUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadedUrl(null);
                    setUploadProgress(0);
                  }}
                  className="w-full h-11 font-bold rounded-xl"
                >
                  UPLOAD ANOTHER
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => {
                  setShowStoragePopup(false);
                  setUploadedUrl(null);
                  setSelectedFile(null);
                  setUploadProgress(0);
                }}
                className="w-full text-xs text-muted-foreground"
              >
                Cancel & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secret;
