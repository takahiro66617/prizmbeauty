import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Trash2, KeyRound, Wallet, AlertTriangle, Building2, Calendar } from "lucide-react";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useAdminApplications, useAdminUpdateCompany, useAdminDeleteCompany } from "@/hooks/useAdminData";
import { COMPANY_STATUSES, INDUSTRIES, CAMPAIGN_STATUSES, APPLICATION_STATUSES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#6b7280"];

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: companies = [], refetch } = useExternalCompanies();
  const { data: campaigns = [] } = useExternalCampaigns();
  const { data: applications = [] } = useAdminApplications();
  const updateCompany = useAdminUpdateCompany();
  const deleteCompany = useAdminDeleteCompany();

  const company = companies.find(c => c.id === id);
  const companyCampaigns = useMemo(() => campaigns.filter(c => c.company_id === id), [campaigns, id]);
  const companyApps = useMemo(() => applications.filter(a => a.company_id === id), [applications, id]);

  const [editForm, setEditForm] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [companyPayments, setCompanyPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Init form
  useEffect(() => {
    if (company && !editForm) {
      setEditForm({
        name: company.name, contact_name: company.contact_name || "", contact_email: company.contact_email || "",
        phone: company.phone || "", industry: company.industry || "", website: company.website || "",
        description: company.description || "", status: company.status,
      });
      // Fetch auth email and payments
      if (company.user_id) {
        supabase.functions.invoke("admin-get-user-email", { body: { userId: company.user_id } })
          .then(({ data }) => { if (data?.email) setAuthEmail(data.email); }).catch(() => {});
      }
      fetchPayments(company.id);
    }
  }, [company]);

  const fetchPayments = async (companyId: string) => {
    setPaymentsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-data", {
        body: { action: "get_payments", companyId },
      });
      if (error) throw error;
      setCompanyPayments(data?.data || []);
    } catch { setCompanyPayments([]); }
    setPaymentsLoading(false);
  };

  // Chart data
  const campaignStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    companyCampaigns.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => {
      const s = CAMPAIGN_STATUSES.find(x => x.id === status);
      return { name: s?.label || status, value: count };
    });
  }, [companyCampaigns]);

  const appStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    companyApps.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => {
      const s = APPLICATION_STATUSES.find(x => x.id === status);
      return { name: s?.label || status, value: count };
    });
  }, [companyApps]);

  const paymentSummary = useMemo(() => {
    const total = companyPayments.reduce((s, p) => s + p.amount, 0);
    const paid = companyPayments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pending = companyPayments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    return { total, paid, pending };
  }, [companyPayments]);

  const isOverdue = (d: string | null) => d ? new Date(d).getTime() < Date.now() : false;
  const isNear = (d: string | null) => {
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const handleSave = () => {
    if (!company || !editForm) return;
    updateCompany.mutate({ id: company.id, updates: editForm }, {
      onSuccess: () => { toast.success("保存しました"); refetch(); },
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  const handleDelete = () => {
    if (!company || !window.confirm("この企業を削除しますか？")) return;
    deleteCompany.mutate(company.id, {
      onSuccess: () => { toast.success("削除しました"); navigate("/admin/clients"); },
      onError: () => toast.error("削除に失敗しました"),
    });
  };

  if (!company) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>企業が見つかりません</p>
        <Button variant="ghost" onClick={() => navigate("/admin/clients")} className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />一覧に戻る</Button>
      </div>
    );
  }

  if (!editForm) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  const st = COMPANY_STATUSES.find(s => s.id === company.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る
        </Button>
      </div>

      {/* Company Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm shrink-0">
            {company.logo_url ? (
              <img src={company.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <Building2 className="w-10 h-10 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <Badge className={st?.color || ""}>{st?.label || company.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              {company.contact_name && <span>担当: {company.contact_name}</span>}
              {company.industry && <span>業種: {company.industry}</span>}
              {company.contact_email && <span>{company.contact_email}</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">登録日: {new Date(company.created_at).toLocaleDateString("ja-JP")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="text-red-600 border-red-200" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-1" />削除</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={updateCompany.isPending}>
              <Save className="w-4 h-4 mr-2" />保存
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">案件数</p>
          <p className="text-2xl font-bold text-purple-600">{companyCampaigns.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">応募数</p>
          <p className="text-2xl font-bold text-blue-600">{companyApps.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">振込合計</p>
          <p className="text-2xl font-bold text-gray-900">¥{paymentSummary.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">振込済</p>
          <p className="text-2xl font-bold text-green-600">¥{paymentSummary.paid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">振込待ち</p>
          <p className="text-2xl font-bold text-orange-600">¥{paymentSummary.pending.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">案件ステータス分布</h3>
          {campaignStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={campaignStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={3}>
                  {campaignStatusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-gray-400">案件データなし</p>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">応募ステータス分布 ({companyApps.length}件)</h3>
          {appStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appStatusData} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-gray-400">応募データなし</p>}
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">案件一覧 ({companyCampaigns.length}件)</h3>
        {companyCampaigns.length > 0 ? (
          <div className="space-y-3">
            {companyCampaigns.map(c => {
              const cSt = CAMPAIGN_STATUSES.find(cs => cs.id === c.status);
              const appCount = companyApps.filter(a => a.campaign_id === c.id).length;
              return (
                <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-gray-400" /></div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>{c.category || "未分類"}</span>
                        <span>応募: {appCount}件</span>
                        {c.deadline && <span>締切: {new Date(c.deadline).toLocaleDateString("ja-JP")}</span>}
                        {c.payment_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            振込: {new Date(c.payment_date).toLocaleDateString("ja-JP")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gray-600">¥{(c.budget_min || 0).toLocaleString()}〜¥{(c.budget_max || 0).toLocaleString()}</span>
                    <Badge className={cSt?.color || ""}>{cSt?.label || c.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-8">案件なし</p>}
      </div>

      {/* Assigned Influencers */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">アサイン済みインフルエンサー</h3>
        {companyApps.filter(a => ["approved", "in_progress", "post_submitted", "post_confirmed", "completed"].includes(a.status)).length > 0 ? (
          <div className="space-y-3">
            {companyApps.filter(a => ["approved", "in_progress", "post_submitted", "post_confirmed", "completed"].includes(a.status)).map(a => {
              const appSt = APPLICATION_STATUSES.find(s => s.id === a.status);
              return (
                <div key={a.id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={a.influencer_profiles?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.influencer_profiles?.name || "?")}`} alt="" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{a.influencer_profiles?.name || "-"}</p>
                      <p className="text-xs text-gray-500">@{a.influencer_profiles?.username || "-"} · {a.campaigns?.title || ""}</p>
                    </div>
                  </div>
                  <Badge className={appSt?.color || ""}>{appSt?.label || a.status}</Badge>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-8">アサイン済みのインフルエンサーなし</p>}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" />振込詳細</h3>
        {paymentsLoading ? (
          <p className="text-sm text-gray-400">読み込み中...</p>
        ) : companyPayments.length > 0 ? (
          <div className="space-y-3">
            {companyPayments.map(p => {
              const overdue = p.status === "pending" && isOverdue(p.campaigns?.payment_date ?? null);
              const near = p.status === "pending" && isNear(p.campaigns?.payment_date ?? null);
              return (
                <div key={p.id} className={`p-4 rounded-xl border ${overdue ? "bg-red-50 border-red-200" : near ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.campaigns?.image_url ? (
                        <img src={p.campaigns.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0"><Wallet className="w-4 h-4 text-gray-400" /></div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{p.campaigns?.title || "不明"}</p>
                          {overdue && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                          {near && !overdue && <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.influencer_profiles?.image_url && <img src={p.influencer_profiles.image_url} alt="" className="w-5 h-5 rounded-full" />}
                          <p className="text-xs text-gray-500">{p.influencer_profiles?.name || "不明"}</p>
                          {p.campaigns?.payment_date && (
                            <span className={`text-xs ${overdue ? "text-red-600 font-medium" : near ? "text-yellow-600 font-medium" : "text-gray-400"}`}>
                              · 期日: {new Date(p.campaigns.payment_date).toLocaleDateString("ja-JP")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={p.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {p.status === "paid" ? "振込済" : "振込待ち"}
                      </Badge>
                      <span className="font-bold text-gray-900">¥{p.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  {p.bank_account ? (
                    <div className="mt-2 p-2 bg-white rounded-md border border-gray-100 text-xs text-gray-600">
                      <span className="font-medium">振込先:</span> {p.bank_account.bank_name} {p.bank_account.branch_name} ({p.bank_account.account_type === "ordinary" ? "普通" : p.bank_account.account_type}) {p.bank_account.account_number} {p.bank_account.account_holder}
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-100 text-xs text-red-600">⚠ 振込先口座が未登録です</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-8">振込データなし</p>}
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">企業情報編集</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">企業名</label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">業種</label>
              <select value={editForm.industry} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">未選択</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label><Input value={editForm.contact_name} onChange={e => setEditForm({ ...editForm, contact_name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label><Input value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
              <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/[^\d\-+()]/g, "") })} placeholder="03-1234-5678" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Webサイト</label><Input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">概要</label>
            <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
            <div className="flex gap-2">
              {COMPANY_STATUSES.map(s => (
                <Button key={s.id} size="sm" variant={editForm.status === s.id ? "default" : "outline"}
                  onClick={() => setEditForm({ ...editForm, status: s.id })} className={editForm.status === s.id ? "bg-purple-600" : ""}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Auth */}
          {company.user_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2"><KeyRound className="w-4 h-4" />ログイン情報</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">メールアドレス</label>
                  <Input value={authEmail} onChange={e => setAuthEmail(e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">新しいパスワード</label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="変更する場合のみ" /></div>
              </div>
              <Button size="sm" variant="outline" className="text-amber-700 border-amber-300" disabled={authLoading}
                onClick={async () => {
                  if (!authEmail && !newPassword) return;
                  setAuthLoading(true);
                  try {
                    const { data, error } = await supabase.functions.invoke("admin-update-user-auth", {
                      body: { userId: company.user_id, email: authEmail || undefined, password: newPassword || undefined },
                    });
                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    toast.success("ログイン情報を更新しました");
                    setNewPassword("");
                  } catch (e: any) {
                    toast.error("更新に失敗: " + (e.message || ""));
                  } finally { setAuthLoading(false); }
                }}>
                <KeyRound className="w-3 h-3 mr-1" />ログイン情報を更新
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/admin/clients")}>キャンセル</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={updateCompany.isPending}>
              <Save className="w-4 h-4 mr-2" />保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
