import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileEdit, Users, MessageCircle, Settings, LogOut, PlusCircle,
} from "lucide-react";
import { useExternalCompany } from "@/hooks/useExternalCompanies";

const navItems = [
  { title: "ダッシュボード", href: "/client/dashboard", icon: LayoutDashboard },
  { title: "案件管理", href: "/client/campaigns", icon: FileEdit },
  { title: "応募者管理", href: "/client/applicants", icon: Users },
  { title: "メッセージ", href: "/client/messages", icon: MessageCircle },
];

export function ClientSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: company } = useExternalCompany(companyId);

  const handleLogout = () => {
    sessionStorage.removeItem("client_session");
    sessionStorage.removeItem("client_company_id");
    navigate("/client/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 flex items-center justify-center text-blue-600 font-bold text-lg mb-3 shadow-md">
            CL
          </div>
          <h2 className="font-bold text-gray-800">{company?.name || "企業管理画面"}</h2>
          <p className="text-xs text-gray-400 mt-0.5">PRizm Client</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link key={item.href} to={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm
                  ${isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"}`} />
                  <span>{item.title}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                </div>
              </Link>
            );
          })}

          <Link to="/client/campaigns/new">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm mt-3 border border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50">
              <PlusCircle className="w-5 h-5" />
              <span>新規案件作成</span>
            </div>
          </Link>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-100">
        <Link to="/client/settings">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm
            ${location.pathname === "/client/settings" ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
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
