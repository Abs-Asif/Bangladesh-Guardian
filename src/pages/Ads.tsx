import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Plus, Trash2, Check, Upload } from "lucide-react";
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
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-primary" />
          Advertisement Management
        </h1>
        <p className="text-zinc-400">Add ad images to be automatically attached to the bottom of generated photocards. One ad can be active at a time.</p>
      </div>

      <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 shadow-xl max-w-2xl">
        <div className="space-y-4">
          <Label>Upload New Ad</Label>
          <div className="flex gap-4">
            <Input
              placeholder="Ad Name (e.g. Summer Promo)"
              value={newAdName}
              onChange={e => setNewAdName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 h-12"
            />
            <Button
              className="h-12 px-6 rounded-xl shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
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
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest italic">Images will be zoomed to fit the photocard width.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className={cn(
              "group relative flex flex-col bg-zinc-900/40 rounded-3xl border p-4 transition-all duration-300",
              selectedAdId === ad.id ? "border-primary bg-zinc-900 shadow-2xl shadow-primary/10" : "border-zinc-800 hover:bg-zinc-900/60"
            )}
          >
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-zinc-800 mb-4 relative">
              <img src={ad.data} alt={ad.name} className="w-full h-full object-contain" />
              {selectedAdId === ad.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                  <Check className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="min-w-0">
                <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">{ad.name}</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Ready for use</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedAdId === ad.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl h-9 text-xs"
                  onClick={() => toggleSelect(ad.id)}
                >
                  {selectedAdId === ad.id ? "ACTIVE" : "SELECT"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-500 hover:text-destructive rounded-xl"
                  onClick={() => deleteAd(ad.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
            <ImageIcon className="w-16 h-16 text-zinc-800 mb-4" />
            <p className="text-zinc-600 font-medium">No ad images uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ads;
