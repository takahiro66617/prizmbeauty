import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Clock, Building2, Filter, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { GENRES, PLATFORMS } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function MyPageCampaigns() {
  const { data: campaigns = [], isLoading } = useExternalCampaigns();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState<Date | undefined>();
  const [deadlineTo, setDeadlineTo] = useState<Date | undefined>();
  const [sortBy, setSortBy] = useState("newest");

  const recruitingCampaigns = campaigns.filter(c => c.status === "recruiting");

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (categoryFilter !== "all") c++;
    if (platformFilter !== "all") c++;
    if (budgetMin) c++;
    if (budgetMax) c++;
    if (deadlineFrom) c++;
    if (deadlineTo) c++;
    return c;
  }, [categoryFilter, platformFilter, budgetMin, budgetMax, deadlineFrom, deadlineTo]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setPlatformFilter("all");
    setBudgetMin("");
    setBudgetMax("");
    setDeadlineFrom(undefined);
    setDeadlineTo(undefined);
  };

  const filtered = useMemo(() => {
    let result = recruitingCampaigns.filter(c => {
      const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.companies?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
      const matchesPlatform = platformFilter === "all" || (c.platform || "").toLowerCase().includes(platformFilter.toLowerCase());
      if (!matchesSearch || !matchesCategory || !matchesPlatform) return false;
      const budget = c.budget_max || c.budget_min || 0;
      if (budgetMin && budget < Number(budgetMin)) return false;
      if (budgetMax && budget > Number(budgetMax)) return false;
      if (deadlineFrom && c.deadline && new Date(c.deadline) < deadlineFrom) return false;
      if (deadlineTo && c.deadline) {
        const end = new Date(deadlineTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(c.deadline) > end) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "deadline") return (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity);
      if (sortBy === "budget_high") return (b.budget_max || 0) - (a.budget_max || 0);
      if (sortBy === "budget_low") return (a.budget_max || 0) - (b.budget_max || 0);
      return 0;
    });

    return result;
  }, [recruitingCampaigns, searchQuery, categoryFilter, platformFilter, budgetMin, budgetMax, deadlineFrom, deadlineTo, sortBy]);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">案件を探す</h1>
        <p className="text-gray-500 mt-1">現在募集中の案件一覧です。気になる案件に応募してみましょう。</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="案件名・企業名で検索" className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="newest">新着順</option>
          <option value="deadline">締切が近い順</option>
          <option value="budget_high">報酬が高い順</option>
          <option value="budget_low">報酬が低い順</option>
        </select>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn("relative", showFilters && "bg-pink-50 border-pink-300")}>
          <Filter className="w-4 h-4 mr-2" />フィルター
          {activeFilterCount > 0 && (
            <span className="ml-1 w-5 h-5 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center">{activeFilterCount}</span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">詳細フィルター</h3>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-pink-500 hover:underline">すべてクリア</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリ</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                <option value="all">すべて</option>
                {GENRES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">プラットフォーム</label>
              <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                <option value="all">すべて</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">締切日（開始）</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !deadlineFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {deadlineFrom ? format(deadlineFrom, "yyyy/MM/dd", { locale: ja }) : "指定なし"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadlineFrom} onSelect={setDeadlineFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">締切日（終了）</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !deadlineTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {deadlineTo ? format(deadlineTo, "yyyy/MM/dd", { locale: ja }) : "指定なし"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadlineTo} onSelect={setDeadlineTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500">{filtered.length}件の案件が見つかりました</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(campaign => (
            <Link key={campaign.id} to={`/mypage/campaigns/${campaign.id}`}>
              <Card className="group hover:shadow-lg transition-all border-gray-100 h-full">
                <CardContent className="p-0">
                  <div className="h-40 bg-gray-100 overflow-hidden rounded-t-lg">
                    {campaign.image_url ? (
                      <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-12 h-12" /></div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {campaign.category && <Badge variant="outline" className="text-xs">{campaign.category}</Badge>}
                      {campaign.platform && <Badge variant="secondary" className="text-xs">{campaign.platform}</Badge>}
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-2">{campaign.title}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      {campaign.companies?.logo_url ? (
                        <img src={campaign.companies.logo_url} alt="" className="w-5 h-5 rounded-full object-cover mr-1.5" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 mr-1" />
                      )}
                      {campaign.companies?.name || "不明"}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-700"><span className="text-pink-500 font-bold mr-1">¥</span><span className="font-bold">{(campaign.budget_max || campaign.budget_min || 0).toLocaleString()}</span></div>
                      <div className="flex items-center text-gray-500"><Clock className="w-3.5 h-3.5 mr-1" />{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString("ja-JP") : "-"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">該当する案件はありません</h3>
          <p className="text-gray-500">フィルター条件を変更してみてください。</p>
        </div>
      )}
    </div>
  );
}
