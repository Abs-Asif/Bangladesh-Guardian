import { useState, useEffect } from "react";
import { ArrowLeft, Search, X, Type, Download, Code, Check, Copy, ExternalLink, Info, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Palette, RotateCcw, ChevronRight, Crown, LogIn, Key } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FontStyle {
  name: string;
  weight: string;
  file: string;
  fontClass: string;
}

interface FontData {
  name: string;
  id: string;
  styles: FontStyle[];
  isPremium?: boolean;
}

const fonts: FontData[] = [
  {
    name: "Ekushey Lal Salu Normal",
    id: "ekushey-lalsalu",
    styles: [
      { name: "Regular", weight: "400", file: "/fonts/EkusheyLalsalu-Regular.ttf", fontClass: "font-ekushey-regular" },
      { name: "Bold", weight: "700", file: "/fonts/EkusheyLalsalu-Bold.ttf", fontClass: "font-ekushey-bold" }
    ]
  },
  {
    name: "Adorsho Lipi",
    id: "adorsho-lipi",
    styles: [
      { name: "Regular", weight: "400", file: "/fonts/AdorshoLipi.ttf", fontClass: "font-adorsho-regular" }
    ]
  },
  {
    name: "Bornomala",
    id: "bornomala",
    styles: [
      { name: "Regular", weight: "400", file: "/fonts/Bornomala-Regular.ttf", fontClass: "font-bornomala-regular" },
      { name: "Bold", weight: "700", file: "/fonts/Bornomala-Bold.ttf", fontClass: "font-bornomala-bold" }
    ]
  },
  {
    name: "July",
    id: "july",
    isPremium: true,
    styles: [
      { name: "Regular", weight: "400", file: "/fonts/July-Regular.ttf", fontClass: "font-july-regular" },
      { name: "Italic", weight: "400", file: "/fonts/July-Italic.ttf", fontClass: "font-july-italic" },
      { name: "Bold", weight: "700", file: "/fonts/July-Bold.ttf", fontClass: "font-july-bold" },
      { name: "Bold Italic", weight: "700", file: "/fonts/July-Bold-Italic.ttf", fontClass: "font-july-bold-italic" }
    ]
  },
  {
    name: "Purno",
    id: "purno",
    styles: [
      { name: "Regular", weight: "400", file: "/fonts/Purno.woff", fontClass: "font-purno-regular" }
    ]
  },
  {
    name: "Solaiman Lipi",
    id: "solaiman-lipi",
    styles: [
      { name: "Thin", weight: "100", file: "/fonts/SolaimanLipi-Thin.ttf", fontClass: "font-solaiman-thin" },
      { name: "Regular", weight: "400", file: "/fonts/SolaimanLipi-Regular.ttf", fontClass: "font-solaiman-regular" },
      { name: "Bold", weight: "700", file: "/fonts/SolaimanLipi-Bold.ttf", fontClass: "font-solaiman-bold" }
    ]
  },
  {
    name: "Kalpurush",
    id: "kalpurush",
    styles: [
      { name: "Regular", weight: "400", file: "/fonts/kalpurush.ttf", fontClass: "font-kalpurush-regular" }
    ]
  },
  {
    name: "Sagar",
    id: "sagar",
    styles: [
      { name: "Regular", weight: "400", file: "/fonts/sagar.ttf", fontClass: "font-sagar-regular" }
    ]
  }
];

