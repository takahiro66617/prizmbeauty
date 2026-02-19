import { useState, useEffect } from "react";
import { MessageCircle, FileText, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import ThreadConversation from "@/components/ThreadConversation";

export default function ClientMessages() {
  const [companyId, setCompanyId] = useState<string>("");
  const [companyUserId, setCompanyUserId] = useState<string>("");
  const [threadAppId, setThreadAppId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCompanyUserId(session.user.id);
      const { data } = await supabase.from("companies").select("id").eq("user_id", session.user.id).single();
      if (data) setCompanyId(data.id);
    };
    fetchCompany();
  }, []);

  const { data: applications = [], isLoading } = useExternalApplications(companyId ? { companyId } : undefined);

  // Only show applications with active threads
  const threadApps = applications.filter(app =>
    ["approved", "in_progress", "post_submitted", "post_confirmed", "payment_pending", "completed"].includes(app.status)
  );

  if (threadAppId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-120px)]">
        <ThreadConversation
          applicationId={threadAppId}
          userType="company"
          senderId={companyUserId}
          onBack={() => setThreadAppId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">メッセージ</h1>
        <p className="text-gray-500 mt-1">採用したインフルエンサーとのやり取りを管理します。</p>
      </div>

      {isLoading || !companyId ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : threadApps.length > 0 ? (
        <div className="grid gap-4">
          {threadApps.map(app => {
            const campaign = app.campaigns;
            const influencer = app.influencer_profiles;
            const isCompleted = app.status === "completed";
            return (
              <Card
                key={app.id}
                className="p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md"
                onClick={() => setThreadAppId(app.id)}
              >
                <div className="flex gap-4 items-start">
                  {campaign?.image_url ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={campaign.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate text-sm">
                        {campaign?.title || "不明な案件"}
                      </h3>
                      {isCompleted ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[10px] shrink-0">完了</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 text-[10px] shrink-0">進行中</Badge>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <User className="w-3 h-3 mr-1" />
                      インフルエンサー: {influencer?.name || "不明"}
                      {influencer?.username && <span className="ml-1 text-gray-400">@{influencer.username}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {campaign?.category && <Badge variant="outline" className="text-[10px]">{campaign.category}</Badge>}
                      <span className="text-pink-500 font-medium">¥{(campaign?.budget_max || campaign?.budget_min || 0).toLocaleString()}</span>
                      {campaign?.deadline && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(campaign.deadline).toLocaleDateString("ja-JP")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-500">現在、メッセージスレッドはありません。<br />インフルエンサーを採用するとスレッドが開設されます。</p>
        </div>
      )}
    </div>
  );
}
