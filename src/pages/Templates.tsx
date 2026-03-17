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
    // Dispatch storage event manually for same-tab updates
    window.dispatchEvent(new Event('storage'));
    toast.success("Template updated");
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Layout className="w-8 h-8 text-primary" />
          Photocard Templates
        </h1>
        <p className="text-zinc-400">Select a background template for your photocards. All generations will use the selected template.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelect(template.file)}
            className={cn(
              "group relative flex flex-col cursor-pointer transition-all duration-300",
              "rounded-3xl border p-4 bg-zinc-900/40 hover:bg-zinc-900/80 hover:scale-[1.02]",
              selectedTemplate === template.file
                ? "border-primary shadow-2xl shadow-primary/10 bg-zinc-900"
                : "border-zinc-800"
            )}
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-inner mb-4 relative">
              <img
                src={`/${template.file}`}
                alt={template.name}
                className="w-full h-full object-contain p-2"
              />
              {selectedTemplate === template.file && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-primary text-white p-3 rounded-full shadow-xl">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-2">
              <div>
                <h3 className={cn(
                  "font-bold transition-colors",
                  selectedTemplate === template.file ? "text-primary" : "text-white group-hover:text-primary"
                )}>
                  {template.name}
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                  {template.file}
                </p>
              </div>
              {selectedTemplate === template.file && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                  ACTIVE
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
