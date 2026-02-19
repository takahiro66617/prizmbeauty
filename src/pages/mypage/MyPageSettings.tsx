import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Instagram, Youtube, Wallet, Save, Camera, Lock, AlertTriangle, Building2, Search } from "lucide-react";
import { useBankAccount, useUpsertBankAccount, usePayments } from "@/hooks/usePayments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["スキンケア", "メイク", "ヘアケア", "ボディケア", "ネイル", "フレグランス"];

type TabType = "basic" | "sns" | "activity" | "account" | "reward";

export default function MyPageSettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authUserId, setAuthUserId] = useState("");

  const [formData, setFormData] = useState({
    name: "", username: "", bio: "", category: "",
    image_url: "",
    instagram_followers: 0, tiktok_followers: 0, youtube_followers: 0, twitter_followers: 0,
    categories: [] as string[],
  });

  useEffect(() => {
    const loadProfile = async () => {
      // Try Supabase auth first
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthUserId(session.user.id);
        const { data } = await supabase.from("influencer_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
        if (data) {
          setProfile(data);
          setFormData({
            name: data.name || "",
            username: data.username || "",
            bio: data.bio || "",
            category: data.category || "",
            image_url: data.image_url || "",
            instagram_followers: data.instagram_followers || 0,
            tiktok_followers: data.tiktok_followers || 0,
            youtube_followers: data.youtube_followers || 0,
            twitter_followers: data.twitter_followers || 0,
            categories: data.category ? data.category.split(",").map((c: string) => c.trim()) : [],
          });
          return;
        }
      }
      // Fallback to sessionStorage
      const u = sessionStorage.getItem("currentUser");
      if (u) {
        const parsed = JSON.parse(u);
        setProfile(parsed);
        setFormData({
          name: parsed.name || "",
          username: parsed.username || "",
          bio: parsed.bio || "",
          category: parsed.category || "",
          image_url: parsed.image_url || parsed.profileImagePreview || "",
          instagram_followers: parsed.instagram_followers || 0,
          tiktok_followers: parsed.tiktok_followers || 0,
          youtube_followers: parsed.youtube_followers || 0,
          twitter_followers: parsed.twitter_followers || 0,
          categories: parsed.category ? parsed.category.split(",").map((c: string) => c.trim()) : [],
        });
      } else {
        navigate("/auth/login");
      }
    };
    loadProfile();
  }, [navigate]);

  const handleChange = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat],
    }));
  };

  const handleSaveProfile = async (updates: Record<string, any>) => {
    setIsLoading(true);
    try {
      if (profile?.id) {
        // Use edge function to bypass RLS for LINE-auth influencers without user_id
        const { data: fnData, error: fnError } = await supabase.functions.invoke("update-influencer-profile", {
          body: { profileId: profile.id, updates },
        });
        if (fnError) throw fnError;
        if (fnData?.error) throw new Error(fnData.error);
        const updatedProfile = fnData?.data || { ...profile, ...updates };
        setProfile(updatedProfile);
        const u = sessionStorage.getItem("currentUser");
        if (u) sessionStorage.setItem("currentUser", JSON.stringify({ ...JSON.parse(u), ...updates }));
        toast.success("保存しました");
      }
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
    setIsLoading(false);
  };

  const handleSaveBasic = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveProfile({ name: formData.name, username: formData.username });
  };

  const handleSaveSNS = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveProfile({
      instagram_followers: Number(formData.instagram_followers) || 0,
      tiktok_followers: Number(formData.tiktok_followers) || 0,
      youtube_followers: Number(formData.youtube_followers) || 0,
      twitter_followers: Number(formData.twitter_followers) || 0,
    });
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveProfile({
      category: formData.categories.join(", "),
      bio: formData.bio,
    });
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon?: any }) => (
    <button type="button" onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
      {Icon && <Icon className="w-4 h-4" />}{label}
    </button>
  );

  const SaveButton = () => (
    <div className="flex justify-end mt-6">
      <Button type="submit" disabled={isLoading} className="bg-pink-500 hover:bg-pink-400 text-white shadow-md px-8">
        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4 mr-2" />保存する</>}
      </Button>
    </div>
  );

  if (!profile) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div><h1 className="text-2xl font-bold text-gray-800">登録情報</h1><p className="text-gray-500 mt-1">プロフィールの編集・アカウント設定</p></div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex min-w-max">
          <TabButton tab="basic" label="基本情報" icon={User} />
          <TabButton tab="sns" label="SNS情報" icon={Instagram} />
          <TabButton tab="activity" label="活動情報" icon={Camera} />
          <TabButton tab="account" label="アカウント設定" icon={Lock} />
          <TabButton tab="reward" label="報酬" icon={Wallet} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {activeTab === "basic" && (
          <form onSubmit={handleSaveBasic} className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-50 shadow-inner bg-gray-100">
                  {formData.image_url ? <img src={formData.image_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><User className="w-12 h-12" /></div>}
                </div>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">名前</label><Input value={formData.name} onChange={e => handleChange("name", e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">ユーザーネーム</label><Input value={formData.username} onChange={e => handleChange("username", e.target.value)} /></div>
                </div>
              </div>
            </div>
            <SaveButton />
          </form>
        )}

        {activeTab === "sns" && (
          <form onSubmit={handleSaveSNS} className="space-y-8">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-800 border-b pb-2"><Instagram className="w-5 h-5 text-pink-500" /> Instagram</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">フォロワー数</label>
                <Input type="number" value={formData.instagram_followers} onChange={e => handleChange("instagram_followers", e.target.value)} /></div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">TikTok</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">フォロワー数</label>
                <Input type="number" value={formData.tiktok_followers} onChange={e => handleChange("tiktok_followers", e.target.value)} /></div>
            </div>
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-800 border-b pb-2"><Youtube className="w-5 h-5 text-red-600" /> YouTube</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">登録者数</label>
                <Input type="number" value={formData.youtube_followers} onChange={e => handleChange("youtube_followers", e.target.value)} /></div>
            </div>
            <SaveButton />
          </form>
        )}

        {activeTab === "activity" && (
          <form onSubmit={handleSaveActivity} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-3">得意なカテゴリ <span className="text-xs text-gray-500">(複数選択可)</span></label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 transition-colors">
                    <Checkbox id={`cat-${cat}`} checked={formData.categories.includes(cat)} onCheckedChange={() => handleCategoryToggle(cat)} />
                    <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer w-full">{cat}</label>
                  </div>
                ))}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">自己紹介 <span className="text-xs text-gray-400">({formData.bio.length}/500文字)</span></label>
              <Textarea value={formData.bio} onChange={e => { if (e.target.value.length <= 500) handleChange("bio", e.target.value); }} placeholder="PR案件に対する意気込みや、得意な投稿スタイルなどを記載してください。" />
            </div>
            <SaveButton />
          </form>
        )}

        {activeTab === "account" && (
          <div className="space-y-10">
            <div className="pt-8 border-t border-gray-100">
              <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> アカウント削除</h3>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-sm text-red-700">アカウント削除については事務局までお問い合わせください。</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reward" && <RewardTab />}
      </div>
    </div>
  );
}

