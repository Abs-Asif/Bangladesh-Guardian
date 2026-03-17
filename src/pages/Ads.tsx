import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Check, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

interface AdItem {
  id: string;
  name: string;
  blobUrl: string;
  file?: File;
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

const saveAdDB = async (id: string, name: string, blob: Blob) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, name, blob });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const getAllAdsDB = async (): Promise<AdItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result.map((item: any) => ({
        id: item.id,
        name: item.name,
        blobUrl: URL.createObjectURL(item.blob)
      }));
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
};

const deleteAdDB = async (id: string) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const Ads = () => {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [activeAdId, setActiveAdId] = useState<string | null>(localStorage.getItem('bg_selected_ad') || null);
  const [newName, setNewName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllAdsDB().then(setAds);
    return () => {
      ads.forEach(ad => URL.revokeObjectURL(ad.blobUrl));
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newName.trim()) {
      toast.error("Please enter a name for the ad first");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await saveAdDB(id, newName, file);
      const blobUrl = URL.createObjectURL(file);
      const newAd = { id, name: newName, blobUrl };
      setAds(prev => [...prev, newAd]);
      setNewName('');
      toast.success("Ad uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload ad");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this ad?")) return;
    try {
      await deleteAdDB(id);
      setAds(prev => {
        const ad = prev.find(a => a.id === id);
        if (ad) URL.revokeObjectURL(ad.blobUrl);
        return prev.filter(a => a.id !== id);
      });
      if (activeAdId === id) {
        setActiveAdId(null);
        localStorage.removeItem('bg_selected_ad');
      }
      toast.success("Ad deleted");
    } catch (error) {
      toast.error("Failed to delete ad");
    }
  };

  const handleSelect = (id: string) => {
    const nextId = activeAdId === id ? null : id;
    setActiveAdId(nextId);
    if (nextId) {
      localStorage.setItem('bg_selected_ad', nextId);
    } else {
      localStorage.removeItem('bg_selected_ad');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Advertisement Management</h1>
        <p className="text-muted-foreground">Add and select ad images to be attached to the bottom of generated photocards.</p>
      </div>

      <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
        <Label>Upload New Ad</Label>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Ad Name (e.g., Summer Sale)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-grow h-11"
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <Button
            className="h-11 px-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Ad Image"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className={cn(
              "group relative bg-card rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
              activeAdId === ad.id
                ? "border-primary shadow-xl ring-2 ring-primary/20"
                : "border-transparent hover:border-primary/50"
            )}
            onClick={() => handleSelect(ad.id)}
          >
            <div className="aspect-video bg-surface-1 overflow-hidden relative">
              <img
                src={ad.blobUrl}
                alt={ad.name}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ad.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {activeAdId === ad.id && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground p-1 rounded-full shadow-lg">
                <Check className="h-4 w-4" />
              </div>
            )}

            <div className="p-4 bg-surface-2 flex items-center justify-between">
              <p className="font-bold text-sm truncate pr-2">{ad.name}</p>
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                activeAdId === ad.id ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-400"
              )}>
                {activeAdId === ad.id ? "Active" : "Select"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {ads.length === 0 && !isUploading && (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-1 rounded-3xl border border-dashed border-zinc-700">
          <ImageIcon className="h-12 w-12 text-zinc-700 mb-4" />
          <p className="text-zinc-500 font-medium">No ads uploaded yet</p>
          <p className="text-zinc-600 text-sm">Upload an image to get started</p>
        </div>
      )}
    </div>
  );
};

export default Ads;
