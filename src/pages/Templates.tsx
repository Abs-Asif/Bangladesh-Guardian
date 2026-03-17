import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const templates = [
  { id: 'default', name: 'Classic', path: '/PhotocardTemplate.png' },
  { id: 'template-1', name: 'Modern', path: '/Template-1.png' },
  { id: 'template-2', name: 'Bold', path: '/Template-2.png' },
  { id: 'template-3', name: 'Clean', path: '/Template-3.png' },
  { id: 'template-4', name: 'Minimal', path: '/Template-4.png' },
  { id: 'template-5', name: 'Accent', path: '/Template-5.png' },
  { id: 'template-6', name: 'Focus', path: '/Template-6.png' },
  { id: 'template-7', name: 'Dynamic', path: '/Template-7.png' },
];

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    return localStorage.getItem('bg_selected_template') || 'default';
  });

  const handleSelect = (id: string) => {
    setSelectedTemplate(id);
    localStorage.setItem('bg_selected_template', id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Photocard Templates</h1>
        <p className="text-muted-foreground">Select a template for your photocards. One at a time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "group relative bg-card rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
              selectedTemplate === template.id
                ? "border-primary shadow-xl ring-2 ring-primary/20"
                : "border-transparent hover:border-primary/50"
            )}
            onClick={() => handleSelect(template.id)}
          >
            <div className="aspect-square bg-surface-1 overflow-hidden">
              <img
                src={template.path}
                alt={template.name}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground p-1 rounded-full shadow-lg">
                <Check className="h-4 w-4" />
              </div>
            )}

            <div className="p-4 bg-surface-2">
              <p className="font-bold text-center uppercase tracking-wider text-sm">{template.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
