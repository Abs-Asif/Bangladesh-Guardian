import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, BookOpen, Terminal, Code2, ShieldAlert, Cpu } from "lucide-react";
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
# Technical Documentation & System Architecture

This documentation is intended for software engineers and students to understand the internal mechanics, API integrations, and design decisions of the Bangladesh Guardian Photocard Generator.

## 1. Core Architecture & Tech Stack

The application is built as a highly optimized Single Page Application (SPA).

*   **Frontend Framework**: React 18 with TypeScript. Chosen for its component-based architecture and robust type safety, which is critical for complex state management (like the automation engine).
*   **Build Tool**: Vite. Selected over Webpack for its extremely fast Hot Module Replacement (HMR) and optimized build pipeline using Rollup.
*   **State Management**: React Hooks (useState, useEffect, useRef). For a tool of this scale, Redux would add unnecessary boilerplate; native hooks provide a cleaner, more performant flow.
*   **Persistent Storage**: **IndexedDB**. Unlike LocalStorage (limited to ~5MB), IndexedDB allows for structured storage of large datasets (like Base64 image previews) and supports asynchronous transactions.
*   **Styling**: Tailwind CSS. Provides a utility-first approach that ensures minimal CSS bundle sizes and rapid UI development.

## 2. The Bangladesh Guardian Archive API

The application relies on a specific backoffice API to fetch news metadata.

### Endpoint
\`POST https://backoffice.bangladeshguardian.com/api-en/archive\`

### Request Structure
The API expects a JSON body. Note that \`category_name\` requires an integer ID (e.g., 1 for National, 7 for Sports), but can be left empty to fetch all categories.

\`\`\`json
{
  "start_date": "",
  "end_date": "",
  "category_name": "",
  "limit": 12,
  "offset": 0
}
\`\`\`

### Response Payload (Partial)
The key data points are located within the \`archive_data\` array:

\`\`\`json
{
  "archive_data": [
    {
      "ContentID": 12345,
      "Slug": "sample-article-title",
      "ContentHeading": "The News Headline",
      "ImageBgPath": "2023/10/image.jpg"
    }
  ]
}
\`\`\`

### Integration Logic
- **URL Extraction**: When a user pastes a URL (\`.../slug/ID\`), the app parses the string to isolate the terminal numeric ID.
- **Data Reconstruction**: The image URL is reconstructed by prefixing the \`ImageBgPath\` with the media base URL: \`https://backoffice.bangladeshguardian.com/media/imgAll/\`.

## 3. "Backend" Processing (Client-Side)

While the app has no traditional server-side backend, it performs complex operations typically reserved for the server:

1.  **CORS Management**: Fetching images from external domains often triggers CORS blocks. The app uses a multi-layered proxy strategy (AllOrigins, CodeTabs, CorsProxy.io) to bypass these restrictions.
2.  **Canvas Rendering Engine**: The "Photocard" is not an HTML element; it is a dynamically generated PNG.
    - The engine loads a template image.
    - It draws the user-provided image using \`drawImage\` with a custom clipping path (rounded corners).
    - It calculates text wrapping and auto-scales the font size to fit the title within a 3-line limit.
3.  **Automation Worker**: The 60-second check-up is handled by a **Web Worker**. This ensures that the heavy API polling and string matching do not block the main UI thread, preventing frame drops.

## 4. Content Moderation & Censorship

To maintain editorial standards, the app implements a regex-based censorship engine found in \`src/lib/censor.ts\`.

### How it works
The engine uses a case-insensitive Global Regular Expression to match unsafe words and replaces them using a predefined mapping (usually inserting an asterisk).

### Censored Words List
| Unsafe Word | Censored Output |
| :--- | :--- |
| Fuck / Fucks / Fucking / Fucked | F*uck / f*ucks / F*ucking / F*ucked |
| Kill / Killing / Killer / Killed | k*ill / ki*lling / ki*ller / ki*lled |
| Suicide | Su*icide |
| Gaza | Ga*za |
| Murder / Murdered / Murderer | Mu*rder / Mu*rdered / Mu*rderer |
| Israel / Israeli | Isr*ael / Isr*aeli |
| Rape / Rapist / Raped | ra*pe / Ra*pist / Ra*ped |

## 5. Deployment & CI/CD Logic

The GitHub Workflow (\`package.yml\`) automates the following for every merge to \`main\`:
1.  **Environment Sync**: Generates a \`.htaccess\` (for Apache) and \`_redirects\` (for Netlify) to handle Client-Side Routing. This ensures that refreshing the page on \`/wiki\` doesn't result in a 404.
2.  **Artifact Packaging**: Zips the production \`dist\` folder for instant deployment to any platform.

## 6. Best Usage Practices

The **Automation Mode** is designed for efficiency. For the best experience:
- Keep the app open in a **dedicated browser tab**.
- Most modern browsers "throttle" background tabs to save power. To ensure the 60-second interval remains precise, you may need to disable "Memory Saver" or "Efficiency Mode" for this specific URL in your browser settings.
- Automation records are unique based on their Content ID; the app will never generate a duplicate for a post it has already seen.

---

### Technical Credits
- **Developer**: Abdullah Bari Asif
- **Framework**: React + Vite + TypeScript
- **Icons**: Lucide React
- **Typography**: Cambria (English), Solaiman Lipi (Bangla)
`;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-solaiman-regular text-white">
        <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Technical Wiki</h1>
            <p className="text-zinc-500 text-sm text-center">Software Engineering Documentation Access</p>
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
            <Button type="submit" className="w-full font-bold">DECRYPT & ACCESS</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-12 font-solaiman-regular">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
              <Terminal className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Engineer's Wiki</h1>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                <span className="flex items-center gap-1"><Code2 className="w-4 h-4" /> v1.0.0</span>
                <span className="w-1 h-1 rounded-full bg-zinc-400" />
                <span className="flex items-center gap-1"><Cpu className="w-4 h-4" /> System Specs</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-900 rounded-lg text-xs font-mono flex items-center gap-2 border border-zinc-300 dark:border-zinc-800">
               <ShieldAlert className="w-4 h-4 text-orange-500" /> INTERNAL_USE_ONLY
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <aside className="lg:col-span-1 space-y-8 hidden lg:block">
            <nav className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Sections</p>
              {['Architecture', 'API Integration', 'Backend Flow', 'Moderation', 'CI/CD', 'Best Practices'].map((item) => (
                <div key={item} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-900 cursor-pointer transition-colors">
                  {item}
                </div>
              ))}
            </nav>
          </aside>

          <main className="lg:col-span-3">
            <article className="prose prose-zinc dark:prose-invert max-w-none
              prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-12
              prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-6 prose-pre:rounded-xl prose-pre:shadow-2xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {wikiContent}
              </ReactMarkdown>
            </article>

            <footer className="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Abdullah Bari Asif. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <span>Security Level: L3</span>
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Wiki;
