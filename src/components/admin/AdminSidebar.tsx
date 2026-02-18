import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileEdit, Building2, Users, Settings, LogOut, ClipboardList, MessageCircle,
} from "lucide-react";

const navItems = [
  { title: "ダッシュボード", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "案件管理", href: "/admin/campaigns", icon: FileEdit },
  { title: "企業管理", href: "/admin/clients", icon: Building2 },
  { title: "インフルエンサー管理", href: "/admin/influencers", icon: Users },
  { title: "応募管理", href: "/admin/applications", icon: ClipboardList },
  { title: "メッセージ", href: "/admin/messages", icon: MessageCircle },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    sessionStorage.removeItem("admin_email");
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center text-purple-600 font-bold text-lg mb-3 shadow-md">
            AD
          </div>
          <h2 className="font-bold text-gray-800">PRizm Admin</h2>
          <p className="text-xs text-gray-400 mt-0.5">事務局管理画面</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link key={item.href} to={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm
                  ${isActive ? "bg-purple-50 text-purple-600 font-bold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-purple-500" : "text-gray-400 group-hover:text-gray-600"}`} />
                  <span>{item.title}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500"></div>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-100">
        <Link to="/admin/dashboard">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm
            ${location.pathname === "/admin/settings" ? "bg-purple-50 text-purple-600 font-bold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
            <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            <span>設定</span>
          </div>
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm mt-1">
          <LogOut className="w-5 h-5" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