function RewardTab() {
  const { data: bankAccount, isLoading: bankLoading } = useBankAccount();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const upsertBank = useUpsertBankAccount();
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: "", branch_name: "", account_type: "ordinary", account_number: "", account_holder: "",
  });
  const [campaignFilter, setCampaignFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (bankAccount) {
      setBankForm({
        bank_name: bankAccount.bank_name,
        branch_name: bankAccount.branch_name,
        account_type: bankAccount.account_type,
        account_number: bankAccount.account_number,
        account_holder: bankAccount.account_holder,
      });
    }
  }, [bankAccount]);

  const handleSaveBank = () => {
    if (!bankForm.bank_name || !bankForm.branch_name || !bankForm.account_number || !bankForm.account_holder) {
      toast.error("すべての項目を入力してください");
      return;
    }
    upsertBank.mutate(bankForm, {
      onSuccess: () => { toast.success("振込先情報を保存しました"); setShowBankForm(false); },
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  const filteredPayments = payments.filter(p => {
    const matchesCampaign = !campaignFilter || (p.campaigns?.title || "").toLowerCase().includes(campaignFilter.toLowerCase());
    const matchesDateFrom = !dateFrom || new Date(p.created_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(p.created_at) <= new Date(dateTo + "T23:59:59");
    return matchesCampaign && matchesDateFrom && matchesDateTo;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = filteredPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  const statusLabel = (s: string) => {
    switch (s) {
      case "paid": return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">振込済</span>;
      case "pending": return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">振込待ち</span>;
      default: return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>;
    }
  };

  if (bankLoading || paymentsLoading) return <div className="text-center py-8 text-gray-400">読み込み中...</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-gray-500" />振込先情報</h3>
          <Button variant="outline" size="sm" onClick={() => setShowBankForm(!showBankForm)}>
            {bankAccount ? "編集" : "設定する"}
          </Button>
        </div>
        {bankAccount && !showBankForm ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">銀行名</span><span className="font-medium">{bankAccount.bank_name}</span>
              <span className="text-gray-500">支店名</span><span className="font-medium">{bankAccount.branch_name}</span>
              <span className="text-gray-500">口座種別</span><span className="font-medium">{bankAccount.account_type === "ordinary" ? "普通" : "当座"}</span>
              <span className="text-gray-500">口座番号</span><span className="font-medium">{"●".repeat(Math.max(0, bankAccount.account_number.length - 3)) + bankAccount.account_number.slice(-3)}</span>
              <span className="text-gray-500">口座名義</span><span className="font-medium">{bankAccount.account_holder}</span>
            </div>
          </div>
        ) : showBankForm || !bankAccount ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">銀行名</label>
                <Input value={bankForm.bank_name} onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="例: 三菱UFJ銀行" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">支店名</label>
                <Input value={bankForm.branch_name} onChange={e => setBankForm(p => ({ ...p, branch_name: e.target.value }))} placeholder="例: 渋谷支店" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">口座種別</label>
                <select value={bankForm.account_type} onChange={e => setBankForm(p => ({ ...p, account_type: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="ordinary">普通</option><option value="current">当座</option>
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">口座番号</label>
                <Input value={bankForm.account_number} onChange={e => setBankForm(p => ({ ...p, account_number: e.target.value }))} placeholder="1234567" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">口座名義（カタカナ）</label>
              <Input value={bankForm.account_holder} onChange={e => setBankForm(p => ({ ...p, account_holder: e.target.value }))} placeholder="例: ヤマダ タロウ" /></div>
            <div className="flex justify-end gap-2">
              {bankAccount && <Button variant="outline" size="sm" onClick={() => setShowBankForm(false)}>キャンセル</Button>}
              <Button size="sm" className="bg-pink-500 hover:bg-pink-400 text-white" onClick={handleSaveBank} disabled={upsertBank.isPending}>
                <Save className="w-4 h-4 mr-1" />保存
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-gray-500" />報酬サマリー</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">合計報酬</p>
            <p className="text-xl font-bold text-pink-600">¥{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">振込済み</p>
            <p className="text-xl font-bold text-green-600">¥{paidAmount.toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">振込待ち</p>
            <p className="text-xl font-bold text-orange-600">¥{pendingAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-4">報酬履歴</h3>
        <div className="flex gap-3 flex-wrap items-center mb-4">
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} placeholder="案件名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>期間:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            <span>〜</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setCampaignFilter(""); setDateFrom(""); setDateTo(""); }} className="text-gray-500">クリア</Button>
        </div>

        {filteredPayments.length > 0 ? (
          <div className="space-y-3">
            {filteredPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{p.campaigns?.title || "不明な案件"}</p>
                  <p className="text-xs text-gray-500">{p.companies?.name || "-"} · {new Date(p.created_at).toLocaleDateString("ja-JP")}</p>
                </div>
                <div className="flex items-center gap-3">
                  {statusLabel(p.status)}
                  <span className="font-bold text-gray-900">¥{p.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-500 mr-2">絞り込み合計:</span>
              <span className="font-bold text-lg text-pink-600">¥{filteredPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">報酬履歴はまだありません</div>
        )}
      </div>
    </div>
  );
}