const GLYPHS = "অ আ ই ঈ উ ঊ ঋ এ ঐ ও ঔ ক খ গ ঘ ঙ চ ছ জ ঝ ঞ ট ঠ ড ঢ ণ ত থ দ ধ ন প ফ ব ভ ম য র ল শ ষ স হ ড় ঢ় য় ৎ ং ঃ ঁ ৰ ৱ া ি ী ু ূ ৃ ে ৈ ো ৌ ৗ ্‌ । ॥ ০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ ৳ ক্ক ক্ট ক্ট্র ক্ত ক্ত্র ক্ন ক্ব ক্ম ক্র ক্ল ক্ষ ক্ষ্ণ ক্ষ্ম ক্ষ্র ক্স খ্র গু গ্গ গ্ধ গ্ন গ্ব গ্ম গ্র গ্রু গ্রূ গ্ল ঘ্ন ঘ্ব ঘ্র ঙ্ক ঙ্ক্র ঙ্খ ঙ্গ ঙ্ম চ্ঞ চ্র ছ্ব ছ্র জ্জ জ্জ্ব জ্ঝ জ্ঞ জ্ব জ্র ঞ্চ ঞ্ছ ঞ্জ ঞ্ঝ ট্ট ট্ব ট্ম ট্র ঠ্র ড্ড ড্র ঢ্র ণ্ট ণ্ঠ ণ্ড ণ্ড্র ণ্ঢ ণ্ণ ণ্ব ণ্ম ণ্র ত্ত ত্ত্ব ত্থ ত্ন ত্ব ত্ল ত্ম ত্র ত্রু ত্রূ থ্ব থ্র থ্রু থ্রূ থ্ল দ্দ দ্দ্ব দ্ধ দ্ধ্ব দ্ন দ্ব দ্ভ দ্ভ্র দ্ম দ্র দ্রু দ্রূ ধ্ন ধ্ব ধ্ম ন্জ ন্ট ন্ট্র ন্ঠ ন্ড ন্ড্র ন্ত ন্ত্ব ন্ত্র ন্থ ন্দ ন্দ্র ন্ধ ন্ধ্র ন্ন ন্ব ন্ম ন্র ন্স প্ট প্ত প্ত্র প্ন প্প প্র প্রু প্রূ প্ল প্স ফ্ট ফ্র ফ্ল ব্জ ব্দ ব্ধ ব্ব ব্র ব্রু ব্রূ ব্ল ভ্র ভ্রু ভ্রূ ভ্ল ম্ন ম্ফ ম্ব ম্ব্র ম্ভ ম্ভ্র ম্ম ম্র ম্ল য্র ল্ক ল্গ ল্ড ল্প ল্ফ ল্ব ল্ম ল্র ল্ল ল্স শু শ্চ শ্ছ শ্ন শ্ব শ্ম শ্র শ্রু শ্রূ শ্ল ষ্ক ষ্ক্র ষ্ট ষ্ট্র ষ্ঠ ষ্ফ ষ্ব ষ্ম ষ্র স্ক স্ক্র স্খ স্ট স্ট্র স্ত স্ত্র স্থ স্ন স্প্ল স্ফ স্ব স্ম স্রু স্রূ স্ল হু হৃ হ্ণ হ্ন হ্ম হ্ব হ্র হ্ল ড়্গ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z 0 1 2 3 4 5 6 7 8 9";

