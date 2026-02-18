import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Building2, Save, Search } from "lucide-react";
import { useBankAccount, useUpsertBankAccount, usePayments } from "@/hooks/usePayments";
import { toast } from "sonner";

export default function MyPageRewards() {
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
      toast.error("すべての項目を入力してください");
      return;
    }
    upsertBank.mutate(bankForm, {
      onSuccess: () => { toast.success("振込先情報を保存しました"); setShowBankForm(false); },
      onError: () => toast.error("保存に失敗しました"),
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

  if (bankLoading || paymentsLoading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">報酬管理</h1>
        <p className="text-gray-500 mt-1">報酬の確認・振込先情報の設定</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-pink-50 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">合計報酬</p>
          <p className="text-2xl font-bold text-pink-600">¥{totalAmount.toLocaleString()}</p>
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

      {/* Bank Account */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
          <div className="space-y-4">
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

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-gray-500" />報酬履歴</h3>
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
