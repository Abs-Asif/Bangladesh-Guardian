import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, BookOpen } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const WIKI_PW_HASH = "2b319f7db4837a7b152c9b147ab55a4e0a891a7961708f9c754d2f6c3332649f"; // SHA-256 for "21221150057"

const Wiki = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');

  const hashPassword = async (pwd: string) => {
    const msgUint8 = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const hashed = await hashPassword(password);
    if (hashed === WIKI_PW_HASH) {
      setIsAuthorized(true);
    } else {
      toast.error("Incorrect Password");
    }
  };

  const wikiContent = `
# Application Wiki

Welcome to the Bangladesh Guardian Photocard Generator Wiki. This app provides three distinct ways to create photocards.

## 1. URL Auto-Generation
This is the fastest way to create a photocard.
- **Process**: Simply paste a valid Bangladesh Guardian article URL into the "News post" field and click the **Arrow (Right)** button.
- **How it works**: The app extracts the Content ID from the URL and queries the Bangladesh Guardian's archive API (\`api-en/archive\`). It retrieves the official title and high-resolution background image, then automatically generates the photocard preview.
- **Note**: This method skips the manual form and directly creates a record in your generation history.

## 2. Manual Creation
If you want to create a photocard with custom text or an external image, use the manual form.
- **Process**:
    1. Enter your desired title in the "Title Text" field.
    2. Provide a direct link to an image in the "Image URL" field.
    3. Click the **Generate Preview** button.
- **How it works**: The app uses your provided inputs to render a photocard on a hidden canvas using the official template.
- **Features**: You can adjust font sizes and letter spacing in the **Settings** menu to perfect the layout.

## 3. Full Automation
For power users, the app features a background monitoring system.
- **Process**: Click the **START** button in the **AUTOMATION** section.
- **How it works**: Once activated, the app starts a Web Worker that polls the archive API every 60 seconds. If it detects a new post that hasn't been processed yet, it automatically generates a photocard, saves it, and plays an alert sound.
- **Performance**: This runs in a separate thread to ensure the UI remains responsive.

---

### Technical Details
- **Storage**: All generated photocards are stored locally in your browser using **IndexedDB**. This means your history is private and persists even if you refresh the page.
- **Security**: Access to both the Secret page and this Wiki is protected by security keys to prevent unauthorized use.
- **Censorship**: The app automatically filters sensitive words to ensure all generated content follows community guidelines.
`;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-solaiman-regular">
        <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Wiki Locked</h1>
            <p className="text-zinc-500 text-sm text-center">Enter the security key to access the documentation.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Security Key</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">Unlock Wiki</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-solaiman-regular">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-4 border-b pb-6">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground">Understanding how the Photocard Generator works</p>
          </div>
        </header>

        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {wikiContent}
          </ReactMarkdown>
        </article>

        <footer className="pt-12 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bangladesh Guardian. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Wiki;
