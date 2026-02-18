import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User, Instagram, Youtube, Wallet, Save, Camera, Mail, Lock, AlertTriangle, Eye, EyeOff, Building2, Search } from "lucide-react";
import { useBankAccount, useUpsertBankAccount, usePayments } from "@/hooks/usePayments";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県",
  "埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県",
  "佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const CATEGORIES = ["スキンケア", "メイク", "ヘアケア", "ボディケア", "ネイル", "フレグランス"];

type TabType = "basic" | "sns" | "activity" | "account" | "reward";

export default function MyPageSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  const [formData, setFormData] = useState({
    id: "", lastName: "", firstName: "", email: "",
    birthYear: "", birthMonth: "", birthDay: "", gender: "", prefecture: "",
    profileImagePreview: "",
    instagramUserName: "", instagramFollowers: "",
    tiktokEnabled: false, tiktokUserName: "", tiktokFollowers: "",
    youtubeEnabled: false, youtubeUrl: "", youtubeFollowers: "",
    categories: [] as string[], bio: "", portfolioUrl: "",
    currentPassword: "", newPassword: "", confirmPassword: "", newEmail: "",
  });
  const [originalUser, setOriginalUser] = useState<any>(null);

  useEffect(() => {
    const sessionUser = sessionStorage.getItem("currentUser");
    if (sessionUser) {
      const parsed = JSON.parse(sessionUser);
      const allUsers = JSON.parse(localStorage.getItem("prizm_influencers") || "[]");
      const found = allUsers.find((u: any) => u.email === parsed.email) || parsed;
      setOriginalUser(found);
      setFormData((prev) => ({ ...prev, ...found, categories: found.categories || [], tiktokEnabled: !!found.tiktokUserName, youtubeEnabled: !!found.youtubeUrl }));
    } else {
      navigate("/auth/login");
    }
  }, [navigate]);

  const handleChange = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, profileImagePreview: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryToggle = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat],
    }));
  };

  const saveData = (updatedData: any) => {
    const allUsers = JSON.parse(localStorage.getItem("prizm_influencers") || "[]");
    const updated = allUsers.map((u: any) => (u.email === originalUser.email ? { ...u, ...updatedData } : u));
    localStorage.setItem("prizm_influencers", JSON.stringify(updated));
    sessionStorage.setItem("currentUser", JSON.stringify({ ...originalUser, ...updatedData }));
    setOriginalUser({ ...originalUser, ...updatedData });
    toast({ title: "保存しました" });
    setIsLoading(false);
  };

  const handleSaveBasic = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    saveData({ lastName: formData.lastName, firstName: formData.firstName, gender: formData.gender, prefecture: formData.prefecture, profileImagePreview: formData.profileImagePreview });
  };

  const handleSaveSNS = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    saveData({ instagramUserName: formData.instagramUserName, instagramFollowers: formData.instagramFollowers, tiktokUserName: formData.tiktokEnabled ? formData.tiktokUserName : "", tiktokFollowers: formData.tiktokEnabled ? formData.tiktokFollowers : "", youtubeUrl: formData.youtubeEnabled ? formData.youtubeUrl : "", youtubeFollowers: formData.youtubeEnabled ? formData.youtubeFollowers : "" });
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    saveData({ categories: formData.categories, bio: formData.bio, portfolioUrl: formData.portfolioUrl });
  };

  const handleUpdatePassword = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) { toast({ title: "すべてのパスワード項目を入力してください", variant: "destructive" }); return; }
    if (formData.newPassword.length < 8) { toast({ title: "8文字以上で設定してください", variant: "destructive" }); return; }
    if (formData.newPassword !== formData.confirmPassword) { toast({ title: "パスワードが一致しません", variant: "destructive" }); return; }
    setIsLoading(true);
    saveData({ password: btoa(formData.newPassword) });
    setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
  };

  const handleDeleteAccount = () => {
    if (window.confirm("本当にアカウントを削除しますか？\nこの操作は取り消せません。")) {
      const allUsers = JSON.parse(localStorage.getItem("prizm_influencers") || "[]");
      localStorage.setItem("prizm_influencers", JSON.stringify(allUsers.filter((u: any) => u.email !== originalUser.email)));
      sessionStorage.removeItem("currentUser");
      navigate("/");
    }
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon?: any }) => (
    <button type="button" onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
      {Icon && <Icon className="w-4 h-4" />}{label}
    </button>
  );

  const SaveButton = ({ onClick }: { onClick?: any }) => (
    <div className="flex justify-end mt-6">
      <Button type="submit" onClick={onClick} disabled={isLoading} className="bg-pink-500 hover:bg-pink-400 text-white shadow-md px-8">
        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4 mr-2" />保存する</>}
      </Button>
    </div>
  );

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
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-50 shadow-inner bg-gray-100 relative group">
                  {formData.profileImagePreview ? <img src={formData.profileImagePreview} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><User className="w-12 h-12" /></div>}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">画像を変更</Button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">姓</label><Input value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">名</label><Input value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                  <select value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">選択してください</option><option value="女性">女性</option><option value="男性">男性</option><option value="その他">その他</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">居住地</label>
                  <select value={formData.prefecture} onChange={(e) => handleChange("prefecture", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">選択してください</option>{PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
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
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">ユーザーネーム</label><Input placeholder="@example_user" value={formData.instagramUserName} onChange={(e) => handleChange("instagramUserName", e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">フォロワー数</label><Input type="number" placeholder="1200" value={formData.instagramFollowers} onChange={(e) => handleChange("instagramFollowers", e.target.value)} /></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-gray-800">TikTok</h3>
                <div className="flex items-center gap-2"><Checkbox id="tiktok-toggle" checked={formData.tiktokEnabled} onCheckedChange={(c) => handleChange("tiktokEnabled", c)} /><label htmlFor="tiktok-toggle" className="text-sm text-gray-600 cursor-pointer">TikTokアカウントを連携</label></div>
              </div>
              {formData.tiktokEnabled && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">ユーザーネーム</label><Input placeholder="@tiktok_user" value={formData.tiktokUserName} onChange={(e) => handleChange("tiktokUserName", e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">フォロワー数</label><Input type="number" value={formData.tiktokFollowers} onChange={(e) => handleChange("tiktokFollowers", e.target.value)} /></div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="flex items-center gap-2 font-bold text-gray-800"><Youtube className="w-5 h-5 text-red-600" /> YouTube</h3>
                <div className="flex items-center gap-2"><Checkbox id="youtube-toggle" checked={formData.youtubeEnabled} onCheckedChange={(c) => handleChange("youtubeEnabled", c)} /><label htmlFor="youtube-toggle" className="text-sm text-gray-600 cursor-pointer">YouTubeチャンネルを連携</label></div>
              </div>
              {formData.youtubeEnabled && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">チャンネルURL</label><Input placeholder="https://youtube.com/channel/..." value={formData.youtubeUrl} onChange={(e) => handleChange("youtubeUrl", e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">登録者数</label><Input type="number" value={formData.youtubeFollowers} onChange={(e) => handleChange("youtubeFollowers", e.target.value)} /></div>
                </div>
              )}
            </div>
            <SaveButton />
          </form>
        )}

        {activeTab === "activity" && (
          <form onSubmit={handleSaveActivity} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-3">得意なカテゴリ <span className="text-xs text-gray-500">(複数選択可)</span></label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 transition-colors">
                    <Checkbox id={`cat-${cat}`} checked={formData.categories.includes(cat)} onCheckedChange={() => handleCategoryToggle(cat)} />
                    <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer w-full">{cat}</label>
                  </div>
                ))}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">自己紹介 <span className="text-xs text-gray-400">({formData.bio.length}/500文字)</span></label>
              <Textarea value={formData.bio} onChange={(e) => { if (e.target.value.length <= 500) handleChange("bio", e.target.value); }} placeholder="PR案件に対する意気込みや、得意な投稿スタイルなどを記載してください。" />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">ポートフォリオURL <span className="text-xs text-gray-400">(任意)</span></label><Input placeholder="https://..." value={formData.portfolioUrl} onChange={(e) => handleChange("portfolioUrl", e.target.value)} /></div>
            <SaveButton />
          </form>
        )}

        {activeTab === "account" && (
          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Mail className="w-4 h-4" /> メールアドレス変更</h3>
              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">現在のメールアドレス</label><Input value={formData.email} disabled className="bg-gray-100 text-gray-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">新しいメールアドレス</label><Input type="email" value={formData.newEmail} onChange={(e) => handleChange("newEmail", e.target.value)} placeholder="new@example.com" /></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> パスワード変更</h3>
              <div className="space-y-3 max-w-md">
                {(["current", "new", "confirm"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field === "current" ? "現在のパスワード" : field === "new" ? "新しいパスワード" : "パスワード確認"}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword[field] ? "text" : "password"}
                        value={field === "current" ? formData.currentPassword : field === "new" ? formData.newPassword : formData.confirmPassword}
                        onChange={(e) => handleChange(field === "current" ? "currentPassword" : field === "new" ? "newPassword" : "confirmPassword", e.target.value)}
                      />
                      <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword((p) => ({ ...p, [field]: !p[field] }))}>
                        {showPassword[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end"><Button onClick={handleUpdatePassword} variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-50">変更する</Button></div>
            </div>
            <div className="pt-8 mt-8 border-t border-gray-100">
              <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> アカウント削除</h3>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-red-700">一度削除したアカウントは復元できません。すべてのデータが完全に削除されます。</p>
                <Button variant="ghost" onClick={handleDeleteAccount} className="bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors whitespace-nowrap">アカウントを削除</Button>
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
  const { toast } = useToast();
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
      toast({ title: "すべての項目を入力してください", variant: "destructive" });
      return;
    }
    upsertBank.mutate(bankForm, {
      onSuccess: () => { toast({ title: "振込先情報を保存しました" }); setShowBankForm(false); },
      onError: () => toast({ title: "保存に失敗しました", variant: "destructive" }),
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
      {/* Bank Account Section */}
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

      {/* Payment Summary */}
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

      {/* Payment History with Filters */}
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

