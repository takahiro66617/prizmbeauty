import { Button } from "@/components/ui/button";
import { Plus, Search, Building2, User, Mail, Phone, Calendar } from "lucide-react";
import { MOCK_CAMPAIGNS } from "@/lib/mockData";

// Derive unique companies from mock data
const companies = Array.from(
  new Map(MOCK_CAMPAIGNS.map((c) => [c.company.id, c.company])).values()
).map((company, i) => ({
  ...company,
  contactName: "担当者 " + (i + 1),
  contactRole: "マーケティング部",
  email: `contact${i + 1}@example.com`,
  phone: `03-${String(1000 + i).padStart(4, "0")}-${String(2000 + i).padStart(4, "0")}`,
  address: "東京都渋谷区",
  createdAt: "2026-01-15",
}));

export default function AdminClientsPage() {
  return (
    <div className="font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-gray-500 mt-1">登録済みの企業一覧です。</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            企業登録
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="企業名、担当者名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">企業</th>
                <th className="px-6 py-3">担当者</th>
                <th className="px-6 py-3">連絡先</th>
                <th className="px-6 py-3">登録日</th>
                <th className="px-6 py-3">ステータス</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{company.name}</div>
                          <div className="text-xs text-gray-500">{company.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{company.contactName}</div>
                          <div className="text-xs text-gray-500">{company.contactRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-3 h-3" />
                          {company.email}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {company.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(company.createdAt).toLocaleDateString("ja-JP")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        契約中
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                        編集
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="max-w-xs mx-auto text-center">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">企業が登録されていません</h3>
                      <p className="text-gray-500 text-sm mb-4">最初の企業アカウントを登録しましょう。</p>
                      <Button size="sm">企業登録</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
