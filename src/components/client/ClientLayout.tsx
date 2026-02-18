import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";
import { MOCK_COMPANIES } from "@/lib/mockData";

export function ClientLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionStorage.getItem("client_session");
    if (session !== "true") {
      navigate("/client/login");
    }
  }, [navigate]);

  const companyId = sessionStorage.getItem("client_company_id") || "c1";
  const company = MOCK_COMPANIES.find(c => c.id === companyId);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between">
          <h2 className="text-sm font-semibold text-gray-600">
            {company?.name || "企業管理画面"}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              担当: <span className="font-medium text-gray-900">{company?.contactName || ""}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              CL
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
