import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Trash2, AlertTriangle, Users, Image as ImageIcon } from "lucide-react";
import { CampaignImageGallery } from "@/components/campaign/CampaignImageGallery";
import { useAdminCampaigns, useAdminUpdateCampaign, useAdminDeleteCampaign, useAdminApplications } from "@/hooks/useAdminData";
import { CATEGORIES, PLATFORMS, CAMPAIGN_STATUSES, APPLICATION_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ApplicationProgressTimeline } from "@/components/ApplicationProgressTimeline";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

export default function AdminCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaigns = [] } = useAdminCampaigns();
  const { data: applications = [] } = useAdminApplications();
  const updateCampaign = useAdminUpdateCampaign();
  const deleteCampaign = useAdminDeleteCampaign();

  const campaign = campaigns.find((c: any) => c.id === id);
  const campaignApps = useMemo(() => applications.filter((a: any) => a.campaign_id === id), [applications, id]);

  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    if (campaign && !editForm) {
      setEditForm({
        title: campaign.title, description: campaign.description || "", category: campaign.category || "",
        budget_min: campaign.budget_min || 0, budget_max: campaign.budget_max || 0,
        max_applicants: campaign.max_applicants || 0,
        deadline: campaign.deadline ? campaign.deadline.split("T")[0] : "",
        payment_date: campaign.payment_date ? campaign.payment_date.split("T")[0] : "",
        requirements: campaign.requirements || "", platform: campaign.platform || "",
        status: campaign.status, deliverables: campaign.deliverables || "",
      });
    }
  }, [campaign]);

  // Chart data
  const appStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    campaignApps.forEach((a: any) => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => {
      const s = APPLICATION_STATUSES.find(x => x.id === status);
      return { name: s?.label || status, value: count };
    });
  }, [campaignApps]);

  const handleSave = () => {
    if (!campaign || !editForm) return;
    updateCampaign.mutate({ id: campaign.id, updates: editForm }, {
      onSuccess: () => toast.success("保存しました"),
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  const handleDelete = () => {
    if (!campaign || !window.confirm("この案件を削除しますか？")) return;
    deleteCampaign.mutate(campaign.id, {
      onSuccess: () => { toast.success("削除しました"); navigate("/admin/campaigns"); },
      onError: () => toast.error("削除に失敗しました"),
    });
  };

  if (!campaign) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>案件が見つかりません</p>
        <Button variant="ghost" onClick={() => navigate("/admin/campaigns")} className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />一覧に戻る</Button>
      </div>
    );
  }

  if (!editForm) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  const st = CAMPAIGN_STATUSES.find(s => s.id === campaign.status);
  const isOverdue = campaign.deadline && new Date(campaign.deadline) < new Date() && campaign.status === "recruiting";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/campaigns")} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る
        </Button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
            {campaign.image_url ? (
              <img src={campaign.image_url} alt="" className="w-24 h-24 rounded-2xl object-cover" />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
              <Badge className={st?.color || ""}>{st?.label || campaign.status}</Badge>
              {isOverdue && <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />締切超過</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span>企業: {campaign.companies?.name || "-"}</span>
              {campaign.category && <span>カテゴリ: {campaign.category}</span>}
              {campaign.platform && <span>プラットフォーム: {campaign.platform}</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">作成日: {new Date(campaign.created_at).toLocaleDateString("ja-JP")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="text-red-600 border-red-200" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-1" />削除</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={updateCampaign.isPending}>
              <Save className="w-4 h-4 mr-2" />保存
            </Button>
          </div>
        </div>
      </div>

      {/* KPI + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="grid grid-cols-2 gap-3 lg:col-span-1">
          {[
            { label: "応募数", val: campaignApps.length, color: "text-blue-600" },
            { label: "採用数", val: campaignApps.filter((a: any) => !["applied", "reviewing", "rejected"].includes(a.status)).length, color: "text-green-600" },
            { label: "報酬", val: `¥${(campaign.budget_min || 0).toLocaleString()}〜¥${(campaign.budget_max || 0).toLocaleString()}`, color: "text-gray-900" },
            { label: "募集人数", val: campaign.max_applicants || "制限なし", color: "text-purple-600" },
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
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={appStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {appStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-gray-400">応募データなし</p>}
        </div>
      </div>

      {/* Images */}
      {(campaign.image_urls?.length > 0 || campaign.image_url) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3">案件画像</h3>
          <CampaignImageGallery
            imageUrls={campaign.image_urls?.length > 0 ? campaign.image_urls : [campaign.image_url]}
            title={campaign.title}
          />
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-bold text-gray-800">案件情報の編集</h3>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
          <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
          <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[100px]" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">未選択</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">プラットフォーム</label>
            <select value={editForm.platform} onChange={e => setEditForm({ ...editForm, platform: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">未選択</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬 (最小)</label>
            <Input type="number" value={editForm.budget_min} onChange={e => setEditForm({ ...editForm, budget_min: Number(e.target.value) })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬 (最大)</label>
            <Input type="number" value={editForm.budget_max} onChange={e => setEditForm({ ...editForm, budget_max: Number(e.target.value) })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">募集人数</label>
          <Input type="number" value={editForm.max_applicants} onChange={e => setEditForm({ ...editForm, max_applicants: Number(e.target.value) })} placeholder="0 = 制限なし" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">応募締切日</label>
            <Input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">振込予定日</label>
            <Input type="date" value={editForm.payment_date} onChange={e => setEditForm({ ...editForm, payment_date: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
          <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            {CAMPAIGN_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">応募条件</label>
          <textarea value={editForm.requirements} onChange={e => setEditForm({ ...editForm, requirements: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">納品物・依頼内容</label>
          <textarea value={editForm.deliverables} onChange={e => setEditForm({ ...editForm, deliverables: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" /></div>
        <div className="flex justify-end pt-2">
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={updateCampaign.isPending}>
            <Save className="w-4 h-4 mr-2" />保存
          </Button>
        </div>
      </div>

      {/* Applications with progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5" />この案件への応募 ({campaignApps.length}件)</h3>
        {campaignApps.length > 0 ? (
          <div className="space-y-4">
            {campaignApps.map((a: any) => (
              <Link key={a.id} to={`/admin/applications/${a.id}`} className="block hover:ring-2 hover:ring-purple-200 rounded-2xl transition-all">
                <ApplicationProgressTimeline
                  status={a.status}
                  appliedAt={a.applied_at}
                  updatedAt={a.updated_at}
                  influencer={a.influencer_profiles ? { name: a.influencer_profiles.name, username: a.influencer_profiles.username, image_url: a.influencer_profiles.image_url } : null}
                  campaign={{ title: campaign.title, deadline: campaign.deadline, payment_date: campaign.payment_date, companies: campaign.companies }}
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
