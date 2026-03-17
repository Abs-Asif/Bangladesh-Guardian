import React from 'react';
import { cn } from "@/lib/utils";
import { Home, Layout, Megaphone, Settings } from "lucide-react";

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const Sidebar = ({ activePage, onPageChange }: SidebarProps) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'ads', label: 'Ads', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen z-50 group">
      <div className={cn(
        "h-full bg-card border-r flex flex-col transition-all duration-300 ease-in-out",
        "w-16 group-hover:w-64"
      )}>
        <div className="p-4 flex items-center justify-center mb-8">
          <img src="/Logoicon.svg" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="ml-4 font-bold text-lg overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Channel 24
          </span>
        </div>

        <nav className="flex-1 px-2 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all duration-200",
                activePage === item.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <item.icon className="h-6 w-6 shrink-0" />
              <span className="ml-4 font-medium overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
