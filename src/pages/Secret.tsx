import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Sidebar, { PageId } from "@/components/Sidebar";
import Home from "./Home";
import Templates from "./Templates";
import Ads from "./Ads";
import Settings from "./Settings";

const Secret = () => {
  const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('bg_authorized') === 'true');
  const [currentPage, setCurrentPage] = useState<PageId>('home');

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorized(true);
    localStorage.setItem('bg_authorized', 'true');
    toast.success("Access Granted");
  };

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
            <Button type="submit" className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02]">Enter Application</Button>
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
      <main className="flex-1 overflow-y-auto relative pt-20 lg:pt-0 h-full scrollbar-hide">
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
      </main>
    </div>
  );
};

export default Secret;
