import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RefreshCw, Image as ImageIcon, ChevronUp, ChevronDown, ChevronRight, Trash2, ClipboardPaste, List, Zap, Play, Square, Download, Copy } from "lucide-react";
import { toast } from "sonner";

interface HomeProps {
  postUrl: string;
  setPostUrl: (url: string) => void;
  title: string;
  setTitle: (title: string) => void;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (url: string | null) => void;
  isFetching: boolean;
  fetchPostData: () => void;
  isGenerating: boolean;
  generatePhotoCard: () => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  setGeneratedTitle: (title: string) => void;
  clearAll: () => void;
  autoModeActive: boolean;
  setAutoModeActive: (active: boolean) => void;
  isLeader: boolean;
  automationMode: string;
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
  autoLogs: any[];
  autoRecords: any[];
  handleDelete: (id: string) => void;
  clearRecords: () => void;
  checkAndGenerate: () => void;
  nextFetchLimitRef: React.MutableRefObject<number | null>;
  copyToClipboard: (text: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Home = ({
  postUrl, setPostUrl, title, setTitle, imageUrl, setImageUrl,
  uploadedImage, setUploadedImage, isFetching, fetchPostData,
  isGenerating, generatePhotoCard, previewUrl, setPreviewUrl,
  setGeneratedTitle, clearAll, autoModeActive, setAutoModeActive,
  isLeader, automationMode, showLogs, setShowLogs, autoLogs,
  autoRecords, handleDelete, clearRecords, checkAndGenerate,
  nextFetchLimitRef, copyToClipboard, fileInputRef, handleImageUpload
}: HomeProps) => {

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

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Manual Input Column */}
        <div className="space-y-6 bg-card p-6 md:p-8 rounded-3xl border shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="postUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">News post</Label>
              <div className="flex gap-2">
                <Textarea
                  id="postUrl"
                  placeholder="https://www.channel24bd.tv/..."
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="bg-surface-2 min-h-[80px] rounded-2xl resize-none"
                />
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" onClick={() => handlePaste(setPostUrl)}>
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" className="rounded-xl h-10 w-10" onClick={fetchPostData} disabled={isFetching || !postUrl}>
                    {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">OR MANUAL</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title Text</Label>
              <div className="flex gap-2">
                <Textarea
                  id="title"
                  placeholder="Enter photocard title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-surface-2 min-h-[80px] rounded-2xl resize-none"
                />
                <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" onClick={() => handlePaste(setTitle)}>
                  <ClipboardPaste className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image URL</Label>
              <div className="flex gap-2">
                <Textarea
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-surface-2 min-h-[80px] rounded-2xl resize-none"
                  disabled={!!uploadedImage}
                />
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" onClick={() => handlePaste(setImageUrl)} disabled={!!uploadedImage}>
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className={cn("rounded-xl h-10 w-10", uploadedImage && "bg-primary text-primary-foreground border-primary")} onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-grow h-12 rounded-2xl font-bold shadow-lg" onClick={() => generatePhotoCard()} disabled={isGenerating || (!imageUrl && !uploadedImage)}>
              {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
              Generate Photocard
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl shrink-0"
              onClick={clearAll}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Automation & Preview Column */}
        <div className="space-y-8">
          {/* Preview Window */}
          <div className="relative w-full aspect-square border-2 border-dashed border-zinc-800 rounded-[2.5rem] overflow-hidden flex items-center justify-center bg-card shadow-inner group">
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    className="rounded-full px-8 h-12 shadow-2xl"
                    onClick={() => {
                       const link = document.createElement('a');
                       link.download = `photocard-${Date.now()}.png`;
                       link.href = previewUrl;
                       link.click();
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download PNG
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-4">
                <div className="p-6 bg-surface-2 rounded-full">
                  <ImageIcon className="h-10 w-10 opacity-20" />
                </div>
                <span className="text-sm font-medium opacity-40">Preview will appear here</span>
              </div>
            )}
          </div>

          {/* Automation Dashboard */}
          <div className="bg-card p-6 rounded-3xl border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Automation</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full",
                  !autoModeActive ? 'bg-zinc-700' :
                  isLeader ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500'
                )} />
                <span className="text-[10px] uppercase font-bold tracking-tighter">
                  {!autoModeActive ? 'Idle' : isLeader ? `Active (${automationMode.toUpperCase()})` : 'Standby'}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
               <button
                 onClick={() => setAutoModeActive(!autoModeActive)}
                 className={cn(
                   "flex-1 h-14 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                   autoModeActive
                    ? "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]"
                 )}
               >
                 {autoModeActive ? <><Square className="h-4 w-4" /> STOP SERVICE</> : <><Play className="h-4 w-4" /> START SERVICE</>}
               </button>
               <Button
                 variant="outline"
                 className="h-14 w-14 rounded-2xl font-bold"
                 onClick={() => {
                   nextFetchLimitRef.current = 36;
                   if (!autoModeActive) setAutoModeActive(true);
                   else checkAndGenerate();
                 }}
                 title="Quick fetch 36 posts"
               >
                 +30
               </Button>
            </div>

            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full h-8 text-[10px] font-bold text-muted-foreground hover:bg-surface-2 rounded-lg"
                onClick={() => setShowLogs(!showLogs)}
              >
                {showLogs ? <ChevronUp className="h-3 w-3 mr-2" /> : <ChevronDown className="h-3 w-3 mr-2" />}
                {showLogs ? "HIDE ACTIVITY LOGS" : "SHOW ACTIVITY LOGS"}
              </Button>

              {showLogs && (
                <div className="bg-surface-2 rounded-2xl p-4 h-40 overflow-y-auto scrollbar-hide text-[10px] space-y-2 animate-in slide-in-from-top-2">
                  {autoLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic opacity-40">
                      Waiting for system activity...
                    </div>
                  ) : (
                    autoLogs.map((log, i) => (
                      <div key={i} className={cn(
                        "flex gap-3 leading-relaxed",
                        log.type === 'success' ? 'text-green-500' :
                        log.type === 'error' ? 'text-red-500' :
                        log.type === 'process' ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        <span className="opacity-40 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="font-medium">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generations Grid */}
      {autoRecords.length > 0 && (
        <div className="space-y-8 pt-10 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <List className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Recent Generations</h2>
            </div>
            <Button variant="destructive" size="sm" className="rounded-xl px-4" onClick={clearRecords}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> CLEAR ALL
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {autoRecords.map((record) => (
              <div key={record.id} className="flex flex-col group animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-card border shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-300">
                  <img src={record.previewUrl} alt={record.title} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 p-6">
                    <Button
                      variant="default"
                      className="w-full h-11 rounded-xl font-bold"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `${record.title}.png`;
                        link.href = record.previewUrl;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" /> DOWNLOAD
                    </Button>
                    <div className="flex gap-2 w-full">
                      <Button variant="secondary" className="flex-1 h-11 rounded-xl" onClick={() => copyToClipboard(record.url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" className="flex-1 h-11 rounded-xl" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 px-2 space-y-1">
                  <h3 className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {record.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter opacity-60">
                    {record.postTime || 'Generated manually'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
