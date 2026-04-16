import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, FileText } from "lucide-react";

const STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "未請求", color: "bg-gray-100 text-gray-700" },
  issued: { label: "請求済（未払い）", color: "bg-gray-200 text-gray-800" },
  paid: { label: "支払い完了", color: "bg-gray-800 text-white" },
};

export default function ClientBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.functions.invoke("admin-manage-data", {
        body: { action: "get_invoices", companyId: sessionStorage.getItem("client_company_id") },
      });
      setInvoices(data?.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">請求・支払い管理</h1>
        <p className="text-gray-500 text-sm mt-1">事務局からの請求書を確認できます</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : invoices.length > 0 ? (
        <div className="grid gap-4">
          {invoices.map((inv: any) => {
            const st = STATUSES[inv.status] || STATUSES.pending;
            return (
              <Link key={inv.id} to={`/client/billing/${inv.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{inv.billing_month} 月分</p>
                        <p className="text-xs text-gray-400 font-mono">{inv.invoice_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">¥{(inv.grand_total || 0).toLocaleString()}</p>
                      <Badge className={st.color + " mt-1"}>{st.label}</Badge>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-gray-400">
          <FileText className="w-12 h-12 mb-3" />
          <p>請求書はまだありません</p>
        </div>
      )}
    </div>
  );
}
