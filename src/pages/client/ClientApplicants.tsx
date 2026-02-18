import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ClientApplicants() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [applications, setApplications] = useState<any[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: company } = await supabase.from("companies").select("id").eq("user_id", session.user.id).maybeSingle();
    if (!company) return;
    const { data } = await supabase
      .from("applications")
      .select("*, campaigns(title), influencer_profiles(name, username, image_url, instagram_followers, tiktok_followers, youtube_followers)")
      .eq("company_id", company.id)
      .order("applied_at", { ascending: false });
    setApplications(data || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = applications.filter(a => statusFilter === "all" || a.status === statusFilter);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("applications").update({ status }).eq("id", id);
    toast({ title: status === "approved" ? "採用しました" : "不採用にしました" });
    load();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied": return <Badge className="bg-blue-100 text-blue-700">新規応募</Badge>;
      case "reviewing": return <Badge className="bg-yellow-100 text-yellow-700">選考中</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-700">採用</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700">不採用</Badge>;
      case "completed": return <Badge className="bg-gray-100 text-gray-700">完了</Badge>;
      default: return <Badge variant="outline">不明</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">応募者管理</h1><p className="text-gray-500 mt-1">案件への応募を確認・選考します。</p></div>

      <div className="flex gap-2">
        {[{ id: "all", label: "すべて" }, { id: "applied", label: "新規応募" }, { id: "reviewing", label: "選考中" }, { id: "approved", label: "採用" }, { id: "rejected", label: "不採用" }].map(tab => (
          <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === tab.id ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(app => (
          <Card key={app.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">
                {app.influencer_profiles?.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-gray-900">{app.influencer_profiles?.name || "不明"}</h3>
                  <span className="text-sm text-gray-500">@{app.influencer_profiles?.username || ""}</span>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">案件: <span className="font-medium">{app.campaigns?.title || "不明"}</span></p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>応募日: {new Date(app.applied_at).toLocaleDateString("ja-JP")}</span>
                  {app.influencer_profiles?.instagram_followers > 0 && <span className="text-pink-600">IG: {app.influencer_profiles.instagram_followers.toLocaleString()}</span>}
                  {app.influencer_profiles?.tiktok_followers > 0 && <span>TT: {app.influencer_profiles.tiktok_followers.toLocaleString()}</span>}
                </div>
                {app.motivation && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg italic">"{app.motivation}"</p>}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {(app.status === "applied" || app.status === "reviewing") && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(app.id, "approved")}><CheckCircle className="w-3 h-3 mr-1" />採用</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus(app.id, "rejected")}><XCircle className="w-3 h-3 mr-1" />不採用</Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500">該当する応募はありません</div>}
      </div>
    </div>
  );
}
