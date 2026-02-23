import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import InfluencerSidebar from "./InfluencerSidebar";
import { Header } from "./Header";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

export default function MyPageLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [influencerStatus, setInfluencerStatus] = useState<string | null>(null);

  useEffect(() => {
    const user = sessionStorage.getItem("currentUser");
    if (!user) {
      navigate("/auth/login");
      return;
    }
    setIsAuthorized(true);
    const parsed = JSON.parse(user);
    // Fetch influencer status
    const fetchStatus = async () => {
      const { data } = await supabase.from("influencer_profiles").select("status").eq("id", parsed.id).maybeSingle();
      if (data) setInfluencerStatus(data.status);
    };
    fetchStatus();
  }, [navigate]);

  if (!isAuthorized) return null;

  // Allow only dashboard and settings when pending
  const allowedPaths = ["/mypage", "/mypage/settings"];
  const isRestricted = influencerStatus === "pending" && !allowedPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden">
        <Header />
      </div>
      <InfluencerSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
          {isRestricted ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="p-6 bg-yellow-50 rounded-full">
                <Clock className="w-16 h-16 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">承認待ち</h2>
              <p className="text-gray-500 max-w-md">
                現在事務局にて審査中です。承認されるまで少々お待ちください。
                承認後に案件への応募やメッセージなどの機能をご利用いただけます。
              </p>
              <p className="text-sm text-gray-400">
                ダッシュボードとプロフィール設定は引き続きご利用いただけます。
              </p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
