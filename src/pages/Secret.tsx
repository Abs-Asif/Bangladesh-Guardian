import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Sidebar, { PageId } from "@/components/Sidebar";
import Home from "./Home";
import Templates from "./Templates";
import Ads from "./Ads";
import Settings from "./Settings";

const ENC_PW = "MDE1MjIxMDUzNzM="; // btoa("01522105373")

const Secret = () => {
  const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('bg_authorized') === 'true');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (password === atob(ENC_PW)) {
      setIsAuthorized(true);
      localStorage.setItem('bg_authorized', 'true');
    } else {
      toast.error("Incorrect Password");
    }
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
              <p className="text-base text-muted-foreground">Please enter your security key to access the tool.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Security Key</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/50 border-border text-foreground pr-10 h-12 rounded-xl focus:ring-primary/20"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold transition-all hover:scale-[1.02]">Initialize Access</Button>
          </form>

          <div className="pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-1">Need Access?</p>
            <a href="mailto:contact@abdullah.ami.bd" className="text-sm text-primary hover:underline">contact@abdullah.ami.bd</a>
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
