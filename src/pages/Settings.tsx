import React, { useState, useEffect } from 'react';
import { Settings2, Volume2, Zap, History, Clock, ShieldAlert, ArrowRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { defaultMappings } from "@/lib/censor";

const FREQ_OPTIONS = [
  { id: '1m3p', label: '1m 3p' },
  { id: '2m6p', label: '2m 6p' },
  { id: '3m6p', label: '3m 6p' }
];

const Settings = () => {
  const [selectedAudio, setSelectedAudio] = useState(localStorage.getItem('bg_secret_audio') || '/Alert.mp3');
  const [automationMode, setAutomationMode] = useState(localStorage.getItem('bg_secret_automation_mode') || 'main');
  const [automationFrequency, setAutomationFrequency] = useState(localStorage.getItem('bg_secret_automation_frequency') || '1m3p');
  const [livePreview, setLivePreview] = useState(localStorage.getItem('bg_live_preview') === 'true');

  // Word Restrictions
  const [wordRestrictions, setWordRestrictions] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('bg_secret_word_restrictions');
    return saved ? JSON.parse(saved) : defaultMappings;
  });
  const [newWord, setNewWord] = useState('');
  const [newReplacement, setNewReplacement] = useState('');

  // Typography
  const [fontSize, setFontSize] = useState(Number(localStorage.getItem('bg_font_size') || 70));
  const [letterSpacing, setLetterSpacing] = useState(Number(localStorage.getItem('bg_letter_spacing') || -2.4));
  const [lineHeight, setLineHeight] = useState(Number(localStorage.getItem('bg_line_height') || 0.9));
  const [dateFontSize, setDateFontSize] = useState(Number(localStorage.getItem('bg_date_font_size') || 20));
  const [dateXOffset, setDateXOffset] = useState(Number(localStorage.getItem('bg_date_x_offset') || -40));
  const [dateYOffset, setDateYOffset] = useState(Number(localStorage.getItem('bg_date_y_offset') || -30));

  useEffect(() => {
    localStorage.setItem('bg_secret_word_restrictions', JSON.stringify(wordRestrictions));
    window.dispatchEvent(new Event('storage'));
  }, [wordRestrictions]);

  const saveSetting = (key: string, value: any) => {
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event('storage'));
  };

  const playNotification = (file: string) => new Audio(file).play().catch(() => {});

  const resetTypography = () => {
    setFontSize(70); setLetterSpacing(-2.4); setLineHeight(0.9);
    setDateFontSize(20); setDateXOffset(-40); setDateYOffset(-30);
    saveSetting('bg_font_size', 70); saveSetting('bg_letter_spacing', -2.4);
    saveSetting('bg_line_height', 0.9); saveSetting('bg_date_font_size', 20);
    saveSetting('bg_date_x_offset', -40); saveSetting('bg_date_y_offset', -30);
    toast.success("Typography reset to defaults");
  };

  return (
    <div className="max-w-4xl space-y-12 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-primary" />
          System Settings
        </h1>
        <p className="text-zinc-400">Configure automation behavior, notification sounds, and photocard appearance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Core Settings */}
        <div className="space-y-8">
          <section className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Zap className="w-4 h-4" /> Automation Core
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Live Preview Mode</p>
                  <p className="text-[10px] text-zinc-500 italic">Generate as you type</p>
                </div>
                <Button
                  variant={livePreview ? "default" : "outline"}
                  size="sm"
                  className="rounded-full px-6"
                  onClick={() => { setLivePreview(!livePreview); saveSetting('bg_live_preview', !livePreview); }}
                >
                  {livePreview ? "ON" : "OFF"}
                </Button>
              </div>

              <div className="space-y-4">
                <Label className="text-xs text-zinc-400 uppercase tracking-widest">Automation Mode</Label>
                <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => { setAutomationMode('main'); saveSetting('bg_secret_automation_mode', 'main'); }}
                    className={cn("flex-1 py-2 text-[10px] font-bold rounded-lg transition-all", automationMode === 'main' ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-white")}
                  >REGULAR</button>
                  <button
                    onClick={() => { setAutomationMode('backup'); saveSetting('bg_secret_automation_mode', 'backup'); }}
                    className={cn("flex-1 py-2 text-[10px] font-bold rounded-lg transition-all", automationMode === 'backup' ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-white")}
                  >BACKUP</button>
                </div>
                <p className="text-[10px] text-zinc-500 italic px-2">Backup uses sitemaps when API fails.</p>
              </div>

              <div className="space-y-4">
                <Label className="text-xs text-zinc-400 uppercase tracking-widest">Checking Frequency</Label>
                <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                  {FREQ_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setAutomationFrequency(opt.id); saveSetting('bg_secret_automation_frequency', opt.id); }}
                      className={cn("flex-1 py-2 text-[10px] font-bold rounded-lg transition-all", automationFrequency === opt.id ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-white")}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Notifications
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Alert (Default)', file: '/Alert.mp3' },
                { name: 'Instant', file: '/Instant.mp3' },
                { name: 'Loud', file: '/Loud.mp3' }
              ].map((audio) => (
                <div key={audio.file} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                  <span className="text-sm font-medium">{audio.name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => playNotification(audio.file)}><Volume2 className="w-4 h-4" /></Button>
                    <Button
                      variant={selectedAudio === audio.file ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-[10px] rounded-lg"
                      onClick={() => { setSelectedAudio(audio.file); saveSetting('bg_secret_audio', audio.file); }}
                    >{selectedAudio === audio.file ? "ACTIVE" : "SELECT"}</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Moderation & Design */}
        <div className="space-y-8">
          <section className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Word Restrictions
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-zinc-500 hover:text-destructive" onClick={() => { if(confirm('Reset?')) setWordRestrictions(defaultMappings); }}><RotateCcw className="w-3 h-3 mr-1" /> Reset</Button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Restricted" value={newWord} onChange={e => setNewWord(e.target.value)} className="bg-zinc-800 border-zinc-700 h-9 text-xs" />
                <ArrowRight className="w-4 h-4 mt-2.5 text-zinc-700 shrink-0" />
                <Input placeholder="Safe form" value={newReplacement} onChange={e => setNewReplacement(e.target.value)} className="bg-zinc-800 border-zinc-700 h-9 text-xs" />
                <Button size="icon" className="h-9 w-9 shrink-0 rounded-lg" onClick={() => { if(!newWord || !newReplacement) return; setWordRestrictions({...wordRestrictions, [newWord]: newReplacement}); setNewWord(''); setNewReplacement(''); }}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {Object.entries(wordRestrictions).map(([word, rep]) => (
                  <div key={word} className="flex items-center gap-2 p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50 group">
                    <span className="text-xs font-mono text-zinc-400 w-1/3 truncate px-2">{word}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-800" />
                    <Input value={rep} onChange={e => setWordRestrictions({...wordRestrictions, [word]: e.target.value})} className="h-7 text-xs bg-zinc-900 border-none flex-1" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-destructive" onClick={() => { const next = {...wordRestrictions}; delete next[word]; setWordRestrictions(next); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Typography
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-zinc-500 hover:text-destructive" onClick={resetTypography}><RotateCcw className="w-3 h-3 mr-1" /> Reset</Button>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Title Size', val: fontSize, set: setFontSize, k: 'bg_font_size', min: 40, max: 120 },
                { label: 'Spacing', val: letterSpacing, set: setLetterSpacing, k: 'bg_letter_spacing', min: -10, max: 10, step: 0.1 },
                { label: 'Line Height', val: lineHeight, set: setLineHeight, k: 'bg_line_height', min: 0.5, max: 2, step: 0.05 },
                { label: 'Date Size', val: dateFontSize, set: setDateFontSize, k: 'bg_date_font_size', min: 10, max: 40 }
              ].map(s => (
                <div key={s.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span>{s.label}</span>
                    <span className="text-white">{s.val}</span>
                  </div>
                  <input
                    type="range" min={s.min} max={s.max} step={s.step || 1}
                    value={s.val} onChange={e => { s.set(Number(e.target.value)); saveSetting(s.k, e.target.value); }}
                    className="w-full accent-primary h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500">X Offset</Label>
                  <Input type="number" value={dateXOffset} onChange={e => { setDateXOffset(Number(e.target.value)); saveSetting('bg_date_x_offset', e.target.value); }} className="h-9 bg-zinc-800 border-zinc-700 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500">Y Offset</Label>
                  <Input type="number" value={dateYOffset} onChange={e => { setDateYOffset(Number(e.target.value)); saveSetting('bg_date_y_offset', e.target.value); }} className="h-9 bg-zinc-800 border-zinc-700 text-xs" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
