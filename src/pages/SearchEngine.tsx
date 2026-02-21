import { useState, useEffect } from "react";
import { Search, X, ArrowLeft, MoreVertical, Mic, Camera, SearchIcon, Globe, Image, Newspaper, Play, MoreHorizontal, Settings, Grid } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

interface OrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
  source: string;
}

const SearchEngine = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<OrganicResult[]>([]);
  const [totalResults, setTotalResults] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithProxy = async (targetUrl: string) => {
    // Primary: CodeTabs Proxy
    try {
      const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn("Primary proxy failed, trying fallback...");
    }

    // Fallback: AllOrigins
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();
      if (data && data.contents) return JSON.parse(data.contents);
    } catch (e) {
      console.error("Fallback proxy failed as well.");
    }

    throw new Error("Failed to retrieve search results.");
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchParams({ q: searchQuery });

    try {
      const apiKey = import.meta.env.VITE_SERPAPI_KEY;
      const apiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&engine=google`;

      const data = await fetchWithProxy(apiUrl);

      if (data && data.organic_results) {
        setResults(data.organic_results);
        if (data.search_information?.total_results) {
          setTotalResults(data.search_information.total_results.toLocaleString());
        }
      } else {
        setResults([]);
        setTotalResults(null);
        if (data && data.error) {
          setError(data.error);
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError("FAILED TO ESTABLISH CONNECTION WITH SEARCH ARCHIVES.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] text-[#bdc1c6] font-sans selection:bg-[#8ab4f8]/30">
      {/* Header / Search Bar Section */}
      <header className="sticky top-0 z-50 bg-[#202124] border-b border-[#3c4043] pt-6">
        <div className="max-w-[1400px] px-4 md:px-8 flex flex-col md:flex-row items-center gap-4 md:gap-8 pb-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button
               onClick={() => navigate("/")}
               className="p-2 hover:bg-[#3c4043] rounded-full transition-colors"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div
               className="text-2xl font-bold cursor-pointer hidden md:block"
               onClick={() => { setQuery(""); setResults([]); setSearchParams({}); }}
             >
               <span className="text-[#4285F4]">G</span>
               <span className="text-[#EA4335]">o</span>
               <span className="text-[#FBBC05]">o</span>
               <span className="text-[#4285F4]">g</span>
               <span className="text-[#34A853]">l</span>
               <span className="text-[#EA4335]">e</span>
             </div>
          </div>

          <div className="relative flex-1 max-w-[692px] w-full group">
            <div className="flex items-center bg-[#303134] border border-transparent hover:bg-[#3c4043] focus-within:bg-[#303134] focus-within:shadow-lg focus-within:border-transparent rounded-full px-5 py-2.5 transition-all">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-white text-[16px]"
                placeholder="Search the web"
              />
              <div className="flex items-center gap-3 ml-2 border-l border-[#5f6368] pl-3">
                {query && (
                  <button onClick={() => setQuery("")} className="text-[#9aa0a6] hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button className="text-[#8ab4f8] hover:text-[#8ab4f8]/80 hidden sm:block">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="text-[#8ab4f8] hover:text-[#8ab4f8]/80 hidden sm:block">
                  <Camera className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleSearch(query)}
                  className="text-[#8ab4f8] hover:text-[#8ab4f8]/80"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 ml-auto">
            <button className="p-2 hover:bg-[#3c4043] rounded-full transition-colors">
              <Settings className="w-5 h-5 text-[#9aa0a6]" />
            </button>
            <button className="p-2 hover:bg-[#3c4043] rounded-full transition-colors">
              <Grid className="w-5 h-5 text-[#9aa0a6]" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#8ab4f8] flex items-center justify-center text-[#202124] font-bold text-xs">
              A
            </div>
          </div>
        </div>

        {/* Search Tabs */}
        <div className="max-w-[1400px] px-4 md:px-[160px] flex items-center gap-6 mt-4 text-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 border-b-2 border-[#8ab4f8] pb-3 px-1 text-[#8ab4f8] whitespace-nowrap cursor-pointer">
            <SearchIcon className="w-4 h-4" />
            <span>All</span>
          </div>
          <div className="flex items-center gap-1 pb-3 px-1 hover:text-white transition-colors whitespace-nowrap cursor-pointer">
            <Image className="w-4 h-4" />
            <span>Images</span>
          </div>
          <div className="flex items-center gap-1 pb-3 px-1 hover:text-white transition-colors whitespace-nowrap cursor-pointer">
            <Newspaper className="w-4 h-4" />
            <span>News</span>
          </div>
          <div className="flex items-center gap-1 pb-3 px-1 hover:text-white transition-colors whitespace-nowrap cursor-pointer">
            <Play className="w-4 h-4" />
            <span>Videos</span>
          </div>
          <div className="flex items-center gap-1 pb-3 px-1 hover:text-white transition-colors whitespace-nowrap cursor-pointer">
            <Globe className="w-4 h-4" />
            <span>Maps</span>
          </div>
          <div className="flex items-center gap-1 pb-3 px-1 hover:text-white transition-colors whitespace-nowrap cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </div>
        </div>
      </header>

      {/* Results Section */}
      <main className="max-w-[1400px] px-4 md:px-[160px] py-8">
        {isLoading && (
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="max-w-[652px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#3c4043]" />
                  <div className="w-32 h-3 bg-[#3c4043] rounded" />
                </div>
                <div className="w-full h-5 bg-[#3c4043] rounded mb-2" />
                <div className="w-3/4 h-3 bg-[#3c4043] rounded" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="py-10 text-[#ea4335] font-mono">
            <h3 className="text-xl font-bold mb-2 uppercase">ERROR_ENCOUNTERED</h3>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-10 max-w-[652px]">
            <p className="text-sm text-[#9aa0a6] mb-4">
              About {totalResults || (results.length * 123).toLocaleString()} results (0.42 seconds)
            </p>
            {results.map((result, idx) => (
              <div key={idx} className="group">
                <div className="flex flex-col">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 mb-1 no-underline"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#303134] flex items-center justify-center border border-[#3c4043] shrink-0">
                      <Globe className="w-4 h-4 text-[#9aa0a6]" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <cite className="text-sm text-[#bdc1c6] not-italic truncate">
                        {result.source || new URL(result.link).hostname}
                      </cite>
                      <span className="text-xs text-[#9aa0a6] truncate">{result.displayed_link || result.link}</span>
                    </div>
                    <MoreVertical className="w-4 h-4 text-[#9aa0a6] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl text-[#8ab4f8] hover:underline mb-1 font-medium"
                  >
                    {result.title}
                  </a>
                  <p className="text-sm text-[#bdc1c6] leading-relaxed">
                    {result.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && results.length === 0 && query && (
          <div className="py-10">
            <p>Your search - <span className="font-bold">{query}</span> - did not match any documents.</p>
            <p className="mt-4">Suggestions:</p>
            <ul className="list-disc ml-8 mt-2 space-y-1">
              <li>Make sure that all words are spelled correctly.</li>
              <li>Try different keywords.</li>
              <li>Try more general keywords.</li>
              <li>Try fewer keywords.</li>
            </ul>
          </div>
        )}

        {!query && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="text-6xl font-bold mb-8 select-none">
               <span className="text-[#4285F4]">G</span>
               <span className="text-[#EA4335]">o</span>
               <span className="text-[#FBBC05]">o</span>
               <span className="text-[#4285F4]">g</span>
               <span className="text-[#34A853]">l</span>
               <span className="text-[#EA4335]">e</span>
             </div>
             <p className="text-[#9aa0a6] max-w-md">Search the web using Google Search API. Powered by SerpApi.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#171717] mt-20 border-t border-[#3c4043]">
        <div className="max-w-[1400px] px-4 md:px-[160px] py-3 text-sm text-[#9aa0a6]">
          <span>Bangladesh</span>
        </div>
        <div className="border-t border-[#3c4043]">
          <div className="max-w-[1400px] px-4 md:px-[160px] py-3 flex flex-wrap gap-6 text-sm text-[#9aa0a6]">
            <a href="#" className="hover:underline">Help</a>
            <a href="#" className="hover:underline">Send feedback</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SearchEngine;
