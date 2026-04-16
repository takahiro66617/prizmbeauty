import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSetting, useAdminUpdateAppSetting } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function AdminBillingSettings() {
  const navigate = useNavigate();
  const { data: bankData, isLoading } = useAppSetting("admin_bank_account");
  const updateSetting = useAdminUpdateAppSetting();

  const [form, setForm] = useState({
    bank_name: "", branch_name: "", account_type: "普通", account_number: "", account_holder: "",
  });

  useEffect(() => {
    if (bankData && typeof bankData === "object") {
      setForm(prev => ({ ...prev, ...(bankData as any) }));
    }
  }, [bankData]);

  const handleSave = () => {
    updateSetting.mutate({ key: "admin_bank_account", value: form }, {
      onSuccess: () => toast.success("振込先口座情報を保存しました"),
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing")} className="text-gray-500">
        <ArrowLeft className="w-4 h-4 mr-1" />請求管理に戻る
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">振込先口座設定</h1>
        <p className="text-gray-500 text-sm mt-1">企業が支払いを行う際の振込先口座情報です。請求書に表示されます。</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">銀行名</label>
          <Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="例: みずほ銀行" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">支店名</label>
          <Input value={form.branch_name} onChange={e => setForm({ ...form, branch_name: e.target.value })} placeholder="例: 渋谷支店" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">口座種別</label>
          <select value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">口座番号</label>
          <Input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} placeholder="例: 1234567" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">口座名義</label>
          <Input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })} placeholder="例: カ）ピーアールイズム" /></div>
        <div className="flex justify-end pt-2">
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={updateSetting.isPending}>
            <Save className="w-4 h-4 mr-2" />保存
          </Button>
        </div>
      </div>
    </div>
  );
}
