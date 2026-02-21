import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Globe, MousePointer2, Smartphone, Terminal, Users, Download, Code, Monitor, ExternalLink, Activity, Calendar, X, ChevronRight, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const API_KEY = import.meta.env.VITE_GOATCOUNTER_API_KEY;
const BASE_URL = "https://abdullahbari.goatcounter.com/api/v0";

// Types for GoatCounter API
interface TotalStats {
  total: number;
}

interface DailyStats {
  total: number;
  list: Array<{
    day: string;
    count: number;
  }>;
}

interface HitStats {
  hits: Array<{
    path: string;
    title: string;
    event: boolean;
    count: number;
    count_unique: number;
  }>;
}

interface PropertyStats {
  list: Array<{
    name: string;
    count: number;
    count_unique: number;
  }>;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);

  // Fetch Total Stats
  const { data: totalData, isLoading: isLoadingTotal } = useQuery<TotalStats>({
    queryKey: ["stats-total"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/stats/total`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      return res.json();
    },
  });

  // Fetch Daily Stats
  const { data: dailyData, isLoading: isLoadingDaily } = useQuery<DailyStats>({
    queryKey: ["stats-daily"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/stats/total?daily=true`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      return res.json();
    },
  });

  // Fetch Hits (Pages and Events)
  const { data: hitsData, isLoading: isLoadingHits } = useQuery<HitStats>({
    queryKey: ["stats-hits"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/stats/hits`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      return res.json();
    },
  });

  // Fetch Hits with Daily data (for graphs)
  const { data: dailyHitsData, isLoading: isLoadingDailyHits } = useQuery<any>({
    queryKey: ["stats-hits-daily"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/stats/hits?daily=true`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      return res.json();
    },
  });

  const isLoading = isLoadingTotal || isLoadingHits || isLoadingDaily || isLoadingDailyHits;

  // Process Font Analytics
  const fontStats = (hitsData?.hits || [])
    .filter(h => h.path.includes('font/'))
    .reduce((acc: any, curr) => {
      const cleanPath = curr.path.startsWith('/') ? curr.path.slice(1) : curr.path;
      const parts = cleanPath.split('/');
      const type = parts[1]; // download, embed, embed-view
      const id = parts[2];

      if (!id) return acc;
      if (!acc[id]) {
        acc[id] = { id, downloads: 0, embeds: 0, views: 0, liveEmbeds: 0 };
      }

      if (type === 'download') acc[id].downloads += curr.count;
      else if (type === 'embed') acc[id].embeds += curr.count;
      else if (type === 'embed-view') acc[id].views += curr.count;

      return acc;
    }, {});

  // Add "Live" stats (from last day of daily stats)
  if (dailyHitsData?.hits) {
    dailyHitsData.hits.forEach((h: any) => {
      if (h.path.includes('font/embed')) {
        const cleanPath = h.path.startsWith('/') ? h.path.slice(1) : h.path;
        const parts = cleanPath.split('/');
        const id = parts[2];
        if (id && fontStats[id] && h.daily && h.daily.length > 0) {
          // Last element is usually the most recent day
          fontStats[id].liveEmbeds = h.daily[h.daily.length - 1].count;
        }
      }
    });
  }

  const fontStatsArray = Object.values(fontStats);

  // Top Pages (excluding events)
  const topPages = hitsData?.hits
    .filter(h => !h.path.includes('font/'))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) || [];

  const getFontGraphData = (id: string) => {
    if (!dailyHitsData?.hits) return [];

    const downloads = dailyHitsData.hits.find((h: any) => h.path.includes(`font/download/${id}`));
    const embeds = dailyHitsData.hits.find((h: any) => h.path.includes(`font/embed/${id}`));

    const days = new Set([
      ...(downloads?.daily?.map((d: any) => d.day) || []),
      ...(embeds?.daily?.map((d: any) => d.day) || [])
    ]);

    return Array.from(days).sort().slice(-3).map(day => ({
      day: day.split('-').slice(1).join('/'), // format as MM/DD
      downloads: downloads?.daily?.find((d: any) => d.day === day)?.count || 0,
      embeds: embeds?.daily?.find((d: any) => d.day === day)?.count || 0,
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono pb-20">
      <div className="max-w-6xl mx-auto pt-10 px-4">
        <header className="flex items-center gap-4 mb-12">
          <button
            onClick={() => navigate("/")}
            className="p-2.5 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group shrink-0"
          >
            <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text uppercase tracking-tighter">System Analytics</h1>
            <p className="text-muted-foreground text-[10px]">{"// SECURE_ACCESS::ESTABLISHED"}</p>
          </div>
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="terminal-window p-6 border-primary/20">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Users size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Pageviews</span>
            </div>
            <div className="text-4xl font-bold">{isLoadingTotal ? "..." : totalData?.total.toLocaleString()}</div>
            <div className="mt-2 text-[9px] text-muted-foreground">SINCE DEPLOYMENT</div>
          </div>
        </div>

        {/* Top Pages & System Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-10">
          <div className="terminal-window">
            <div className="terminal-header">
              <Terminal size={12} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Traffic::Top_Pages</span>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topPages.map((page: any, idx) => (
                  <div key={page.path} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground font-bold w-4">0{idx + 1}</span>
                        <span className="text-xs font-bold group-hover:text-primary transition-colors">{page.path}</span>
                      </div>
                      <span className="text-[10px] font-bold text-primary">{page.count.toLocaleString()} hits</span>
                    </div>
                    <div className="w-full bg-surface-2 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-1000"
                        style={{ width: `${(page.count / topPages[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Font Internal Analysis */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-2">
              <Code size={20} className="text-primary" />
              Font Analytics
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {fontStatsArray.length > 0 ? fontStatsArray.map((font: any) => (
              <div
                key={font.id}
                onClick={() => setSelectedFontId(font.id)}
                className="terminal-window p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors">
                    <Type size={18} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-bold uppercase tracking-tight">{font.id}</span>
                    <p className="text-[9px] text-muted-foreground uppercase">Internal Registry</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 md:gap-16">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase block">Total Downloads</span>
                    <div className="flex items-center gap-2">
                      <Download size={12} className="text-primary" />
                      <span className="text-sm font-bold">{font.downloads.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase block">Live Embedded</span>
                    <div className="flex items-center gap-2">
                      <Activity size={12} className="text-accent" />
                      <span className="text-sm font-bold">{font.liveEmbeds.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center terminal-window border-dashed bg-transparent">
                <div className="flex flex-col items-center gap-3">
                  <Activity size={32} className="text-muted-foreground/20" />
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">No telemetry data</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Font Popup */}
        {selectedFontId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="terminal-window max-w-2xl w-full shadow-2xl overflow-hidden">
              <div className="terminal-header flex items-center justify-between bg-surface-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-primary" />
                  <span className="text-xs font-mono font-bold uppercase">{selectedFontId} :: Analytics</span>
                </div>
                <button
                  onClick={() => setSelectedFontId(null)}
                  className="p-1 hover:bg-surface-3 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold uppercase tracking-tighter">{selectedFontId}</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] text-muted-foreground uppercase">Downloads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-[10px] text-muted-foreground uppercase">Embeds</span>
                    </div>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getFontGraphData(selectedFontId)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "10px", textTransform: "uppercase" }}
                      />
                      <Bar dataKey="downloads" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="embeds" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 pt-8 border-t border-border flex justify-end">
                  <button
                    onClick={() => setSelectedFontId(null)}
                    className="px-6 py-2 rounded-xl bg-surface-2 border border-border hover:bg-surface-3 transition-colors text-xs font-bold uppercase"
                  >
                    Close Terminal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Footer */}
        <footer className="mt-20 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone size={14} />
              <span className="text-[9px] uppercase tracking-tighter">Status: Nominal</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={14} />
              <span className="text-[9px] uppercase tracking-tighter">Updated: Real-time</span>
            </div>
          </div>
          <a
            href="https://abdullahbari.goatcounter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[9px] text-primary hover:text-primary/80 font-bold uppercase tracking-widest transition-colors"
          >
            Terminal Access [Dashboard]
            <ExternalLink size={12} />
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Analytics;
