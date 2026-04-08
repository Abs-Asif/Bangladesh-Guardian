import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { censorText } from "@/lib/censor";
import { shouldUpgradeTitle } from "@/lib/title-utils";
import { Download, RefreshCw, Image as ImageIcon, ChevronRight, List, Zap, Play, Square, Trash2, Copy, X, PenTool, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  AutoRecord,
  deleteRecordDB,
  clearRecordsDB,
  saveRecordDB,
  getAllRecordsDB
} from "@/lib/db";
import {
  BGArchiveItem,
  getMetadata,
  getRelativeDateStr,
  formatSitemapTime,
  scrapeLatestLinks,
  scrapeSitemapLinks
} from "@/lib/api";
import { loadTypographySettings, TypographySettings } from "@/lib/settings";
import { generatePhotoCardInternal, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/renderer";

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

const Home = () => {
  const [activeTab, setActiveTab] = useState<'url' | 'manual'>('url');
  const [postUrl, setPostUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [autoModeActive, setAutoModeActive] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const isAutoCheckingRef = useRef(false);
  const [autoRecords, setAutoRecords] = useState<AutoRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<AutoRecord | null>(null);
  const [tempHighlights, setTempHighlights] = useState<number[]>([]);
  const [mobileActiveId, setMobileActiveId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const sortRecords = (records: AutoRecord[]) => {
    return [...records].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.contentId || 0) - (a.contentId || 0);
    });
  };
  const [autoLogs, setAutoLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [processedUrls, setProcessedUrls] = useState<Map<string, number>>(new Map());
  const processedUrlsRef = useRef<Map<string, number>>(new Map());
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const nextFetchLimitRef = useRef<number | null>(null);
  const backupInitializedRef = useRef(false);
  const lastHeartbeatRef = useRef(Date.now());

  // Settings
  const [wordRestrictions, setWordRestrictions] = useState<Record<string, string>>({});
  const [automationFrequency, setAutomationFrequency] = useState(FREQ_OPTIONS[0]);
  const [automationMode, setAutomationMode] = useState<'main' | 'backup'>('main');
  const [selectedAudio, setSelectedAudio] = useState('/Alert.mp3');
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(false);

  // Typography
  const [fontSize, setFontSize] = useState(70);
  const [dateXOffset, setDateXOffset] = useState(-40);
  const [dateYOffset, setDateYOffset] = useState(-30);
  const [dateFontSize, setDateFontSize] = useState(20);
  const [titleLetterSpacing, setTitleLetterSpacing] = useState(-2.4);
  const [lineHeightFactor, setLineHeightFactor] = useState(0.9);

  const [imageXOffset, setImageXOffset] = useState(0);
  const [imageYOffset, setImageYOffset] = useState(0);
  const [titleXOffset, setTitleXOffset] = useState(0);
  const [titleYOffset, setTitleYOffset] = useState(0);
  const [layerOrder, setLayerOrder] = useState<string[]>(['background', 'news_image', 'date_time', 'title_text']);

  useEffect(() => {
    const loadSettings = (e?: StorageEvent) => {
      if (e && e.key === 'bg_automation_status') return; // Ignore status updates
      const sw = localStorage.getItem('bg_secret_word_restrictions');
      if (sw) setWordRestrictions(JSON.parse(sw));
      const sf = localStorage.getItem('bg_secret_automation_frequency');
      if (sf) { const found = FREQ_OPTIONS.find(opt => opt.id === sf); if (found) setAutomationFrequency(found); }
      const sm = localStorage.getItem('bg_secret_automation_mode') as 'main' | 'backup';
      if (sm) setAutomationMode(sm);
      setSelectedAudio(localStorage.getItem('bg_secret_audio') || '/Alert.mp3');
      setLivePreviewEnabled(localStorage.getItem('bg_live_preview') === 'true');

      const settings = loadTypographySettings();
      setFontSize(settings.fontSize);
      setTitleLetterSpacing(settings.titleLetterSpacing);
      setLineHeightFactor(settings.lineHeightFactor);
      setDateFontSize(settings.dateFontSize);
      setDateXOffset(settings.dateXOffset);
      setDateYOffset(settings.dateYOffset);
      setImageXOffset(settings.imageXOffset);
      setImageYOffset(settings.imageYOffset);
      setTitleXOffset(settings.titleXOffset);
      setTitleYOffset(settings.titleYOffset);
      setLayerOrder(settings.layerOrder);
    };
    loadSettings();
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  useEffect(() => {
    processedUrlsRef.current = processedUrls;
  }, [processedUrls]);

  useEffect(() => {
    const preloadFonts = async () => {
      try {
        await Promise.all([
          document.fonts.load('bold 70px "Cambria"'),
          document.fonts.load('20px "Cambria"'),
          document.fonts.load('400 16px "Solaiman Lipi"'),
          document.fonts.load('700 16px "Solaiman Lipi"')
        ]);
      } catch (e) {
        // Fallback
      }
    };
    preloadFonts();
    const savedUrls = localStorage.getItem('bg_secret_processed_urls');
    if (savedUrls) {
      try {
        const parsed = JSON.parse(savedUrls);
        const map = new Map<string, number>();
        parsed.forEach((item: { url: string; timestamp: number }) => map.set(item.url, item.timestamp || Date.now()));
        setProcessedUrls(map);
      } catch (e) {
        // Fallback
      }
    }
    if (localStorage.getItem('bg_secret_auto_active') === 'true') setAutoModeActive(true);
    getAllRecordsDB().then(records => {
      setAutoRecords(records.sort((a, b) => (b.contentId || new Date(b.timestamp).getTime()) - (a.contentId || new Date(a.timestamp).getTime())));
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('bg_secret_processed_urls', JSON.stringify(Array.from(processedUrls.entries()).map(([url, timestamp]) => ({ url, timestamp }))));
  }, [processedUrls]);

  useEffect(() => {
    localStorage.setItem('bg_secret_auto_active', String(autoModeActive));
    const status = !autoModeActive ? 'IDLE' : isLeader ? 'ACTIVE' : 'STANDBY';
    const oldStatus = localStorage.getItem('bg_automation_status');
    if (status !== oldStatus) {
      localStorage.setItem('bg_automation_status', status);
      window.dispatchEvent(new StorageEvent('storage', { key: 'bg_automation_status', newValue: status }));
    }
  }, [autoModeActive, isLeader]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setAutoLogs(prev => [{ message, timestamp: Date.now(), type }, ...prev.slice(0, 99)]);
  }, []);

  const playNotification = useCallback(() => {
    new Audio(selectedAudio).play().catch(() => {});
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

  const generatePhotoCard = useCallback(async (isLive = false) => {
    const finalImg = uploadedImage || imageUrl;
    if (!title || !finalImg) { if (!isLive) toast.error("Provide title and image"); return; }
    if (!isLive) setIsGenerating(true);
    try {
      const censored = censorText(title, wordRestrictions);
      const settings: TypographySettings = {
        fontSize,
        dateXOffset,
        dateYOffset,
        dateFontSize,
        titleLetterSpacing,
        lineHeightFactor,
        imageXOffset,
        imageYOffset,
        titleXOffset,
        titleYOffset,
        layerOrder
      };
      const { dataUrl, appliedHighlights } = await generatePhotoCardInternal(canvasRef.current!, censored, finalImg, settings, imageCacheRef.current, false);
      setPreviewUrl(dataUrl);
      if (!isLive) {
        const now = new Date();
        const manualTime = `[Manually Generated at ${now.getHours()%12||12}:${now.getMinutes().toString().padStart(2,'0')} ${now.getHours()>=12?'PM':'AM'}] [${getRelativeDateStr(now)}]`;
        const record: AutoRecord = { id: Math.random().toString(36).substr(2, 9), url: 'manual', title: censored, imageUrl: finalImg, previewUrl: dataUrl, timestamp: now.toISOString(), postTime: manualTime, highlightedIndices: appliedHighlights };
        await saveRecordDB(record);
        setAutoRecords(prev => sortRecords([record, ...prev]).slice(0, 50));
        toast.success("Generated!"); playNotification();
      }
    } catch (e) { if (!isLive) toast.error("Failed to generate"); }
    finally { if (!isLive) setIsGenerating(false); }
  }, [uploadedImage, imageUrl, title, wordRestrictions, playNotification, fontSize, dateXOffset, dateYOffset, dateFontSize, titleLetterSpacing, lineHeightFactor, imageXOffset, imageYOffset, titleXOffset, titleYOffset, layerOrder]);

  const fetchPostData = async () => {
    const trimmedUrl = postUrl.trim().replace(/\/$/, '');
    if (!trimmedUrl) { toast.error("Please enter a Post URL"); return; }
    setIsFetching(true);
    try {
      const contentId = trimmedUrl.split('/').pop();
      const response = await fetch("https://backoffice.bangladeshguardian.com/api-en/archive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: 50, offset: 0 })
      });
      const data = await response.json();
      const article = (data.archive_data || []).find((item: BGArchiveItem) => String(item.ContentID) === contentId);
      let eTitle = '', eImage = '', postTime = '';
      if (article) {
        eTitle = article.ContentHeading; eImage = `https://backoffice.bangladeshguardian.com/media/imgAll/${article.ImageBgPath}`;
        postTime = article.create_date ? formatSitemapTime(article.create_date) : '';
      } else {
        const meta = await getMetadata(trimmedUrl);
        if (meta && meta.title && meta.image) {
          eTitle = meta.title; eImage = meta.image;
          if (meta.publishDate) postTime = formatSitemapTime(meta.publishDate);
        } else { toast.error("Post not found."); return; }
      }
      const censored = censorText(eTitle, wordRestrictions);
      const settings: TypographySettings = {
        fontSize,
        dateXOffset,
        dateYOffset,
        dateFontSize,
        titleLetterSpacing,
        lineHeightFactor,
        imageXOffset,
        imageYOffset,
        titleXOffset,
        titleYOffset,
        layerOrder
      };
      const { dataUrl, appliedHighlights } = await generatePhotoCardInternal(canvasRef.current!, censored, eImage, settings, imageCacheRef.current, false);
      const record: AutoRecord = { id: Math.random().toString(36).substr(2, 9), url: trimmedUrl, title: censored, imageUrl: eImage, previewUrl: dataUrl, timestamp: new Date().toISOString(), postTime, contentId: parseInt(contentId || '0'), highlightedIndices: appliedHighlights };
      await saveRecordDB(record);
      setAutoRecords(prev => sortRecords([record, ...prev]).slice(0, 50));
      setProcessedUrls(prev => new Map(prev).set(trimmedUrl, Date.now()));
      toast.success("Generated!"); playNotification();
    } catch (error) { toast.error("Failed to fetch post data."); } finally { setIsFetching(false); }
  };

  const checkAndGenerate = useCallback(async () => {
    if (isAutoCheckingRef.current) return;
    isAutoCheckingRef.current = true; setIsAutoChecking(true);
    const limit = nextFetchLimitRef.current || automationFrequency.limit;
    nextFetchLimitRef.current = null;
    addLog(`Checking for new posts${automationMode === 'backup' ? ' (BACKUP MODE)' : ''}...`, "process");
    try {
      if (automationMode === 'backup' && !backupInitializedRef.current) {
        addLog("Initializing Backup mode...", "process");
        const articles = await scrapeSitemapLinks();
        if (articles === null) {
          addLog("Backup initialization failed: Could not fetch sitemap.", "error");
          return;
        }
        const nextMap = new Map(processedUrlsRef.current);
        articles.forEach(art => { nextMap.set(art.url, Date.now()); });
        setProcessedUrls(nextMap);
        backupInitializedRef.current = true;
        addLog(`Backup mode initialized with ${articles.length} posts.`, "success");
        return;
      }
      console.log(`Fetching articles for ${automationMode} mode with limit ${limit}`);
      const articles = automationMode === 'main' ? await scrapeLatestLinks(limit) : await scrapeSitemapLinks();

      if (articles === null) {
        addLog(`Fetch failed for ${automationMode} mode. Check connection or proxies.`, "error");
        return;
      }

      const newArticles = articles.filter(art => !processedUrlsRef.current.has(art.url)).slice(0, limit).reverse();
      if (newArticles.length === 0) {
        if (Date.now() - lastHeartbeatRef.current > 600000) { // 10 minutes
          addLog("Engine Heartbeat: Automation is active and watching.", "info");
          lastHeartbeatRef.current = Date.now();
        } else {
          addLog("No new posts found.");
        }
      } else {
        lastHeartbeatRef.current = Date.now();
        addLog(`Found ${newArticles.length} new post(s). Processing...`);

        // Process new articles in parallel for speed
        const results = await Promise.all(newArticles.map(async (article) => {
          try {
            let artTitle = article.title, artImage = article.image;
            if (!artTitle || !artImage) {
              const meta = await getMetadata(article.url, automationMode === 'backup');
              if (meta) { artTitle = artTitle || meta.title; artImage = artImage || meta.image; }
            }
            if (!artTitle || !artImage) return null;

            // Optional verification with short delay if needed, but let's make it parallel
            // We'll reduce the delay to 2s for parallel processing
            await new Promise(r => setTimeout(r, 2000));
            const verifyMeta = await getMetadata(article.url, automationMode === 'backup');
            if (verifyMeta && verifyMeta.title && verifyMeta.image) {
              if (shouldUpgradeTitle(artTitle, verifyMeta.title)) {
                artTitle = verifyMeta.title;
                artImage = verifyMeta.image;
              }
            }

            const censored = censorText(artTitle, wordRestrictions);
            const settings = loadTypographySettings();
            const { dataUrl, appliedHighlights } = await generatePhotoCardInternal(canvasRef.current!, censored, artImage, settings, imageCacheRef.current, automationMode === 'backup');
            const record: AutoRecord = {
              id: Math.random().toString(36).substr(2, 9),
              url: article.url,
              title: censored,
              imageUrl: artImage,
              previewUrl: dataUrl,
              timestamp: new Date().toISOString(),
              postTime: article.postTime,
              contentId: article.contentId,
              highlightedIndices: appliedHighlights
            };
            return record;
          } catch (e) {
            console.error(`Error processing article ${article.url}:`, e);
            return null;
          }
        }));

        const validRecords = results.filter((r): r is AutoRecord => r !== null);
        if (validRecords.length > 0) {
          for (const record of validRecords) {
            await saveRecordDB(record);
            setProcessedUrls(prev => new Map(prev).set(record.url, Date.now()));
          }
          setAutoRecords(prev => sortRecords([...validRecords, ...prev]).slice(0, 50));
          addLog(`Successfully generated ${validRecords.length} new card(s).`, "success");
          toast.success(`Generated ${validRecords.length} photocards`);
          playNotification();
        }
      }
    } catch (e: unknown) {
      console.error("Automation error:", e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      addLog(`Automation error: ${msg}`, "error");
      setAutomationError(msg || "Automation failed unexpectedly.");
    } finally { setIsAutoChecking(false); isAutoCheckingRef.current = false; }
  }, [addLog, playNotification, automationFrequency, automationMode, wordRestrictions]);

  const checkAndGenerateRef = useRef(checkAndGenerate);
  useEffect(() => { checkAndGenerateRef.current = checkAndGenerate; }, [checkAndGenerate]);

  useEffect(() => {
    if (!autoModeActive) return;
    let wakeLock: { release: () => Promise<void> } | null = null, isMounted = true;
    const controller = new AbortController();
    console.log("Automation effect triggered. Mode Active:", autoModeActive);
    const startAutomation = (intervalMs: number) => {
      const blob = new Blob([`let i; self.onmessage=e=>{if(e.data==='start'){self.postMessage('tick');i=setInterval(()=>self.postMessage('tick'),${intervalMs})}else if(e.data==='stop')clearInterval(i)}`], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      worker.onmessage = e => { if (e.data === 'tick') checkAndGenerateRef.current?.(); };
      worker.postMessage('start');
      return { worker, url };
    };
    let workerInstance: { worker: Worker; url: string } | null = null;
    const init = async () => {
      try {
        if ('wakeLock' in navigator) {
          const wl = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
          wakeLock = wl;
        }
      } catch (err) {
        // Fallback
      }
      try {
        if ('locks' in navigator) {
          navigator.locks.request('bg_photocard_automation', { signal: controller.signal }, async (lock) => {
            if (!lock || !isMounted) return;
            setIsLeader(true);
            addLog("Took leadership of automation.", "success");
            console.log("Automation leadership acquired.");
            workerInstance = startAutomation(automationFrequency.interval);
            await new Promise(resolve => { controller.signal.addEventListener('abort', resolve); });
            setIsLeader(false);
            console.log("Automation leadership released.");
          }).catch(err => {
            if (err.name !== 'AbortError') {
              setIsLeader(false);
              addLog("Automation standby", "info");
              console.warn("Automation leadership request failed/ended:", err);
            }
          });
        } else { setIsLeader(true); workerInstance = startAutomation(automationFrequency.interval); }
      } catch (err) { setIsLeader(true); workerInstance = startAutomation(automationFrequency.interval); }
    };
    init();
    return () => {
      isMounted = false;
      controller.abort();
      if (wakeLock) { (wakeLock as { release: () => Promise<void> }).release().catch(() => {}); }
      if (workerInstance) { workerInstance.worker.postMessage('stop'); workerInstance.worker.terminate(); URL.revokeObjectURL(workerInstance.url); }
    };
  }, [autoModeActive, automationFrequency.interval]);

  useEffect(() => {
    if (activeTab !== 'manual' || !livePreviewEnabled || !title || !(uploadedImage || imageUrl)) return;
    const t = setTimeout(() => { generatePhotoCard(true); }, 500);
    return () => { clearTimeout(t); };
  }, [title, imageUrl, uploadedImage, livePreviewEnabled, activeTab, generatePhotoCard]);

  // Auto-refresh Recent Generations list every 70 seconds
  useEffect(() => {
    const refreshHistory = async () => {
      const records = await getAllRecordsDB();
      setAutoRecords(sortRecords(records).slice(0, 50));
    };
    const interval = setInterval(refreshHistory, 70000);
    return () => clearInterval(interval);
  }, []);

  const showPreview = activeTab === 'manual' && livePreviewEnabled;

  const handleEditSave = async () => {
    if (!editingRecord) return;
    setIsSavingEdit(true);
    try {
      const settings: TypographySettings = {
        fontSize,
        dateXOffset,
        dateYOffset,
        dateFontSize,
        titleLetterSpacing,
        lineHeightFactor,
        imageXOffset,
        imageYOffset,
        titleXOffset,
        titleYOffset,
        layerOrder
      };
      const { dataUrl } = await generatePhotoCardInternal(canvasRef.current!, editingRecord.title, editingRecord.imageUrl, settings, imageCacheRef.current, false, tempHighlights);
      const updatedRecord = { ...editingRecord, previewUrl: dataUrl, highlightedIndices: tempHighlights };
      await saveRecordDB(updatedRecord);
      setAutoRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
      setEditingRecord(null);
      toast.success("Changes saved!");
    } catch (e) {
      toast.error("Failed to save changes");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditDownload = async () => {
    if (!editingRecord) return;
    try {
      const settings: TypographySettings = {
        fontSize,
        dateXOffset,
        dateYOffset,
        dateFontSize,
        titleLetterSpacing,
        lineHeightFactor,
        imageXOffset,
        imageYOffset,
        titleXOffset,
        titleYOffset,
        layerOrder
      };
      const { dataUrl } = await generatePhotoCardInternal(canvasRef.current!, editingRecord.title, editingRecord.imageUrl, settings, imageCacheRef.current, false, tempHighlights);
      const a = document.createElement('a');
      a.download = `${editingRecord.title}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      toast.error("Failed to download");
    }
  };

  const handleEditShare = async () => {
    if (!editingRecord) return;
    try {
      const settings: TypographySettings = {
        fontSize,
        dateXOffset,
        dateYOffset,
        dateFontSize,
        titleLetterSpacing,
        lineHeightFactor,
        imageXOffset,
        imageYOffset,
        titleXOffset,
        titleYOffset,
        layerOrder
      };
      const { dataUrl } = await generatePhotoCardInternal(canvasRef.current!, editingRecord.title, editingRecord.imageUrl, settings, imageCacheRef.current, false, tempHighlights);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${editingRecord.title}.png`, { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: editingRecord.title });
      } else {
        navigator.clipboard.writeText(dataUrl);
        toast.success("Image link copied");
      }
    } catch (e) {
      toast.error("Failed to share");
    }
  };

  useEffect(() => {
    if (editingRecord) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [editingRecord]);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in-up pb-20">
      {automationError && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-destructive/20 max-w-md w-full p-8 shadow-2xl rounded-3xl space-y-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Automation Failed</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The engine encountered a critical error: <span className="text-destructive font-mono font-bold">{automationError}</span>
              </p>
            </div>
            <Button
              className="w-full h-12 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Application
            </Button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Automation Section (Moved to Left) */}
        <div className="space-y-4 lg:space-y-6 h-full">
          <div className="bg-card p-5 lg:p-6 border border-border h-full flex flex-col space-y-4 rounded-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold   text-foreground">Autopilot Interface</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", !autoModeActive ? 'bg-muted' : isLeader ? 'bg-green-500 animate-pulse' : 'bg-amber-500')} />
                <span className="text-xs  font-bold  text-muted-foreground uppercase tracking-widest">{!autoModeActive ? 'IDLE' : isLeader ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant={autoModeActive ? "destructive" : "default"} className="flex-1 h-12 text-sm font-bold   gap-2" onClick={() => { setAutoModeActive(!autoModeActive); }}>
                {autoModeActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {autoModeActive ? "Stop Engine" : "Start Engine"}
              </Button>
              <Button variant="outline" className="h-12 w-12 px-0 text-sm font-bold" onClick={() => { nextFetchLimitRef.current = 30; if(!autoModeActive) setAutoModeActive(true); else checkAndGenerate(); }}>+30</Button>
            </div>
            {!showLogs ? (
              <Button
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-2 border border-dashed border-border text-muted-foreground hover:text-foreground transition-all"
                onClick={() => setShowLogs(true)}
              >
                <List className="w-4 h-4" />
                <span className="text-xs font-bold">Logs Hidden</span>
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-muted/50 p-5 max-h-[160px] overflow-y-auto font-mono text-sm space-y-2 border border-border">
                  {autoLogs.length ? autoLogs.map((l, i) => <div key={i} className={cn(l.type==='success'?'text-green-500':l.type==='error'?'text-red-500':l.type==='process'?'text-primary':'text-muted-foreground')}>[{new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}] {l.message}</div>) : <div className="italic text-muted-foreground text-center py-10   text-xs">No logs</div>}
                </div>
                <Button
                  variant="outline"
                  className="w-full h-10 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowLogs(false)}
                >
                  <List className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Hide Logs</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Section (Moved to Right) */}
        <div className="space-y-4 lg:space-y-6">
          <div className="bg-card p-5 lg:p-6 border border-border space-y-4 rounded-xl">
            <div className="flex bg-muted p-1 border border-border mb-1 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab('url')}
                className={cn("flex-1 py-2 text-sm font-bold   transition-all rounded-md", activeTab === 'url' ? "bg-card text-primary border border-border" : "text-muted-foreground hover:text-foreground")}
              >
                Article URL
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={cn("flex-1 py-2 text-sm font-bold   transition-all rounded-md", activeTab === 'manual' ? "bg-card text-primary border border-border" : "text-muted-foreground hover:text-foreground")}
              >
                Text & Image
              </button>
            </div>

            {activeTab === 'url' ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-sm   text-muted-foreground font-bold">Source URL</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs font-bold text-primary p-0 hover:bg-transparent" onClick={() => { navigator.clipboard.readText().then(setPostUrl); }}>Paste from Clipboard</Button>
                </div>
                <div className="flex gap-4">
                  <Input value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://www.bangladeshguardian.com/..." className="bg-muted/50 border-border h-12 text-sm rounded-xl" />
                  <Button variant="destructive" className="h-12 w-12 shrink-0 rounded-xl" onClick={fetchPostData} disabled={isFetching || !postUrl}>{isFetching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-6 h-6" />}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm   text-muted-foreground font-bold">Headline Text</Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs font-bold text-primary p-0 hover:bg-transparent" onClick={() => { navigator.clipboard.readText().then(setTitle); }}>Paste Text</Button>
                  </div>
                  <Textarea value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter headline..." className="bg-muted/50 border-border min-h-[100px] text-sm leading-relaxed" />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm   text-muted-foreground font-bold">Media Source</Label>
                  <div className="flex gap-4">
                    <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste image URL..." className="bg-muted/50 border-border h-12 text-sm" disabled={!!uploadedImage} />
                    <Button variant="outline" className="h-12 gap-2 text-sm font-bold  px-6" onClick={() => { fileInputRef.current?.click(); }}><ImageIcon className="w-4 h-4" /> Upload</Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>
                {uploadedImage && (
                  <div className="flex items-center gap-4 p-4 bg-muted/50 border border-dashed border-border rounded-xl">
                    <div className="w-12 h-12 bg-black shrink-0 rounded-lg overflow-hidden"><img src={uploadedImage} className="w-full h-full object-cover" alt="Uploaded Preview" /></div>
                    <div className="flex-1"><p className="text-sm font-bold   text-foreground">Local Image Loaded</p><p className="text-xs text-muted-foreground font-bold ">Ready for generation</p></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={clearUploadedImage}><X className="w-4 h-4" /></Button>
                  </div>
                )}
                <Button className="w-full h-14 font-bold text-xs   gap-3 rounded-xl" onClick={() => { generatePhotoCard(); }} disabled={isGenerating}>{isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <PenTool className="w-4 h-4" />} Create PhotoCard</Button>
              </div>
            )}
          </div>

          {showPreview && (
            <div className="animate-in slide-in-from-top-4 duration-500 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <Label className="text-sm   text-muted-foreground font-bold">Live Preview</Label>
              </div>
              <div className="aspect-square bg-muted border border-border overflow-hidden flex items-center justify-center relative rounded-2xl">
                {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain" alt="Live Preview" /> : <div className="text-muted-foreground flex flex-col items-center gap-3"><ImageIcon className="w-12 h-12 opacity-20" /><span className="text-xs font-bold  ">Rendering...</span></div>}
              </div>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden" />

      <div className="space-y-6 lg:space-y-8 pt-6 lg:pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 lg:h-10 bg-primary" />
            <div>
              <h2 className="text-xl lg:text-2xl font-bold   text-foreground">Recent Generations</h2>
              <p className="text-xs lg:text-sm text-muted-foreground  ">Session History ({autoRecords.length}/50)</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-destructive  p-0 self-end sm:self-auto" onClick={() => { if(confirm('Clear all history?')) { clearRecordsDB(); setAutoRecords([]); } }}>CLEAR HISTORY</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {autoRecords.map(r => (
            <div key={r.id} className="group bg-card border border-border overflow-hidden hover:border-primary transition-all duration-300 rounded-xl">
              <div
                className="aspect-square bg-muted overflow-hidden relative border-b border-border cursor-pointer"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    if (mobileActiveId === r.id) {
                      setEditingRecord(r);
                      setTempHighlights(r.highlightedIndices || []);
                      setMobileActiveId(null);
                    } else {
                      setMobileActiveId(r.id);
                    }
                  }
                }}
              >
                <img src={r.previewUrl} className="w-full h-full object-contain" alt={r.title} />
                <div className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300",
                  mobileActiveId === r.id ? "opacity-100" : "opacity-0 lg:group-hover:opacity-100"
                )}>
                  <Button
                    variant="secondary"
                    className="rounded-full h-12 w-12 p-0 shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRecord(r);
                      setTempHighlights(r.highlightedIndices || []);
                    }}
                  >
                    <PenTool className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold leading-snug  tracking-wide text-foreground">
                    {r.url && r.url !== 'manual' ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline">
                        {r.title}
                      </a>
                    ) : <span className="inline">{r.title}</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium   whitespace-nowrap">
                    {r.postTime || '• Manual Entry'}
                  </p>
                </div>

                <div className="flex gap-1.5 sm:gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-1 h-11 sm:h-10 border-border hover:bg-muted text-green-600 rounded-md"
                    onClick={() => { const a=document.createElement('a'); a.download=`${r.title}.png`; a.href=r.previewUrl; a.click(); }}
                  >
                    <Download className="w-4 h-4 sm:w-4 sm:h-4" strokeWidth={2.5} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-1 h-11 sm:h-10 border-border hover:bg-muted text-foreground/60 rounded-md"
                    onClick={() => {
                      if (navigator.share) {
                        fetch(r.previewUrl).then(res => res.blob()).then(blob => {
                          const file = new File([blob], `${r.title}.png`, { type: 'image/png' });
                          navigator.share({ files: [file], title: r.title }).catch(() => {});
                        });
                      } else {
                        navigator.clipboard.writeText(r.previewUrl);
                        toast.success("Image link copied");
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 sm:w-4 sm:h-4" strokeWidth={2.5} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-1 h-11 sm:h-10 border-border hover:bg-muted text-blue-600 rounded-md"
                    onClick={() => {
                      if (r.url && r.url !== 'manual') {
                        navigator.clipboard.writeText(r.url);
                        toast.success("Post URL copied");
                      } else {
                        navigator.clipboard.writeText(r.previewUrl);
                        toast.success("Image link copied");
                      }
                    }}
                  >
                    <Copy className="w-4 h-4" strokeWidth={2.5} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-1 h-11 sm:h-10 border-destructive/10 bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-md"
                    onClick={() => { if(confirm('Delete generation?')) { deleteRecordDB(r.id); setAutoRecords(prev => prev.filter(x => x.id !== r.id)); } }}
                  >
                    <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {autoRecords.length === 0 && (
            <div className="col-span-full py-20 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
               <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
               <p className="text-sm font-bold  ">No generations yet</p>
            </div>
          )}
        </div>
      </div>

      {editingRecord && createPortal(
        <div
          className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setEditingRecord(null)}
        >
          <div
            className="bg-card border border-border max-w-2xl w-full p-6 lg:p-8 shadow-2xl rounded-3xl space-y-6 animate-in zoom-in-95 duration-300 z-[60]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Edit Highlights</h2>
                  <p className="text-xs text-muted-foreground">Customize word-level coloring</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setEditingRecord(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground font-bold">Tap words to toggle highlight</Label>
              <div className="p-6 bg-muted/30 rounded-2xl border border-border flex flex-wrap gap-2 leading-relaxed">
                {editingRecord.title.split(' ').map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTempHighlights(prev =>
                        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                      );
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-lg font-medium transition-all",
                      tempHighlights.includes(idx)
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "bg-card text-foreground border border-border hover:bg-muted hover:border-primary/30"
                    )}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
              <Button
                className="h-12 font-bold gap-2 rounded-xl shadow-lg shadow-primary/20"
                onClick={handleEditSave}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Save Changes
              </Button>
              <Button variant="outline" className="h-12 font-bold gap-2 rounded-xl" onClick={handleEditDownload}>
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" className="h-12 font-bold gap-2 rounded-xl" onClick={handleEditShare}>
                <Share2 className="w-4 h-4" />
                Share link
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Home;
