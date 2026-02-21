import { Link } from "react-router-dom";

const pages = [
  {
    path: "/",
    title: "Home",
    description: "Portfolio landing page. Shows project highlights, hobbies, and contact info using a modular component-based architecture."
  },
  {
    path: "/D",
    title: "Dictionary",
    description: "Minimalist dictionary tool. Fetches word data from public APIs and renders it in a terminal-themed UI with pre-loaded audio support."
  },
  {
    path: "/F",
    title: "Bangla Font Simplified",
    description: "Font hosting platform. Allows users to preview, customize, and embed Bangla fonts using a Google Fonts-inspired API."
  },
  {
    path: "/F/D",
    title: "Font Documentation",
    description: "Developer guide. Explains how to integrate the Font API using CSS @import or HTML link tags for web projects."
  },
  {
    path: "/F/L",
    title: "Font Login",
    description: "Access control. Provides a secure login for admins and users to manage font licenses via Supabase Auth."
  },
  {
    path: "/F/A",
    title: "Font Admin",
    description: "Management console. Enables administrators to monitor API usage and manage font assets through a dashboard interface."
  },
  {
    path: "/F/U",
    title: "Font Dashboard",
    description: "Personal console. Lets users track their font embedding activity and manage their specific API keys."
  },
  {
    path: "/A",
    title: "Analytics",
    description: "Traffic dashboard. Visualizes site statistics using the GoatCounter API and React charts for real-time monitoring."
  },
  {
    path: "/FP",
    title: "Automation (Photo)",
    description: "Vocabulary card generator. Uses AI to create dual-language educational images, rendering them on a canvas for batch download."
  },
  {
    path: "/FV",
    title: "Automation (Video)",
    description: "Video reel generator. Orchestrates AI text generation and TTS to produce 1080x1920 MP4 educational videos in-browser."
  },
  {
    path: "/AI",
    title: "AI Chat",
    description: "Intelligent assistant. Leverages Gemini AI models via Puter.js to provide a markdown-rich conversational interface in a terminal style."
  },
  {
    path: "/GA",
    title: "Duck Maze Runner",
    description: "2D maze game. Uses Recursive Backtracking algorithms for procedural level generation and HTML5 Canvas for rendering."
  },
  {
    path: "/SE",
    title: "Search Engine",
    description: "Google-inspired search interface. Utilizes SerpApi to fetch and display live search results in a familiar web-standard layout."
  },
  {
    path: "/IS",
    title: "Islamic Services",
    description: "Comprehensive religious toolkit. Features prayer times, fasting schedules, zakat calculation, and Asma-ul-Husna using data from IslamicAPI."
  }
];

const Sitemap = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 lg:p-24 font-mono">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 border-b border-primary/20 pb-6">
          <h1 className="text-2xl font-bold text-primary mb-2 uppercase tracking-widest">Sitemap</h1>
          <p className="text-muted-foreground text-sm">Index of all available paths and their functionalities.</p>
        </header>

        <div className="space-y-8">
          {pages.map((page) => (
            <section key={page.path} className="group">
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                <Link
                  to={page.path}
                  className="text-primary hover:underline text-lg font-bold min-w-[120px]"
                >
                  {page.path}
                </Link>
                <h2 className="text-foreground font-semibold uppercase text-xs tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                  {page.title}
                </h2>
              </div>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-2xl border-l border-primary/10 pl-4 py-1">
                {page.description}
              </p>
            </section>
          ))}
        </div>

        <footer className="mt-24 pt-8 border-t border-primary/10 text-[10px] text-muted-foreground uppercase tracking-[0.2em] flex justify-between">
          <span>&copy; {new Date().getFullYear()} Sitemap.sys</span>
          <span>Status: 200 OK</span>
        </footer>
      </div>
    </div>
  );
};

export default Sitemap;
