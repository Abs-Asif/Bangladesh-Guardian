export interface BGArchiveItem {
  ContentID: number;
  Slug?: string;
  ContentSlug?: string;
  ContentHeading: string | null;
  DetailsHeading?: string | null;
  ImageBgPath: string;
  create_date?: string;
  created_at?: string;
}

export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export const fetchImageWithProxy = async (url: string, forceProxy: boolean = false): Promise<string> => {
  const proxies = [
    (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];
  if (!forceProxy) {
    try {
      const res = await fetchWithTimeout(url, { mode: 'cors' });
      if (res.ok) return URL.createObjectURL(await res.blob());
    } catch {
      // Fallback
    }
  }
  for (const p of proxies) {
    try {
      const res = await fetchWithTimeout(p(url));
      if (res.ok) return URL.createObjectURL(await res.blob());
    } catch {
      // Fallback
    }
  }
  throw new Error("Failed to load image");
};

export const getMetadata = async (targetUrl: string, forceProxy: boolean = false) => {
  let html = '';
  if (!forceProxy) {
    try {
      const response = await fetchWithTimeout(targetUrl);
      if (response.ok) html = await response.text();
    } catch (e) {
      // Fallback
    }
  }
  if (!html) {
    const proxies = [
      { url: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, type: 'text' },
      { url: (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`, type: 'text' },
      { url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, type: 'json' },
      { url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, type: 'text' }
    ];
    for (const proxy of proxies) {
      try {
        const response = await fetchWithTimeout(proxy.url(targetUrl));
        if (response.ok) {
          html = proxy.type === 'json' ? (await response.json()).contents : await response.text();
          if (html && (html.includes('<title>') || html.includes('og:title'))) break;
        }
      } catch (e) {
        // Fallback
      }
    }
  }
  if (!html) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return {
    title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.querySelector('title')?.textContent || '',
    image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '',
    publishDate: doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || doc.querySelector('meta[name="publish-date"]')?.getAttribute('content') || ''
  };
};

export const getRelativeDateStr = (date: Date) => {
  const diffDays = Math.floor((new Date().setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return diffDays < 7 ? `${diffDays} days ago` : diffDays === 7 ? 'A week ago' : `${Math.floor(diffDays/7)} weeks ago`;
};

export const formatSitemapTime = (isoStr: string) => {
  try {
    const date = new Date(isoStr);
    const h = date.getHours(), m = date.getMinutes().toString().padStart(2, '0'), ampm = h >= 12 ? 'PM' : 'AM';
    return `[${h%12||12}:${m} ${ampm}] [${getRelativeDateStr(date)}]`;
  } catch (e) { return ''; }
};

export const scrapeLatestLinks = async (fetchLimit: number = 3) => {
  try {
    const response = await fetch("http://103.209.42.203/api/archive", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date: "", end_date: "", category_name: "", limit: fetchLimit, offset: 0 })
    });
    const data = await response.json();
    return (data.data || []).map((item: BGArchiveItem) => ({
      url: `https://www.bangladeshguardian.com/${item.ContentSlug || item.Slug}/${item.ContentID}`,
      title: item.DetailsHeading || item.ContentHeading || '',
      image: `http://103.209.42.203/${item.ImageBgPath}`,
      postTime: item.create_date || item.created_at ? formatSitemapTime(item.create_date || item.created_at!) : '',
      contentId: item.ContentID
    }));
  } catch (e) { return null; }
};

export const scrapeSitemapLinks = async () => {
  const now = new Date();
  const sitemapUrl = `https://www.bangladeshguardian.com/english-sitemap/sitemap-daily-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xml`;
  try {
    let xmlText = '';
    try {
      const res = await fetch(sitemapUrl);
      if (res.ok) xmlText = await res.text();
    } catch (e) {
      // Ignored
    }

    if (!xmlText) {
      const proxies = [
        (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      ];
      for (const p of proxies) {
        try {
          const res = await fetchWithTimeout(p(sitemapUrl));
          if (res.ok) { xmlText = await res.text(); break; }
        } catch (e) {
          // Ignored
        }
      }
    }

    if (!xmlText) return null;

    const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");
    return Array.from(xmlDoc.getElementsByTagName("url")).map(node => {
      const loc = node.getElementsByTagName("loc")[0]?.textContent || '';
      return {
        url: loc.trim(), title: '', image: node.getElementsByTagName("image:loc")[0]?.textContent || '',
        postTime: node.getElementsByTagName("lastmod")[0]?.textContent ? formatSitemapTime(node.getElementsByTagName("lastmod")[0].textContent!) : '',
        contentId: parseInt(loc.replace(/\/$/, '').split('/').pop() || '0')
      };
    }).filter(i => i.url && i.image).reverse();
  } catch (e) { return null; }
};
