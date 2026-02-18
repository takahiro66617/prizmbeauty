import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { Search, X, Users, Calendar, ArrowRight, SlidersHorizontal, FileText } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export default function CampaignsPage() {
  const { data: allCampaigns = [], isLoading } = useExternalCampaigns();
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Only show recruiting campaigns
  let filtered = allCampaigns.filter(c => c.status === "recruiting");

  if (keyword) {
    const lower = keyword.toLowerCase();
    filtered = filtered.filter(c => c.title.toLowerCase().includes(lower) || (c.companies?.name || "").toLowerCase().includes(lower));
  }
  if (selectedCategory) {
    filtered = filtered.filter(c => c.category === selectedCategory);
  }
  filtered.sort((a, b) => {
    if (sortOrder === "reward_desc") return (b.budget_max || 0) - (a.budget_max || 0);
    if (sortOrder === "deadline_asc") return new Date(a.deadline || "9999").getTime() - new Date(b.deadline || "9999").getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getDaysRemaining = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">案件を探す</h1>
        <p className="text-muted-foreground text-sm mb-8">{filtered.length}件の案件が見つかりました</p>

        {/* Filters */}
        <div className="bg-card p-6 rounded-2xl shadow-soft mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input placeholder="案件名や会社名で検索..." className="pl-10 h-12 text-base" value={keyword} onChange={e => setKeyword(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <select className="h-10 px-3 rounded-full border border-input bg-background text-sm" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">すべてのカテゴリ</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-2 ml-auto">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <select className="h-10 px-3 rounded-full border border-input bg-background text-sm" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="newest">新着順</option>
                <option value="reward_desc">報酬が高い順</option>
                <option value="deadline_asc">締切が近い順</option>
              </select>
            </div>
            {(keyword || selectedCategory) && (
              <Button variant="ghost" size="sm" onClick={() => { setKeyword(""); setSelectedCategory(""); }}>
                <X className="w-4 h-4 mr-1" /> リセット
              </Button>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : paginated.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map(campaign => {
              const days = getDaysRemaining(campaign.deadline);
              const isEndingSoon = days !== null && days <= 7 && days >= 0;
              return (
                <div key={campaign.id} className="group bg-card rounded-2xl shadow-soft overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {campaign.image_url ? (
                      <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><FileText className="w-12 h-12" /></div>
                    )}
                    <div className="absolute top-3 right-3">
                      {isEndingSoon ? (
                        <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">締切間近</span>
                      ) : (
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">募集中</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    {campaign.category && (
                      <span className="inline-block px-2.5 py-0.5 bg-pastel-pink/30 text-primary text-xs font-bold rounded-full mb-2 w-fit">{campaign.category}</span>
                    )}
                    <p className="text-xs text-muted-foreground mb-1">{campaign.companies?.name || ""}</p>
                    <h3 className="font-bold line-clamp-2 mb-3 min-h-[3rem]">{campaign.title}</h3>
                    <div className="text-xl font-bold text-primary mb-2">¥{(campaign.budget_max || campaign.budget_min || 0).toLocaleString()}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {campaign.max_applicants || 0}名募集</div>
                      <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                        {days !== null ? (
                          <span className={isEndingSoon ? "text-destructive font-bold" : ""}>あと{Math.max(0, days)}日</span>
                        ) : "-"}
                      </div>
                    </div>
                    <div className="mt-auto">
                      <Link to={`/campaigns/${campaign.id}`}>
                        <Button className="w-full" variant="gradient">詳細を見る <ArrowRight className="w-4 h-4 ml-1" /></Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl shadow-soft">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold mb-2">条件に一致する案件がありません</h3>
            <Button variant="outline" onClick={() => { setKeyword(""); setSelectedCategory(""); }}>フィルターをリセット</Button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>前へ</Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button key={i} variant={currentPage === i + 1 ? "gradient" : "outline"} size="sm" onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>次へ</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
