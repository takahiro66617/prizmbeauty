import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { PenTool, Clock, CheckCircle, Send, FileText, ArrowRight, MessageSquare, Filter, Search, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GENRES } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: "投稿準備中", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "作業中", color: "bg-blue-100 text-blue-700" },
  post_submitted: { label: "投稿審査中", color: "bg-purple-100 text-purple-700" },
  post_confirmed: { label: "投稿承認済", color: "bg-green-100 text-green-700" },
  payment_pending: { label: "振込待ち", color: "bg-orange-100 text-orange-700" },
  completed: { label: "完了", color: "bg-gray-100 text-gray-700" },
};

const STATUS_TABS = [
  { id: "all", label: "すべて" },
  { id: "waiting", label: "投稿待ち" },
  { id: "submitted", label: "審査中" },
  { id: "confirmed", label: "承認・完了" },
];

export default function MyPagePosts() {
  const [userId, setUserId] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [postUrl, setPostUrl] = useState("");
  const [postCaption, setPostCaption] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    const u = sessionStorage.getItem("currentUser");
    if (u) setUserId(JSON.parse(u).id);
  }, []);

  const { data: applications = [], isLoading } = useExternalApplications({ influencerId: userId });

  const activeApps = applications.filter(a =>
    ["approved", "in_progress", "post_submitted", "post_confirmed", "payment_pending", "completed"].includes(a.status)
  );

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (categoryFilter !== "all") c++;
    if (dateFrom) c++;
    if (dateTo) c++;
    return c;
  }, [categoryFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery("");
  };

  const filtered = useMemo(() => {
    return activeApps.filter(app => {
      // Tab filter
      if (activeTab === "waiting" && !["approved", "in_progress"].includes(app.status)) return false;
      if (activeTab === "submitted" && app.status !== "post_submitted") return false;
      if (activeTab === "confirmed" && !["post_confirmed", "payment_pending", "completed"].includes(app.status)) return false;
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(app.campaigns?.title || "").toLowerCase().includes(q) && !(app.campaigns?.companies?.name || "").toLowerCase().includes(q)) return false;
      }
      // Category
      if (categoryFilter !== "all" && app.campaigns?.category !== categoryFilter) return false;
      // Date
      if (dateFrom && new Date(app.applied_at) < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(app.applied_at) > end) return false;
      }
      return true;
    });
  }, [activeApps, activeTab, searchQuery, categoryFilter, dateFrom, dateTo]);

  const handleSubmitPost = async () => {
    if (!selectedApp || !postUrl) {
      toast.error("投稿URLを入力してください");
      return;
    }
    const { error } = await supabase.from("applications").update({ status: "post_submitted" }).eq("id", selectedApp.id);
    if (error) { toast.error("送信に失敗しました"); return; }
    toast.success("投稿を報告しました！企業の確認をお待ちください。");
    setShowSubmitDialog(false);
    setPostUrl("");
    setPostCaption("");
    setSelectedApp(null);
    window.location.reload();
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PenTool className="w-6 h-6 text-pink-500" /> 投稿管理
        </h1>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="案件名・企業名で検索" className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
            {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-pink-500 hover:underline">すべてクリア</button>}
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
        </div>
      )}

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-8 px-1 min-w-max">
          {STATUS_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
              {tab.id === "all" && <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{activeApps.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      <p className="text-sm text-gray-500">{filtered.length}件の投稿</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">該当する投稿はありません</h3>
          <p className="text-gray-500 mb-4">フィルターを変更するか、案件を探してみましょう。</p>
          <Link to="/mypage/campaigns"><Button className="bg-pink-500 text-white hover:bg-pink-400">案件を探す</Button></Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(app => {
            const isWaiting = ["approved", "in_progress"].includes(app.status);
            const borderColor = isWaiting ? "border-l-yellow-400" : app.status === "post_submitted" ? "border-l-purple-400" : "border-l-green-400";
            return (
              <Card key={app.id} className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow`}>
                <CardContent className="p-5">
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {app.campaigns?.image_url ? <img src={app.campaigns.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-6 h-6" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{app.campaigns?.title || "不明な案件"}</h3>
                      <p className="text-xs text-gray-500 mt-1">{app.campaigns?.companies?.name || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={STATUS_LABELS[app.status]?.color}>{STATUS_LABELS[app.status]?.label}</Badge>
                    {isWaiting && (
                      <Button size="sm" className="bg-pink-500 hover:bg-pink-400 text-white" onClick={() => { setSelectedApp(app); setShowSubmitDialog(true); }}>
                        <Send className="w-3 h-3 mr-1" />投稿を報告
                      </Button>
                    )}
                    {app.campaigns?.budget_max && !isWaiting && (
                      <span className="font-bold text-pink-500 text-sm">¥{app.campaigns.budget_max.toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>投稿を報告する</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedApp && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-bold text-sm">{selectedApp.campaigns?.title}</p>
                <p className="text-xs text-gray-500">{selectedApp.campaigns?.companies?.name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">投稿URL（必須）</label>
              <Input placeholder="https://instagram.com/p/..." value={postUrl} onChange={e => setPostUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">コメント（任意）</label>
              <Textarea placeholder="投稿についてのコメントがあれば記入してください" value={postCaption} onChange={e => setPostCaption(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>キャンセル</Button>
            <Button className="bg-pink-500 hover:bg-pink-400 text-white" onClick={handleSubmitPost}>報告する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
