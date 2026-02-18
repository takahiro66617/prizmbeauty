import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { getApplicationsForCompany, getInfluencerById, getCampaignById } from "@/lib/mockData";

export default function ClientApplicants() {
  const companyId = sessionStorage.getItem("client_company_id") || "c1";
  const applications = getApplicationsForCompany(companyId);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = applications.filter(a => statusFilter === "all" || a.status === statusFilter);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">応募者管理</h1>
        <p className="text-gray-500 mt-1">案件への応募を確認・選考します。</p>
      </div>

      <div className="flex gap-2">
        {[
          { id: "all", label: "すべて" },
          { id: "applied", label: "新規応募" },
          { id: "reviewing", label: "選考中" },
          { id: "approved", label: "採用" },
          { id: "rejected", label: "不採用" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === tab.id ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(app => {
          const influencer = getInfluencerById(app.influencerId);
          const campaign = getCampaignById(app.campaignId);
          if (!influencer || !campaign) return null;

          return (
            <Card key={app.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <img src={influencer.image} alt={influencer.name} className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{influencer.name}</h3>
                    <span className="text-sm text-gray-500">@{influencer.username}</span>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    案件: <span className="font-medium">{campaign.title}</span>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>応募日: {new Date(app.appliedAt).toLocaleDateString("ja-JP")}</span>
                    {influencer.platforms.instagram && <span className="text-pink-600">IG: {influencer.platforms.instagram.toLocaleString()}</span>}
                    {influencer.platforms.tiktok && <span>TT: {influencer.platforms.tiktok.toLocaleString()}</span>}
                    {influencer.platforms.youtube && <span className="text-red-600">YT: {influencer.platforms.youtube?.toLocaleString()}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg italic">"{app.motivation}"</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {(app.status === "applied" || app.status === "reviewing") && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="w-3 h-3 mr-1" />採用</Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"><XCircle className="w-3 h-3 mr-1" />不採用</Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="text-gray-500"><Eye className="w-3 h-3 mr-1" />詳細</Button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">該当する応募はありません</div>
        )}
      </div>
    </div>
  );
}
