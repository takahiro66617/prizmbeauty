import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExternalCompany, useUpdateCompany } from "@/hooks/useExternalCompanies";
import { toast } from "sonner";

export default function ClientSettings() {
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: company, isLoading } = useExternalCompany(companyId);
  const updateCompany = useUpdateCompany();

  const [form, setForm] = useState<Record<string, string>>({});

  const getValue = (field: string) => form[field] ?? (company as any)?.[field] ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany.mutate({
      id: companyId,
      updates: {
        name: getValue("name"),
        contact_name: getValue("contact_name"),
        contact_email: getValue("contact_email"),
        phone: getValue("phone"),
        industry: getValue("industry"),
      },
    }, {
      onSuccess: () => toast.success("保存しました"),
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;
  if (!company) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">企業設定</h1>
        <p className="text-gray-500 mt-1">企業情報を確認・編集します。</p>
      </div>

      <Card className="p-8 border-0 shadow-lg">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
            <Input value={getValue("name")} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">担当者名</label>
              <Input value={getValue("contact_name")} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">業種</label>
              <Input value={getValue("industry")} onChange={e => setForm({ ...form, industry: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <Input value={getValue("contact_email")} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
              <Input value={getValue("phone")} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={updateCompany.isPending}>
              {updateCompany.isPending ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
