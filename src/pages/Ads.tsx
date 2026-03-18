import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Trash2, Check, Upload, X } from "lucide-react";
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
    <div className="space-y-6 lg:space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">Advertising Manager</h1>
        <p className="text-[10px] lg:text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Manage banners for photocard generation</p>
      </div>

      <div className="bg-white p-5 lg:p-6 border border-zinc-200 max-w-4xl space-y-4 lg:space-y-6 rounded-xl">
        <div className="space-y-4">
          <Label className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Register New Campaign</Label>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Campaign Name..."
              value={newAdName}
              onChange={e => setNewAdName(e.target.value)}
              className="bg-zinc-50 border-zinc-200 h-12 text-sm font-bold uppercase tracking-wider"
            />
            <Button
              className="h-12 px-8 shrink-0 text-[10px] font-black uppercase tracking-[0.2em] gap-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload Source
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
          </div>
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest italic">Images will be scaled to match photocard width. Optimal: Horizontal banners.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:gap-4 max-w-5xl">
        {ads.map((ad) => (
          <div
            key={ad.id}
            onClick={() => toggleSelect(ad.id)}
            className={cn(
              "group bg-white border flex flex-col sm:flex-row items-stretch cursor-pointer transition-all duration-300 rounded-xl overflow-hidden",
              selectedAdId === ad.id ? "border-primary ring-1 ring-primary/20" : "border-zinc-200 hover:border-zinc-400"
            )}
          >
            <div className="p-4 lg:p-5 flex-1 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-zinc-100">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className={cn(
                    "text-sm font-black uppercase tracking-wider truncate",
                    selectedAdId === ad.id ? "text-primary" : "text-zinc-900"
                  )}>
                    {ad.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", selectedAdId === ad.id ? "bg-primary animate-pulse" : "bg-zinc-300")} />
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                      {selectedAdId === ad.id ? "ACTIVE CAMPAIGN" : "STANDBY"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-300 hover:text-red-500 shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteAd(ad.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="sm:w-2/3 bg-zinc-50 flex items-center justify-center p-4">
              <div className="relative w-full h-full">
                <img src={ad.data} alt={ad.name} className="w-full h-auto max-h-[300px] object-contain rounded-lg" />
                {selectedAdId === ad.id && (
                  <div className="absolute -top-2 -right-2 bg-primary text-white p-1.5 border border-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="col-span-full py-20 border border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-300">
             <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">No campaigns registered</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ads;
