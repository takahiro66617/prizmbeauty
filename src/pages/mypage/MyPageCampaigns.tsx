import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, DollarSign, Clock, Building2, Badge as BadgeIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";

const CATEGORIES = ["スキンケア", "メイク", "ヘアケア", "ボディケア", "ネイル", "フレグランス", "ダイエット", "ファッション", "ライフスタイル", "ダンス"];

export default function MyPageCampaigns() {
  const { data: campaigns = [], isLoading } = useExternalCampaigns();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const recruitingCampaigns = campaigns.filter(c => c.status === "recruiting");

  const filtered = recruitingCampaigns.filter(c => {
    const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.companies?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesPlatform = platformFilter === "all" || (c.platform || "").toLowerCase().includes(platformFilter.toLowerCase());
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">案件を探す</h1>
        <p className="text-gray-500 mt-1">現在募集中の案件一覧です。気になる案件に応募してみましょう。</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="案件名・企業名で検索" className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="all">カテゴリ: すべて</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="all">プラットフォーム: すべて</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
        </select>
      </div>

      <p className="text-sm text-gray-500">{filtered.length}件の案件が見つかりました</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(campaign => (
            <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
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
                    <div className="flex items-center text-sm text-gray-500"><Building2 className="w-3.5 h-3.5 mr-1" />{campaign.companies?.name || "不明"}</div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-700"><DollarSign className="w-3.5 h-3.5 mr-1 text-pink-500" /><span className="font-bold">¥{(campaign.budget_max || campaign.budget_min || 0).toLocaleString()}</span></div>
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
          <h3 className="text-lg font-bold text-gray-900 mb-2">現在募集中の案件はありません</h3>
          <p className="text-gray-500">新しい案件が掲載されるまでお待ちください。</p>
        </div>
      )}
    </div>
  );
}
