import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExternalCompany, useUpdateCompany } from "@/hooks/useExternalCompanies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Building2 } from "lucide-react";

export default function ClientSettings() {
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: company, isLoading } = useExternalCompany(companyId);
  const updateCompany = useUpdateCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});

  const getValue = (field: string) => form[field] ?? (company as any)?.[field] ?? "";

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB以下の画像を選択してください"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${companyId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("campaign-images").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      const logoUrl = urlData.publicUrl;
      updateCompany.mutate({ id: companyId, updates: { logo_url: logoUrl } }, {
        onSuccess: () => toast.success("ロゴを更新しました"),
        onError: () => toast.error("ロゴの保存に失敗しました"),
      });
    } catch {
      toast.error("アップロードに失敗しました");
    }
    setUploading(false);
  };

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

      {/* Logo Upload */}
      <Card className="p-6 border-0 shadow-lg">
        <h2 className="text-lg font-bold text-gray-800 mb-4">企業ロゴ</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
            {company.logo_url ? (
              <img src={company.logo_url} alt="企業ロゴ" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">JPG、PNG形式の画像をアップロードしてください（5MB以下）</p>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />{uploading ? "アップロード中..." : "画像を選択"}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>
      </Card>

      <Card className="p-8 border-0 shadow-lg">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
            <Input value={getValue("name")} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">担当者名</label>
              <Input value={getValue("contact_name")} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">業種</label>
              <Input value={getValue("industry")} onChange={e => setForm({ ...form, industry: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
