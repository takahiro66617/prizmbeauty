import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";
import { supabase } from "@/integrations/supabase/client";

export function ClientLayout() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/client/login"); return; }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "client").maybeSingle();
      if (!roleData) { navigate("/client/login"); return; }
      const { data: company } = await supabase.from("companies").select("name, contact_name").eq("user_id", session.user.id).maybeSingle();
      if (company) setCompanyName(company.name);
      setAuthorized(true);
    };
    check();
  }, [navigate]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between">
          <h2 className="text-sm font-semibold text-gray-600">{companyName || "企業管理画面"}</h2>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
