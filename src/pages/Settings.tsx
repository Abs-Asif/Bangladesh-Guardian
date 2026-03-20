import React, { useState, useEffect } from 'react';
import { Settings2, Volume2, Zap, ShieldAlert, ArrowRight, Plus, Trash2, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { defaultMappings } from "@/lib/censor";

const FREQ_OPTIONS = [
  { id: '1m3p', label: '1 Minute 3 Posts' },
  { id: '2m6p', label: '2 Minutes 6 Posts' },
  { id: '3m6p', label: '3 Minutes 6 Posts' }
];

const Settings = () => {
  const [selectedAudio, setSelectedAudio] = useState(localStorage.getItem('bg_secret_audio') || '/Alert.mp3');
  const [automationMode, setAutomationMode] = useState(localStorage.getItem('bg_secret_automation_mode') || 'main');
  const [automationFrequency, setAutomationFrequency] = useState(localStorage.getItem('bg_secret_automation_frequency') || '1m3p');
  const [livePreview, setLivePreview] = useState(localStorage.getItem('bg_live_preview') === 'true');
  const [theme, setTheme] = useState(localStorage.getItem('bg_theme') || 'day');
  const [expandedTile, setExpandedTile] = useState<string | null>(null);

  const [currentTemplate, setCurrentTemplate] = useState(() => localStorage.getItem('bg_selected_template') || 'PhotocardTemplate.png');

  // Word Restrictions
  const [wordRestrictions, setWordRestrictions] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('bg_secret_word_restrictions');
    return saved ? JSON.parse(saved) : defaultMappings;
  });
  const [newWord, setNewWord] = useState('');
  const [newReplacement, setNewReplacement] = useState('');

  // Typography
  const [fontSize, setFontSize] = useState(70);
  const [letterSpacing, setLetterSpacing] = useState(-2.4);
  const [lineHeight, setLineHeight] = useState(0.9);
  const [dateFontSize, setDateFontSize] = useState(20);
  const [dateXOffset, setDateXOffset] = useState(-40);
  const [dateYOffset, setDateYOffset] = useState(-30);
  const [imageXOffset, setImageXOffset] = useState(0);
  const [imageYOffset, setImageYOffset] = useState(0);
  const [titleXOffset, setTitleXOffset] = useState(0);
  const [titleYOffset, setTitleYOffset] = useState(0);
  const [layerOrder, setLayerOrder] = useState(['background', 'news_image', 'date_time', 'title_text']);

  const loadTypographySettings = (template: string) => {
    const isRamadanEid = template === 'PhotocardTemplate1.png';
    const suffix = template === 'PhotocardTemplate.png' ? '' : `_${template}`;

    const getVal = (key: string, def: number | string) => {
      const saved = localStorage.getItem(`bg_${key}${suffix}`);
      return saved !== null ? saved : (localStorage.getItem(`bg_${key}`) || def);
    };

    const getDVal = (key: string, def: number | string, eidDef: number | string) => {
      const saved = localStorage.getItem(`bg_${key}${suffix}`);
      if (saved !== null) return saved;
      return isRamadanEid ? eidDef : (localStorage.getItem(`bg_${key}`) || def);
    };

    setFontSize(Number(getDVal('font_size', 70, 57)));
    setLetterSpacing(Number(getDVal('letter_spacing', -2.4, -2.2)));
    setLineHeight(Number(getDVal('line_height', 0.9, 1)));
    setDateFontSize(Number(getDVal('date_font_size', 20, 19)));
    setDateXOffset(Number(getDVal('date_x_offset', -40, -40)));
    setDateYOffset(Number(getDVal('date_y_offset', -30, 18)));
    setImageXOffset(Number(getDVal('image_x_offset', 0, 0)));
    setImageYOffset(Number(getDVal('image_y_offset', 0, 25)));
    setTitleXOffset(Number(getDVal('title_x_offset', 0, 0)));
    setTitleYOffset(Number(getDVal('title_y_offset', 0, 15)));

    const defaultLayerOrder = isRamadanEid ? 'news_image,background,title_text,date_time' : 'background,news_image,date_time,title_text';
    const savedOrder = getVal('layer_order', defaultLayerOrder);
    setLayerOrder(String(savedOrder).split(','));
  };

  useEffect(() => {
    loadTypographySettings(currentTemplate);
  }, [currentTemplate]);

  useEffect(() => {
    const handleStorage = () => {
      const template = localStorage.getItem('bg_selected_template') || 'PhotocardTemplate.png';
      if (template !== currentTemplate) setCurrentTemplate(template);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentTemplate]);

  useEffect(() => {
    localStorage.setItem('bg_secret_word_restrictions', JSON.stringify(wordRestrictions));
    window.dispatchEvent(new Event('storage'));
  }, [wordRestrictions]);

  const saveSetting = (key: string, value: string | number | boolean) => {
    const isTypoSetting = [
      'bg_font_size', 'bg_letter_spacing', 'bg_line_height', 'bg_date_font_size',
      'bg_date_x_offset', 'bg_date_y_offset', 'bg_image_x_offset', 'bg_image_y_offset',
      'bg_title_x_offset', 'bg_title_y_offset', 'bg_layer_order'
    ].includes(key);

    if (isTypoSetting && currentTemplate !== 'PhotocardTemplate.png') {
      localStorage.setItem(`${key}_${currentTemplate}`, String(value));
    } else {
      localStorage.setItem(key, String(value));
    }
    window.dispatchEvent(new Event('storage'));
  };

  const playNotification = (file: string) => { new Audio(file).play().catch(() => {}); };

  const resetTypography = () => {
    setFontSize(70); setLetterSpacing(-2.4); setLineHeight(0.9);
    setDateFontSize(20); setDateXOffset(-40); setDateYOffset(-30);
    setImageXOffset(0); setImageYOffset(0);
    setTitleXOffset(0); setTitleYOffset(0);
    const defaultOrder = ['background', 'news_image', 'date_time', 'title_text'];
    setLayerOrder(defaultOrder);

    saveSetting('bg_font_size', 70); saveSetting('bg_letter_spacing', -2.4);
    saveSetting('bg_line_height', 0.9); saveSetting('bg_date_font_size', 20);
    saveSetting('bg_date_x_offset', -40); saveSetting('bg_date_y_offset', -30);
    saveSetting('bg_image_x_offset', 0); saveSetting('bg_image_y_offset', 0);
    saveSetting('bg_title_x_offset', 0); saveSetting('bg_title_y_offset', 0);
    saveSetting('bg_layer_order', defaultOrder.join(','));

    toast.success("Typography reset to defaults");
  };

  const toggleTile = (id: string) => setExpandedTile(expandedTile === id ? null : id);

  const CustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: { id: string, label: string }[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "h-11 px-4 text-sm font-medium transition-all rounded-lg border text-left flex items-center justify-between",
            value === opt.id
              ? "bg-primary/10 border-primary text-primary"
              : "bg-card border-border text-foreground hover:bg-muted/50"
          )}
        >
          {opt.label}
          {value === opt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  );

  const SettingTile = ({ id, title, description, icon: Icon, children }: { id: string, title: string, description: string, icon: any, children: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => toggleTile(id)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-primary border border-border">
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground   mt-0.5">{description}</p>
          </div>
        </div>
        <ChevronRight className={cn("w-4 h-4 text-muted-foreground/30 transition-transform duration-300", expandedTile === id && "rotate-90")} />
      </button>

      {expandedTile === id && (
        <div className="p-6 border-t border-border bg-muted/20 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-bold   text-foreground">System Configuration</h1>
        <p className="text-sm text-muted-foreground  ">Full Flat Design • Manage your workspace parameters</p>
      </div>

      <div className="space-y-4">
        {/* Theme Settings */}
        <SettingTile
          id="theme"
          title="Theme"
          description="Switch between light and dark UI"
          icon={Zap}
        >
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground  ">Select Mode</Label>
            <CustomSelect
              value={theme}
              onChange={(val) => { setTheme(val); saveSetting('bg_theme', val); }}
              options={[
                { id: 'day', label: 'Day (Default Light)' },
                { id: 'night', label: 'Night (Dark Mode)' }
              ]}
            />
          </div>
        </SettingTile>

        {/* Live Preview */}
        <SettingTile
          id="preview"
          title="Live Preview Engine"
          description="Real-time rendering of manual entries"
          icon={Zap}
        >
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground  ">Configuration</Label>
            <CustomSelect
              value={livePreview ? 'true' : 'false'}
              onChange={(val) => { const isTrue = val === 'true'; setLivePreview(isTrue); saveSetting('bg_live_preview', isTrue); }}
              options={[
                { id: 'true', label: 'Enabled (Real-time Preview)' },
                { id: 'false', label: 'Disabled (Manual Trigger)' }
              ]}
            />
          </div>
        </SettingTile>

        {/* Automation Mode */}
        <SettingTile
          id="mode"
          title="Automation Mode"
          description="Select post fetching architecture"
          icon={Settings2}
        >
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground  ">Processing Source</Label>
            <CustomSelect
              value={automationMode}
              onChange={(val) => { setAutomationMode(val); saveSetting('bg_secret_automation_mode', val); }}
              options={[
                { id: 'main', label: 'Regular mode' },
                { id: 'backup', label: 'Backup mode' }
              ]}
            />
          </div>
        </SettingTile>

        {/* Polling Frequency */}
        <SettingTile
          id="freq"
          title="Polling Frequency"
          description="Post check interval and limits"
          icon={RotateCcw}
        >
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground  ">Frequency Level</Label>
            <CustomSelect
              value={automationFrequency}
              onChange={(val) => { setAutomationFrequency(val); saveSetting('bg_secret_automation_frequency', val); }}
              options={FREQ_OPTIONS}
            />
          </div>
        </SettingTile>

        {/* Notification Profile */}
        <SettingTile
          id="audio"
          title="Alert Sound"
          description="System audio alerts configuration"
          icon={Volume2}
        >
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground  ">Sound Selection</Label>
            <CustomSelect
              value={selectedAudio}
              onChange={(val) => {
                setSelectedAudio(val);
                saveSetting('bg_secret_audio', val);
                playNotification(val);
              }}
              options={[
                { id: '/Alert.mp3', label: 'Standard Alert' },
                { id: '/Instant.mp3', label: 'Minimal Ping' },
                { id: '/Loud.mp3', label: 'Urgent Signal' }
              ]}
            />
          </div>
        </SettingTile>

        {/* Typography */}
        <SettingTile
          id="typo"
          title="Typography"
          description="Layout and font fine-tuning"
          icon={Plus}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground  ">Fine-Tuning Parameters</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive  p-0" onClick={resetTypography}>Reset Defaults</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {[
                { label: 'Title Font Size', val: fontSize, set: setFontSize, k: 'bg_font_size', min: 40, max: 120 },
                { label: 'Letter Spacing', val: letterSpacing, set: setLetterSpacing, k: 'bg_letter_spacing', min: -10, max: 10, step: 0.1 },
                { label: 'Line Height', val: lineHeight, set: setLineHeight, k: 'bg_line_height', min: 0.5, max: 2, step: 0.05 },
                { label: 'Date Font Size', val: dateFontSize, set: setDateFontSize, k: 'bg_date_font_size', min: 10, max: 40 }
              ].map(s => (
                <div key={s.label} className="space-y-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{s.label}</span>
                    <span className="text-foreground font-mono">{s.val}</span>
                  </div>
                  <input
                    type="range" min={s.min} max={s.max} step={s.step || 1}
                    value={s.val} onChange={e => { s.set(Number(e.target.value)); saveSetting(s.k, e.target.value); }}
                    className="w-full accent-primary h-1.5 bg-muted appearance-none cursor-pointer rounded-full"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date X Offset</Label>
                <Input type="number" value={dateXOffset} onChange={e => { setDateXOffset(Number(e.target.value)); saveSetting('bg_date_x_offset', e.target.value); }} className="h-11 bg-card border-border text-xs rounded-lg text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date Y Offset</Label>
                <Input type="number" value={dateYOffset} onChange={e => { setDateYOffset(Number(e.target.value)); saveSetting('bg_date_y_offset', e.target.value); }} className="h-11 bg-card border-border text-xs rounded-lg text-foreground" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Image X Offset</Label>
                <Input type="number" value={imageXOffset} onChange={e => { setImageXOffset(Number(e.target.value)); saveSetting('bg_image_x_offset', e.target.value); }} className="h-11 bg-card border-border text-xs rounded-lg text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Image Y Offset</Label>
                <Input type="number" value={imageYOffset} onChange={e => { setImageYOffset(Number(e.target.value)); saveSetting('bg_image_y_offset', e.target.value); }} className="h-11 bg-card border-border text-xs rounded-lg text-foreground" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Title X Offset</Label>
                <Input type="number" value={titleXOffset} onChange={e => { setTitleXOffset(Number(e.target.value)); saveSetting('bg_title_x_offset', e.target.value); }} className="h-11 bg-card border-border text-xs rounded-lg text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Title Y Offset</Label>
                <Input type="number" value={titleYOffset} onChange={e => { setTitleYOffset(Number(e.target.value)); saveSetting('bg_title_y_offset', e.target.value); }} className="h-11 bg-card border-border text-xs rounded-lg text-foreground" />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border">
              <Label className="text-xs text-muted-foreground">Layer Stacking Order (Top to Bottom: 4 to 1)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase">Layer {index + 1} ( {index === 0 ? 'Bottom' : index === 3 ? 'Top' : 'Middle'} )</Label>
                    <CustomSelect
                      value={layerOrder[index]}
                      onChange={(val) => {
                        const newOrder = [...layerOrder];
                        newOrder[index] = val;
                        setLayerOrder(newOrder);
                        saveSetting('bg_layer_order', newOrder.join(','));
                      }}
                      options={[
                        { id: 'background', label: 'Background Image' },
                        { id: 'news_image', label: 'News Image' },
                        { id: 'date_time', label: 'Date and Time' },
                        { id: 'title_text', label: 'Title Text' }
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SettingTile>

        {/* Censorship Engine */}
        <SettingTile
          id="censor"
          title="Restriction Engine"
          description="Censorship and word replacement rules"
          icon={ShieldAlert}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground  ">Rule Management</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive  p-0" onClick={() => { if(confirm('Reset all restrictions?')) setWordRestrictions(defaultMappings); }}>Restore Default</Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="RESTRICTED WORD" value={newWord} onChange={e => setNewWord(e.target.value)} className="bg-card border-border h-11 text-sm rounded-lg text-foreground" />
              <div className="flex items-center justify-center"><ArrowRight className="w-4 h-4 text-muted-foreground/30 rotate-90 sm:rotate-0" /></div>
              <Input placeholder="SAFE FORM" value={newReplacement} onChange={e => setNewReplacement(e.target.value)} className="bg-card border-border h-11 text-sm rounded-lg text-foreground" />
              <Button className="h-11 w-full sm:w-11 shrink-0 rounded-lg" onClick={() => { if(!newWord || !newReplacement) return; setWordRestrictions({...wordRestrictions, [newWord]: newReplacement}); setNewWord(''); setNewReplacement(''); }}><Plus className="w-5 h-5" /></Button>
            </div>

            <div className="flex flex-col gap-2">
              {Object.entries(wordRestrictions).map(([word, rep]) => (
                <div key={word} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card border border-border group rounded-xl transition-all duration-200">
                  <div className="flex-1 flex items-center gap-4 min-w-0">
                    <div className="shrink-0 flex items-center gap-3">
                      <span className="text-sm text-foreground whitespace-nowrap">{word}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                    </div>
                    <Input
                      value={rep}
                      onChange={e => setWordRestrictions({...wordRestrictions, [word]: e.target.value})}
                      className="h-9 text-sm bg-muted border-border flex-1 rounded-lg min-w-[120px] text-foreground"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground/40 hover:text-destructive self-end sm:self-auto shrink-0"
                    onClick={() => { const next = {...wordRestrictions}; delete next[word]; setWordRestrictions(next); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </SettingTile>
      </div>
    </div>
  );
};

export default Settings;
