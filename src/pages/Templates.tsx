import React, { useState, useEffect } from 'react';
import { Check, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const templates = [
  { id: 'default', name: 'Basic (Default)', file: 'PhotocardTemplate.png', preview: '/Def.png' },
  { id: 't1', name: 'Elite Red', file: 'PhotocardTemplate1.png', preview: '/PhotocardTemplate1.png' },
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
    <div className="space-y-6 lg:space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black   text-foreground">Visual Templates</h1>
        <p className="text-xs font-bold text-muted-foreground  ">Select background style for all generations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelect(template.file)}
            className={cn(
              "group bg-card border cursor-pointer overflow-hidden transition-all duration-300 rounded-xl",
              selectedTemplate === template.file
                ? "border-primary ring-1 ring-primary/20"
                : "border-border hover:border-muted-foreground/30"
            )}
          >
            <div className="aspect-square bg-muted relative overflow-hidden p-4">
              <img
                src={template.preview}
                alt={template.name}
                className="w-full h-full object-contain"
              />
              {selectedTemplate === template.file && (
                <div className="absolute top-4 right-4 bg-primary text-white p-2">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            <div className="p-5 flex items-center justify-between border-t border-border">
              <div className="min-w-0">
                <h3 className={cn(
                  "text-xs font-black   transition-colors",
                  selectedTemplate === template.file ? "text-primary" : "text-foreground"
                )}>
                  {template.name}
                </h3>
              </div>
              {selectedTemplate === template.file && (
                <span className="text-[9px] font-black text-primary  ">Active</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
