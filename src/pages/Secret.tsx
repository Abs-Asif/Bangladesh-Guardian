import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Sidebar, { PageId } from "@/components/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./Home";
import Templates from "./Templates";
import Ads from "./Ads";
import Settings from "./Settings";
import QuickDownload from "./QuickDownload";

const Secret = () => {
  const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('bg_authorized') === 'true');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const mainRef = useRef<HTMLElement>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const quickId = searchParams.get(''); // Handle ?=45310 where key is empty
  const isQuickDownload = !!quickId && /^\d+$/.test(quickId);

  useEffect(() => {
    const updateTheme = () => {
      const theme = localStorage.getItem('bg_theme') || 'day';
      if (theme === 'night') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  const hashPassword = async (string: string) => {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const hashed = await hashPassword(password);
      // SHA-256 hash of "01738745285"
      if (hashed === "af27ebbe2d45f24a3a1451104f59f8ecda9f065f86a89d5a95ed81676a0e9586") {
        setIsAuthorized(true);
        localStorage.setItem('bg_authorized', 'true');
        toast.success("Access Granted");
      } else {
        toast.error("Invalid Credentials");
      }
    } catch (error) {
      toast.error("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isQuickDownload && quickId) {
    return <QuickDownload contentId={quickId} />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-foreground">
        <div className="w-full max-w-md space-y-8 bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-4 bg-black rounded-2xl">
              <img src="/logo.png" alt="BG Logo" className="h-12 object-contain" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Photocard Automation</h1>
              <p className="text-base text-muted-foreground">Authorized Access Only</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter Access Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 rounded-xl text-center tracking-[0.5em] font-mono"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02]"
            >
              {isLoading ? "Verifying..." : "Enter Application"}
            </Button>
          </form>

          <div className="pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-1">Bangladesh Guardian</p>
            <a href="mailto:contact@abdullah.ami.bd" className="text-sm text-primary hover:underline">Support & Access</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background text-foreground overflow-hidden">
      <div className="hidden lg:block lg:w-24 xl:w-64 shrink-0">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
      <div className="lg:hidden">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
      <main ref={mainRef} className="flex-1 overflow-y-scroll relative pt-20 lg:pt-0 h-full">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className={cn(currentPage !== 'home' && "hidden")}>
            <Home />
          </div>
          <div className={cn(currentPage !== 'templates' && "hidden")}>
            <Templates />
          </div>
          <div className={cn(currentPage !== 'ads' && "hidden")}>
            <Ads />
          </div>
          <div className={cn(currentPage !== 'settings' && "hidden")}>
            <Settings />
          </div>
        </div>
        <ScrollToTop containerRef={mainRef} />
      </main>
    </div>
  );
};

export default Secret;
