import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DebugModeWrapper } from "@/components/debug/DebugModeWrapper";
import { ScrollToTop } from "@/components/ScrollToTop";
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
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminInfluencersPage from "./pages/admin/AdminInfluencers";
import AdminInfluencerDetail from "./pages/admin/AdminInfluencerDetail";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminCampaignDetail from "./pages/admin/AdminCampaignDetail";
import AdminApplicationDetail from "./pages/admin/AdminApplicationDetail";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminBillingDetail from "./pages/admin/AdminBillingDetail";
import AdminBillingSettings from "./pages/admin/AdminBillingSettings";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ClientLayout } from "./components/client/ClientLayout";
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientCampaigns from "./pages/client/ClientCampaigns";
import ClientCampaignNew from "./pages/client/ClientCampaignNew";
import ClientCampaignDetail from "./pages/client/ClientCampaignDetail";
import ClientApplicants from "./pages/client/ClientApplicants";
import ClientApplicantDetail from "./pages/client/ClientApplicantDetail";
import ClientMessages from "./pages/client/ClientMessages";
import ClientSettings from "./pages/client/ClientSettings";
import ClientPayments from "./pages/client/ClientPayments";
import ClientNotifications from "./pages/client/ClientNotifications";
import ClientBilling from "./pages/client/ClientBilling";
import ClientBillingDetail from "./pages/client/ClientBillingDetail";
import MyPageLayout from "./components/layout/MyPageLayout";
import MyPageDashboard from "./pages/mypage/MyPageDashboard";
import MyPageApplications from "./pages/mypage/MyPageApplications";
import MyPageFavorites from "./pages/mypage/MyPageFavorites";
import MyPageMessages from "./pages/mypage/MyPageMessages";
import MyPageNotifications from "./pages/mypage/MyPageNotifications";
import MyPagePosts from "./pages/mypage/MyPagePosts";
import MyPageSettings from "./pages/mypage/MyPageSettings";
import MyPageCampaignHub from "./pages/mypage/MyPageCampaignHub";
import MyPageCampaignDetail from "./pages/mypage/MyPageCampaignDetail";
import MyPageRewards from "./pages/mypage/MyPageRewards";
import DebugReportsPage from "./pages/DebugReportsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <DebugModeWrapper>
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
            <Route path="campaigns" element={<MyPageCampaignHub />} />
            <Route path="campaigns/:id" element={<MyPageCampaignDetail />} />
            <Route path="applications" element={<MyPageApplications />} />
            <Route path="favorites" element={<MyPageFavorites />} />
            <Route path="messages" element={<MyPageCampaignHub />} />
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
            <Route path="campaigns/:id" element={<ClientCampaignDetail />} />
            <Route path="applicants" element={<ClientApplicants />} />
            <Route path="applicants/:id" element={<ClientApplicantDetail />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="settings" element={<ClientSettings />} />
            <Route path="payments" element={<ClientPayments />} />
            <Route path="notifications" element={<ClientNotifications />} />
            <Route path="billing" element={<ClientBilling />} />
            <Route path="billing/:id" element={<ClientBillingDetail />} />
          </Route>
          {/* Admin Dashboard */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="campaigns" element={<AdminCampaignsPage />} />
            <Route path="campaigns/:id" element={<AdminCampaignDetail />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="clients/:id" element={<AdminClientDetail />} />
            <Route path="influencers" element={<AdminInfluencersPage />} />
            <Route path="influencers/:id" element={<AdminInfluencerDetail />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="applications/:id" element={<AdminApplicationDetail />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="billing/:id" element={<AdminBillingDetail />} />
            <Route path="billing/settings" element={<AdminBillingSettings />} />
            <Route path="debug-reports" element={<DebugReportsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </DebugModeWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
