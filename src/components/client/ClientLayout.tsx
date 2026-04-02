import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Ban } from "lucide-react";

export function ClientLayout() {
  const navigate = useNavigate();
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("client_session");
    if (session !== "true") {
      navigate("/client/login");
      return;
    }

    // Fetch company status
    const checkStatus = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession?.user?.id) {
        const { data } = await supabase
          .from("companies")
          .select("status")
          .eq("user_id", authSession.user.id)
          .maybeSingle();
        setCompanyStatus(data?.status ?? "active");
      } else {
        setCompanyStatus("active");
      }
      setIsReady(true);
    };
    checkStatus();
  }, [navigate]);

  if (!isReady) return null;

  if (companyStatus === "suspended") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="p-6 bg-red-50 rounded-full inline-flex">
            <Ban className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">アカウントが一時停止中です</h2>
          <p className="text-gray-500">
            事務局により、貴社のアカウントが一時利用停止されています。
            案件の作成・管理・メッセージ送信などの機能はご利用いただけません。
          </p>
          <p className="text-sm text-gray-400">
            詳細については事務局までお問い合わせください。
          </p>
          <div className="bg-gray-100 rounded-xl p-4">
            <p className="text-sm text-gray-700 font-medium">お問い合わせ先</p>
            <a href="mailto:media@pr-izm.com" className="text-sm text-pink-500 hover:underline">media@pr-izm.com</a>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("client_session");
              navigate("/client/login");
            }}
            className="text-sm text-gray-500 hover:text-red-500 underline"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

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
