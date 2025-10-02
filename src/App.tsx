import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Students from "./pages/Students";
import Jobs from "./pages/Jobs";
import Skills from "./pages/Skills";
import Assessments from "./pages/Assessments";
import CareerCoach from "./pages/CareerCoach";
import Candidates from "./pages/Candidates";
import DataManagement from "./pages/DataManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/students" element={<Students />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/career-coach" element={<CareerCoach />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/data" element={<DataManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
