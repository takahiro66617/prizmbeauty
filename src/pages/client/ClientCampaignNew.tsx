import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["スキンケア", "メイク", "ヘアケア", "ボディケア", "ネイル", "フレグランス", "ダイエット", "ファッション", "ライフスタイル"];

export default function ClientCampaignNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "スキンケア", budget_min: "", budget_max: "",
    deadline: "", requirements: "", platform: "", status: "recruiting",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: company } = await supabase.from("companies").select("id").eq("user_id", session.user.id).maybeSingle();
    if (!company) { toast({ title: "企業情報が見つかりません", variant: "destructive" }); setLoading(false); return; }

    const { error } = await supabase.from("campaigns").insert({
      company_id: company.id,
      title: form.title,
      description: form.description,
      category: form.category,
      budget_min: form.budget_min ? parseInt(form.budget_min) : 0,
      budget_max: form.budget_max ? parseInt(form.budget_max) : 0,
      deadline: form.deadline || null,
      requirements: form.requirements,
      platform: form.platform,
      status: form.status,
    });

    if (error) {
      toast({ title: "案件の作成に失敗しました", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "案件を作成しました" });
      navigate("/client/campaigns");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-gray-800">新規案件作成</h1><p className="text-gray-500 mt-1">案件の詳細を入力してください。</p></div>
      </div>

      <Card className="p-8 border-0 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">案件タイトル</label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：新作スキンケアラインのPR投稿" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">案件説明</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" required placeholder="案件の詳細を記入してください" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択してください</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">最低予算（円）</label><Input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} placeholder="30000" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">最高予算（円）</label><Input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} placeholder="100000" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">応募締切</label>
            <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">応募条件</label>
            <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="改行区切りで記入" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="draft">下書き</option>
              <option value="recruiting">募集中（すぐに公開）</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>キャンセル</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? "作成中..." : "案件を作成"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
