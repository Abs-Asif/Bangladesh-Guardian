import { createRoot } from "react-dom/client";
import Secret from "./pages/Secret";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <TooltipProvider>
    <Sonner />
    <Secret />
  </TooltipProvider>
);
