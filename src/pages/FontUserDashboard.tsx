import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Key, Copy, Check, LogOut, Loader2, Info, Crown } from "lucide-react";

interface FontPermission {
  api_key_id: string;
  font_id: string;
}

interface ApiKey {
  id: string;
  api_key: string;
  label: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

const PREMIUM_FONT_NAMES: Record<string, string> = {
  july: "July",
};

const FontUserDashboard = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [fontPerms, setFontPerms] = useState<FontPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/F/L"); return; }

    setUserEmail(user.email || "");

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (roles?.some(r => r.role === "admin")) { navigate("/F/A"); return; }

    const { data: keys } = await supabase.from("font_api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (keys) {
      setApiKeys(keys);
      // Fetch font permissions for user's keys
      if (keys.length > 0) {
        const keyIds = keys.map(k => k.id);
        const { data: perms } = await supabase.from("font_api_key_fonts").select("api_key_id, font_id").in("api_key_id", keyIds);
        if (perms) setFontPerms(perms);
      }
    }
    setLoading(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/F/L");
  };

  const getFontsForKey = (keyId: string) => fontPerms.filter(p => p.api_key_id === keyId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <div className="max-w-4xl mx-auto pt-6 md:pt-12 px-4">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/F")} className="p-2.5 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group shrink-0">
              <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold font-mono gradient-text">My Dashboard</h1>
              <p className="text-muted-foreground font-mono text-[10px] md:text-sm">{userEmail}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-1 border border-border hover:border-destructive/50 text-sm font-mono transition-all">
            <LogOut size={16} />
            Logout
          </button>
        </header>

        {/* API Keys */}
        <div className="terminal-window">
          <div className="terminal-header">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-primary" />
              <span className="text-xs font-mono font-bold">MY_API_KEYS</span>
            </div>
          </div>

          {apiKeys.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mx-auto">
                <Info size={32} className="text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-mono text-muted-foreground">No API Keys Yet</h3>
              <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                You don't have any API keys assigned yet. Contact the administrator to get one assigned to your account for embedding premium fonts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {apiKeys.map((key) => {
                const keyFonts = getFontsForKey(key.id);
                return (
                  <div key={key.id} className="p-4 md:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{key.label}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${key.is_active ? "text-primary bg-primary/10 border-primary/20" : "text-destructive bg-destructive/10 border-destructive/20"}`}>
                          {key.is_active ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Created: {new Date(key.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-accent bg-accent/5 px-3 py-2 rounded-lg border border-accent/10 truncate">
                        {key.api_key}
                      </code>
                      <button onClick={() => handleCopy(key.api_key, key.id)} className="p-2 rounded-lg hover:bg-surface-2 transition-colors shrink-0">
                        {copied === key.id ? <Check size={16} className="text-primary" /> : <Copy size={16} className="text-muted-foreground" />}
                      </button>
                    </div>

                    {/* Permitted fonts */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest self-center mr-2">Permitted fonts:</span>
                      {keyFonts.length === 0 ? (
                        <span className="text-[10px] font-mono text-muted-foreground/50">No fonts assigned</span>
                      ) : (
                        keyFonts.map(perm => (
                          <span key={perm.font_id} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono bg-primary/10 border border-primary/30 text-primary">
                            <Crown size={10} />
                            {PREMIUM_FONT_NAMES[perm.font_id] || perm.font_id}
                          </span>
                        ))
                      )}
                    </div>

                    {/* Usage examples per font */}
                    {keyFonts.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {keyFonts.map(perm => (
                          <div key={perm.font_id} className="p-4 bg-surface-1 rounded-xl border border-border">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                              Usage — {PREMIUM_FONT_NAMES[perm.font_id] || perm.font_id}
                            </p>
                            <div className="relative group">
                              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<link rel="stylesheet" 
  href="https://abdullah.ami.bd/api/validate-font-key?key=${key.api_key}&font=${perm.font_id}">`}
                              </pre>
                              <button
                                onClick={() => handleCopy(`<link rel="stylesheet" href="https://abdullah.ami.bd/api/validate-font-key?key=${key.api_key}&font=${perm.font_id}">`, `usage-${key.id}-${perm.font_id}`)}
                                className="absolute right-2 top-2 p-1 rounded hover:bg-surface-2 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                {copied === `usage-${key.id}-${perm.font_id}` ? <Check size={12} className="text-primary" /> : <Copy size={12} className="text-muted-foreground" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FontUserDashboard;
