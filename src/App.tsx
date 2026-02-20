import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index";
import LocalRedaction from "./pages/LocalRedaction";
import ServerRedaction from "./pages/ServerRedaction";
import LLMWrapper from "./pages/LLMWrapper";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppShell>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/local" element={<LocalRedaction />} />
            <Route path="/server" element={<ServerRedaction />} />
            <Route path="/llm" element={<LLMWrapper />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
