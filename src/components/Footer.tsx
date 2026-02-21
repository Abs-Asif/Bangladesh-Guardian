import { Terminal } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <Terminal size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-mono font-bold text-foreground">Md. Abdullah Bari</p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Software & Healthcare</p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-6 text-xs font-mono text-muted-foreground">
              <a href="#projects" className="hover:text-primary transition-colors">projects</a>
              <a href="#contact" className="hover:text-primary transition-colors">contact</a>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              © {currentYear} <span className="text-primary/70">built_with_passion.sh</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
