import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CampaignsPage from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import GuidePage from "./pages/Guide";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import FaqPage from "./pages/Faq";
import ProjectDetailPage from "./pages/ProjectDetail";
import AdminLoginPage from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCampaignsPage from "./pages/admin/AdminCampaigns";
import AdminClientsPage from "./pages/admin/AdminClients";
import AdminInfluencersPage from "./pages/admin/AdminInfluencers";
import { AdminLayout } from "./components/admin/AdminLayout";
import MyPageLayout from "./components/layout/MyPageLayout";
import MyPageDashboard from "./pages/mypage/MyPageDashboard";
import MyPageApplications from "./pages/mypage/MyPageApplications";
import MyPageFavorites from "./pages/mypage/MyPageFavorites";
import MyPageMessages from "./pages/mypage/MyPageMessages";
import MyPageNotifications from "./pages/mypage/MyPageNotifications";
import MyPagePosts from "./pages/mypage/MyPagePosts";
import MyPageSettings from "./pages/mypage/MyPageSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/mypage" element={<MyPageLayout />}>
            <Route index element={<MyPageDashboard />} />
            <Route path="applications" element={<MyPageApplications />} />
            <Route path="favorites" element={<MyPageFavorites />} />
            <Route path="messages" element={<MyPageMessages />} />
            <Route path="notifications" element={<MyPageNotifications />} />
            <Route path="posts" element={<MyPagePosts />} />
            <Route path="settings" element={<MyPageSettings />} />
          </Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="campaigns" element={<AdminCampaignsPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="influencers" element={<AdminInfluencersPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
