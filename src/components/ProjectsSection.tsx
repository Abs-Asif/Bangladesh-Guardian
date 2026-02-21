import { Section } from "./Section";
import { Smartphone, Globe, ExternalLink, Code2 } from "lucide-react";
import gramroktiLogo from "@/assets/atitilogo.png";
import greenhutLogo from "@/assets/greenhut-logo.png";

const projects = [
  {
    title: "গ্রামরক্তি",
    filename: "GramRokti.js",
    type: "Android Application",
    icon: Smartphone,
    logo: gramroktiLogo,
    url: "https://Gramrokti.vercel.app",
    description: "A mobile application designed to connect blood donors with recipients in rural areas of Bangladesh.",
    isBangla: true,
    tech: ["Android", "React", "Vite", "Capacitor", "Supabase", "Firebase", "Minimalist", "Offline", "Non profit"]
  },
  {
    title: "Greenhutbd Inventory Management",
    filename: "greenhutbd_inventory_man...",
    type: "Web Application",
    icon: Globe,
    logo: greenhutLogo,
    url: "https://Inventory.greenhutbd.com",
    description: "A comprehensive web-based inventory management system for streamlining business operations and stock tracking.",
    isBangla: false,
    tech: ["webapp", "React", "Vite", "Supabase", "Woocommerce", "Comprehensive", "Business", "Inventory"]
  },
];

export const ProjectsSection = () => {
  return (
    <Section id="projects">
      <div className="text-center mb-16 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <h3 className="text-4xl font-bold text-foreground mb-4">My recent Projects</h3>
        <p className="text-muted-foreground max-w-lg mx-auto">
          A showcase of my recent work in mobile development and web systems.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {projects.map((project, index) => (
          <div
            key={project.title}
            className="group relative terminal-window animate-fade-in-up opacity-0 flex flex-col"
            style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: "forwards" }}
          >
            {/* Terminal Header as Tab */}
            <div className="terminal-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                  {project.filename}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start gap-5 mb-6">
                {/* Project Logo */}
                <div className="w-16 h-16 rounded-xl bg-surface-1 border border-border p-2.5 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary/50 transition-colors shadow-inner">
                  <img
                    src={project.logo}
                    alt={project.title}
                    className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <h3 className={`text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors ${project.title === 'গ্রামরক্তি' ? 'font-bangla' : 'font-mono'}`}>
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-primary/70">
                    <project.icon size={12} />
                    <span>{project.type}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                {project.description}
              </p>

              <div className="space-y-4 mt-auto">
                <div className="flex flex-wrap gap-2">
                  {project.tech.map(t => (
                    <span key={t} className="text-[10px] font-mono text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end items-center">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary hover:text-white transition-colors group/link"
                  >
                    view_details
                    <ExternalLink size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
