import { Heart, FileText, Clock, Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { toast } from "sonner";

export default function MyPageFavorites() {
  const { data: favorites = [], isLoading } = useFavorites();
  const toggleFav = useToggleFavorite();

  const handleRemove = (campaignId: string) => {
    toggleFav.mutate(campaignId, {
      onSuccess: () => toast.success("お気に入りから削除しました"),
    });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">読み込み中...</div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-pink-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">お気に入り</h1>
        <p className="text-gray-500">
          まだお気に入り登録された案件はありません。<br />気になる案件を見つけてリストに追加しましょう。
        </p>
        <Link to="/mypage/campaigns">
          <Button className="mt-4 bg-pink-500 text-white hover:bg-pink-300 shadow-sm px-8">案件を探す</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900">お気に入り</h1>
      <p className="text-gray-500">{favorites.length}件のお気に入り</p>
      <div className="grid gap-4 md:grid-cols-2">
        {favorites.map((fav: any) => {
          const campaign = fav.campaigns;
          if (!campaign) return null;
          return (
            <Card key={fav.id} className="group hover:shadow-lg transition-all border-gray-100">
              <CardContent className="p-0">
                <div className="h-36 bg-gray-100 overflow-hidden rounded-t-lg relative">
                  {campaign.image_url ? (
                    <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-12 h-12" /></div>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); handleRemove(campaign.id); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-gray-900 line-clamp-2">{campaign.title}</h3>
                  <div className="flex items-center text-sm text-gray-500"><Building2 className="w-3.5 h-3.5 mr-1" />{campaign.companies?.name || "不明"}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-pink-500">¥{(campaign.budget_max || campaign.budget_min || 0).toLocaleString()}</span>
                    <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString("ja-JP") : "-"}</span>
                  </div>
                  <Link to={`/mypage/campaigns/${campaign.id}`}>
                    <Button size="sm" className="w-full mt-2 bg-pink-500 hover:bg-pink-400 text-white">
                      詳細を見る <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
