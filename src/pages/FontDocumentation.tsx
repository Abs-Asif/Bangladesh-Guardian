import { ArrowLeft, BookOpen, Code, Copy, Check, Globe, Type, Terminal, Info, ExternalLink, Zap, Crown, Key } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const FontDocumentation = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <div className="max-w-4xl mx-auto pt-6 md:pt-20 px-4">
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/F")}
              className="p-2.5 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group shrink-0"
            >
              <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold font-mono truncate gradient-text uppercase tracking-tight">
                Documentation
              </h1>
              <p className="text-muted-foreground font-mono text-[10px] md:text-sm truncate">
                {"// Professional Guide for Bangla Web Typography"}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
            <Zap className="text-primary shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-primary font-bold uppercase tracking-wider mb-1">Modern CSS API</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bangla Fonts Simplified provides a streamlined alternative to Google Fonts, specifically optimized for Bengali scripts.
                Our API delivers high-performance, self-hosted fonts with minimal latency.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-24">
          {/* Quickstart */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 text-primary border-b border-border pb-4">
              <Terminal size={24} />
              <h2 className="text-2xl font-bold tracking-tight uppercase">Quickstart</h2>
            </div>
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                The fastest way to get started is to include a standard HTML <code className="text-primary font-mono text-sm px-1.5 py-0.5 bg-primary/10 rounded">&lt;link&gt;</code> tag in your document head.
              </p>

              <div className="terminal-window">
                <div className="terminal-header flex justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">HTML :: HEAD</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="relative group">
                    <pre className="bg-black/50 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-border text-muted-foreground leading-relaxed">
{`<link rel="preconnect" href="https://abdullah.ami.bd">
<link rel="stylesheet" href="https://abdullah.ami.bd/fonts/ekushey-lalsalu.css">`}
                    </pre>
                    <button
                      onClick={() => handleCopy(`<link rel="preconnect" href="https://abdullah.ami.bd">\n<link rel="stylesheet" href="https://abdullah.ami.bd/fonts/ekushey-lalsalu.css">`, 'html-quick')}
                      className="absolute right-4 top-4 p-2 rounded-lg bg-surface-1 border border-border opacity-0 group-hover:opacity-100 transition-all hover:border-primary"
                    >
                      {copied === 'html-quick' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Implementation Methods */}
          <section className="space-y-12">
            <div className="flex items-center gap-3 text-primary border-b border-border pb-4">
              <Globe size={24} />
              <h2 className="text-2xl font-bold tracking-tight uppercase">Implementation</h2>
            </div>

            <div className="grid gap-16">
              {/* @import */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Code size={18} className="text-accent" />
                  CSS @import
                </h3>
                <p className="text-sm text-muted-foreground">
                  If you're using a CSS preprocessor or prefer keeping your HTML clean, use the <code className="text-accent font-mono text-xs">@import</code> rule at the top of your stylesheet.
                </p>
                <div className="terminal-window border-accent/20">
                  <div className="p-6">
                    <div className="relative group">
                      <pre className="bg-black/50 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-border text-muted-foreground leading-relaxed">
{`@import url('https://abdullah.ami.bd/fonts/solaiman-lipi.css');`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`@import url('https://abdullah.ami.bd/fonts/solaiman-lipi.css');`, 'css-import')}
                        className="absolute right-4 top-4 p-2 rounded-lg bg-surface-1 border border-border opacity-0 group-hover:opacity-100 transition-all hover:border-accent"
                      >
                        {copied === 'css-import' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Styles */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Type size={18} className="text-primary" />
                  Applying Styles
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the <code className="text-primary font-mono text-xs">font-family</code> property to apply the font. We recommend providing a fallback generic family.
                </p>
                <div className="terminal-window border-primary/20">
                  <div className="p-6">
                    <div className="relative group">
                      <pre className="bg-black/50 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-border text-muted-foreground leading-relaxed">
{`/* Apply to specific elements */
.bangla-text {
  font-family: 'Solaiman Lipi', sans-serif;
  font-weight: 400;
}

/* Apply globally */
body {
  font-family: 'Solaiman Lipi', sans-serif;
}`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`.bangla-text {\n  font-family: 'Solaiman Lipi', sans-serif;\n  font-weight: 400;\n}\n\nbody {\n  font-family: 'Solaiman Lipi', sans-serif;\n}`, 'css-usage')}
                        className="absolute right-4 top-4 p-2 rounded-lg bg-surface-1 border border-border opacity-0 group-hover:opacity-100 transition-all hover:border-primary"
                      >
                        {copied === 'css-usage' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Premium Fonts */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 text-accent border-b border-border pb-4">
              <Crown size={24} />
              <h2 className="text-2xl font-bold tracking-tight uppercase">Premium Fonts</h2>
            </div>

            <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10 space-y-4">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-accent" />
                <h4 className="font-bold uppercase text-sm tracking-wider text-accent">July Font — API Key Required</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The <strong>July</strong> font is a premium font. Downloading the font files is free, but embedding it via our CDN requires an API key.
                To get an API key, <Link to="/F/L" className="text-primary hover:underline font-bold">create an account</Link> and request one from the administrator.
              </p>
            </div>

            <div className="terminal-window">
              <div className="terminal-header flex justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">PREMIUM :: EMBED WITH API KEY</span>
              </div>
              <div className="p-6">
                <div className="relative group">
                  <pre className="bg-surface-1 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-border text-muted-foreground leading-relaxed">
{`<link rel="stylesheet" 
  href="https://abdullah.ami.bd/api/validate-font-key?key=YOUR_API_KEY&font=july">

/* Then use in CSS: */
.my-text {
  font-family: 'July', sans-serif;
  font-weight: 400;
}`}
                  </pre>
                  <button
                    onClick={() => handleCopy(`<link rel="stylesheet" href="https://abdullah.ami.bd/api/validate-font-key?key=YOUR_API_KEY&font=july">`, 'premium-embed')}
                    className="absolute right-4 top-4 p-2 rounded-lg bg-surface-1 border border-border opacity-0 group-hover:opacity-100 transition-all hover:border-accent"
                  >
                    {copied === 'premium-embed' ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Optimization */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 text-primary border-b border-border pb-4">
              <Zap size={24} />
              <h2 className="text-2xl font-bold tracking-tight uppercase">Optimization</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-surface-1 border border-border space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Info size={18} />
                  <h4 className="font-bold uppercase text-xs tracking-wider">Font Display</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our CSS files include <code className="text-primary">font-display: swap;</code> by default. This ensures text remains visible using a fallback font while the custom font is loading, improving perceived performance.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-surface-1 border border-border space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Globe size={18} />
                  <h4 className="font-bold uppercase text-xs tracking-wider">CDN Hosting</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All fonts are served via global infrastructure to ensure low-latency delivery regardless of your user's location. Preconnecting to our domain is highly recommended.
                </p>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <footer className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              &copy; 2026 Bangla Fonts Simplified :: Open Source Project
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink size={16} />
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default FontDocumentation;
