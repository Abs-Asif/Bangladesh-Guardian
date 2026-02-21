import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";

const isStandalone = import.meta.env.VITE_STANDALONE_SECRET === 'true';

const Index = isStandalone ? null : lazy(() => import("./pages/Index"));
const Dictionary = isStandalone ? null : lazy(() => import("./pages/Dictionary"));
const FontSimplified = isStandalone ? null : lazy(() => import("./pages/FontSimplified"));
const FontDocumentation = isStandalone ? null : lazy(() => import("./pages/FontDocumentation"));
const FontLogin = isStandalone ? null : lazy(() => import("./pages/FontLogin"));
const FontAdminDashboard = isStandalone ? null : lazy(() => import("./pages/FontAdminDashboard"));
const FontUserDashboard = isStandalone ? null : lazy(() => import("./pages/FontUserDashboard"));
const Analytics = isStandalone ? null : lazy(() => import("./pages/Analytics"));
const Automation = isStandalone ? null : lazy(() => import("./pages/Automation"));
const VideoAutomation = isStandalone ? null : lazy(() => import("./pages/VideoAutomation"));
const AiChat = isStandalone ? null : lazy(() => import("./pages/AiChat"));
const MazeGame = isStandalone ? null : lazy(() => import("./pages/MazeGame"));
const SearchEngine = isStandalone ? null : lazy(() => import("./pages/SearchEngine"));
const IslamicServices = isStandalone ? null : lazy(() => import("./pages/IslamicServices"));
const Secret = lazy(() => import("./pages/Secret"));

const Sitemap = isStandalone ? null : lazy(() => import("./pages/Sitemap"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const Router = isStandalone ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <Routes>
              {isStandalone ? (
                <>
                  <Route path="/" element={<Secret />} />
                  <Route path="/secret" element={<Secret />} />
                  <Route path="*" element={<NotFound />} />
                </>
              ) : (
                <>
                  <Route path="/" element={Index ? <Index /> : null} />
                  <Route path="/D" element={Dictionary ? <Dictionary /> : null} />
                  <Route path="/F" element={FontSimplified ? <FontSimplified /> : null} />
                  <Route path="/F/D" element={FontDocumentation ? <FontDocumentation /> : null} />
                  <Route path="/F/L" element={FontLogin ? <FontLogin /> : null} />
                  <Route path="/F/A" element={FontAdminDashboard ? <FontAdminDashboard /> : null} />
                  <Route path="/F/U" element={FontUserDashboard ? <FontUserDashboard /> : null} />
                  <Route path="/A" element={Analytics ? <Analytics /> : null} />
                  <Route path="/FP" element={Automation ? <Automation /> : null} />
                  <Route path="/FV" element={VideoAutomation ? <VideoAutomation /> : null} />
                  <Route path="/AI" element={AiChat ? <AiChat /> : null} />
                  <Route path="/GA" element={MazeGame ? <MazeGame /> : null} />
                  <Route path="/SE" element={SearchEngine ? <SearchEngine /> : null} />
                  <Route path="/IS" element={IslamicServices ? <IslamicServices /> : null} />
                  <Route path="/secret" element={<Secret />} />
                  <Route path="/sitemap" element={Sitemap ? <Sitemap /> : null} />
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </Suspense>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
