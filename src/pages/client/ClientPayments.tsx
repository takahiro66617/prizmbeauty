import { useState, useEffect, useMemo } from "react";
import { Wallet, Search, AlertTriangle, ChevronDown, ChevronUp, Calendar, Filter } from "lucide-react";
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

interface CampaignGroup {
  campaignId: string;
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
  const [deadlineFilter, setDeadlineFilter] = useState("all"); // all, overdue, near, future, unset
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [sortBy, setSortBy] = useState("pending_first"); // pending_first, deadline_asc, deadline_desc, amount_desc, amount_asc, date_desc
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const isDeadlineNear = (paymentDate: string | null) => {
    if (!paymentDate) return false;
    const diff = new Date(paymentDate).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const isOverdue = (paymentDate: string | null) => {
    if (!paymentDate) return false;
    return new Date(paymentDate).getTime() < Date.now();
  };

  // Unique campaign names for filter dropdown
  const campaignOptions = useMemo(() => {
    const map = new Map<string, string>();
    payments.forEach(p => {
      if (p.campaigns?.id && p.campaigns?.title) {
        map.set(p.campaigns.id, p.campaigns.title);
      }
    });
    return Array.from(map.entries());
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = !filter ||
        (p.campaigns?.title || "").toLowerCase().includes(filter.toLowerCase()) ||
        (p.influencer_profiles?.name || "").toLowerCase().includes(filter.toLowerCase()) ||
        (p.influencer_profiles?.username || "").toLowerCase().includes(filter.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesCampaign = campaignFilter === "all" || p.campaign_id === campaignFilter;

      // Deadline filter
      let matchesDeadline = true;
      if (deadlineFilter === "overdue") {
        matchesDeadline = p.status === "pending" && isOverdue(p.campaigns?.payment_date ?? null);
      } else if (deadlineFilter === "near") {
        matchesDeadline = p.status === "pending" && isDeadlineNear(p.campaigns?.payment_date ?? null);
      } else if (deadlineFilter === "future") {
        const pd = p.campaigns?.payment_date;
        matchesDeadline = !!pd && !isOverdue(pd) && !isDeadlineNear(pd);
      } else if (deadlineFilter === "unset") {
        matchesDeadline = !p.campaigns?.payment_date;
      }

      // Date range filter (created_at)
      const matchesDateFrom = !dateFrom || new Date(p.created_at) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(p.created_at) <= new Date(dateTo + "T23:59:59");

      // Amount range filter
      const matchesAmountMin = !amountMin || p.amount >= Number(amountMin);
      const matchesAmountMax = !amountMax || p.amount <= Number(amountMax);

      return matchesSearch && matchesStatus && matchesCampaign && matchesDeadline && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    });
  }, [payments, filter, statusFilter, campaignFilter, deadlineFilter, dateFrom, dateTo, amountMin, amountMax]);

