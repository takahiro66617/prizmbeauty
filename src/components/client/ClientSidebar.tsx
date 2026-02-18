import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileEdit,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  PlusCircle,
} from "lucide-react";

const navItems = [
  { title: "ダッシュボード", href: "/client/dashboard", icon: LayoutDashboard },
  { title: "案件管理", href: "/client/campaigns", icon: FileEdit },
  { title: "応募者管理", href: "/client/applicants", icon: Users },
  { title: "メッセージ", href: "/client/messages", icon: MessageCircle },
];

export function ClientSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("client_session");
    sessionStorage.removeItem("client_company_id");
    navigate("/client/login");
  };

  return (
    <div className="flex bg-slate-900 text-white w-64 min-h-screen flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          PRizm Client
        </h1>
        <p className="text-xs text-slate-400 mt-1">企業管理画面</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}

        <Link
          to="/client/campaigns/new"
          className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm mt-4 border border-dashed border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800"
        >
          <PlusCircle className="w-5 h-5" />
          <span>新規案件作成</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          to="/client/settings"
          className={cn(
            "flex items-center space-x-3 px-4 py-3 transition-colors text-sm rounded-lg",
            location.pathname === "/client/settings"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>設定</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span>ログアウト</span>
        </button>
      </div>
    </div>
  );
}
