import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Search, MessageCircle, Heart, Bell, Settings, LogOut, ClipboardList, PenTool, User, Wallet, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useExternalApplications } from "@/hooks/useExternalApplications";

export default function InfluencerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    navigate("/auth/login");
  };

  const userId = user?.id || "";
  const { data: applications = [] } = useExternalApplications({ influencerId: userId });
  const approvedCount = applications.filter(a => a.status === "approved").length;

  const menuItems = [
    { icon: LayoutDashboard, label: "ダッシュボード", href: "/mypage", badge: approvedCount > 0 ? `${approvedCount}` : undefined, badgeColor: "bg-green-500" },
    { icon: Search, label: "案件を探す", href: "/mypage/campaigns" },
    { icon: ClipboardList, label: "応募履歴", href: "/mypage/applications", badge: approvedCount > 0 ? "新着" : undefined, badgeColor: "bg-green-500" },
    { icon: PenTool, label: "投稿管理", href: "/mypage/posts" },
    { icon: MessageCircle, label: "案件進行管理", href: "/mypage/messages" },
    { icon: Wallet, label: "報酬管理", href: "/mypage/rewards" },
    { icon: Heart, label: "お気に入り", href: "/mypage/favorites" },
    { icon: Bell, label: "お知らせ", href: "/mypage/notifications" },
    { icon: Settings, label: "登録情報", href: "/mypage/settings" },
  ];

  if (!user) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-300 shadow-md mb-3 relative">
            {user.profileImagePreview ? (
              <img src={user.profileImagePreview} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <h2 className="font-bold text-gray-800">{user.lastName && user.firstName ? `${user.lastName} ${user.firstName}` : user.name || ""}</h2>
          <p className="text-xs text-gray-400">PRizm ID: {user.id}</p>
          <div className="mt-2 flex gap-1">
            <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">審査中</span>
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
                  {(item as any).badge && (
                    <span className={`ml-auto text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold ${(item as any).badgeColor || "bg-pink-500"} animate-pulse`}>
                      {(item as any).badge}
                    </span>
                  )}
                  {isActive && !(item as any).badge && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500"></div>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-700">お問い合わせ</span>
          </div>
          <p className="text-[10px] text-gray-400 mb-1">24時間受付（返信: 2〜3営業日）</p>
          <a href="mailto:media@pr-izm.com" className="text-xs text-pink-500 hover:underline">media@pr-izm.com</a>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full">
            <LogOut className="w-5 h-5" />
            <span>ログアウト</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
