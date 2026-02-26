import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, CheckCircle, Clock, Send, ChevronRight, X, Building2, ArrowRight, MessageCircle, Filter, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExternalApplications, type ExternalApplication } from "@/hooks/useExternalApplications";
import ThreadConversation from "@/components/ThreadConversation";
import { GENRES } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "すべて" },
  { id: "reviewing", label: "選考中" },
  { id: "approved", label: "採用済み" },
  { id: "rejected", label: "不採用" },
  { id: "completed", label: "完了" },
];

export default function MyPageApplications() {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
  const userId = currentUser?.id || "";
  const { data: applications = [], isLoading } = useExternalApplications({ influencerId: userId });
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ExternalApplication | null>(null);
  const [threadAppId, setThreadAppId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (categoryFilter !== "all") c++;
    if (dateFrom) c++;
    if (dateTo) c++;
    if (budgetMin) c++;
    if (budgetMax) c++;
    return c;
  }, [categoryFilter, dateFrom, dateTo, budgetMin, budgetMax]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setBudgetMin("");
    setBudgetMax("");
  };

  const filtered = useMemo(() => {
    return applications.filter(app => {
      if (activeTab === "reviewing" && !["applied", "reviewing"].includes(app.status)) return false;
      else if (activeTab !== "all" && activeTab !== "reviewing" && app.status !== activeTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(app.campaigns?.title || "").toLowerCase().includes(q) && !(app.campaigns?.companies?.name || "").toLowerCase().includes(q)) return false;
      }
      if (categoryFilter !== "all" && app.campaigns?.category !== categoryFilter) return false;
      if (dateFrom && new Date(app.applied_at) < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(app.applied_at) > end) return false;
      }
      const budget = app.campaigns?.budget_max || app.campaigns?.budget_min || 0;
      if (budgetMin && budget < Number(budgetMin)) return false;
      if (budgetMax && budget > Number(budgetMax)) return false;
      return true;
    });
  }, [applications, activeTab, searchQuery, categoryFilter, dateFrom, dateTo, budgetMin, budgetMax]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied": case "reviewing": return <Badge variant="secondary" className="bg-blue-100 text-blue-700">選考中</Badge>;
      case "approved": return <Badge variant="secondary" className="bg-green-100 text-green-700">採用</Badge>;
      case "rejected": return <Badge variant="secondary" className="bg-red-100 text-red-700">不採用</Badge>;
      case "in_progress": return <Badge variant="secondary" className="bg-purple-100 text-purple-700">進行中</Badge>;
      case "post_submitted": return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">投稿済み</Badge>;
      case "post_confirmed": return <Badge variant="secondary" className="bg-teal-100 text-teal-700">投稿確認済</Badge>;
      case "payment_pending": return <Badge variant="secondary" className="bg-orange-100 text-orange-700">振込待ち</Badge>;
      case "completed": return <Badge variant="secondary" className="bg-gray-100 text-gray-700">完了</Badge>;
      default: return <Badge variant="outline">不明</Badge>;
    }
  };

  if (threadAppId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-120px)]">
        <ThreadConversation applicationId={threadAppId} userType="influencer" senderId={userId} onBack={() => setThreadAppId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">応募履歴</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="案件名・会社名で検索" className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={cn("relative shrink-0", showFilters && "bg-pink-50 border-pink-300")}>
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">詳細フィルター</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-pink-500 hover:underline">すべてクリア</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリ</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                <option value="all">すべて</option>
                {GENRES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">応募日（開始）</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "yyyy/MM/dd", { locale: ja }) : "指定なし"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">応募日（終了）</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "yyyy/MM/dd", { locale: ja }) : "指定なし"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">報酬（最小）</label>
              <Input type="number" placeholder="例: 5000" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">報酬（最大）</label>
              <Input type="number" placeholder="例: 100000" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="bg-white" />
            </div>
          </div>
        </div>
      )}

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

      <p className="text-sm text-gray-500">{filtered.length}件の応募</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(app => {
            const campaign = app.campaigns;
            const hasThread = ["approved", "in_progress", "post_submitted", "post_confirmed", "payment_pending", "completed"].includes(app.status);
            return (
              <Card key={app.id} className="group hover:shadow-md transition-shadow border-gray-100">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="w-full md:w-32 h-32 md:h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {campaign?.image_url ? <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-8 h-8" /></div>}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {getStatusBadge(app.status)}
                        <span className="text-xs text-gray-500">応募日: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 truncate">{campaign?.title || "不明な案件"}</h3>
                      <div className="flex items-center text-sm text-gray-500"><Building2 className="w-3.5 h-3.5 mr-1" />{campaign?.companies?.name || "不明"}</div>
                      <div className="flex flex-wrap gap-4 text-xs md:text-sm pt-1">
                        <div className="flex items-center text-gray-600"><span className="text-pink-500 font-bold mr-1">¥</span><span className="font-medium">{(campaign?.budget_max || campaign?.budget_min || 0).toLocaleString()}</span></div>
                        <div className="flex items-center text-gray-600"><Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />締切: {campaign?.deadline ? new Date(campaign.deadline).toLocaleDateString("ja-JP") : "-"}</div>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 justify-end mt-2 md:mt-0 border-t md:border-t-0 pt-3 md:pt-0">
                      {hasThread && (
                        <Button size="sm" className="bg-purple-500 hover:bg-purple-400 text-white shadow-sm w-full md:w-auto" onClick={() => setThreadAppId(app.id)}>
                          <MessageCircle className="w-3 h-3 mr-1" />スレッド
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)} className="w-full md:w-auto text-gray-500 hover:text-gray-900">詳細 <ChevronRight className="w-3 h-3 ml-1" /></Button>
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
          <Link to="/mypage/campaigns"><Button className="bg-pink-500 text-white hover:bg-pink-400">案件を探す <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
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
              {selectedApp.campaigns && (
                <>
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      {selectedApp.campaigns.image_url && <img src={selectedApp.campaigns.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{selectedApp.campaigns.title}</h4>
                      <p className="text-sm text-gray-500 mb-2">{selectedApp.campaigns.companies?.name || ""}</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="font-bold text-pink-500">¥{(selectedApp.campaigns.budget_max || selectedApp.campaigns.budget_min || 0).toLocaleString()}</span>
                        {selectedApp.campaigns.deadline && (
                          <span className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />締切: {new Date(selectedApp.campaigns.deadline).toLocaleDateString("ja-JP")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedApp.campaigns.category && (
                    <div className="flex gap-2"><Badge variant="outline">{selectedApp.campaigns.category}</Badge></div>
                  )}
                </>
              )}
              <div>
                <h4 className="font-bold text-gray-800 mb-2 text-sm">ステータス</h4>
                <div>{getStatusBadge(selectedApp.status)}</div>
              </div>
              {selectedApp.motivation && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2 text-sm">応募動機</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed italic border border-gray-100">"{selectedApp.motivation}"</div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              {["approved", "in_progress", "post_submitted", "post_confirmed", "payment_pending", "completed"].includes(selectedApp.status) && (
                <Button className="bg-purple-500 hover:bg-purple-400 text-white" onClick={() => { setSelectedApp(null); setThreadAppId(selectedApp.id); }}>
                  <MessageCircle className="w-4 h-4 mr-2" />スレッドを開く
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedApp(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
