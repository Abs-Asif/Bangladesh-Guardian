import { Section } from "./Section";
import { Book, Search, Code, Brain, Code2 } from "lucide-react";

const hobbies = [
  {
    title: "Reading Books",
    filename: "medical_literature.pdf",
    description: "Deep diving into medical literature and software engineering architecture to stay at the intersection of both fields.",
    icon: Book,
    tags: ["Medical Journals", "System Design", "Tech Docs"]
  },
  {
    title: "Researching Online",
    filename: "health_tech_trends.sh",
    description: "Actively exploring the latest trends in Health-Tech, AI integration in medicine, and modern web frameworks.",
    icon: Search,
    tags: ["Health-Tech", "AI/ML", "Market Trends"]
  },
  {
    title: "Open Source",
    filename: "contributions.git",
    description: "Building and contributing to tools that simplify development and improve accessibility (like Bangla Font Simplified).",
    icon: Code,
    tags: ["Github", "Community", "Open Source"]
  },
  {
    title: "Continuous Learning",
    filename: "skill_upgrade.log",
    description: "Constantly upgrading my skill set through documentation, online courses, and hands-on experimentation.",
    icon: Brain,
    tags: ["Problem Solving", "Growth Mindset"]
  }
];

export const HobbiesSection = () => {
  return (
    <Section id="hobbies">
      <div className="text-center mb-16 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <h3 className="text-4xl font-bold text-foreground mb-4">Hobbies & Interests</h3>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Exploring the synergy between technology, medicine, and continuous growth.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {hobbies.map((hobby, index) => (
          <div
            key={hobby.title}
            className="group relative terminal-window animate-fade-in-up opacity-0 flex flex-col"
            style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: "forwards" }}
          >
            {/* Terminal Header as Tab */}
            <div className="terminal-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                  {hobby.filename}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start gap-5 mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-1 border border-border flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors shadow-inner">
                  <hobby.icon size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors font-mono uppercase tracking-tight">
                    {hobby.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-primary/70 uppercase">
                    <span>Active Interest</span>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                {hobby.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-auto">
                {hobby.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
