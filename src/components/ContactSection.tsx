import { Section } from "./Section";
import { Mail, Phone, MessageCircle } from "lucide-react";

const contactLinks = [
  {
    icon: Mail,
    label: "Email",
    value: "contact@abdullah.ami.bd",
    href: "mailto:contact@abdullah.ami.bd",
    fullWidth: true,
  },
  {
    icon: Phone,
    label: "Direct Call",
    value: "09638250306",
    href: "tel:09638250306",
    fullWidth: true,
  },
  {
    icon: Phone,
    label: "Direct Call",
    value: "01738745285",
    href: "tel:01738745285",
    fullWidth: false,
  },
  {
    icon: Phone,
    label: "Direct Call",
    value: "01538310838",
    href: "tel:01538310838",
    fullWidth: false,
  },
];

const FacebookIcon = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const ContactSection = () => {
  return (
    <Section id="contact">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <a href="#contact-grid" className="inline-block hover:opacity-80 transition-opacity">
            <h3 className="text-4xl font-bold text-foreground mb-4">Lets Collaborate</h3>
          </a>
          <p className="text-muted-foreground max-w-lg mx-auto">
            I'm always open to discussing new projects, medical tech innovations, or opportunities to be part of your vision.
          </p>
        </div>

        <div id="contact-grid" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {contactLinks.map((link, index) => (
            <div
              key={`${link.label}-${link.value}`}
              className={`animate-fade-in-up opacity-0 group ${
                link.fullWidth ? "col-span-2 sm:col-span-1" : "col-span-1 sm:col-span-1"
              }`}
              style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'forwards' }}
            >
              <a
                href={link.href}
                className="flex flex-col items-center p-6 rounded-2xl bg-secondary/20 border border-border/50 hover:border-primary/50 hover:bg-secondary/30 transition-all text-center h-full"
              >
                <div className="w-10 h-10 rounded-full bg-surface-1 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <link.icon size={18} className="text-primary" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{link.label}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.value}</span>
              </a>
            </div>
          ))}

          {/* Facebook */}
          <div
            className="animate-fade-in-up opacity-0 group col-span-2 sm:col-span-1"
            style={{ animationDelay: "500ms", animationFillMode: 'forwards' }}
          >
            <a
              href="https://www.facebook.com/abdullahbariasif"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-6 rounded-2xl bg-secondary/20 border border-border/50 hover:border-blue-500/50 hover:bg-secondary/30 transition-all text-center h-full"
            >
              <div className="w-10 h-10 rounded-full bg-surface-1 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FacebookIcon size={18} className="text-blue-500" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Facebook</span>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">My Personal Profile</span>
            </a>
          </div>
        </div>

        <div className="text-center animate-fade-in-up opacity-0" style={{ animationDelay: "600ms", animationFillMode: 'forwards' }}>
          <a
            href="https://wa.me/8801538310838"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-mono font-bold bg-primary text-primary-foreground transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:-translate-y-1 active:scale-[0.98]"
          >
            <MessageCircle size={18} />
            send_message
          </a>
        </div>
      </div>
    </Section>
  );
};
