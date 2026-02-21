import { useState, useEffect } from "react";

const API_KEY = "hajwwg316qfr22czgo9kdzwb81z65ipj97gosnai39wm0f88mg";
const API_URL = "https://abdullahbari.goatcounter.com/api/v0/stats/total";

export const VisitorCounter = () => {
  const [count, setCount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        });
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        // 'total' represents total hits/pageviews in GoatCounter API
        setCount(data.total?.toLocaleString() || "0");
        setError(false);
      } catch (err) {
        console.error("Error fetching visitor count:", err);
        setCount("ERR_FETCH_FAILED");
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  return (
    <div
      className="font-mono text-[10px] sm:text-xs animate-fade-in-up opacity-0 space-y-1.5"
      style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
    >
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <span className="text-primary">$</span>
        <span>curl -X GET /api/stats/total</span>
      </div>

      <div className="flex flex-col border-l border-primary/20 pl-3 py-1 ml-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/40 text-[9px]">
            [{loading ? "..." : (error ? "ERROR" : "SUCCESS")}]
          </span>
          <span className="text-foreground/80">visitors_count:</span>
          <span className="text-primary font-bold">
            {loading ? (
              <span className="inline-block w-8 h-3 bg-primary/20 animate-pulse rounded" />
            ) : (
              count
            )}
          </span>
        </div>

        {!loading && (
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/40">
            <span>&gt; status: stable</span>
            <span className="relative flex h-1.5 w-1.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary/60"></span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
