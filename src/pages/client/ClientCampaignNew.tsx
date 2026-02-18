import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useCreateCampaign } from "@/hooks/useExternalCampaigns";
import { CATEGORIES, PLATFORMS } from "@/lib/constants";
import { toast } from "sonner";

export default function ClientCampaignNew() {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const [form, setForm] = useState({
    title: "", description: "", category: "スキンケア", budgetMin: "", budgetMax: "",
    maxApplicants: "", deadline: "", paymentDate: "", requirements: "", platforms: [] as string[], deliverables: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign.mutate({
      title: form.title, description: form.description, company_id: companyId, category: form.category,
      budget_min: Number(form.budgetMin), budget_max: Number(form.budgetMax || form.budgetMin),
      deadline: form.deadline, requirements: form.requirements, platform: form.platforms.join(","), status: "recruiting",
    }, {
      onSuccess: () => { toast.success("案件を作成しました"); navigate("/client/campaigns"); },
      onError: () => toast.error("案件の作成に失敗しました"),
    });
  };

  const togglePlatform = (p: string) => {
    setForm(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">新規案件作成</h1>
          <p className="text-gray-500 mt-1">案件の詳細を入力してください。</p>
        </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">募集人数</label>
              <Input type="number" value={form.maxApplicants} onChange={e => setForm({ ...form, maxApplicants: e.target.value })} placeholder="10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">報酬額（最小・円）</label>
              <Input type="number" value={form.budgetMin} onChange={e => setForm({ ...form, budgetMin: e.target.value })} placeholder="30000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">報酬額（最大・円）</label>
              <Input type="number" value={form.budgetMax} onChange={e => setForm({ ...form, budgetMax: e.target.value })} placeholder="100000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">応募締切</label>
              <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">振込予定日</label>
              <Input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.platforms.includes(p) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">応募条件</label>
            <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="改行区切りで記入" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">成果物</label>
            <textarea value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="フィード投稿1本、ストーリーズ3本 など" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>キャンセル</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? "作成中..." : "案件を作成"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
