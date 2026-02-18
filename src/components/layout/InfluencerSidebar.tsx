import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Search, MessageCircle, Heart, Bell, Settings, LogOut, ClipboardList, PenTool, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function InfluencerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("influencer_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      setProfile(data);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "ダッシュボード", href: "/mypage" },
    { icon: Search, label: "案件を探す", href: "/campaigns" },
    { icon: ClipboardList, label: "応募履歴", href: "/mypage/applications" },
    { icon: PenTool, label: "投稿管理", href: "/mypage/posts" },
    { icon: MessageCircle, label: "メッセージ", href: "/mypage/messages" },
    { icon: Heart, label: "お気に入り", href: "/mypage/favorites" },
    { icon: Bell, label: "お知らせ", href: "/mypage/notifications" },
    { icon: Settings, label: "登録情報", href: "/mypage/settings" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-300 shadow-md mb-3 relative">
            {profile?.image_url ? (
              <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <h2 className="font-bold text-gray-800">{profile?.name || ""}</h2>
          <p className="text-xs text-gray-400">@{profile?.username || ""}</p>
          <div className="mt-2 flex gap-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              profile?.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              {profile?.status === "approved" ? "承認済み" : "審査中"}
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive ? "bg-pink-50 text-pink-500 font-bold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-pink-500" : "text-gray-400 group-hover:text-gray-600"}`} />
                  <span>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500"></div>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-100">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full">
          <LogOut className="w-5 h-5" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
