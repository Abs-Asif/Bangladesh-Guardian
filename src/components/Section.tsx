import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  index?: string;
}

export const Section = ({ id, title, children, className, index }: SectionProps) => {
  return (
    <section id={id} className={cn("py-20 md:py-32 relative", className)}>
      <div className="container">
        {title && (
          <div className="flex flex-col mb-12 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-2">
              {index && <span className="text-primary font-mono text-sm">{index}.</span>}
              <h2 className="section-title mb-0">{title}</h2>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-border via-border to-transparent" />
          </div>
        )}
        {children}
      </div>
    </section>
  );
};
