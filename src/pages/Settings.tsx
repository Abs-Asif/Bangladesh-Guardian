import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { defaultMappings } from "@/lib/censor";
import { Settings2, Volume2, Zap, History, Clock, ShieldAlert, Plus, Trash2, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const FREQ_OPTIONS = [
  { id: '1m3p', label: '1m 3p', interval: 60000, limit: 3 },
  { id: '2m6p', label: '2m 6p', interval: 120000, limit: 6 },
  { id: '3m6p', label: '3m 6p', interval: 180000, limit: 6 }
];

const Settings = () => {
  // Audio State
  const [selectedAudio, setSelectedAudio] = useState(localStorage.getItem('bg_secret_audio') || '/Alert.mp3');

  // Word Restrictions State
  const [wordRestrictions, setWordRestrictions] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('bg_secret_word_restrictions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return defaultMappings; }
    }
    return defaultMappings;
  });

  // Automation State
  const [automationMode, setAutomationMode] = useState<'main' | 'backup'>(() => {
    return (localStorage.getItem('bg_secret_automation_mode') as 'main' | 'backup') || 'main';
  });

  const [automationFrequency, setAutomationFrequency] = useState(() => {
    const saved = localStorage.getItem('bg_secret_automation_frequency');
    return FREQ_OPTIONS.find(opt => opt.id === saved) || FREQ_OPTIONS[0];
  });

  const [livePreview, setLivePreview] = useState(localStorage.getItem('bg_live_preview') === 'true');

  // Typography State
  const [fontSize, setFontSize] = useState(Number(localStorage.getItem('bg_font_size')) || 70);
  const [dateXOffset, setDateXOffset] = useState(Number(localStorage.getItem('bg_date_x_offset')) || -40);
  const [dateYOffset, setDateYOffset] = useState(Number(localStorage.getItem('bg_date_y_offset')) || -30);
  const [dateFontSize, setDateFontSize] = useState(Number(localStorage.getItem('bg_date_font_size')) || 20);
  const [titleLetterSpacing, setTitleLetterSpacing] = useState(Number(localStorage.getItem('bg_title_letter_spacing')) || -2.4);
  const [lineHeightFactor, setLineHeightFactor] = useState(Number(localStorage.getItem('bg_line_height_factor')) || 0.9);

  const [newWord, setNewWord] = useState('');
  const [newReplacement, setNewReplacement] = useState('');

  const saveSetting = (key: string, value: any) => {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  };

  const handleWordAdd = () => {
    if (!newWord.trim() || !newReplacement.trim()) {
      toast.error("Both fields are required");
      return;
    }
    const next = { ...wordRestrictions, [newWord.trim()]: newReplacement.trim() };
    setWordRestrictions(next);
    saveSetting('bg_secret_word_restrictions', next);
    setNewWord('');
    setNewReplacement('');
    toast.success("Restriction added");
  };

  const handleWordRemove = (word: string) => {
    const next = { ...wordRestrictions };
    delete next[word];
    setWordRestrictions(next);
    saveSetting('bg_secret_word_restrictions', next);
    toast.success("Restriction removed");
  };

  const resetTypography = () => {
    setFontSize(70);
    setTitleLetterSpacing(-2.4);
    setLineHeightFactor(0.9);
    setDateFontSize(20);
    setDateXOffset(-40);
    setDateYOffset(-30);

    saveSetting('bg_font_size', '70');
    saveSetting('bg_title_letter_spacing', '-2.4');
    saveSetting('bg_line_height_factor', '0.9');
    saveSetting('bg_date_font_size', '20');
    saveSetting('bg_date_x_offset', '-40');
    saveSetting('bg_date_y_offset', '-30');

    toast.success("Typography reset to default");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your photocard generation and automation preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Automation & UI */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Automation & UI</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-bold">Live Preview Mode</p>
                <p className="text-[10px] text-muted-foreground">Generate photocards as you type.</p>
              </div>
              <Button
                variant={livePreview ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-full"
                onClick={() => {
                  const next = !livePreview;
                  setLivePreview(next);
                  localStorage.setItem('bg_live_preview', String(next));
                }}
              >
                {livePreview ? "ENABLED" : "DISABLED"}
              </Button>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Automation Mode</p>
                <div className="flex bg-surface-1 p-1 rounded-lg border">
                  {['main', 'backup'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setAutomationMode(mode as any);
                        saveSetting('bg_secret_automation_mode', mode);
                      }}
                      className={cn(
                        "px-4 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase",
                        automationMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {mode === 'main' ? 'Regular' : 'Backup'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Regular uses API. Backup uses sitemap. Use backup only if main fails.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Checking Frequency</p>
                <div className="flex bg-surface-1 p-1 rounded-lg border">
                  {FREQ_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setAutomationFrequency(opt);
                        saveSetting('bg_secret_automation_frequency', opt.id);
                      }}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-bold rounded-md transition-all",
                        automationFrequency.id === opt.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audio Notification */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Notifications</h2>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Alert (Default)', file: '/Alert.mp3' },
              { name: 'Instant', file: '/Instant.mp3' },
              { name: 'Loud', file: '/Loud.mp3' }
            ].map((audio) => (
              <div key={audio.file} className="flex items-center justify-between p-3 rounded-2xl bg-card border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", selectedAudio === audio.file ? "bg-primary animate-pulse" : "bg-zinc-800")} />
                  <span className="text-sm font-medium">{audio.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => new Audio(audio.file).play()}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedAudio === audio.file ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-[10px]"
                    onClick={() => {
                      setSelectedAudio(audio.file);
                      saveSetting('bg_secret_audio', audio.file);
                      toast.success("Notification sound updated");
                    }}
                  >
                    {selectedAudio === audio.file ? "SELECTED" : "SELECT"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Word Restrictions */}
        <section className="space-y-6 md:col-span-2">
          <div className="flex items-center gap-2 border-b pb-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Word Restrictions</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-2xl border shadow-sm h-fit space-y-4">
              <Label>Add New Restriction</Label>
              <div className="space-y-3">
                <Input placeholder="Restricted Word" value={newWord} onChange={e => setNewWord(e.target.value)} />
                <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                <Input placeholder="Usable Form" value={newReplacement} onChange={e => setNewReplacement(e.target.value)} />
                <Button className="w-full mt-2" onClick={handleWordAdd}>
                  <Plus className="mr-2 h-4 w-4" /> Add Restriction
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-card p-6 rounded-2xl border shadow-sm max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <Label>Current Restrictions ({Object.keys(wordRestrictions).length})</Label>
                <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => {
                   if (window.confirm("Reset to defaults?")) {
                     setWordRestrictions(defaultMappings);
                     saveSetting('bg_secret_word_restrictions', defaultMappings);
                     toast.success("Restrictions reset");
                   }
                }}>Reset to Defaults</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(wordRestrictions).map(([word, replacement]) => (
                  <div key={word} className="flex items-center gap-2 p-3 rounded-xl bg-surface-2 border border-transparent hover:border-primary/20 transition-all group">
                    <span className="text-xs font-bold flex-1 truncate">{word}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-primary flex-1 truncate">{replacement}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleWordRemove(word)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6 md:col-span-2">
          <div className="flex items-center gap-2 border-b pb-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Advanced Typography</h2>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
               {/* Title Settings */}
               <div className="space-y-6">
                 <Label className="text-primary font-bold">Title Typography</Label>
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs"><span>Font Size</span><span className="font-mono">{fontSize}px</span></div>
                     <input type="range" min="40" max="120" value={fontSize} onChange={e => { setFontSize(Number(e.target.value)); saveSetting('bg_font_size', e.target.value); }} className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary" />
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs"><span>Letter Spacing</span><span className="font-mono">{titleLetterSpacing}px</span></div>
                     <input type="range" min="-10" max="10" step="0.1" value={titleLetterSpacing} onChange={e => { setTitleLetterSpacing(Number(e.target.value)); saveSetting('bg_title_letter_spacing', e.target.value); }} className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary" />
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs"><span>Line Height</span><span className="font-mono">{lineHeightFactor.toFixed(2)}</span></div>
                     <input type="range" min="0.5" max="2" step="0.05" value={lineHeightFactor} onChange={e => { setLineHeightFactor(Number(e.target.value)); saveSetting('bg_line_height_factor', e.target.value); }} className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary" />
                   </div>
                 </div>
               </div>

               {/* Date Settings */}
               <div className="space-y-6">
                 <Label className="text-primary font-bold">Date Typography</Label>
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs"><span>Date Font Size</span><span className="font-mono">{dateFontSize}px</span></div>
                     <input type="range" min="10" max="40" value={dateFontSize} onChange={e => { setDateFontSize(Number(e.target.value)); saveSetting('bg_date_font_size', e.target.value); }} className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-[10px]">X Offset</Label>
                       <Input type="number" value={dateXOffset} onChange={e => { setDateXOffset(Number(e.target.value)); saveSetting('bg_date_x_offset', e.target.value); }} className="h-9" />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px]">Y Offset</Label>
                       <Input type="number" value={dateYOffset} onChange={e => { setDateYOffset(Number(e.target.value)); saveSetting('bg_date_y_offset', e.target.value); }} className="h-9" />
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             <div className="flex justify-center border-t pt-8">
               <Button variant="outline" size="sm" onClick={resetTypography}>
                 <RotateCcw className="mr-2 h-4 w-4" /> Reset Typography to Defaults
               </Button>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
