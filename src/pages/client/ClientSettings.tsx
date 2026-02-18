import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_COMPANIES } from "@/lib/mockData";

export default function ClientSettings() {
  const companyId = sessionStorage.getItem("client_company_id") || "c1";
  const company = MOCK_COMPANIES.find(c => c.id === companyId);

  if (!company) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">企業設定</h1>
        <p className="text-gray-500 mt-1">企業情報を確認・編集します。</p>
      </div>

      <Card className="p-8 border-0 shadow-lg">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
            <Input defaultValue={company.name} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">担当者名</label>
              <Input defaultValue={company.contactName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">部署・役職</label>
              <Input defaultValue={company.contactRole} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <Input defaultValue={company.email} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
              <Input defaultValue={company.phone} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">住所</label>
            <Input defaultValue={company.address} />
          </div>
          <div className="flex justify-end pt-4">
            <Button className="bg-blue-600 hover:bg-blue-700">保存する</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
