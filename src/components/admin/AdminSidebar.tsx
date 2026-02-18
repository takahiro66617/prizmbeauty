import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileEdit, Building2, Users, Settings, LogOut, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "ダッシュボード", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "案件管理", href: "/admin/campaigns", icon: FileEdit },
  { title: "企業管理", href: "/admin/clients", icon: Building2 },
  { title: "インフルエンサー管理", href: "/admin/influencers", icon: Users },
  { title: "応募管理", href: "/admin/applications", icon: ClipboardList },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="flex bg-gray-900 text-white w-64 min-h-screen flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">PRizm Admin</h1>
        <p className="text-xs text-gray-400 mt-1">事務局管理画面</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link key={item.href} to={item.href}
              className={cn("flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm",
                isActive ? "bg-purple-600 text-white shadow-md" : "text-gray-400 hover:bg-gray-800 hover:text-white")}>
              <item.icon className="w-5 h-5" /><span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm mt-2">
          <LogOut className="w-5 h-5" /><span>ログアウト</span>
        </button>
      </div>
    </div>
  );
}
