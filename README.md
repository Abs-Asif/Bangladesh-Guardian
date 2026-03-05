# Bangladesh Guardian Photocard Automation

A professional, high-performance web application designed for social media managers of the **Bangladesh Guardian**. This tool automates the creation of news photocards by fetching content directly from the website's backoffice or sitemaps, applying text moderation, and rendering high-quality PNGs via HTML5 Canvas.

---

## 🚀 1. What is this App?

The **Bangladesh Guardian Photocard Automation** is a specialized tool that streamlines the workflow of posting news to social media. Instead of manually designing photocards for every article, this app "watches" for new posts and generates ready-to-download images instantly.

**Key use cases:**
- **Instant Social Sharing:** Generate cards as soon as an article is published.
- **Manual Control:** Create custom photocards with manual title/image overrides.
- **Bulk Processing:** Fetch and generate cards for the last 36+ posts in one click.

---

## 🛠️ 2. Tech Stack

This application is built with a modern, type-safe frontend stack optimized for performance and reliability:

- **Framework:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/) (Configured as a Multi-Page Application - MPA)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Storage:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (for local generation history) & `localStorage` (for settings)
- **Automation:** [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) (for background tasks) & [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) (tab leadership)
- **Testing:** [Vitest](https://vitest.dev/) (Unit) & [Playwright](https://playwright.dev/) (E2E)
- **PWA:** Service Workers for offline capabilities and caching.

---

## ⚙️ 3. How It Works (Internal Architecture)

### **Automation Logic**
The app employs a "Leadership" pattern using `navigator.locks`. Only one open tab acts as the **Leader**, running the automation worker. Other tabs stay in **Standby** to prevent redundant API calls.

1.  **Polling:** A Web Worker ticks every 60 seconds.
2.  **Fetching:**
    - **Regular Mode:** Hits the Backoffice Archive API (`/api-en/archive`).
    - **Backup Mode:** Scrapes the daily XML sitemap (e.g., `sitemap-daily-YYYY-MM-DD.xml`) using CORS proxies.
3.  **Deduplication:** Checks the article URL against a `processedUrls` cache in `localStorage` (automatically cleaned after 2 days).
4.  **Content Extraction:** If API data is missing, a fallback scraper extracts OpenGraph (`og:title`, `og:image`) metadata directly from the article page.
5.  **Censorship:** Titles pass through a moderation engine (`src/lib/censor.ts`) that replaces restricted keywords while preserving case sensitivity.
6.  **Canvas Rendering:** The `generatePhotoCardInternal` function combines the template, user image, and text onto an 1080x1080 canvas.

---

## 💻 4. Localhost Setup

Follow these steps to run the app on your local machine:

1.  **Clone the Repository:**
    ```bash
    git clone <repo-url>
    cd bg-photocard-automation
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
4.  **Access the App:** Open `http://localhost:8080` in your browser.

---

## 🔄 5. Updating Dependencies

To keep the app secure and performant:

- **Minor/Patch Updates:** `npm update`
- **Major Updates:** `npm install [package-name]@latest`
- **Cleanup:** Run `npm prune` after removing packages to keep the `node_modules` clean.
- **Verification:** Always run `npm test` after updating dependencies to ensure no breaking changes.

---

## 🎨 6. Changing Photocard Design

The photocard is rendered dynamically. To change the design, edit `src/pages/Secret.tsx`:

- **Template Image:** Replace `public/PhotocardTemplate.png` (Keep dimensions 1080x1080).
- **Layout Constants:** Modify the `BOX` object (for image placement) or `TITLE_Y`, `DATE_Y` constants.
- **Canvas Logic:** Look for `generatePhotoCardInternal`. This is where the image is clipped (rounded corners), text is wrapped, and the red border is drawn.
- **Typography:** Default fonts are `Cambria` and `Solaiman Lipi`. Ensure any new fonts are added to `public/fonts/` and preloaded in the `useEffect` hook.

---

## 📦 7. Creating the Dist File (Deployment)

### **Manual Build**
1.  Run `npm run build`.
2.  The output will be in the `dist/` folder.
3.  Zip the contents of `dist/` to create your deployment package.

### **GitHub Actions**
The repository includes a workflow (`.github/workflows/package.yml`) that triggers on every push to `main`:
- It builds the project.
- Adds `.htaccess` and `_redirects` for MPA 404 handling.
- Zips the `dist` folder into `dist.zip`.
- Creates a GitHub Release tagged with the current date (e.g., `2026.02.27`).

---

## ✨ 8. Feature List

- ✅ **Auto-Detection:** Background monitoring for new news posts.
- ✅ **Advanced Typography:** Adjust font size, letter spacing, line height, and date offsets via UI.
- ✅ **Text Moderation:** Auto-censor sensitive words based on custom mappings.
- ✅ **Generation History:** Stores up to 50 recent photocards locally in IndexedDB.
- ✅ **Live Preview:** Real-time updates as you edit manual fields.
- ✅ **Audio Notifications:** Customizable sounds when a new card is generated.
- ✅ **Backup Mode:** Automatic failover to Sitemap scraping if the API is down.
- ✅ **Security:** Password-protected access (Security Key).

---

## ❓ 9. FAQ

**Q: What is the Security Key?**
A: It is a password stored in the `ENC_PW` constant (Base64 encoded) to restrict access to authorized personnel.

**Q: Where are the generated images stored?**
A: They are stored **locally in your browser** (IndexedDB). They are not uploaded to any server. If you clear your browser data, the history will be lost.

**Q: Why did automation stop?**
A: Browsers often throttle background tabs. Keep the tab active or in a separate window to ensure the Web Worker continues to tick reliably.

---

## 📊 10. Proxy Reliability & Limits

The application uses a multi-tier proxy failover system to ensure 99.9% uptime for image fetching and sitemap scraping.

### **Usage Math (based on 18h daily activity / 100 posts)**
- **Regular Mode:** Uses ~100 requests/day (~3,000/mo) primarily hitting **Codetabs**.
- **Backup Mode (Sitemap):** Uses ~1,280 requests/day (~38,400/mo) primarily hitting **AllOrigins**.

### **Provider Limits**
1.  **AllOrigins:** ~20 requests/minute. No monthly limit.
2.  **Codetabs:** ~300 requests/minute (5 RPS). No monthly limit.
3.  **CorsProxy.io:** 10,000 requests/month (Free Tier).
    - *Note: Restricted to `.vercel.app` or `.github.io`. Will fail on custom subdomains.*

**Verdict:** The app is extremely stable in Regular Mode. If the system is forced into Backup Mode for more than 8 days, the CorsProxy.io "safety net" will be exhausted, but the app will continue to function via the other two proxies.

---

## ⚠️ 11. Common Troubleshooting

- **Images not appearing?** This is usually a CORS issue. The app uses several public proxies to bypass restrictions. If one fails, it tries another.
- **"Standby" status?** This means you have the app open in another tab. Only one tab can lead the automation.
- **Wrong Date/Time?** The app uses the client's local time for manual generations and the article's `create_date` for automated ones.
- **Font looks weird?** Ensure `Cambria` and `Solaiman Lipi` are installed on your system or correctly loaded from the `public/` folder.
