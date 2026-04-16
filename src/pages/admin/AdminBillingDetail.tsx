import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminInvoiceDetail } from "@/hooks/useAdminData";
import { ArrowLeft, Printer } from "lucide-react";

const STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "未請求", color: "bg-gray-100 text-gray-700" },
  issued: { label: "請求済", color: "bg-gray-200 text-gray-800" },
  paid: { label: "入金確認済", color: "bg-gray-800 text-white" },
};

export default function AdminBillingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useAdminInvoiceDetail(id);

  if (isLoading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>;
  if (!invoice) return <div className="text-center py-12 text-gray-400">請求書が見つかりません</div>;

  const st = STATUSES[invoice.status] || STATUSES.pending;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing")} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る
        </Button>
        <div className="flex items-center gap-3">
          <Badge className={st.color}>{st.label}</Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />印刷プレビュー
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 print:shadow-none print:border-0 print:rounded-none print:p-0" id="admin-invoice-content">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">請求書</h1>
            <p className="text-sm text-gray-500 mt-1">INVOICE</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">請求番号: <span className="font-mono font-bold text-gray-900">{invoice.invoice_number}</span></p>
            <p className="text-sm text-gray-500">発行日: {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString("ja-JP") : "-"}</p>
          </div>
        </div>

        {/* Recipient / Issuer */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border-l-4 border-gray-400 pl-4">
            <p className="text-xs text-gray-400 uppercase mb-1">請求先</p>
            <p className="font-bold text-lg text-gray-900">{invoice.companies?.name || "-"} 御中</p>
            {invoice.companies?.contact_name && <p className="text-sm text-gray-600">{invoice.companies.contact_name}</p>}
          </div>
          <div className="border-l-4 border-gray-600 pl-4">
            <p className="text-xs text-gray-400 uppercase mb-1">発行元</p>
            <p className="font-bold text-lg text-gray-900">株式会社Zangle</p>
            <p className="text-sm text-gray-600">media@pr-izm.com</p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-center">
          <p className="text-sm text-gray-500 mb-1">ご請求金額（税込）</p>
          <p className="text-4xl font-bold text-gray-900">¥{(invoice.grand_total || 0).toLocaleString()}</p>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-700 mb-3">内訳</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 text-gray-500 text-xs uppercase">
                <th className="text-left py-3 px-2">案件名</th>
                <th className="text-right py-3 px-2">報酬額（参考）</th>
                <th className="text-right py-3 px-2">手数料(30%)</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item: any, i: number) => (
                <tr key={item.id || i} className="border-b border-gray-100">
                  <td className="py-3 px-2 text-gray-900">{item.campaign_title}</td>
                  <td className="py-3 px-2 text-right text-gray-400">¥{(item.reward_amount || 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right font-medium text-gray-900">¥{(item.fee_amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">システム手数料 小計</span><span className="font-medium text-gray-900">¥{(invoice.system_fee_amount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">消費税 (10%)</span><span className="font-medium text-gray-900">¥{(invoice.tax_amount || 0).toLocaleString()}</span></div>
            <div className="border-t-2 border-gray-900 pt-2 flex justify-between text-base">
              <span className="font-bold text-gray-900">合計</span><span className="font-bold text-lg text-gray-900">¥{(invoice.grand_total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Due date */}
        {invoice.due_date && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
            振込期日: <span className="font-bold text-gray-900">{invoice.due_date}</span>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #admin-invoice-content, #admin-invoice-content * { visibility: visible; }
          #admin-invoice-content { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
        }
      `}</style>
    </div>
  );
}
