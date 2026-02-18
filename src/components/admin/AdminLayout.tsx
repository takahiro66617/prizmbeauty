import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionStorage.getItem("admin_session");
    if (session !== "true") {
      navigate("/admin/login");
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between">
          <h2 className="text-sm font-semibold text-gray-600">
            PRizm Beauty 事務局
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              管理者: <span className="font-medium text-gray-900">事務局 太郎</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
