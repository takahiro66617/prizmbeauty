import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, X, GripVertical } from "lucide-react";
import { useCreateCampaign } from "@/hooks/useExternalCampaigns";
import { CATEGORIES, PLATFORMS, PREFECTURES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ClientCampaignNew() {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "スキンケア", budgetMin: "", budgetMax: "",
    maxApplicants: "", deadline: "", paymentDate: "", requirements: "", platforms: [] as string[], deliverables: "",
    prefecture: "",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 10) {
      toast.error("画像は最大10枚までです");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFiles(prev => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const { file } of imageFiles) {
      const ext = file.name.split(".").pop();
      const fileName = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("campaign-images").upload(fileName, file);
      if (error) {
        console.error("Upload error:", error);
        toast.error("画像のアップロードに失敗しました");
        continue;
      }
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(fileName);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      imageUrls = await uploadImages();
    }

    createCampaign.mutate({
      title: form.title, description: form.description, company_id: companyId, category: form.category,
      budget_min: Number(form.budgetMin), budget_max: Number(form.budgetMax || form.budgetMin),
      deadline: form.deadline, requirements: form.requirements, platform: form.platforms.join(","),
      status: "pending_approval", image_url: imageUrls[0] || undefined, image_urls: imageUrls,
      prefecture: form.prefecture || undefined,
    } as any, {
      onSuccess: () => { toast.success("案件を作成しました。事務局の承認後に公開されます。"); navigate("/client/campaigns"); },
      onError: () => { toast.error("案件の作成に失敗しました"); setIsUploading(false); },
    });
  };

  const togglePlatform = (p: string) => {
    setForm(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">新規案件作成</h1>
          <p className="text-gray-500 mt-1">案件の詳細を入力してください。</p>
        </div>
      </div>

      <Card className="p-8 border-0 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Multiple Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">案件イメージ画像（最大10枚）</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageFiles.map((img, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                  <img src={img.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button type="button" onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">メイン</span>
                  )}
                </div>
              ))}
              {imageFiles.length < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">追加</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">1枚目がメイン画像として一覧に表示されます。JPG, PNG, WEBP（最大5MB/枚）</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">案件タイトル</label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：新作スキンケアラインのPR投稿" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">案件説明</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" required placeholder="案件の詳細を記入してください" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
              <select value={form.prefecture} onChange={e => setForm({ ...form, prefecture: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">指定なし</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">募集人数</label>
              <Input type="number" value={form.maxApplicants} onChange={e => setForm({ ...form, maxApplicants: e.target.value })} placeholder="10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">報酬額（最小・円）</label>
              <Input type="number" value={form.budgetMin} onChange={e => setForm({ ...form, budgetMin: e.target.value })} placeholder="30000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">報酬額（最大・円）</label>
              <Input type="number" value={form.budgetMax} onChange={e => setForm({ ...form, budgetMax: e.target.value })} placeholder="100000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">応募締切</label>
              <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">振込予定日</label>
              <Input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.platforms.includes(p) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">応募条件</label>
            <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="改行区切りで記入" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">成果物</label>
            <textarea value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="フィード投稿1本、ストーリーズ3本 など" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>キャンセル</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createCampaign.isPending || isUploading}>
              {createCampaign.isPending || isUploading ? "作成中..." : "案件を作成"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
