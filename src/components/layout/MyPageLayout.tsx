import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import InfluencerSidebar from "./InfluencerSidebar";
import { Header } from "./Header";
import { supabase } from "@/integrations/supabase/client";

export default function MyPageLayout() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "influencer").maybeSingle();
      if (!data) { navigate("/auth/login"); return; }
      setIsAuthorized(true);
    };
    check();
  }, [navigate]);

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden">
        <Header />
      </div>
      <InfluencerSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
