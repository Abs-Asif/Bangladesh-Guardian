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
  const [previewData, setPreviewData] = useState<string | null>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCampaign = async () => {
    if (!newAdName.trim() || !previewData) {
      toast.error("Please enter a name and upload an image");
      return;
    }

    const newAd = { id: Math.random().toString(36).substr(2, 9), name: newAdName, data: previewData };

    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(newAd);
    tx.oncomplete = () => {
      setAds([...ads, newAd]);
      setNewAdName('');
      setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success("Ad campaign added");
    };
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
        <h1 className="text-2xl lg:text-3xl font-bold   text-foreground">Advertising Manager</h1>
        <p className="text-sm lg:text-xs font-bold text-muted-foreground  ">Manage banners for photocard generation</p>
      </div>

      <div className="max-w-4xl space-y-4 lg:space-y-6">
        <div className="space-y-4">
          <Label className="text-sm   text-muted-foreground font-bold">Register New Campaign</Label>
          <div className="space-y-4 bg-card border border-border p-6 rounded-xl">
            {!previewData ? (
              <Button
                variant="outline"
                className="w-full h-24 border-dashed border-2 flex flex-col gap-2 text-sm font-bold   rounded-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6" />
                Upload Image Source
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="relative aspect-[3/1] bg-muted border border-border rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={previewData} className="w-full h-full object-contain" alt="Preview" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm rounded-full"
                    onClick={() => { setPreviewData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Campaign Name..."
                    value={newAdName}
                    onChange={e => setNewAdName(e.target.value)}
                    className="bg-muted border-border h-12 text-xs font-bold   rounded-lg"
                  />
                  <Button
                    className="h-12 px-8 shrink-0 text-sm font-bold   gap-3 rounded-lg"
                    onClick={handleAddCampaign}
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Add
                  </Button>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          <p className="text-xs text-muted-foreground font-bold   italic">Images will be scaled to match photocard width. Optimal: Horizontal banners.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:gap-4 max-w-5xl">
        {ads.map((ad) => (
          <div
            key={ad.id}
            onClick={() => toggleSelect(ad.id)}
            className={cn(
              "group bg-card border flex flex-col sm:flex-row items-stretch cursor-pointer transition-all duration-300 rounded-xl overflow-hidden",
              selectedAdId === ad.id ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/30"
            )}
          >
            <div className="p-4 lg:p-5 flex-1 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-border">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className={cn(
                    "text-sm font-bold   truncate",
                    selectedAdId === ad.id ? "text-primary" : "text-foreground"
                  )}>
                    {ad.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", selectedAdId === ad.id ? "bg-primary animate-pulse" : "bg-muted")} />
                    <p className="text-xs text-muted-foreground font-bold  ">
                      {selectedAdId === ad.id ? "Active Campaign" : "Standby"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteAd(ad.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="sm:w-2/3 bg-muted flex items-center justify-center p-4">
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
          <div className="col-span-full py-20 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
             <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
             <p className="text-sm font-bold  ">No campaigns registered</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ads;
