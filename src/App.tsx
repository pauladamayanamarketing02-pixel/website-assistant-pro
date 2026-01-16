import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Packages from "./pages/Packages";
import Blog from "./pages/Blog";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AssistDashboard from "./pages/dashboard/AssistDashboard";
import SuperAdminLogin from "./pages/super-admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/onboarding/Welcome";
import GetStarted from "./pages/onboarding/GetStarted";
import BusinessStage from "./pages/onboarding/BusinessStage";
import BusinessBasics from "./pages/onboarding/BusinessBasics";
import OnlinePresence from "./pages/onboarding/OnlinePresence";
import SetupNew from "./pages/onboarding/SetupNew";
import SetupGrowing from "./pages/onboarding/SetupGrowing";
import RecommendedPackage from "./pages/onboarding/RecommendedPackage";
import SelectPackage from "./pages/onboarding/SelectPackage";
// Orientation (Assist onboarding)
import OrientationWelcome from "./pages/orientation/Welcome";
import OrientationProfile from "./pages/orientation/Profile";
import OrientationSkills from "./pages/orientation/Skills";
import OrientationPortfolio from "./pages/orientation/Portfolio";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />

            {/* Super Admin */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/dashboard/super-admin/*" element={<SuperAdminDashboard />} />

            {/* Admin Operasional */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/dashboard/admin/*" element={<AdminDashboard />} />
            <Route path="/onboarding/welcome" element={<Welcome />} />
            <Route path="/onboarding/get-started" element={<GetStarted />} />
            <Route path="/onboarding/business-stage" element={<BusinessStage />} />
            <Route path="/onboarding/business-basics" element={<BusinessBasics />} />
            <Route path="/onboarding/online-presence" element={<OnlinePresence />} />
            <Route path="/onboarding/setup-new" element={<SetupNew />} />
            <Route path="/onboarding/setup-growing" element={<SetupGrowing />} />
            <Route path="/onboarding/recommended-package" element={<RecommendedPackage />} />
            <Route path="/onboarding/select-package" element={<SelectPackage />} />
            {/* Orientation (Assist onboarding) */}
            <Route path="/orientation/welcome" element={<OrientationWelcome />} />
            <Route path="/orientation/profile" element={<OrientationProfile />} />
            <Route path="/orientation/skills" element={<OrientationSkills />} />
            <Route path="/orientation/portfolio" element={<OrientationPortfolio />} />
            <Route path="/dashboard/user/*" element={<UserDashboard />} />
            <Route path="/dashboard/assist/*" element={<AssistDashboard />} />
            
            {/* Explicit 404 route (dipakai untuk redirect akses tanpa login) */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;