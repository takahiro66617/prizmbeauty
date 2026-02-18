import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, DollarSign, CheckCircle, XCircle, Clock, Send, ChevronRight, X, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApplicationsForInfluencer, getCampaignById, getCompanyById, MOCK_USER } from "@/lib/mockData";
import type { Application } from "@/lib/mockData";

const TABS = [
  { id: "all", label: "すべて" },
  { id: "reviewing", label: "選考中" },
  { id: "approved", label: "採用済み" },
  { id: "rejected", label: "不採用" },
  { id: "completed", label: "完了" },
];

export default function MyPageApplications() {
  const userId = JSON.parse(sessionStorage.getItem("currentUser") || "null")?.id || MOCK_USER.id;
  const applications = getApplicationsForInfluencer(userId);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const filtered = applications.filter(app => {
    if (activeTab === "reviewing" && !["applied", "reviewing"].includes(app.status)) return false;
    else if (activeTab !== "all" && activeTab !== "reviewing" && app.status !== activeTab) return false;
    if (searchQuery) {
      const campaign = getCampaignById(app.campaignId);
      const q = searchQuery.toLowerCase();
      return campaign?.title.toLowerCase().includes(q) || campaign?.company.name.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied": case "reviewing": return <Badge variant="secondary" className="bg-blue-100 text-blue-700">選考中</Badge>;
      case "approved": return <Badge variant="secondary" className="bg-green-100 text-green-700">採用</Badge>;
      case "rejected": return <Badge variant="secondary" className="bg-red-100 text-red-700">不採用</Badge>;
      case "completed": return <Badge variant="secondary" className="bg-gray-100 text-gray-700">完了</Badge>;
      default: return <Badge variant="outline">不明</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">応募履歴</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="案件名・会社名で検索" className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-8 px-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
              {tab.id === "all" && <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{applications.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(app => {
            const campaign = getCampaignById(app.campaignId);
            return (
              <Card key={app.id} className="group hover:shadow-md transition-shadow border-gray-100">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="w-full md:w-32 h-32 md:h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {campaign ? <img src={campaign.images[0]} alt={campaign.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-8 h-8" /></div>}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {getStatusBadge(app.status)}
                        <span className="text-xs text-gray-500">応募日: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 truncate">{campaign?.title || "不明な案件"}</h3>
                      <div className="flex items-center text-sm text-gray-500"><Building2 className="w-3.5 h-3.5 mr-1" />{campaign?.company.name || "不明"}</div>
                      <div className="flex flex-wrap gap-4 text-xs md:text-sm pt-1">
                        <div className="flex items-center text-gray-600"><DollarSign className="w-3.5 h-3.5 mr-1 text-gray-400" /><span className="font-medium">¥{campaign?.reward.toLocaleString()}</span></div>
                        <div className="flex items-center text-gray-600"><Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />締切: {campaign?.deadline || "-"}</div>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 justify-end mt-2 md:mt-0 border-t md:border-t-0 pt-3 md:pt-0">
                      {app.status === "approved" ? (
                        <Button size="sm" className="bg-pink-500 hover:bg-pink-400 text-white shadow-sm w-full md:w-auto"><Send className="w-3 h-3 mr-1" />投稿する</Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)} className="w-full md:w-auto text-gray-500 hover:text-gray-900">詳細 <ChevronRight className="w-3 h-3 ml-1" /></Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4"><FileText className="w-8 h-8 text-gray-300" /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">応募履歴がありません</h3>
          <p className="text-gray-500 mb-6">まだ案件に応募していません。</p>
          <Link to="/campaigns"><Button className="bg-pink-500 text-white hover:bg-pink-400">案件を探す <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900">応募詳細</h3>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {(() => { const campaign = getCampaignById(selectedApp.campaignId); return campaign ? (
                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0"><img src={campaign.images[0]} alt="" className="w-full h-full object-cover" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{campaign.title}</h4>
                    <p className="text-sm text-gray-500 mb-2">{campaign.company.name}</p>
                    <span className="font-bold text-pink-500">¥{campaign.reward.toLocaleString()}</span>
                  </div>
                </div>
              ) : null; })()}
              <div>
                <h4 className="font-bold text-gray-800 mb-2 text-sm">応募動機</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed italic border border-gray-100">"{selectedApp.motivation}"</div>
              </div>
              {selectedApp.reviewComment && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2 text-sm">企業からのコメント</h4>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 leading-relaxed border border-blue-100">{selectedApp.reviewComment}</div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
