# Bangladesh Guardian Photocard Automation

A professional, high-performance web application designed for social media managers of **Bangladesh Guardian**. This tool automates the creation of news photocards by fetching content directly from the website's backoffice API or sitemaps, applying text moderation, and rendering high-quality PNGs via HTML5 Canvas.

---

## 🚀 1. Overview

The **Bangladesh Guardian Photocard Automation** is a specialized tool that streamlines the workflow of posting news to social media. It features an "Autopilot" engine that monitors the website for new articles and generates ready-to-share photocards instantly.

### Key Features:
- **Autopilot Engine:** Scans the news archive every 1-3 minutes and generates photocards in the background.
- **Backoffice Integration:** Direct connection to the `103.209.42.203` API.
- **High-Performance Rendering:** Optimized Canvas rendering with word-level highlighting and dynamic font scaling.
- **Manual Entry:** Support for custom headlines and image uploads.
- **Professional Design:** Standardized typography (Google Sans, Cambria) and flat design aesthetic.
- **PWA & Offline:** Fully installable as a Progressive Web App with offline generation support.
- **Quick Download API:** Instant photocard generation via numeric ID in the URL path.

---

## 📁 2. Project Structure

```text
├── public/             # Static assets (fonts, icons, template images, audio)
│   ├── fonts/          # Cambria, Solaiman Lipi, and Google Sans
│   ├── sw.js           # PWA Service Worker (v3)
│   └── Def.png         # Default photocard template
├── src/
│   ├── components/     # UI components (Sidebar, ScrollToTop, shadcn/ui)
│   ├── lib/            # Shared utilities (censor, title-utils, utils)
│   ├── pages/
│   │   ├── Home.tsx    # Core automation and generation dashboard
│   │   ├── Templates.tsx # Template selection and management
│   │   ├── Ads.tsx       # Ad campaign management (IndexedDB)
│   │   ├── Settings.tsx  # Advanced configuration (Typography, Frequency)
│   │   └── Secret.tsx    # Main layout, routing, and authentication
│   └── index.css       # Global styles and font declarations
├── index.html          # Application entry point
├── tailwind.config.ts  # Theme and styling configuration
└── vite.config.ts      # Build and dev server setup (Port 8080)
```

---

## 🔗 3. Backoffice API & Scraper Integration

The application integrates with the **Bangladesh Guardian Backoffice** to fetch the latest news articles.

### **The Archive API**
- **Endpoint:** `http://103.209.42.203/api/archive`
- **Method:** `POST`
- **Content-Type:** `application/json`

#### **Request Payload Example:**
To fetch the 3 most recent articles:
```json
{
  "start_date": "",
  "end_date": "",
  "category_name": "",
  "limit": 3,
  "offset": 0
}
```

#### **Implementation Example (JavaScript):**
```javascript
const fetchLatestNews = async (limit = 3) => {
  const response = await fetch("http://103.209.42.203/api/archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_date: "",
      end_date: "",
      category_name: "",
      limit: limit,
      offset: 0
    })
  });

  const data = await response.json();
  // data is an array of BGArchiveItem
  return data.data.map(item => ({
    title: item.DetailsHeading || item.ContentHeading,
    slug: item.ContentSlug || item.Slug,
    id: item.ContentID,
    imageUrl: `http://103.209.42.203/${item.ImageBgPath}`
  }));
};
```

---

## ⚙️ 4. Automation Engine (Autopilot)

### **Leader Election**
To prevent redundant API calls across multiple tabs, the app uses the **Web Locks API** (`navigator.locks`).
- **ACTIVE:** Only the "Leader" tab runs the automation loop and generates photocards.
- **STANDBY:** Other tabs wait and automatically take over if the Leader tab is closed.
- **IDLE:** Automation is disabled by the user.

### **Parallel Processing**
The engine is optimized for high-throughput. When new posts are detected, they are processed in **parallel** using `Promise.all`.
1. **Detection:** Scans API/Sitemap for URLs not in `processedUrls` cache.
2. **Metadata Verification:** Re-fetches metadata after a 2s delay to ensure titles are finalized and not truncated.
3. **Generation:** Renders the PNG using an optimized Canvas pipeline with pre-cached assets.
4. **Persistence:** Saves the result to IndexedDB and triggers a notification.

---

## 🎨 5. Photocard Design & Typography

The photocard uses a multi-layered rendering system defined in `Home.tsx`.

### **Customizable Layers:**
- **Background:** The selected template (Def.png, etc.).
- **News Image:** Clipped with a 35px radius and a red border.
- **Date/Time:** Dynamic localized date string.
- **Title Text:** Supports word-level highlighting and automatic scaling (1-3 lines).
- **Ad Banner:** Optional advertisement loaded from IndexedDB.

### **Typography Settings:**
Users can fine-tune the output in **Settings.tsx**:
- Font size (Default: 70px)
- Letter spacing (Default: -2.4px)
- Line height factor (Default: 0.9)
- X/Y offsets for every element.
- Stacking order (e.g., placing the image behind or in front of the background).

---

## 📱 6. PWA Features

- **Offline Support:** Service Worker (v3) caches all assets, including fonts (`Cambria`), template images, and the application logic.
- **Installable:** Meets all PWA requirements for installation on Android, iOS, and Desktop.
- **Notifications:** Audio alerts on successful generation.

---

## 💻 7. Development & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Run Dev Server:**
   ```bash
   npm run dev
   ```
3. **Run Tests:**
   ```bash
   npm test
   ```
4. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🚀 8. Quick Download API

The application supports a zero-UI, instant download feature designed for integration with other tools. By appending an article's numeric ID to the application's base URL, users can trigger an automated generation and download process.

### **Usage:**
Navigate to: `https://<your-app-domain>/<Article_ID>`
Example: `https://bg-photocard.vercel.app/45310`

### **Workflow:**
1. **Detection:** The app identifies the numeric ID from the path.
2. **Authorization Bypass:** This specific route does not require the access key.
3. **Fetch & Render:** Automatically fetches the article metadata and renders the photocard using current settings.
4. **Instant Download:** Triggers the browser download for the PNG file.
5. **Auto-Exit:** The tab attempts to close or go back once the process is complete.

---

## ⚠️ 9. Troubleshooting

- **CORS Errors:** The app automatically fallbacks to multiple CORS proxies (AllOrigins, Codetabs, CorsProxy.io).
- **Slow Generation:** Ensure hardware acceleration is enabled in your browser for optimal HTML5 Canvas performance.
- **Truncated Titles:** Automation uses `shouldUpgradeTitle` to compare API titles vs. Web Scraped titles, preferring non-truncated versions.
