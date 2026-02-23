import { useState } from "react";
import { MessageCircle, Building2, Clock, FileText, Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { APPLICATION_STATUSES, CATEGORIES } from "@/lib/constants";
import ThreadConversation from "@/components/ThreadConversation";

export default function MyPageMessages() {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
  const userId = currentUser?.id || "";
  const { data: applications = [], isLoading } = useExternalApplications({ influencerId: userId });
  const [threadAppId, setThreadAppId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const threadApps = applications.filter(app =>
    ["approved", "in_progress", "post_submitted", "revision_requested", "post_confirmed", "payment_pending", "completed"].includes(app.status)
  );

  const filtered = threadApps.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || app.campaigns?.category === categoryFilter;
    const matchesSearch = !search || (app.campaigns?.title || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  if (threadAppId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-120px)]">
        <ThreadConversation
          applicationId={threadAppId}
          userType="influencer"
          senderId={userId}
          onBack={() => setThreadAppId(null)}
        />
      </div>
    );
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  const activeStatuses = APPLICATION_STATUSES.filter(s =>
    ["approved", "in_progress", "post_submitted", "revision_requested", "post_confirmed", "payment_pending", "completed"].includes(s.id)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">案件進行管理</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="案件名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">ステータス: すべて</option>
            {activeStatuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">カテゴリ: すべて</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }} className="text-gray-500">クリア</Button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(app => {
            const campaign = app.campaigns;
            const company = campaign?.companies;
            const isCompleted = app.status === "completed";
            const statusObj = APPLICATION_STATUSES.find(s => s.id === app.status);
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
                      <Badge className={statusObj?.color || ""}>{statusObj?.label || app.status}</Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <Building2 className="w-3 h-3 mr-1" />
                      {company?.name || "不明な企業"}
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
          <p className="text-gray-500">現在、進行中の案件はありません。<br />企業から採用されるとスレッドが開設されます。</p>
        </div>
      )}
    </div>
  );
}
