import React, { useState, useEffect } from 'react';
import { Settings2, Volume2, Zap, ShieldAlert, ArrowRight, Plus, Trash2, RotateCcw } from "lucide-react";
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

  const saveSetting = (key: string, value: string | number | boolean) => {
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event('storage'));
  };

  const playNotification = (file: string) => { new Audio(file).play().catch(() => {}); };

  const resetTypography = () => {
    setFontSize(70); setLetterSpacing(-2.4); setLineHeight(0.9);
    setDateFontSize(20); setDateXOffset(-40); setDateYOffset(-30);
    saveSetting('bg_font_size', 70); saveSetting('bg_letter_spacing', -2.4);
    saveSetting('bg_line_height', 0.9); saveSetting('bg_date_font_size', 20);
    saveSetting('bg_date_x_offset', -40); saveSetting('bg_date_y_offset', -30);
    toast.success("Typography reset to defaults");
  };

  return (
    <div className="max-w-7xl space-y-8 lg:space-y-12 animate-fade-in-up pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">System Configuration</h1>
        <p className="text-[10px] lg:text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Engine fine-tuning & global parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Side: General Settings List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <Settings2 className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">General Settings</h2>
          </div>

          <div className="bg-white border border-zinc-200 divide-y divide-zinc-100 rounded-2xl overflow-hidden">
            {/* Live Preview */}
            <div className="flex items-center justify-between p-5 lg:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Live Preview</p>
                <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Real-time manual rendering</p>
              </div>
              <Button
                variant={livePreview ? "default" : "outline"}
                className="h-9 px-6 text-[9px] font-black uppercase tracking-widest"
                onClick={() => { setLivePreview(!livePreview); saveSetting('bg_live_preview', !livePreview); }}
              >
                {livePreview ? "ENABLED" : "DISABLED"}
              </Button>
            </div>

            {/* Processing Mode */}
            <div className="p-5 lg:p-6 space-y-4">
              <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Processing Mode</Label>
              <div className="flex bg-zinc-100 p-1 border border-zinc-200">
                <button
                  onClick={() => { setAutomationMode('main'); saveSetting('bg_secret_automation_mode', 'main'); }}
                  className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all", automationMode === 'main' ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-900")}
                >REGULAR API</button>
                <button
                  onClick={() => { setAutomationMode('backup'); saveSetting('bg_secret_automation_mode', 'backup'); }}
                  className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all", automationMode === 'backup' ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-900")}
                >SITEMAP BACKUP</button>
              </div>
            </div>

            {/* Frequency */}
            <div className="p-6 space-y-4">
              <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Checking Frequency</Label>
              <div className="flex bg-zinc-100 p-1 border border-zinc-200">
                {FREQ_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setAutomationFrequency(opt.id); saveSetting('bg_secret_automation_frequency', opt.id); }}
                    className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all", automationFrequency === opt.id ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-900")}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Sound Profile */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Sound Profile</Label>
                <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
              </div>
              <select
                className="w-full h-11 bg-zinc-50 border border-zinc-200 px-4 text-[11px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none"
                value={selectedAudio}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAudio(val);
                  saveSetting('bg_secret_audio', val);
                  playNotification(val);
                }}
              >
                <option value="/Alert.mp3">Alert (Standard)</option>
                <option value="/Instant.mp3">Instant Ping</option>
                <option value="/Loud.mp3">Loud Signal</option>
              </select>
            </div>

            {/* Typography */}
            <div className="p-5 lg:p-6 space-y-8">
              <div className="flex items-center justify-between">
                <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Typography Engine</Label>
                <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black text-zinc-400 hover:text-red-500 tracking-widest p-0" onClick={resetTypography}>RESET</Button>
              </div>
              <div className="space-y-8">
                {[
                  { label: 'Title Size', val: fontSize, set: setFontSize, k: 'bg_font_size', min: 40, max: 120 },
                  { label: 'Letter Spacing', val: letterSpacing, set: setLetterSpacing, k: 'bg_letter_spacing', min: -10, max: 10, step: 0.1 },
                  { label: 'Line Height', val: lineHeight, set: setLineHeight, k: 'bg_line_height', min: 0.5, max: 2, step: 0.05 },
                  { label: 'Date Size', val: dateFontSize, set: setDateFontSize, k: 'bg_date_font_size', min: 10, max: 40 }
                ].map(s => (
                  <div key={s.label} className="space-y-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      <span>{s.label}</span>
                      <span className="text-zinc-900">{s.val}</span>
                    </div>
                    <input
                      type="range" min={s.min} max={s.max} step={s.step || 1}
                      value={s.val} onChange={e => { s.set(Number(e.target.value)); saveSetting(s.k, e.target.value); }}
                      className="w-full accent-primary h-1 bg-zinc-100 appearance-none cursor-pointer"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Date X Offset</Label>
                    <Input type="number" value={dateXOffset} onChange={e => { setDateXOffset(Number(e.target.value)); saveSetting('bg_date_x_offset', e.target.value); }} className="h-10 bg-zinc-50 border-zinc-200 text-xs font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Date Y Offset</Label>
                    <Input type="number" value={dateYOffset} onChange={e => { setDateYOffset(Number(e.target.value)); saveSetting('bg_date_y_offset', e.target.value); }} className="h-10 bg-zinc-50 border-zinc-200 text-xs font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Restrict Engine */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Restrict Engine</h2>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black text-zinc-400 hover:text-red-500 tracking-widest p-0" onClick={() => { if(confirm('Reset all restrictions?')) setWordRestrictions(defaultMappings); }}>DEFAULT</Button>
          </div>

          <div className="bg-white border border-zinc-200 p-5 lg:p-8 space-y-6 lg:space-y-8 rounded-2xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input placeholder="Restricted" value={newWord} onChange={e => setNewWord(e.target.value)} className="bg-zinc-50 border-zinc-200 h-11 text-[11px] font-bold uppercase tracking-wider" />
              <div className="flex items-center justify-center"><ArrowRight className="w-4 h-4 text-zinc-300 rotate-90 sm:rotate-0" /></div>
              <Input placeholder="Safe form" value={newReplacement} onChange={e => setNewReplacement(e.target.value)} className="bg-zinc-50 border-zinc-200 h-11 text-[11px] font-bold uppercase tracking-wider" />
              <Button className="h-11 w-full sm:w-11 shrink-0" onClick={() => { if(!newWord || !newReplacement) return; setWordRestrictions({...wordRestrictions, [newWord]: newReplacement}); setNewWord(''); setNewReplacement(''); }}><Plus className="w-4 h-4" /></Button>
            </div>

            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {Object.entries(wordRestrictions).map(([word, rep]) => (
                <div key={word} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 group rounded-xl">
                  <div className="flex-1 flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 w-24 truncate shrink-0">{word}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    <Input
                      value={rep}
                      onChange={e => setWordRestrictions({...wordRestrictions, [word]: e.target.value})}
                      className="h-9 text-[10px] bg-white border-zinc-200 flex-1 font-bold uppercase tracking-widest"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-zinc-300 hover:text-red-500 self-end sm:self-auto"
                    onClick={() => { const next = {...wordRestrictions}; delete next[word]; setWordRestrictions(next); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
