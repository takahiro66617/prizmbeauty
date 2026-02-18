import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";

export function ClientLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionStorage.getItem("client_session");
    if (session !== "true") {
      navigate("/client/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ClientSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
