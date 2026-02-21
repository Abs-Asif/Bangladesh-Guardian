import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Clock,
  Calendar,
  Heart,
  Calculator,
  MapPin,
  ChevronRight,
  Loader2,
  Volume2
} from "lucide-react";

const API_KEY = import.meta.env.VITE_ISLAMIC_API_KEY;
const DHAKA_COORDS = { lat: 23.8103, lon: 90.4125 };

const to12Hour = (time24: string) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const IslamicServices = () => {
  const [activeTab, setActiveTab] = useState<"prayer" | "fasting" | "zakat" | "asma" | "ramadan">("prayer");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (tab: typeof activeTab) => {
    setLoading(true);
    setError(null);
    let url = "";

    try {
      switch (tab) {
        case "prayer":
          url = `https://islamicapi.com/api/v1/prayer-time/?lat=${DHAKA_COORDS.lat}&lon=${DHAKA_COORDS.lon}&method=4&api_key=${API_KEY}`;
          break;
        case "fasting":
          url = `https://islamicapi.com/api/v1/fasting/?lat=${DHAKA_COORDS.lat}&lon=${DHAKA_COORDS.lon}&api_key=${API_KEY}`;
          break;
        case "zakat":
          url = `https://islamicapi.com/api/v1/zakat-nisab/?standard=classical&currency=bdt&unit=gram&api_key=${API_KEY}`;
          break;
        case "asma":
          url = `https://islamicapi.com/api/v1/asma-ul-husna/?language=bn&api_key=${API_KEY}`;
          break;
        case "ramadan":
          url = `https://islamicapi.com/api/v1/ramadan/?lat=${DHAKA_COORDS.lat}&lon=${DHAKA_COORDS.lon}&api_key=${API_KEY}`;
          break;
      }

      console.log("Fetching URL:", url);
      const response = await fetch(url);
      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Result status:", result.status);
      if (result.status === "success") {
        setData(result);
      } else {
        setError(result.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null);
    fetchData(activeTab);
  }, [activeTab]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Connecting to IslamicAPI...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center border border-destructive/20 bg-destructive/5 rounded-lg">
          <p className="text-destructive font-mono text-sm">{error}</p>
          <button
            onClick={() => fetchData(activeTab)}
            className="mt-4 text-xs font-mono uppercase underline hover:text-primary transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!data) return null;

    switch (activeTab) {
      case "prayer":
        if (!data.data?.times) return null;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.data.times).map(([key, value]: [string, any]) => (
                <div key={key} className="terminal-window p-4 flex flex-col items-center justify-center gap-2 border-primary/20 bg-primary/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{key}</span>
                  <span className="text-xl font-bold font-mono text-primary">{to12Hour(value)}</span>
                </div>
              ))}
            </div>

            <div className="terminal-window p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Date Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Gregorian:</span>
                  <span>{data.data.date.readable}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Hijri:</span>
                  <span>{data.data.date.hijri.date} ({data.data.date.hijri.month.en})</span>
                </div>
              </div>
            </div>

            <div className="terminal-window p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Location Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="text-[10px]">{data.data.date.hijri.method}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span>{data.data.timezone.name} ({data.data.timezone.utc_offset})</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "fasting":
        if (!data.data?.fasting) return null;
        return (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.data.fasting.map((item: any, idx: number) => (
                <div key={idx} className="terminal-window p-6 space-y-4 border-primary/20 bg-primary/5">
                  <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                    <span className="text-xs font-mono font-bold text-primary uppercase">{item.hijri_readable}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.date}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-background/50 rounded">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Sahur (End)</p>
                      <p className="font-mono font-bold text-primary">{to12Hour(item.time.sahur)}</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Iftar (Start)</p>
                      <p className="font-mono font-bold text-primary">{to12Hour(item.time.iftar)}</p>
                    </div>
                  </div>
                  <p className="text-center text-[10px] font-mono text-muted-foreground">Duration: {item.time.duration}</p>
                </div>
              ))}
            </div>

            <div className="terminal-window p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-primary">Ayyam al-Bid (White Days)</h3>
              <div className="grid grid-cols-3 gap-4 font-mono text-sm">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground uppercase">13th</span>
                  <span>{data.data.white_days.days["13th"]}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground uppercase">14th</span>
                  <span>{data.data.white_days.days["14th"]}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground uppercase">15th</span>
                  <span>{data.data.white_days.days["15th"]}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "zakat":
        if (!data.data?.nisab_thresholds) return null;
        const { gold, silver } = data.data.nisab_thresholds;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="terminal-window p-6 border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-4 border-b border-yellow-500/10 pb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  <h3 className="text-sm font-mono font-bold text-yellow-500 uppercase tracking-widest">Gold Nisab</h3>
                </div>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground uppercase">Weight:</span>
                    <span className="text-foreground">{gold.weight} {data.weight_unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground uppercase">Unit Price:</span>
                    <span className="text-foreground">{gold.unit_price.toLocaleString()} {data.currency.toUpperCase()}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-yellow-500/10">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1 text-center">Threshold Amount</p>
                    <p className="text-xl font-bold text-yellow-500 text-center">{gold.nisab_amount.toLocaleString()} {data.currency.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="terminal-window p-6 border-zinc-400/20 bg-zinc-400/5">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-400/10 pb-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.5)]" />
                  <h3 className="text-sm font-mono font-bold text-zinc-400 uppercase tracking-widest">Silver Nisab</h3>
                </div>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground uppercase">Weight:</span>
                    <span className="text-foreground">{silver.weight} {data.weight_unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground uppercase">Unit Price:</span>
                    <span className="text-foreground">{silver.unit_price.toLocaleString()} {data.currency.toUpperCase()}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-400/10">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1 text-center">Threshold Amount</p>
                    <p className="text-xl font-bold text-zinc-400 text-center">{silver.nisab_amount.toLocaleString()} {data.currency.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="terminal-window p-6 flex items-center justify-between border-primary/20 bg-primary/5">
              <span className="text-xs font-mono font-bold uppercase text-primary">Zakat Rate</span>
              <span className="text-xl font-mono font-bold text-primary">{data.data.zakat_rate}</span>
            </div>

            <p className="text-[10px] font-mono text-muted-foreground text-center italic">*{data.data.notes}</p>
          </div>
        );

      case "asma":
        if (!data.data?.names) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.names.map((name: any) => (
              <div key={name.number} className="terminal-window p-6 group hover:border-primary/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-mono text-muted-foreground">#{name.number.toString().padStart(2, '0')}</span>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-arabic font-normal text-primary leading-loose">{name.name}</h2>
                  <div className="space-y-1">
                    <p className="font-bangla text-lg text-foreground">{name.transliteration}</p>
                    <p className="font-bangla text-sm text-primary">{name.translation}</p>
                  </div>
                  <p className="font-bangla text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {name.meaning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case "ramadan":
        if (!data.data?.fasting) return null;
        return (
          <div className="space-y-8">
            <div className="terminal-window p-8 bg-primary/5 border-primary/20 space-y-6">
              <div className="text-center border-b border-primary/10 pb-6">
                <h2 className="text-xl font-mono font-bold text-primary uppercase tracking-widest mb-2">{data.resource.dua.title}</h2>
                <p className="text-2xl font-arabic font-normal text-foreground mb-4 leading-loose">{data.resource.dua.arabic}</p>
                <div className="space-y-2">
                  <p className="text-sm font-mono text-primary italic">"{data.resource.dua.transliteration}"</p>
                  <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">{data.resource.dua.translation}</p>
                  <p className="text-[10px] text-primary/60 font-mono pt-2">{data.resource.dua.reference}</p>
                </div>
              </div>

              <div className="bg-background/40 p-6 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-3 text-primary">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Hadith of the Day</span>
                </div>
                <p className="text-lg font-arabic font-normal text-foreground mb-3 text-right leading-loose">{data.resource.hadith.arabic}</p>
                <p className="text-xs text-muted-foreground leading-relaxed italic">"{data.resource.hadith.english}"</p>
                <p className="text-[10px] text-primary/60 font-mono mt-2 uppercase">{data.resource.hadith.source} • Grade: {data.resource.hadith.grade}</p>
              </div>
            </div>

            <div className="terminal-window overflow-hidden">
              <div className="terminal-header flex justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Ramadan 1447 AH Schedule</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Dhaka, Bangladesh</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="p-4 uppercase tracking-widest text-muted-foreground">Ramadan</th>
                      <th className="p-4 uppercase tracking-widest text-muted-foreground">Date</th>
                      <th className="p-4 uppercase tracking-widest text-muted-foreground text-center">Sahur (End)</th>
                      <th className="p-4 uppercase tracking-widest text-muted-foreground text-center">Iftar (Start)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.data.fasting.map((day: any, idx: number) => {
                      const ramadanDay = day.hijri.split('-')[2];
                      return (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                          <td className="p-4 font-bold text-primary">{ramadanDay}</td>
                          <td className="p-4 text-muted-foreground">{day.date} ({day.day.substring(0, 3)})</td>
                          <td className="p-4 text-center">{to12Hour(day.time.sahur)}</td>
                          <td className="p-4 text-center">{to12Hour(day.time.iftar)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  const tabs = [
    { id: "prayer", label: "Prayer", icon: Clock },
    { id: "fasting", label: "Fasting", icon: Sun },
    { id: "zakat", label: "Zakat", icon: Calculator },
    { id: "asma", label: "99 Names", icon: Heart },
    { id: "ramadan", label: "Ramadan", icon: Moon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/20 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-mono font-bold uppercase tracking-tighter flex items-center gap-3">
              <span className="text-primary tracking-[0.2em]">Islamic</span>
              <span className="opacity-50">Services.sys</span>
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">Powered by IslamicAPI.com • Location: Dhaka</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">System Online</span>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 md:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 border ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-1 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="animate-fade-in-up">
          {renderContent()}
        </main>

        <footer className="pt-12 border-t border-border mt-12 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>Lat: {DHAKA_COORDS.lat}</span>
            <span>Lon: {DHAKA_COORDS.lon}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Umm Al-Qura University</span>
            <span>&copy; {new Date().getFullYear()} ISLAMIC_SERVICES</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default IslamicServices;
