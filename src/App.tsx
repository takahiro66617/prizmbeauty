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
import LineCallback from "./pages/auth/LineCallback";
import RegisterProfile from "./pages/auth/RegisterProfile";
import LineAddFriend from "./pages/auth/LineAddFriend";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import FaqPage from "./pages/Faq";
import ProjectDetailPage from "./pages/ProjectDetail";
import AdminLoginPage from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCampaignsPage from "./pages/admin/AdminCampaigns";
import AdminClientsPage from "./pages/admin/AdminClients";
import AdminInfluencersPage from "./pages/admin/AdminInfluencers";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminMessages from "./pages/admin/AdminMessages";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ClientLayout } from "./components/client/ClientLayout";
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientCampaigns from "./pages/client/ClientCampaigns";
import ClientCampaignNew from "./pages/client/ClientCampaignNew";
import ClientApplicants from "./pages/client/ClientApplicants";
import ClientMessages from "./pages/client/ClientMessages";
import ClientSettings from "./pages/client/ClientSettings";
import MyPageLayout from "./components/layout/MyPageLayout";
import MyPageDashboard from "./pages/mypage/MyPageDashboard";
import MyPageApplications from "./pages/mypage/MyPageApplications";
import MyPageFavorites from "./pages/mypage/MyPageFavorites";
import MyPageMessages from "./pages/mypage/MyPageMessages";
import MyPageNotifications from "./pages/mypage/MyPageNotifications";
import MyPagePosts from "./pages/mypage/MyPagePosts";
import MyPageSettings from "./pages/mypage/MyPageSettings";
import MyPageCampaigns from "./pages/mypage/MyPageCampaigns";
import MyPageCampaignDetail from "./pages/mypage/MyPageCampaignDetail";
import MyPageRewards from "./pages/mypage/MyPageRewards";

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
          <Route path="/auth/line/callback" element={<LineCallback />} />
          <Route path="/auth/register/add-friend" element={<LineAddFriend />} />
          <Route path="/auth/register/profile" element={<RegisterProfile />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          {/* Influencer MyPage */}
          <Route path="/mypage" element={<MyPageLayout />}>
            <Route index element={<MyPageDashboard />} />
            <Route path="campaigns" element={<MyPageCampaigns />} />
            <Route path="campaigns/:id" element={<MyPageCampaignDetail />} />
            <Route path="applications" element={<MyPageApplications />} />
            <Route path="favorites" element={<MyPageFavorites />} />
            <Route path="messages" element={<MyPageMessages />} />
            <Route path="notifications" element={<MyPageNotifications />} />
            <Route path="posts" element={<MyPagePosts />} />
            <Route path="settings" element={<MyPageSettings />} />
            <Route path="rewards" element={<MyPageRewards />} />
          </Route>
          {/* Client (Company) Dashboard */}
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client" element={<ClientLayout />}>
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="campaigns" element={<ClientCampaigns />} />
            <Route path="campaigns/new" element={<ClientCampaignNew />} />
            <Route path="applicants" element={<ClientApplicants />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="settings" element={<ClientSettings />} />
          </Route>
          {/* Admin Dashboard */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="campaigns" element={<AdminCampaignsPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="influencers" element={<AdminInfluencersPage />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="messages" element={<AdminMessages />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
