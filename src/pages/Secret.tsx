import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import Sidebar, { PageId } from "@/components/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./Home";
import Templates from "./Templates";
import Ads from "./Ads";
import Settings from "./Settings";
import QuickDownload from "./QuickDownload";

const Secret = () => {
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

  if (isQuickDownload && quickId) {
    return <QuickDownload contentId={quickId} />;
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
