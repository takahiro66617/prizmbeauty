import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminInvoices, useAdminGenerateInvoices, useAdminUpdateInvoiceStatus } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { Receipt, FileText, Settings, Loader2 } from "lucide-react";

const INVOICE_STATUSES = [
  { id: "pending", label: "未請求", color: "bg-gray-100 text-gray-700" },
  { id: "issued", label: "請求済", color: "bg-blue-100 text-blue-700" },
  { id: "paid", label: "入金確認済", color: "bg-green-100 text-green-700" },
];

export default function AdminBilling() {
  const [filterStatus, setFilterStatus] = useState("all");
  const { data: invoices = [], isLoading } = useAdminInvoices({ status: filterStatus });
  const generateInvoices = useAdminGenerateInvoices();
  const updateStatus = useAdminUpdateInvoiceStatus();

  const [billingMonth, setBillingMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleGenerate = () => {
    if (!window.confirm(`${billingMonth} の請求書を一括生成しますか？\n完了済みの案件が対象です。`)) return;
    generateInvoices.mutate(billingMonth, {
      onSuccess: (data: any) => toast.success(`${data?.count || 0}件の請求書を生成しました`),
      onError: (e: any) => toast.error(e.message || "生成に失敗しました"),
    });
  };

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    updateStatus.mutate({ invoiceId, status: newStatus }, {
      onSuccess: () => toast.success("ステータスを更新しました"),
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">請求管理</h1>
          <p className="text-gray-500 text-sm mt-1">企業への請求書を管理します</p>
        </div>
        <Link to="/admin/billing/settings">
          <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" />振込先口座設定</Button>
        </Link>
      </div>

      {/* Generate */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-3">請求書の一括生成</h3>
        <p className="text-sm text-gray-500 mb-4">ステータスが「完了」で報酬額が設定されている案件が対象です。生成後、案件は「請求済」に変更されます。</p>
        <div className="flex items-center gap-4">
          <input type="month" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <Button onClick={handleGenerate} disabled={generateInvoices.isPending} className="bg-purple-600 hover:bg-purple-700">
            {generateInvoices.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
            請求書を一括生成
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[{ id: "all", label: "すべて" }, ...INVOICE_STATUSES].map(s => (
          <Button key={s.id} variant={filterStatus === s.id ? "default" : "outline"} size="sm"
            onClick={() => setFilterStatus(s.id)}
            className={filterStatus === s.id ? "bg-purple-600" : ""}>
            {s.label}
          </Button>
        ))}
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : invoices.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-6 py-3">請求番号</th>
                <th className="text-left px-6 py-3">企業名</th>
                <th className="text-left px-6 py-3">請求月</th>
                <th className="text-right px-6 py-3">総合計</th>
                <th className="text-center px-6 py-3">ステータス</th>
                <th className="text-center px-6 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv: any) => {
                const st = INVOICE_STATUSES.find(s => s.id === inv.status);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">{inv.invoice_number || "-"}</td>
                    <td className="px-6 py-4 font-medium">{inv.companies?.name || "-"}</td>
                    <td className="px-6 py-4">{inv.billing_month}</td>
                    <td className="px-6 py-4 text-right font-bold">¥{(inv.grand_total || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={st?.color || ""}>{st?.label || inv.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select value={inv.status} onChange={e => handleStatusChange(inv.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1">
                        {INVOICE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mb-3" />
          <p>請求書はまだありません</p>
        </div>
      )}
    </div>
  );
}
