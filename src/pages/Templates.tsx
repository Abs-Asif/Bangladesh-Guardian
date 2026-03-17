import React, { useState, useEffect } from 'react';
import { Check, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const templates = [
  { id: 'default', name: 'Basic (Default)', file: 'PhotocardTemplate.png' },
  { id: 't1', name: 'Elite Red', file: 'PhotocardTemplate1.png' },
  { id: 't2', name: 'Modern Dark', file: 'PhotocardTemplate2.png' },
  { id: 't3', name: 'Classic Blue', file: 'PhotocardTemplate3.png' },
  { id: 't4', name: 'Golden Premium', file: 'PhotocardTemplate4.png' },
  { id: 't5', name: 'Silver Slate', file: 'PhotocardTemplate5.png' },
  { id: 't6', name: 'Royal Purple', file: 'PhotocardTemplate6.png' },
  { id: 't7', name: 'Deep Emerald', file: 'PhotocardTemplate7.png' },
];

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    return localStorage.getItem('bg_selected_template') || 'PhotocardTemplate.png';
  });

  const handleSelect = (file: string) => {
    setSelectedTemplate(file);
    localStorage.setItem('bg_selected_template', file);
    window.dispatchEvent(new Event('storage'));
    toast.success("Template updated");
  };

  return (
    <div className="space-y-12 animate-fade-in-up pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Visual Templates</h1>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Select background style for all generations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelect(template.file)}
            className={cn(
              "group bg-white border cursor-pointer overflow-hidden transition-all duration-300",
              selectedTemplate === template.file
                ? "border-primary shadow-lg ring-1 ring-primary/20"
                : "border-zinc-200 hover:border-zinc-400"
            )}
          >
            <div className="aspect-square bg-zinc-50 relative overflow-hidden p-4">
              <img
                src={`/${template.file}`}
                alt={template.name}
                className="w-full h-full object-contain"
              />
              {selectedTemplate === template.file && (
                <div className="absolute top-4 right-4 bg-primary text-white p-2 shadow-lg">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            <div className="p-5 flex items-center justify-between border-t border-zinc-100">
              <div className="min-w-0">
                <h3 className={cn(
                  "text-xs font-black uppercase tracking-wider transition-colors",
                  selectedTemplate === template.file ? "text-primary" : "text-zinc-900"
                )}>
                  {template.name}
                </h3>
                <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mt-1">
                  {template.file}
                </p>
              </div>
              {selectedTemplate === template.file && (
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">ACTIVE</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
