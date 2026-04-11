import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Zap, Download, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { censorText } from '@/lib/censor';
import { loadTypographySettings } from '@/lib/settings';
import { generatePhotoCardInternal, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/renderer';
import { formatSitemapTime, BGArchiveItem } from '@/lib/api';

interface QuickDownloadProps {
  contentId: string;
}

const QuickDownload: React.FC<QuickDownloadProps> = ({ contentId }) => {
  const [status, setStatus] = useState<'loading' | 'processing' | 'downloading' | 'completed' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const processQuickDownload = async () => {
      try {
        setStatus('loading');

        // 0. Preload Fonts
        try {
          await Promise.all([
            document.fonts.load('bold 70px "Cambria"'),
            document.fonts.load('20px "Cambria"'),
            document.fonts.load('400 16px "Solaiman Lipi"'),
            document.fonts.load('700 16px "Solaiman Lipi"')
          ]);
        } catch (e) {
          console.warn("Font preloading failed, continuing with system fonts.");
        }

        // 1. Fetch metadata
        const response = await fetch("http://103.209.42.203/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: 50, offset: 0 })
        });

        if (!response.ok) throw new Error("API Connection Failed");

        const data = await response.json();
        const article = (data.data || []).find((item: BGArchiveItem) => String(item.ContentID) === contentId);

        let title = '', imageUrl = '', articleUrl = '';

        if (article) {
          title = article.DetailsHeading || article.ContentHeading || '';
          imageUrl = `http://103.209.42.203/${article.ImageBgPath}`;
          articleUrl = `https://www.bangladeshguardian.com/${article.ContentSlug || article.Slug}/${article.ContentID}`;
        } else {
          throw new Error("Article not found in recent archive.");
        }

        setStatus('processing');
        const settings = loadTypographySettings();

        const sw = localStorage.getItem('bg_secret_word_restrictions');
        const wordRestrictions = sw ? JSON.parse(sw) : {};
        const censoredTitle = censorText(title, wordRestrictions);

        // 2. Render Photocard
        const { dataUrl } = await generatePhotoCardInternal(
          canvasRef.current!,
          censoredTitle,
          imageUrl,
          settings,
          imageCacheRef.current,
          false
        );

        setStatus('downloading');

        // 3. Trigger Download
        const a = document.createElement('a');
        a.download = `${censoredTitle}.png`;
        a.href = dataUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setStatus('completed');
        toast.success("Photocard Downloaded!");

        // 4. Close tab or go back
        setTimeout(() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.close();
          }
        }, 1500);

      } catch (err: any) {
        console.error("Quick Download Error:", err);
        setStatus('error');
        setErrorMsg(err.message || "An unexpected error occurred.");
        toast.error("Failed to process Quick Download");
      }
    };

    processQuickDownload();
  }, [contentId]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
      <div className="w-full max-w-md space-y-8 bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="p-4 bg-black rounded-2xl">
            <img src="/logo.png" alt="BG Logo" className="h-12 object-contain" />
          </div>

          <div className="space-y-4">
            {status === 'error' ? (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Processing Failed</h1>
                <p className="text-muted-foreground">{errorMsg}</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {status === 'loading' && "Fetching Article..."}
                    {status === 'processing' && "Generating Photocard..."}
                    {status === 'downloading' && "Starting Download..."}
                    {status === 'completed' && "Success!"}
                  </h1>
                  <p className="text-muted-foreground animate-pulse">
                    Please stay on this page. Article ID: {contentId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">Bangladesh Guardian Autopilot</p>
        </div>
      </div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden" />
    </div>
  );
};

export default QuickDownload;
