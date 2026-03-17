import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Trash2, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdImage {
  id: string;
  name: string;
  data: string;
}

const DB_NAME = 'AdImagesDB';
const STORE_NAME = 'ads';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const Ads = () => {
  const [ads, setAds] = useState<AdImage[]>([]);
  const [selectedAdId, setSelectedAdId] = useState(() => localStorage.getItem('bg_selected_ad') || '');
  const [newAdName, setNewAdName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => setAds(request.result);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newAdName.trim()) {
      if (file && !newAdName.trim()) toast.error("Please enter a name first");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result as string;
      const newAd = { id: Math.random().toString(36).substr(2, 9), name: newAdName, data };

      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add(newAd);
      tx.oncomplete = () => {
        setAds([...ads, newAd]);
        setNewAdName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.success("Ad uploaded");
      };
    };
    reader.readAsDataURL(file);
  };

  const deleteAd = async (id: string) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      setAds(ads.filter(a => a.id !== id));
      if (selectedAdId === id) {
        setSelectedAdId('');
        localStorage.removeItem('bg_selected_ad');
      }
      toast.success("Ad deleted");
    };
  };

  const toggleSelect = (id: string) => {
    const newVal = selectedAdId === id ? '' : id;
    setSelectedAdId(newVal);
    if (newVal) localStorage.setItem('bg_selected_ad', newVal);
    else localStorage.removeItem('bg_selected_ad');
    window.dispatchEvent(new Event('storage'));
    toast.success(newVal ? "Ad applied" : "Ad removed");
  };

  return (
    <div className="space-y-10 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-2xl">
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
          Ad Management
        </h1>
        <p className="text-zinc-500 max-w-2xl text-lg">Upload promotional banners to be attached to your generated photocards. One active ad at a time.</p>
      </div>

      <div className="bg-card p-10 rounded-[2.5rem] border shadow-xl max-w-3xl">
        <div className="space-y-6">
          <Label className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-black">Upload New Campaign</Label>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Campaign Name (e.g. Winter Sale)"
              value={newAdName}
              onChange={e => setNewAdName(e.target.value)}
              className="bg-zinc-50 border-zinc-200 h-14 text-lg px-6 rounded-2xl"
            />
            <Button
              className="h-14 px-8 rounded-2xl shrink-0 font-bold text-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
          </div>
          <p className="text-xs text-zinc-400 italic">Recommended: Horizontal aspect ratio. Images will scale to fit card width.</p>
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className={cn(
              "break-inside-avoid group relative flex flex-col bg-card rounded-[2rem] border overflow-hidden transition-all duration-500",
              selectedAdId === ad.id ? "border-primary shadow-2xl ring-4 ring-primary/5" : "hover:border-zinc-300 hover:shadow-xl"
            )}
          >
            <div className="relative group/img cursor-pointer" onClick={() => toggleSelect(ad.id)}>
              <img src={ad.data} alt={ad.name} className="w-full h-auto block" />
              {selectedAdId === ad.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px] transition-all">
                  <div className="bg-primary text-white p-4 rounded-full shadow-2xl scale-110">
                    <Check className="w-8 h-8" />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors" />
            </div>

            <div className="p-6 bg-white flex items-center justify-between border-t">
              <div className="min-w-0">
                <h3 className="font-black text-zinc-900 truncate text-lg uppercase tracking-tight">{ad.name}</h3>
                <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", selectedAdId === ad.id ? "text-primary" : "text-zinc-400")}>
                  {selectedAdId === ad.id ? "Currently Active" : "Click to select"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 text-zinc-300 hover:text-destructive hover:bg-destructive/5 rounded-2xl"
                  onClick={() => deleteAd(ad.id)}
                >
                  <Trash2 className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center border-4 border-dashed border-zinc-100 rounded-[3rem] bg-zinc-50/50">
            <div className="p-6 bg-zinc-100 rounded-full mb-6">
              <ImageIcon className="w-16 h-16 text-zinc-300" />
            </div>
            <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">No advertising campaigns found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ads;
