import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ClientSettings() {
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState({ name: "", contact_name: "", contact_email: "", phone: "", website: "", description: "" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("companies").select("*").eq("user_id", session.user.id).maybeSingle();
      if (data) { setCompany(data); setForm({ name: data.name || "", contact_name: data.contact_name || "", contact_email: data.contact_email || "", phone: data.phone || "", website: data.website || "", description: data.description || "" }); }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);
    const { error } = await supabase.from("companies").update(form).eq("id", company.id);
    if (error) toast({ title: "保存に失敗しました", variant: "destructive" });
    else toast({ title: "保存しました" });
    setLoading(false);
  };

  if (!company) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-gray-800">企業設定</h1><p className="text-gray-500 mt-1">企業情報を確認・編集します。</p></div>

      <Card className="p-8 border-0 shadow-lg">
        <form onSubmit={handleSave} className="space-y-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">企業名</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">担当者名</label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label><Input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Webサイト</label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">企業説明</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? "保存中..." : "保存する"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