  // Sort filtered payments
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "pending_first":
        arr.sort((a, b) => {
          // pending before paid
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          // within same status, sort by deadline ascending (nearest first)
          const da = a.campaigns?.payment_date ? new Date(a.campaigns.payment_date).getTime() : Infinity;
          const db = b.campaigns?.payment_date ? new Date(b.campaigns.payment_date).getTime() : Infinity;
          return da - db;
        });
        break;
      case "deadline_asc":
        arr.sort((a, b) => {
          const da = a.campaigns?.payment_date ? new Date(a.campaigns.payment_date).getTime() : Infinity;
          const db = b.campaigns?.payment_date ? new Date(b.campaigns.payment_date).getTime() : Infinity;
          return da - db;
        });
        break;
      case "deadline_desc":
        arr.sort((a, b) => {
          const da = a.campaigns?.payment_date ? new Date(a.campaigns.payment_date).getTime() : 0;
          const db = b.campaigns?.payment_date ? new Date(b.campaigns.payment_date).getTime() : 0;
          return db - da;
        });
        break;
      case "amount_desc":
        arr.sort((a, b) => b.amount - a.amount);
        break;
      case "amount_asc":
        arr.sort((a, b) => a.amount - b.amount);
        break;
      case "date_desc":
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);
  const paidAmount = filtered.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = filtered.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const overdueCount = filtered.filter(p => p.status === "pending" && isOverdue(p.campaigns?.payment_date ?? null)).length;
  const nearCount = filtered.filter(p => p.status === "pending" && isDeadlineNear(p.campaigns?.payment_date ?? null)).length;

  // Group sorted payments by campaign
  const campaignGroups = useMemo(() => {
    const groups: CampaignGroup[] = [];
    const groupMap = new Map<string, CampaignGroup>();
    // Use insertion order from sorted array
    sorted.forEach(p => {
      const cid = p.campaign_id;
      if (!groupMap.has(cid)) {
        const g: CampaignGroup = {
          campaignId: cid,
          campaign: p.campaigns,
          payments: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };
        groupMap.set(cid, g);
        groups.push(g);
      }
      const g = groupMap.get(cid)!;
      g.payments.push(p);
      g.totalAmount += p.amount;
      if (p.status === "paid") g.paidAmount += p.amount;
      if (p.status === "pending") g.pendingAmount += p.amount;
    });

    // Sort groups: pending-first groups come first
    if (sortBy === "pending_first") {
      groups.sort((a, b) => {
        if (a.pendingAmount > 0 && b.pendingAmount === 0) return -1;
        if (a.pendingAmount === 0 && b.pendingAmount > 0) return 1;
        const da = a.campaign?.payment_date ? new Date(a.campaign.payment_date).getTime() : Infinity;
        const db = b.campaign?.payment_date ? new Date(b.campaign.payment_date).getTime() : Infinity;
        return da - db;
      });
    }

    return groups;
  }, [sorted, sortBy]);

  const clearFilters = () => {
    setFilter("");
    setStatusFilter("all");
    setDeadlineFilter("all");
    setCampaignFilter("all");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setSortBy("pending_first");
  };

  const hasActiveFilters = filter || statusFilter !== "all" || deadlineFilter !== "all" || campaignFilter !== "all" || dateFrom || dateTo || amountMin || amountMax;

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">振込管理</h1>
        <p className="text-gray-500 mt-1">案件別の振込一覧・振込期日の管理ができます</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">合計金額</p>
          <p className="text-xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">振込済み</p>
          <p className="text-xl font-bold text-green-600">¥{paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">振込待ち</p>
          <p className="text-xl font-bold text-orange-600">¥{pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setDeadlineFilter(deadlineFilter === "overdue" ? "all" : "overdue")}>
          <p className="text-xs text-gray-500 mb-1">期限超過</p>
          <p className="text-xl font-bold text-red-600">{overdueCount}件</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => setDeadlineFilter(deadlineFilter === "near" ? "all" : "near")}>
          <p className="text-xs text-gray-500 mb-1">期限間近</p>
          <p className="text-xl font-bold text-yellow-600">{nearCount}件</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-500" />案件別振込一覧
          <span className="text-sm font-normal text-gray-400 ml-2">{filtered.length}件</span>
        </h3>

        {/* Primary Filters */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="案件名・IF名・ユーザー名で検索..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">ステータス: すべて</option>
              <option value="pending">振込待ち</option>
              <option value="paid">振込済み</option>
            </select>
            <select value={deadlineFilter} onChange={e => setDeadlineFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">振込期日: すべて</option>
              <option value="overdue">🔴 期限超過</option>
              <option value="near">🟡 3日以内</option>
              <option value="future">🟢 期日あり（余裕）</option>
              <option value="unset">⚪ 期日未設定</option>
            </select>
            <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm max-w-[200px]">
              <option value="all">案件: すべて</option>
              {campaignOptions.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-gray-600">
              <Filter className="w-3 h-3 mr-1" />{showAdvanced ? "閉じる" : "詳細フィルター"}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="flex gap-3 flex-wrap items-center bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-3 h-3" />
                <span>登録日:</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
                <span>〜</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>金額:</span>
                <input type="number" value={amountMin} onChange={e => setAmountMin(e.target.value)} placeholder="最小" className="w-24 px-2 py-1.5 rounded border border-gray-300 text-sm" />
                <span>〜</span>
                <input type="number" value={amountMax} onChange={e => setAmountMax(e.target.value)} placeholder="最大" className="w-24 px-2 py-1.5 rounded border border-gray-300 text-sm" />
              </div>
            </div>
          )}

          {/* Sort + Clear */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">並び替え:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-2 py-1.5 rounded border border-gray-200 text-xs">
                <option value="pending_first">振込待ち優先</option>
                <option value="deadline_asc">振込期日（近い順）</option>
                <option value="deadline_desc">振込期日（遠い順）</option>
                <option value="amount_desc">金額（高い順）</option>
                <option value="amount_asc">金額（低い順）</option>
                <option value="date_desc">登録日（新しい順）</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 text-xs">フィルターをクリア</Button>
            )}
          </div>
        </div>

        {campaignGroups.length > 0 ? (
          <div className="space-y-4">
            {campaignGroups.map(group => {
              const cid = group.campaignId;
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
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                          <span>{group.payments.length}名</span>
                          {group.campaign?.payment_date ? (
                            <span className={`flex items-center gap-1 ${overdue && hasPending ? "text-red-600 font-medium" : deadlineNear && hasPending ? "text-yellow-600 font-medium" : ""}`}>
                              <Calendar className="w-3 h-3" />
                              振込期日: {new Date(group.campaign.payment_date).toLocaleDateString("ja-JP")}
                              {overdue && hasPending && " （期限超過）"}
                              {deadlineNear && !overdue && hasPending && " （間もなく）"}
                            </span>
                          ) : (
                            <span className="text-gray-400">振込期日: 未設定</span>
                          )}
                          {group.campaign?.budget_min != null && group.campaign?.budget_max != null && (
                            <span>報酬: ¥{(group.campaign.budget_min || 0).toLocaleString()}〜¥{(group.campaign.budget_max || 0).toLocaleString()}</span>
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
          <div className="text-center py-8 text-gray-400">
            {hasActiveFilters ? "条件に一致する振込データがありません" : "振込データはまだありません"}
          </div>
        )}
      </div>
    </div>
  );
}
