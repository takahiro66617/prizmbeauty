import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User, Instagram, Youtube, Save, Camera, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = ["スキンケア", "メイク", "ヘアケア", "ボディケア", "ネイル", "フレグランス"];
type TabType = "basic" | "sns" | "activity" | "account";

export default function MyPageSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", username: "", bio: "", category: "",
    instagram_followers: 0, tiktok_followers: 0, youtube_followers: 0,
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      const { data } = await supabase.from("influencer_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      if (data) {
        setProfile(data);
        setForm({
          name: data.name || "", username: data.username || "", bio: data.bio || "", category: data.category || "",
          instagram_followers: data.instagram_followers || 0, tiktok_followers: data.tiktok_followers || 0, youtube_followers: data.youtube_followers || 0,
        });
      }
    };
    load();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsLoading(true);
    const { error } = await supabase.from("influencer_profiles").update(form).eq("id", profile.id);
    if (error) toast({ title: "保存に失敗しました", variant: "destructive" });
    else toast({ title: "保存しました" });
    setIsLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword.length < 6) { toast({ title: "6文字以上で設定してください", variant: "destructive" }); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast({ title: "パスワードが一致しません", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    if (error) toast({ title: "パスワード変更に失敗しました", variant: "destructive" });
    else { toast({ title: "パスワードを変更しました" }); setPasswordForm({ newPassword: "", confirmPassword: "" }); }
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon?: any }) => (
    <button type="button" onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
      {Icon && <Icon className="w-4 h-4" />}{label}
    </button>
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
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {activeTab === "basic" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">表示名</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            <div className="flex justify-end"><Button type="submit" disabled={isLoading} className="bg-pink-500 hover:bg-pink-400 text-white px-8"><Save className="w-4 h-4 mr-2" />{isLoading ? "保存中..." : "保存する"}</Button></div>
          </form>
        )}

        {activeTab === "sns" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Instagramフォロワー数</label><Input type="number" value={form.instagram_followers} onChange={e => setForm({ ...form, instagram_followers: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">TikTokフォロワー数</label><Input type="number" value={form.tiktok_followers} onChange={e => setForm({ ...form, tiktok_followers: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">YouTubeフォロワー数</label><Input type="number" value={form.youtube_followers} onChange={e => setForm({ ...form, youtube_followers: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex justify-end"><Button type="submit" disabled={isLoading} className="bg-pink-500 hover:bg-pink-400 text-white px-8"><Save className="w-4 h-4 mr-2" />保存する</Button></div>
          </form>
        )}

        {activeTab === "activity" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">選択してください</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
              <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="自己紹介を記入してください" />
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={isLoading} className="bg-pink-500 hover:bg-pink-400 text-white px-8"><Save className="w-4 h-4 mr-2" />保存する</Button></div>
          </form>
        )}

        {activeTab === "account" && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Lock className="w-4 h-4" />パスワード変更</h3>
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                  <div className="relative">
                    <Input type={showPassword.new ? "text" : "password"} value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                    <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}>
                      {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">パスワード確認</label>
                  <div className="relative">
                    <Input type={showPassword.confirm ? "text" : "password"} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                    <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}>
                      {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end"><Button onClick={handleUpdatePassword} variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-50">変更する</Button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
