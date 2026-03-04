import { useState, useEffect } from "react";
import { Wallet, Search, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Payment {
  id: string;
  application_id: string;
  influencer_user_id: string;
  campaign_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  campaigns?: { id: string; title: string; payment_date: string | null; image_url: string | null; budget_min: number | null; budget_max: number | null } | null;
  influencer_profiles?: { name: string; username: string; image_url: string | null } | null;
}

// Group payments by campaign
interface CampaignGroup {
  campaign: Payment["campaigns"];
  payments: Payment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export default function ClientPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const companyId = sessionStorage.getItem("client_company_id") || "";

  useEffect(() => {
    if (!companyId) return;
    fetchPayments();
  }, [companyId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*, campaigns(id, title, payment_date, image_url, budget_min, budget_max)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = data || [];

      // Fetch influencer names
      const influencerIds = [...new Set(rows.map((p: any) => p.influencer_user_id))];
      let influencerMap: Record<string, { name: string; username: string; image_url: string | null }> = {};
      if (influencerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("influencer_profiles")
          .select("id, name, username, image_url, user_id")
          .or(influencerIds.map(id => `user_id.eq.${id},id.eq.${id}`).join(","));
        if (profiles) {
          profiles.forEach(p => {
            if (p.user_id) influencerMap[p.user_id] = { name: p.name, username: p.username, image_url: p.image_url };
            influencerMap[p.id] = { name: p.name, username: p.username, image_url: p.image_url };
          });
        }
      }

      const enriched = rows.map((p: any) => ({
        ...p,
        influencer_profiles: influencerMap[p.influencer_user_id] || null,
      }));
      setPayments(enriched);
    } catch (e) {
      console.error("Failed to fetch payments:", e);
    }
    setLoading(false);
  };

  const filtered = payments.filter(p => {
    const matchesFilter = !filter || 
      (p.campaigns?.title || "").toLowerCase().includes(filter.toLowerCase()) ||
      (p.influencer_profiles?.name || "").toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesFilter && matchesStatus;
  });

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);
  const paidAmount = filtered.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = filtered.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  // Group by campaign
  const campaignGroups: CampaignGroup[] = [];
  const groupMap = new Map<string, CampaignGroup>();
  filtered.forEach(p => {
    const cid = p.campaign_id;
    if (!groupMap.has(cid)) {
      groupMap.set(cid, {
        campaign: p.campaigns,
        payments: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      });
    }
    const g = groupMap.get(cid)!;
    g.payments.push(p);
    g.totalAmount += p.amount;
    if (p.status === "paid") g.paidAmount += p.amount;
    if (p.status === "pending") g.pendingAmount += p.amount;
  });
  groupMap.forEach(g => campaignGroups.push(g));

  const isDeadlineNear = (paymentDate: string | null) => {
    if (!paymentDate) return false;
    const diff = new Date(paymentDate).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const isOverdue = (paymentDate: string | null) => {
    if (!paymentDate) return false;
    return new Date(paymentDate).getTime() < Date.now();
  };

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">振込管理</h1>
        <p className="text-gray-500 mt-1">案件別の振込一覧・アサイン済みインフルエンサーの詳細を確認できます</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">合計金額</p>
          <p className="text-2xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">振込済み</p>
          <p className="text-2xl font-bold text-green-600">¥{paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">振込待ち</p>
          <p className="text-2xl font-bold text-orange-600">¥{pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-500" />案件別振込一覧
        </h3>
        <div className="flex gap-3 flex-wrap items-center mb-4">
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="案件名・インフルエンサー名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">すべて</option>
            <option value="pending">振込待ち</option>
            <option value="paid">振込済み</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => { setFilter(""); setStatusFilter("all"); }} className="text-gray-500">クリア</Button>
        </div>

        {campaignGroups.length > 0 ? (
          <div className="space-y-4">
            {campaignGroups.map(group => {
              const cid = group.campaign?.id || "unknown";
              const isExpanded = expandedCampaign === cid;
              const deadlineNear = isDeadlineNear(group.campaign?.payment_date ?? null);
              const overdue = isOverdue(group.campaign?.payment_date ?? null);
              const hasPending = group.pendingAmount > 0;

              return (
                <div key={cid} className={`rounded-xl border overflow-hidden ${
                  overdue && hasPending ? "border-red-200" : deadlineNear && hasPending ? "border-yellow-200" : "border-gray-200"
                }`}>
                  {/* Campaign Header */}
                  <button
                    onClick={() => setExpandedCampaign(isExpanded ? null : cid)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                      overdue && hasPending ? "bg-red-50 hover:bg-red-100" : deadlineNear && hasPending ? "bg-yellow-50 hover:bg-yellow-100" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {group.campaign?.image_url ? (
                        <img src={group.campaign.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                          <Wallet className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{group.campaign?.title || "不明な案件"}</p>
                          {overdue && hasPending && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                          {deadlineNear && !overdue && hasPending && <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{group.payments.length}名のインフルエンサー</span>
                          {group.campaign?.payment_date && (
                            <span className={overdue && hasPending ? "text-red-600 font-medium" : deadlineNear && hasPending ? "text-yellow-600 font-medium" : ""}>
                              振込期日: {new Date(group.campaign.payment_date).toLocaleDateString("ja-JP")}
                              {overdue && hasPending && " （期限超過）"}
                              {deadlineNear && !overdue && hasPending && " （間もなく）"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">¥{group.totalAmount.toLocaleString()}</p>
                        <div className="flex gap-2 text-xs">
                          {group.paidAmount > 0 && <span className="text-green-600">済 ¥{group.paidAmount.toLocaleString()}</span>}
                          {group.pendingAmount > 0 && <span className="text-orange-600">待 ¥{group.pendingAmount.toLocaleString()}</span>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {/* Expanded: Individual payments */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {group.payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-white">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img 
                              src={p.influencer_profiles?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.influencer_profiles?.name || "?")}&background=random`}
                              alt="" 
                              className="w-9 h-9 rounded-full shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900">{p.influencer_profiles?.name || "不明"}</p>
                              <p className="text-xs text-gray-400">@{p.influencer_profiles?.username || "-"} · {new Date(p.created_at).toLocaleDateString("ja-JP")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge className={p.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                              {p.status === "paid" ? "振込済" : "振込待ち"}
                            </Badge>
                            <span className="font-bold text-gray-900 min-w-[80px] text-right">¥{p.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-500 mr-2">合計:</span>
              <span className="font-bold text-lg text-blue-600">¥{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">振込データはまだありません</div>
        )}
      </div>
    </div>
  );
}
