import { useState, useEffect } from "react";
import { Wallet, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  campaigns?: { id: string; title: string; payment_date: string | null } | null;
  influencer_profiles?: { name: string; username: string } | null;
}

export default function ClientPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const companyId = sessionStorage.getItem("client_company_id") || "";

  useEffect(() => {
    if (!companyId) return;
    fetchPayments();
  }, [companyId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-manage-data", {
        body: {
          action: "fetch",
          table: "payments",
          filters: { company_id: companyId },
          select: "*, campaigns(id, title, payment_date)",
        },
      });
      const data = res.data?.data || [];

      // Fetch influencer names for each payment
      const influencerIds = [...new Set(data.map((p: any) => p.influencer_user_id))];
      let influencerMap: Record<string, { name: string; username: string }> = {};
      if (influencerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("influencer_profiles")
          .select("id, name, username, user_id")
          .or(influencerIds.map(id => `user_id.eq.${id},id.eq.${id}`).join(","));
        if (profiles) {
          profiles.forEach(p => {
            if (p.user_id) influencerMap[p.user_id] = { name: p.name, username: p.username };
            influencerMap[p.id] = { name: p.name, username: p.username };
          });
        }
      }

      const enriched = data.map((p: any) => ({
        ...p,
        influencer_profiles: influencerMap[p.influencer_user_id] || null,
      }));
      enriched.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  const isDeadlineNear = (paymentDate: string | null) => {
    if (!paymentDate) return false;
    const diff = new Date(paymentDate).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
  };

  const isOverdue = (paymentDate: string | null) => {
    if (!paymentDate) return false;
    return new Date(paymentDate).getTime() < Date.now();
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "paid": return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">振込済</span>;
      case "pending": return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">振込待ち</span>;
      default: return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>;
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">振込管理</h1>
        <p className="text-gray-500 mt-1">振込履歴の確認・期日管理</p>
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

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-500" />振込一覧
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

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(p => {
              const deadlineNear = p.status === "pending" && isDeadlineNear(p.campaigns?.payment_date ?? null);
              const overdue = p.status === "pending" && isOverdue(p.campaigns?.payment_date ?? null);
              return (
                <div key={p.id} className={`flex items-center justify-between p-4 rounded-lg border ${
                  overdue ? "bg-red-50 border-red-200" : deadlineNear ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-transparent"
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.campaigns?.title || "不明な案件"}</p>
                      {overdue && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                      {deadlineNear && !overdue && <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.influencer_profiles?.name || "不明"} · {new Date(p.created_at).toLocaleDateString("ja-JP")}
                    </p>
                    {p.campaigns?.payment_date && (
                      <p className={`text-xs mt-0.5 ${overdue ? "text-red-600 font-medium" : deadlineNear ? "text-yellow-600 font-medium" : "text-gray-400"}`}>
                        振込期日: {new Date(p.campaigns.payment_date).toLocaleDateString("ja-JP")}
                        {overdue && " （期限超過）"}
                        {deadlineNear && !overdue && " （間もなく期限）"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusLabel(p.status)}
                    <span className="font-bold text-gray-900">¥{p.amount.toLocaleString()}</span>
                  </div>
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
