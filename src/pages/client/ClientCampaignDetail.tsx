import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Trash2, Users, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { CampaignImageGallery } from "@/components/campaign/CampaignImageGallery";
import { useExternalCampaigns, useUpdateCampaign, useDeleteCampaign } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { CATEGORIES, PLATFORMS, CAMPAIGN_STATUSES, APPLICATION_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ApplicationProgressTimeline } from "@/components/ApplicationProgressTimeline";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ClientCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: campaigns = [] } = useExternalCampaigns(companyId);
  const { data: applications = [] } = useExternalApplications({ companyId });
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const campaign = campaigns.find(c => c.id === id);
  const campaignApps = useMemo(() => applications.filter(a => a.campaign_id === id), [applications, id]);

  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    if (campaign && !editForm) {
      setEditForm({
        title: campaign.title, description: campaign.description || "", category: campaign.category || "",
        budgetMin: String(campaign.budget_min || ""), budgetMax: String(campaign.budget_max || ""),
        maxApplicants: String((campaign as any).max_applicants || ""),
        deadline: campaign.deadline ? campaign.deadline.slice(0, 10) : "",
        paymentDate: (campaign as any).payment_date ? (campaign as any).payment_date.slice(0, 10) : "",
        requirements: campaign.requirements || "", platforms: campaign.platform ? campaign.platform.split(",").filter(Boolean) : [],
        deliverables: (campaign as any).deliverables || "", status: campaign.status || "recruiting",
      });
    }
  }, [campaign]);

  const appStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    campaignApps.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => {
      const s = APPLICATION_STATUSES.find(x => x.id === status);
      return { name: s?.label || status, value: count };
    });
  }, [campaignApps]);

  const handleSave = () => {
    if (!campaign || !editForm) return;
    updateCampaign.mutate({
      id: campaign.id,
      updates: {
        title: editForm.title, description: editForm.description, category: editForm.category,
        budget_min: Number(editForm.budgetMin) || 0, budget_max: Number(editForm.budgetMax) || 0,
        deadline: editForm.deadline || null, requirements: editForm.requirements,
        platform: editForm.platforms.join(","), status: editForm.status,
      } as any,
    }, {
      onSuccess: () => toast.success("案件を更新しました"),
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  const handleDelete = () => {
    if (!campaign || !window.confirm(`「${campaign.title}」を削除しますか？`)) return;
    deleteCampaign.mutate(campaign.id, {
      onSuccess: () => { toast.success("削除しました"); navigate("/client/campaigns"); },
      onError: () => toast.error("削除に失敗しました"),
    });
  };

  const togglePlatform = (p: string) => {
    if (!editForm) return;
    setEditForm((prev: any) => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter((x: string) => x !== p) : [...prev.platforms, p] }));
  };

  if (!campaign) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>案件が見つかりません</p>
        <Button variant="ghost" onClick={() => navigate("/client/campaigns")} className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />一覧に戻る</Button>
      </div>
    );
  }

  if (!editForm) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  const st = CAMPAIGN_STATUSES.find(s => s.id === campaign.status);
  const isOverdue = campaign.deadline && new Date(campaign.deadline) < new Date() && campaign.status === "recruiting";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/client/campaigns")} className="text-gray-500">
        <ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る
      </Button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
            {campaign.image_url ? <img src={campaign.image_url} alt="" className="w-20 h-20 rounded-2xl object-cover" /> : <ImageIcon className="w-10 h-10 text-gray-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
              <Badge className={st?.color || ""}>{st?.label || campaign.status}</Badge>
              {isOverdue && <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />締切超過</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              {campaign.category && <span>{campaign.category}</span>}
              {campaign.platform && <span>{campaign.platform}</span>}
              <span>作成日: {new Date(campaign.created_at).toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="text-red-600 border-red-200" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-1" />削除</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={updateCampaign.isPending}>
              <Save className="w-4 h-4 mr-2" />保存
            </Button>
          </div>
        </div>
      </div>

      {/* KPI + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "応募数", val: campaignApps.length, color: "text-blue-600" },
            { label: "採用数", val: campaignApps.filter(a => !["applied", "reviewing", "rejected"].includes(a.status)).length, color: "text-green-600" },
            { label: "報酬範囲", val: `¥${(campaign.budget_min || 0).toLocaleString()}〜`, color: "text-gray-900" },
            { label: "募集人数", val: (campaign as any).max_applicants || "制限なし", color: "text-purple-600" },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-3">応募ステータス分布</h3>
          {appStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={appStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {appStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-gray-400">応募データなし</p>}
        </div>
      </div>

      {/* Images */}
      {(campaign.image_urls?.length > 0 || campaign.image_url) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3">案件画像</h3>
          <CampaignImageGallery imageUrls={campaign.image_urls?.length > 0 ? campaign.image_urls : [campaign.image_url]} title={campaign.title} />
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-bold text-gray-800">案件情報の編集</h3>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
          <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
          <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {CAMPAIGN_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬（最小）</label>
            <Input type="number" value={editForm.budgetMin} onChange={e => setEditForm({ ...editForm, budgetMin: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬（最大）</label>
            <Input type="number" value={editForm.budgetMax} onChange={e => setEditForm({ ...editForm, budgetMax: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">応募締切</label>
            <Input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">振込予定日</label>
            <Input type="date" value={editForm.paymentDate} onChange={e => setEditForm({ ...editForm, paymentDate: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">プラットフォーム</label>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map(p => (
              <button key={p} type="button" onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${editForm.platforms.includes(p) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>
                {p}
              </button>
            ))}
          </div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">応募条件</label>
          <textarea value={editForm.requirements} onChange={e => setEditForm({ ...editForm, requirements: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[60px]" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">成果物</label>
          <textarea value={editForm.deliverables} onChange={e => setEditForm({ ...editForm, deliverables: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[60px]" /></div>
        <div className="flex justify-end"><Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={updateCampaign.isPending}><Save className="w-4 h-4 mr-2" />保存</Button></div>
      </div>

      {/* Applications with progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5" />応募者一覧 ({campaignApps.length}件)</h3>
        {campaignApps.length > 0 ? (
          <div className="space-y-4">
            {campaignApps.map(a => (
              <Link key={a.id} to={`/client/applicants/${a.id}`} className="block hover:ring-2 hover:ring-blue-200 rounded-2xl transition-all">
                <ApplicationProgressTimeline
                  status={a.status}
                  appliedAt={a.applied_at}
                  updatedAt={a.updated_at}
                  influencer={a.influencer_profiles ? { name: a.influencer_profiles.name, username: a.influencer_profiles.username, image_url: a.influencer_profiles.image_url } : null}
                  campaign={{ title: campaign.title, deadline: campaign.deadline, payment_date: (campaign as any).payment_date, companies: undefined }}
                  compact
                />
              </Link>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-8">応募なし</p>}
      </div>
    </div>
  );
}
