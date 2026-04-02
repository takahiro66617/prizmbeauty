import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import InfluencerSidebar from "./InfluencerSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Menu, X, LayoutDashboard, Search, ClipboardList, PenTool, MessageCircle, Wallet, Heart, Bell, Settings, LogOut } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function MyPageLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [influencerStatus, setInfluencerStatus] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem("currentUser");
    if (!user) {
      navigate("/auth/login");
      return;
    }
    setIsAuthorized(true);
    const parsed = JSON.parse(user);
    const profileId = parsed.id;

    const fetchStatus = async () => {
      const { data } = await supabase.from("influencer_profiles").select("status").eq("id", profileId).maybeSingle();
      if (data) setInfluencerStatus(data.status);
    };
    fetchStatus();

    // リアルタイムでステータス変更を検知
    const channel = supabase
      .channel(`influencer-status-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'influencer_profiles',
          filter: `id=eq.${profileId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status;
          if (newStatus) {
            setInfluencerStatus(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  if (!isAuthorized) return null;

  const allowedPaths = ["/mypage", "/mypage/settings"];
  const isRestricted = influencerStatus === "pending" && !allowedPaths.includes(location.pathname);

  const mobileMenuItems = [
    { icon: LayoutDashboard, label: "ダッシュボード", href: "/mypage" },
    { icon: Search, label: "案件を探す", href: "/mypage/campaigns" },
    { icon: ClipboardList, label: "応募履歴", href: "/mypage/applications" },
    { icon: PenTool, label: "投稿管理", href: "/mypage/posts" },
    { icon: MessageCircle, label: "案件進行管理", href: "/mypage/messages" },
    { icon: Wallet, label: "報酬管理", href: "/mypage/rewards" },
    { icon: Heart, label: "お気に入り", href: "/mypage/favorites" },
    { icon: Bell, label: "お知らせ", href: "/mypage/notifications" },
    { icon: Settings, label: "登録情報", href: "/mypage/settings" },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      {/* Mobile Header for MyPage */}
      <div className="md:hidden sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/mypage" className="flex items-center gap-1">
            <img src={logoImg} alt="PRizm" className="h-8" />
          </Link>
          <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="bg-card border-t border-border px-4 py-3 space-y-1">
            {mobileMenuItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive ? "bg-pink-50 text-pink-500 font-bold" : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                sessionStorage.removeItem("currentUser");
                navigate("/auth/login");
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>ログアウト</span>
            </button>
          </div>
        )}
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
