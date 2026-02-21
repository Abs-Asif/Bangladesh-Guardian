import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Key, Plus, Trash2, Copy, Check, LogOut, Loader2, Users, ToggleLeft, ToggleRight, Crown } from "lucide-react";

const PREMIUM_FONTS = [
  { id: "july", name: "July" },
];

interface FontPermission {
  api_key_id: string;
  font_id: string;
}

interface ApiKey {
  id: string;
  user_id: string;
  api_key: string;
  label: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface UserProfile {
  user_id: string;
  email: string | null;
}

const FontAdminDashboard = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fontPerms, setFontPerms] = useState<FontPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newLabel, setNewLabel] = useState("Default");
  const [selectedFonts, setSelectedFonts] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/F/L"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some(r => r.role === "admin")) { navigate("/F/U"); return; }
    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const [keysRes, usersRes, permsRes] = await Promise.all([
      supabase.from("font_api_keys").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, email"),
      supabase.from("font_api_key_fonts").select("api_key_id, font_id"),
    ]);
    if (keysRes.data) setApiKeys(keysRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    if (permsRes.data) setFontPerms(permsRes.data);
    setLoading(false);
  };

  const createKey = async () => {
    if (!selectedUserId || selectedFonts.length === 0) return;
    setCreating(true);
    const { data: newKey } = await supabase.from("font_api_keys").insert({ user_id: selectedUserId, label: newLabel }).select("id").single();
    if (newKey) {
      await supabase.from("font_api_key_fonts").insert(
        selectedFonts.map(fontId => ({ api_key_id: newKey.id, font_id: fontId }))
      );
    }
    setNewLabel("Default");
    setSelectedUserId("");
    setSelectedFonts([]);
    await loadData();
    setCreating(false);
  };

  const toggleFont = (keyId: string, fontId: string, hasAccess: boolean) => {
    if (hasAccess) {
      supabase.from("font_api_key_fonts").delete().eq("api_key_id", keyId).eq("font_id", fontId).then(() => loadData());
    } else {
      supabase.from("font_api_key_fonts").insert({ api_key_id: keyId, font_id: fontId }).then(() => loadData());
    }
  };

  const toggleKey = async (id: string, isActive: boolean) => {
    await supabase.from("font_api_keys").update({ is_active: !isActive }).eq("id", id);
    await loadData();
  };

  const deleteKey = async (id: string) => {
    await supabase.from("font_api_keys").delete().eq("id", id);
    await loadData();
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

  const getUserEmail = (userId: string) => users.find(u => u.user_id === userId)?.email || "Unknown";
  const keyHasFont = (keyId: string, fontId: string) => fontPerms.some(p => p.api_key_id === keyId && p.font_id === fontId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <div className="max-w-5xl mx-auto pt-6 md:pt-12 px-4">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/F")} className="p-2.5 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group shrink-0">
              <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold font-mono gradient-text">Admin Dashboard</h1>
              <p className="text-muted-foreground font-mono text-[10px] md:text-sm">{"// Manage font API keys & permissions"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-1 border border-border hover:border-destructive/50 text-sm font-mono transition-all">
            <LogOut size={16} />
            Logout
          </button>
        </header>

        {/* Create New Key */}
        <div className="terminal-window mb-8">
          <div className="terminal-header">
            <div className="flex items-center gap-2">
              <Plus size={14} className="text-primary" />
              <span className="text-xs font-mono font-bold">ASSIGN_API_KEY</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                >
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div className="md:w-48 space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Font selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Grant access to fonts</label>
              <div className="flex flex-wrap gap-2">
                {PREMIUM_FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFonts(prev => prev.includes(font.id) ? prev.filter(f => f !== font.id) : [...prev, font.id])}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono border transition-all ${
                      selectedFonts.includes(font.id)
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-surface-1 border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Crown size={12} />
                    {font.name}
                    {selectedFonts.includes(font.id) && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={createKey}
                disabled={!selectedUserId || selectedFonts.length === 0 || creating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* All API Keys */}
        <div className="terminal-window">
          <div className="terminal-header">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-primary" />
              <span className="text-xs font-mono font-bold">ALL_API_KEYS ({apiKeys.length})</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {apiKeys.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-mono text-sm">
                No API keys generated yet.
              </div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="p-4 md:p-6 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{key.label}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${key.is_active ? "text-primary bg-primary/10 border-primary/20" : "text-destructive bg-destructive/10 border-destructive/20"}`}>
                          {key.is_active ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground">User: {getUserEmail(key.user_id)}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-accent bg-accent/5 px-2 py-1 rounded border border-accent/10 truncate max-w-[300px]">
                          {key.api_key}
                        </code>
                        <button onClick={() => handleCopy(key.api_key, key.id)} className="p-1 rounded hover:bg-surface-2 transition-colors shrink-0">
                          {copied === key.id ? <Check size={14} className="text-primary" /> : <Copy size={14} className="text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleKey(key.id, key.is_active)} className="p-2 rounded-lg hover:bg-surface-2 transition-colors" title={key.is_active ? "Disable" : "Enable"}>
                        {key.is_active ? <ToggleRight size={20} className="text-primary" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                      </button>
                      <button onClick={() => deleteKey(key.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Font permissions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest self-center mr-2">Fonts:</span>
                    {PREMIUM_FONTS.map(font => {
                      const hasAccess = keyHasFont(key.id, font.id);
                      return (
                        <button
                          key={font.id}
                          onClick={() => toggleFont(key.id, font.id, hasAccess)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono border transition-all ${
                            hasAccess
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-surface-1 border-border text-muted-foreground/50 hover:border-primary/20"
                          }`}
                        >
                          <Crown size={10} />
                          {font.name}
                          {hasAccess && <Check size={10} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontAdminDashboard;
