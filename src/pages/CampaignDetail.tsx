import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExternalCampaign } from "@/hooks/useExternalCampaigns";
import { useToggleFavorite, useIsFavorite } from "@/hooks/useFavorites";
import { useApplyToCampaign } from "@/hooks/useApplyToCampaign";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { Heart, Clock, Users, CheckCircle, Instagram, ArrowLeft, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useExternalCampaign(id || null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [influencerProfile, setInfluencerProfile] = useState<any>(null);

  const toggleFav = useToggleFavorite();
  const { data: isFav } = useIsFavorite(id);
  const applyMutation = useApplyToCampaign();

  useEffect(() => {
    // Check sessionStorage for influencer user
    const u = sessionStorage.getItem("currentUser");
    if (u) setCurrentUser(JSON.parse(u));
    // Also check Supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("influencer_profiles").select("*").eq("user_id", session.user.id).maybeSingle()
          .then(({ data }) => { if (data) setInfluencerProfile(data); });
      }
    });
  }, []);

  const influencerId = currentUser?.id || influencerProfile?.id;
  const { data: myApps = [] } = useExternalApplications(influencerId ? { influencerId } : undefined);
  const alreadyApplied = myApps.some(a => a.campaign_id === id);

  const handleApplyClick = () => {
    if (!currentUser && !influencerProfile) {
      // Not logged in - redirect to LINE registration
      navigate("/auth/login");
      return;
    }
    setShowApplyDialog(true);
  };

  const handleApply = () => {
    if (!campaign || !influencerId) return;
    applyMutation.mutate(
      { campaignId: campaign.id, companyId: campaign.company_id, influencerId, motivation },
      {
        onSuccess: () => { toast.success("応募しました！"); setShowApplyDialog(false); setMotivation(""); },
        onError: (e: any) => toast.error(e.message || "応募に失敗しました"),
      }
    );
  };

  const handleFavorite = () => {
    if (!currentUser && !influencerProfile) { navigate("/auth/login"); return; }
    if (!id) return;
    toggleFav.mutate(id, {
      onSuccess: (res) => toast.success(res.action === "added" ? "お気に入りに追加しました" : "お気に入りから削除しました"),
      onError: () => toast.error("操作に失敗しました"),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold mb-4">案件が見つかりません</h1>
            <p className="text-muted-foreground mb-4">お探しの案件は存在しないか、削除された可能性があります。</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />戻る</Button>
              <Link to="/campaigns"><Button>案件一覧へ</Button></Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const platforms = campaign.platform ? campaign.platform.split(",").map(p => p.trim().toLowerCase()) : [];
  const requirements = campaign.requirements ? campaign.requirements.split("\n").filter(Boolean) : [];
  const deliverables = campaign.deliverables ? campaign.deliverables.split("\n").filter(Boolean) : [];
  const daysRemaining = campaign.deadline ? Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/campaigns" className="hover:text-primary transition-colors">案件一覧</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{campaign.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-soft bg-muted">
              {campaign.image_url ? (
                <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><FileText className="w-16 h-16" /></div>
              )}
              {campaign.category && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-card/90 backdrop-blur rounded-full text-sm font-bold shadow-sm">{campaign.category}</span>
                </div>
              )}
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-soft">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{campaign.title}</h1>
              <div className="flex items-center gap-4 py-4 border-t border-b border-border">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold text-xl text-muted-foreground overflow-hidden">
                  {campaign.companies?.logo_url ? <img src={campaign.companies.logo_url} alt="" className="w-full h-full object-cover" /> : campaign.companies?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">掲載企業</div>
                  <div className="font-bold">{campaign.companies?.name || "不明"}</div>
                </div>
              </div>
              {campaign.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">案件内容</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
                </div>
              )}
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-soft space-y-6">
              <h3 className="text-lg font-bold">応募要件・条件</h3>
              {requirements.length > 0 && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-pastel-pink/30 flex items-center justify-center shrink-0 text-primary"><CheckCircle className="w-5 h-5" /></div>
                  <div><h4 className="font-bold mb-2">応募資格</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">{requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                </div>
              )}
              {platforms.length > 0 && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-pastel-blue/30 flex items-center justify-center shrink-0 text-accent-foreground"><Instagram className="w-5 h-5" /></div>
                  <div><h4 className="font-bold mb-2">投稿プラットフォーム</h4>
                    <div className="flex gap-2 flex-wrap">{platforms.map((p, i) => <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm font-medium">{p}</span>)}</div>
                  </div>
                </div>
              )}
              {deliverables.length > 0 && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-pastel-purple/30 flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-secondary-foreground" /></div>
                  <div><h4 className="font-bold mb-2">納品物</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">{deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-0 shadow-lg overflow-hidden">
              <div className="gradient-pink-blue p-6 border-b border-border/30">
                <div className="text-sm text-white/80 mb-1">報酬金額</div>
                <div className="text-3xl font-bold text-white">
                  ¥{(campaign.budget_min || 0).toLocaleString()}
                  {campaign.budget_max && campaign.budget_max > (campaign.budget_min || 0) && <span> ~ ¥{campaign.budget_max.toLocaleString()}</span>}
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> 募集人数</span>
                  <span className="font-bold">{campaign.max_applicants || 0}名</span>
                </div>
                {campaign.deadline && (
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-border">
                    <span className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /> 応募締切</span>
                    <span className={`font-bold ${daysRemaining !== null && daysRemaining <= 7 ? "text-destructive" : ""}`}>
                      {new Date(campaign.deadline).toLocaleDateString("ja-JP")}
                      {daysRemaining !== null && daysRemaining >= 0 && <span className="text-xs ml-1">(あと{daysRemaining}日)</span>}
                    </span>
                  </div>
                )}
                <div className="space-y-3 pt-4">
                  {alreadyApplied ? (
                    <Button className="w-full h-12 text-lg" disabled>応募済み</Button>
                  ) : (
                    <Button className="w-full h-12 text-lg" variant="gradient" onClick={handleApplyClick}>
                      <Send className="w-4 h-4 mr-2" />この案件に応募する
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className={`w-full h-12 ${isFav ? "bg-pastel-pink/20 text-primary border-primary/30" : "hover:bg-pastel-pink/10 hover:text-primary hover:border-primary/30"}`}
                    onClick={handleFavorite}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFav ? "fill-current" : ""}`} />
                    {isFav ? "お気に入り済み" : "お気に入りに追加"}
                  </Button>
                </div>
                {!currentUser && !influencerProfile && (
                  <p className="text-xs text-center text-muted-foreground">応募にはPRizm Beautyへの会員登録が必要です</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>案件に応募する</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-bold text-sm">{campaign.title}</p>
              <p className="text-xs text-muted-foreground">{campaign.companies?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">応募動機（任意）</label>
              <textarea value={motivation} onChange={e => setMotivation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="この案件に応募する理由を記入してください..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>キャンセル</Button>
            <Button variant="gradient" onClick={handleApply} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? "送信中..." : "応募する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
