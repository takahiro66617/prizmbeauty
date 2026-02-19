import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExternalCampaign } from "@/hooks/useExternalCampaigns";
import { useApplyToCampaign } from "@/hooks/useApplyToCampaign";
import { useToggleFavorite, useIsFavorite } from "@/hooks/useFavorites";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { Heart, Clock, Users, CheckCircle, Instagram, ArrowLeft, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function MyPageCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useExternalCampaign(id || null);
  const [user, setUser] = useState<any>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [motivation, setMotivation] = useState("");

  useEffect(() => {
    const u = sessionStorage.getItem("currentUser");
    if (u) setUser(JSON.parse(u));
  }, []);

  const influencerId = user?.id || "";
  const { data: myApps = [] } = useExternalApplications({ influencerId });
  const alreadyApplied = myApps.some(a => a.campaign_id === id);

  const applyMutation = useApplyToCampaign();
  const toggleFav = useToggleFavorite();
  const { data: isFav } = useIsFavorite(id);

  const handleApply = () => {
    if (!campaign || !user) return;
    applyMutation.mutate(
      { campaignId: campaign.id, companyId: campaign.company_id, influencerId: user.id, motivation },
      {
        onSuccess: () => {
          toast.success("応募しました！");
          setShowApplyDialog(false);
          setMotivation("");
        },
        onError: (e: any) => toast.error(e.message || "応募に失敗しました"),
      }
    );
  };

  const handleFavorite = () => {
    if (!id) return;
    toggleFav.mutate(id, {
      onSuccess: (res) => toast.success(res.action === "added" ? "お気に入りに追加しました" : "お気に入りから削除しました"),
      onError: () => toast.error("操作に失敗しました"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <FileText className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-800">案件が見つかりません</h2>
        <p className="text-gray-500">この案件は削除されたか、存在しません。</p>
        <Button variant="outline" onClick={() => navigate("/mypage/campaigns")}>
          <ArrowLeft className="w-4 h-4 mr-2" />案件一覧に戻る
        </Button>
      </div>
    );
  }

  const platforms = campaign.platform ? campaign.platform.split(",").map(p => p.trim()) : [];
  const requirements = campaign.requirements ? campaign.requirements.split("\n").filter(Boolean) : [];
  const deliverables = campaign.deliverables ? campaign.deliverables.split("\n").filter(Boolean) : [];
  const daysRemaining = campaign.deadline
    ? Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-6 pb-20">
      <Button variant="ghost" onClick={() => navigate("/mypage/campaigns")} className="text-gray-500">
        <ArrowLeft className="w-4 h-4 mr-2" />案件一覧に戻る
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
            {campaign.image_url ? (
              <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-16 h-16" /></div>
            )}
            {campaign.category && (
              <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 rounded-full text-sm font-bold shadow-sm">{campaign.category}</span>
            )}
          </div>

          <Card className="p-6 border-0 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            <div className="flex items-center gap-3 py-3 border-t border-b border-gray-100">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                {campaign.companies?.name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-xs text-gray-500">掲載企業</p>
                <p className="font-bold text-gray-800">{campaign.companies?.name || "不明"}</p>
              </div>
            </div>
            {campaign.description && (
              <div className="mt-6">
                <h3 className="font-bold text-gray-800 mb-2">案件内容</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
              </div>
            )}
          </Card>

          {(requirements.length > 0 || platforms.length > 0 || deliverables.length > 0) && (
            <Card className="p-6 border-0 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-800">応募要件・条件</h3>
              {requirements.length > 0 && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4 text-pink-500" /></div>
                  <div><h4 className="font-bold text-sm text-gray-700 mb-1">応募資格</h4>
                    <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">{requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                </div>
              )}
              {platforms.length > 0 && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Instagram className="w-4 h-4 text-blue-500" /></div>
                  <div><h4 className="font-bold text-sm text-gray-700 mb-1">プラットフォーム</h4>
                    <div className="flex gap-2 flex-wrap">{platforms.map((p, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{p}</span>)}</div>
                  </div>
                </div>
              )}
              {deliverables.length > 0 && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4 text-purple-500" /></div>
                  <div><h4 className="font-bold text-sm text-gray-700 mb-1">納品物</h4>
                    <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">{deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4 border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-5">
              <p className="text-white/80 text-sm mb-1">報酬金額</p>
              <p className="text-2xl font-bold text-white">
                ¥{(campaign.budget_min || 0).toLocaleString()}
                {campaign.budget_max && campaign.budget_max > (campaign.budget_min || 0) && (
                  <span> ~ ¥{campaign.budget_max.toLocaleString()}</span>
                )}
              </p>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-500"><Users className="w-4 h-4" />募集人数</span>
                <span className="font-bold">{campaign.max_applicants || 0}名</span>
              </div>
              {campaign.deadline && (
                <div className="flex justify-between items-center text-sm border-t pt-4">
                  <span className="flex items-center gap-2 text-gray-500"><Clock className="w-4 h-4" />応募締切</span>
                  <span className={`font-bold ${daysRemaining !== null && daysRemaining <= 7 ? "text-red-500" : ""}`}>
                    {new Date(campaign.deadline).toLocaleDateString("ja-JP")}
                    {daysRemaining !== null && daysRemaining >= 0 && <span className="text-xs ml-1">(あと{daysRemaining}日)</span>}
                  </span>
                </div>
              )}
              <div className="space-y-3 pt-4">
                {alreadyApplied ? (
                  <Button className="w-full h-11" disabled>応募済み</Button>
                ) : (
                  <Button className="w-full h-11 bg-pink-500 hover:bg-pink-600 text-white" onClick={() => setShowApplyDialog(true)}>
                    <Send className="w-4 h-4 mr-2" />この案件に応募する
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={`w-full h-11 ${isFav ? "bg-pink-50 text-pink-500 border-pink-200" : ""}`}
                  onClick={handleFavorite}
                  disabled={toggleFav.isPending}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFav ? "fill-pink-500 text-pink-500" : ""}`} />
                  {isFav ? "お気に入り済み" : "お気に入りに追加"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>案件に応募する</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-bold text-sm">{campaign.title}</p>
              <p className="text-xs text-gray-500">{campaign.companies?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">応募動機（任意）</label>
              <textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="この案件に応募する理由を記入してください..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>キャンセル</Button>
            <Button className="bg-pink-500 hover:bg-pink-600 text-white" onClick={handleApply} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? "送信中..." : "応募する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