const FontSimplified = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [showEmbedPopup, setShowEmbedPopup] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(40);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const trackEvent = (path: string) => {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({
        path: path,
        event: true,
      });
    }
  };

  const resetControls = () => {
    setFontSize(40);
    setLetterSpacing(0);
    setLineHeight(1.2);
    setTextColor("#ffffff");
    setTextAlign("left");
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      if (selectedFontId) {
        trackEvent(`/font/embed/${selectedFontId}`);
      }
      setTimeout(() => setCopied(null), 2000);
    });
  };

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      const font = fonts.find(f => f.id === hash);
      if (font) {
        setSelectedFontId(font.id);
      } else {
        setSelectedFontId(null);
      }
    } else {
      setSelectedFontId(null);
    }
  }, [location.hash]);

  const filteredFonts = fonts.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedFont = fonts.find(f => f.id === selectedFontId);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <div className="max-w-5xl mx-auto pt-6 md:pt-20 px-4">
        <header className="flex items-center gap-4 mb-10">
          <button
            onClick={() => selectedFontId ? navigate("/F") : navigate("/")}
            className="p-2.5 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-5xl font-bold font-mono truncate gradient-text">
              Bangla Fonts Simplified
            </h1>
            <p className="text-muted-foreground font-mono text-[10px] md:text-sm truncate">
              {"// Simplifying Bangla typography for the web"}
            </p>
          </div>

          <Link
            to="/F/L"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-1 border border-border hover:border-primary text-xs font-mono transition-all shrink-0"
          >
            <LogIn size={14} />
            <span className="hidden md:inline">Sign In</span>
          </Link>
        </header>

        {!selectedFontId && (
          <div className="relative mb-10 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Search fonts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-14 w-full rounded-2xl border border-border bg-surface-1 px-12 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Font Content */}
        <div className="min-h-[400px]">
          {!selectedFontId ? (
            <div className="flex flex-col gap-4 animate-fade-in pb-20">
              {filteredFonts.map((font) => (
                <div
                  key={font.id}
                  onClick={() => navigate(`#${font.id}`)}
                  className="group cursor-pointer border border-border rounded-2xl bg-surface-1/50 hover:bg-surface-1 hover:border-primary/50 transition-all p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="min-w-[180px] shrink-0">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate flex items-center gap-2">
                      {font.name}
                      {font.isPremium && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 ml-1">
                          <Crown size={9} />
                          PRO
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{font.styles.length} styles available</p>
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <p
                      className={cn("text-2xl md:text-3xl whitespace-nowrap overflow-hidden pr-20 transition-all", font.styles[0].fontClass)}
                      style={{ fontSynthesis: 'none' }}
                    >
                      আমি তোমায় ভালোবেসে করেছি তো ভূল
                    </p>
                    <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none md:from-surface-1" />
                  </div>
                  <div className="shrink-0 hidden md:block">
                    <div className="p-2 rounded-xl bg-surface-2 border border-border group-hover:border-primary/50 transition-colors">
                      <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary" />
                    </div>
                  </div>
                </div>
              ))}
              {filteredFonts.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mx-auto mb-4">
                    <Info size={32} className="text-muted-foreground/30" />
                  </div>
                  <h3 className="text-xl font-mono text-muted-foreground">No fonts found matching "{searchTerm}"</h3>
                </div>
              )}
            </div>
          ) : (
            selectedFont && (
              <div className="animate-fade-in space-y-12 pb-20">
                {/* Font Title and Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
                  <div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 flex items-center gap-3">
                      {selectedFont.name}
                      {selectedFont.isPremium && (
                        <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-md bg-primary/15 text-primary border border-primary/25">
                          <Crown size={12} />
                          PRO
                        </span>
                      )}
                    </h2>
                    <div className="flex flex-wrap gap-4">
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                        {selectedFont.styles.length} Styles Available
                      </span>
                      <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded border border-border">
                        ID: {selectedFont.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Preview Input & Controls */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Type here to preview</label>
                    <input
                      type="text"
                      placeholder="আমি তোমায় ভালোবেসে করেছি তো ভূল"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full bg-surface-1 border border-border rounded-2xl px-6 py-4 text-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-surface-1 border border-border rounded-3xl shadow-inner">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Font Size</span>
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="144"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Letter Spacing</span>
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{letterSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="50"
                        value={letterSpacing}
                        onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Line Height</span>
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{lineHeight}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={lineHeight}
                        onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col justify-between space-y-4">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Format & Style</span>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border">
                          <button onClick={() => setTextAlign("left")} className={cn("p-1.5 rounded-lg transition-all", textAlign === "left" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-surface-3 text-muted-foreground")}>
                            <AlignLeft size={16} />
                          </button>
                          <button onClick={() => setTextAlign("center")} className={cn("p-1.5 rounded-lg transition-all", textAlign === "center" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-surface-3 text-muted-foreground")}>
                            <AlignCenter size={16} />
                          </button>
                          <button onClick={() => setTextAlign("right")} className={cn("p-1.5 rounded-lg transition-all", textAlign === "right" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-surface-3 text-muted-foreground")}>
                            <AlignRight size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border">
                          <button onClick={() => setIsBold(!isBold)} className={cn("p-1.5 rounded-lg transition-all", isBold ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-surface-3 text-muted-foreground")}>
                            <Bold size={16} />
                          </button>
                          <button onClick={() => setIsItalic(!isItalic)} className={cn("p-1.5 rounded-lg transition-all", isItalic ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-surface-3 text-muted-foreground")}>
                            <Italic size={16} />
                          </button>
                          <button onClick={() => setIsUnderline(!isUnderline)} className={cn("p-1.5 rounded-lg transition-all", isUnderline ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-surface-3 text-muted-foreground")}>
                            <Underline size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-surface-2 border border-border">
                            <Palette size={16} className="text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-8 h-8 rounded-full border-2 border-border cursor-pointer bg-transparent overflow-hidden"
                            />
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{textColor}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={resetControls}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-border hover:border-primary/50 text-xs font-mono transition-all group"
                      >
                        <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        Reset Defaults
                      </button>
                    </div>
                  </div>
                </div>

                {/* Style Previews */}
                <div className="space-y-8">
                  {selectedFont.styles.map((style) => (
                    <div key={style.name} className="terminal-window overflow-hidden">
                      <div className="terminal-header flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">STYLE::{style.name.toUpperCase()}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-muted-foreground">{style.weight} Weight</span>
                        </div>
                      </div>
                      <div className="p-8 md:p-12">
                        <p
                          className={cn("leading-tight break-words transition-all", style.fontClass)}
                          style={{
                            fontSynthesis: 'none',
                            fontSize: `${fontSize}px`,
                            letterSpacing: `${letterSpacing}px`,
                            lineHeight: lineHeight,
                            color: textColor,
                            textAlign: textAlign,
                            fontWeight: isBold ? 'bold' : undefined,
                            fontStyle: isItalic ? 'italic' : undefined,
                            textDecoration: isUnderline ? 'underline' : undefined
                          }}
                        >
                          {customText || "আমি তোমায় ভালোবেসে করেছি তো ভূল"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setShowDownloadPopup(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-surface-1 border border-border font-bold hover:border-primary transition-all active:scale-95 text-lg shadow-lg"
                  >
                    <Download size={20} />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setShowEmbedPopup(true);
                      if (selectedFontId) trackEvent(`/font/embed-view/${selectedFontId}`);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 text-lg shadow-lg shadow-primary/20"
                  >
                    <Code size={20} />
                    Embed
                  </button>
                </div>

                {/* Glyph Preview */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold font-mono uppercase tracking-tighter">Font Glyphs Preview</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="terminal-window p-8 md:p-12 overflow-hidden">
                    <div
                      className={cn("grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-8 text-muted-foreground/80 justify-items-center", selectedFont.styles[0].fontClass)}
                      style={{ fontSynthesis: 'none' }}
                    >
                      {GLYPHS.split(" ").map((glyph, i) => (
                        <span key={i} className="text-4xl md:text-5xl lg:text-6xl hover:text-primary transition-all cursor-default hover:scale-125 transform-gpu">{glyph}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Download Popup */}
                {showDownloadPopup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                    <div className="terminal-window max-w-md w-full shadow-2xl">
                      <div className="terminal-header flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download size={14} className="text-primary" />
                          <span className="text-xs font-mono font-bold">DOWNLOAD_OPTIONS</span>
                        </div>
                        <button
                          onClick={() => setShowDownloadPopup(false)}
                          className="p-1 hover:bg-surface-2 rounded-md transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <p className="text-sm text-muted-foreground mb-4 font-mono">Select style to download:</p>
                        {selectedFont.styles.map((style) => (
                          <a
                            key={style.name}
                            href={style.file}
                            download={`${selectedFont.id}-${style.name.toLowerCase()}.ttf`}
                            onClick={() => trackEvent(`/font/download/${selectedFont.id}/${style.name.toLowerCase()}`)}
                            className="flex items-center justify-between p-4 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all group"
                          >
                            <span className="font-bold">{style.name}</span>
                            <Download size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          </a>
                        ))}
                        <button
                          onClick={() => setShowDownloadPopup(false)}
                          className="w-full py-3 mt-4 rounded-xl bg-surface-2 border border-border font-bold hover:bg-surface-3 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embed Popup */}
                {showEmbedPopup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                    <div className="terminal-window max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                      <div className="terminal-header flex items-center justify-between sticky top-0 bg-surface-1 z-10">
                        <div className="flex items-center gap-2">
                          <Code size={14} className="text-primary" />
                          <span className="text-xs font-mono font-bold uppercase">Web Embed</span>
                        </div>
                        <button
                          onClick={() => setShowEmbedPopup(false)}
                          className="p-1 hover:bg-surface-2 rounded-md transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                       <div className="p-6 md:p-8 space-y-10">
                        {selectedFont.isPremium && (
                          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3">
                            <Key size={18} className="text-accent shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-accent mb-1">Premium Font — API Key Required</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                July font requires an API key for embedding. Download is free, but to embed it via CSS, you'll need an API key.{" "}
                                <Link to="/F/L" className="text-primary hover:underline" onClick={() => setShowEmbedPopup(false)}>
                                  Sign in or create an account
                                </Link>{" "}
                                to get one.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-6">
                          <div className="flex items-center gap-4 text-primary">
                            <Code size={20} />
                            <h4 className="text-xl font-bold uppercase tracking-tight">&lt;link&gt;</h4>
                          </div>

                          <div className="space-y-4">
                            <h5 className="text-sm font-mono text-muted-foreground uppercase">Embed code in the &lt;head&gt; of your html</h5>
                            <div className="relative group">
                              <pre className="bg-surface-1 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-border text-muted-foreground leading-relaxed">
{selectedFont.isPremium
  ? `<link rel="preconnect" href="https://abdullah.ami.bd">
<link rel="stylesheet" href="https://abdullah.ami.bd/api/validate-font-key?key=YOUR_API_KEY&font=${selectedFont.id}">`
  : `<link rel="preconnect" href="https://abdullah.ami.bd">
<link rel="stylesheet" href="https://abdullah.ami.bd/fonts/${selectedFont.id}.css">`}
                              </pre>
                              <button
                                onClick={() => handleCopy(
                                  selectedFont.isPremium
                                    ? `<link rel="preconnect" href="https://abdullah.ami.bd">\n<link rel="stylesheet" href="https://abdullah.ami.bd/api/validate-font-key?key=YOUR_API_KEY&font=${selectedFont.id}">`
                                    : `<link rel="preconnect" href="https://abdullah.ami.bd">\n<link rel="stylesheet" href="https://abdullah.ami.bd/fonts/${selectedFont.id}.css">`,
                                  'link'
                                )}
                                className="absolute right-4 top-4 p-2 rounded-lg bg-surface-1 border border-border hover:border-primary transition-all opacity-0 group-hover:opacity-100"
                              >
                                {copied === 'link' ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h5 className="text-sm font-mono text-muted-foreground uppercase">CSS class</h5>
                            <div className="relative group">
                              <pre className="bg-surface-1 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-border text-muted-foreground leading-relaxed">
{`.${selectedFont.id}-regular {
  font-family: "${selectedFont.name}", sans-serif;
  font-weight: 400;
  font-style: normal;
}`}
                              </pre>
                              <button
                                onClick={() => handleCopy(`.${selectedFont.id}-regular {\n  font-family: "${selectedFont.name}", sans-serif;\n  font-weight: 400;\n  font-style: normal;\n}`, 'css')}
                                className="absolute right-4 top-4 p-2 rounded-lg bg-surface-1 border border-border hover:border-primary transition-all opacity-0 group-hover:opacity-100"
                              >
                                {copied === 'css' ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {!selectedFont.isPremium && (
                        <div className="space-y-6 pt-10 border-t border-border">
                          <div className="flex items-center gap-4 text-accent">
                            <Type size={20} />
                            <h4 className="text-xl font-bold uppercase tracking-tight">@import</h4>
                          </div>

                          <div className="space-y-4">
                            <h5 className="text-sm font-mono text-muted-foreground uppercase">Embed code in the &lt;head&gt; of your html</h5>
                            <div className="relative group">
                              <pre className="bg-surface-1 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-border text-muted-foreground leading-relaxed">
{`<style>
@import url('https://abdullah.ami.bd/fonts/${selectedFont.id}.css');
</style>`}
                              </pre>
                              <button
                                onClick={() => handleCopy(`<style>\n@import url('https://abdullah.ami.bd/fonts/${selectedFont.id}.css');\n</style>`, 'import')}
                                className="absolute right-4 top-4 p-2 rounded-lg bg-surface-1 border border-border hover:border-primary transition-all opacity-0 group-hover:opacity-100"
                              >
                                {copied === 'import' ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>
                        )}

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8">
                          <button
                            onClick={() => navigate("/F/D")}
                            className="flex items-center gap-2 text-primary font-mono text-sm hover:underline"
                          >
                            <Info size={16} />
                            Read Documentation
                          </button>
                          <button
                            onClick={() => setShowEmbedPopup(false)}
                            className="w-full md:w-auto px-10 py-3 rounded-xl bg-surface-2 border border-border font-bold hover:bg-surface-3 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FontSimplified;
