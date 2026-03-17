import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Home, Image as ImageIcon, Layout, Settings2, Menu, X } from "lucide-react";
import { Button } from "./ui/button";

export type PageId = 'home' | 'templates' | 'ads' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'ads', label: 'Ads', icon: ImageIcon },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ] as const;

  const handlePageChange = (id: PageId) => {
    onPageChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary rounded-lg">
            <img src="/Logoicon.svg" alt="Logo" className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">BG PhotoCard</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-zinc-400">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:w-20 xl:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden lg:flex items-center justify-center xl:justify-start gap-3">
          <div className="p-2 bg-primary rounded-xl">
            <img src="/Logoicon.svg" alt="Logo" className="w-6 h-6" />
          </div>
          <span className="hidden xl:block font-bold text-lg tracking-tight text-white">BG PhotoCard</span>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-20 lg:mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                currentPage === item.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                currentPage === item.id ? "text-white" : "group-hover:scale-110 transition-transform"
              )} />
              <span className="lg:hidden xl:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <div className="hidden xl:block p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-zinc-300">System Online</span>
            </div>
          </div>
          <div className="xl:hidden flex justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
