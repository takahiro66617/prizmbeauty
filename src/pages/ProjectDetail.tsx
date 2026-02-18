import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar, Users, CheckCircle, AlertCircle, Share2, Heart, ChevronLeft, Instagram, Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CAMPAIGNS } from "@/lib/mockData";

interface Project {
  id: string; title: string; companyName: string; companyDescription?: string; websiteUrl?: string;
  mainImage: string; subImages: string[]; category: string[]; status: string; description: string;
  productName: string; productDescription: string; rewardAmount: number; requiredFollowers: number;
  platforms: string[]; deliverables: string[]; deadlineApp: string; deadlinePost: string;
  maxApplications: number; currentApplications: number; otherConditions?: string;
}

interface Application {
  id: string; projectId: string; userId: string; appliedAt: string;
  status: string; motivation: string;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<any>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    // Seed projects from mock data if empty
    const seedProjects = () => {
      const projects = JSON.parse(localStorage.getItem("prizm_projects") || "[]");
      if (projects.length === 0) {
        const seeded = MOCK_CAMPAIGNS.map(c => ({
          id: c.id, title: c.title, companyName: c.company.name,
          companyDescription: "", websiteUrl: "",
          mainImage: c.images[0], subImages: c.images,
          category: [c.category], status: c.status, description: c.description,
          productName: "", productDescription: "",
          rewardAmount: c.reward, requiredFollowers: 3000,
          platforms: c.platforms, deliverables: c.deliverables,
          deadlineApp: c.deadline, deadlinePost: c.deadline,
          maxApplications: c.maxApplicants, currentApplications: c.currentApplicants,
        }));
        localStorage.setItem("prizm_projects", JSON.stringify(seeded));
        return seeded;
      }
      return projects;
    };

    const projects = seedProjects();
    const raw = projects.find((p: any) => String(p.id) === String(projectId));

    if (!raw) {
      toast({ title: "案件が見つかりませんでした", variant: "destructive" });
      setTimeout(() => navigate("/campaigns"), 2000);
      return;
    }

    const normalized: Project = {
      ...raw,
      id: String(raw.id),
      companyName: raw.companyName || raw.company?.name || "",
      mainImage: raw.mainImage || raw.images?.[0] || "/placeholder.svg",
      subImages: raw.subImages || raw.images || [],
      category: Array.isArray(raw.category) ? raw.category : [raw.category].filter(Boolean),
      rewardAmount: Number(raw.rewardAmount || raw.reward || 0),
      requiredFollowers: Number(raw.requiredFollowers || 0),
      platforms: raw.platforms || [],
      deliverables: raw.deliverables || [],
      deadlineApp: raw.deadlineApp || raw.deadline || "",
      deadlinePost: raw.deadlinePost || "",
      maxApplications: Number(raw.maxApplications || raw.maxApplicants || 0),
      currentApplications: Number(raw.currentApplications || 0),
      productName: raw.productName || "",
      productDescription: raw.productDescription || "",
      description: raw.description || "",
      status: raw.status || "recruiting",
      otherConditions: raw.otherConditions || "",
    };
    setProject(normalized);

    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    if (currentUser) {
      setUser(currentUser);
      const apps = JSON.parse(localStorage.getItem("prizm_applications") || "[]");
      const myApp = apps.find((a: any) => a.projectId === projectId && a.userId === currentUser.id);
      setApplication(myApp || null);
    }
    setIsLoading(false);
  }, [projectId, navigate, toast]);

  const handleApply = () => {
    if (!user) { navigate("/auth/login"); return; }
    if (!motivation) { toast({ title: "応募動機を入力してください", variant: "destructive" }); return; }
    if (!agreedToTerms) { toast({ title: "利用規約への同意が必要です", variant: "destructive" }); return; }

    setIsSubmitting(true);
    const newApp: Application = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: projectId!,
      userId: user.id,
      appliedAt: new Date().toISOString(),
      status: "applied",
      motivation,
    };
    const apps = JSON.parse(localStorage.getItem("prizm_applications") || "[]");
    apps.push(newApp);
    localStorage.setItem("prizm_applications", JSON.stringify(apps));

    const allProjects = JSON.parse(localStorage.getItem("prizm_projects") || "[]");
    const updated = allProjects.map((p: any) =>
      String(p.id) === projectId ? { ...p, currentApplications: (p.currentApplications || 0) + 1 } : p
    );
    localStorage.setItem("prizm_projects", JSON.stringify(updated));

    setApplication(newApp);
    setProject(prev => prev ? { ...prev, currentApplications: prev.currentApplications + 1 } : null);
    toast({ title: "応募が完了しました！" });
    setIsSubmitting(false);
    setMotivation("");
  };

  const handleCancel = () => {
    if (!window.confirm("本当にキャンセルしますか？")) return;
    const apps = JSON.parse(localStorage.getItem("prizm_applications") || "[]");
    localStorage.setItem("prizm_applications", JSON.stringify(apps.filter((a: any) => !(a.projectId === projectId && a.userId === user.id))));
    setApplication(null);
    setProject(prev => prev ? { ...prev, currentApplications: Math.max(0, prev.currentApplications - 1) } : null);
    toast({ title: "応募をキャンセルしました" });
  };

  const getDaysRemaining = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  const daysRemaining = getDaysRemaining(project.deadlineApp);
  const isDeadlinePassed = daysRemaining < 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/campaigns" className="flex items-center text-gray-500 hover:text-gray-800 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4 mr-1" /> 案件一覧に戻る
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${project.status === "recruiting" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {project.status === "recruiting" ? "募集中" : "募集終了"}
              </span>
              <span className="text-gray-500 text-sm">{project.companyName}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{project.title}</h1>
            <div className="flex flex-wrap gap-2">
              {project.category.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm bg-gray-200">
              <img src={project.mainImage} alt={project.title} className="w-full h-full object-cover" />
            </div>
            {project.subImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {project.subImages.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-pink-300 transition-all">
                    <img src={img} alt={`sub-${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 border-l-4 border-pink-400 pl-3 mb-4">案件概要</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </section>

          {project.productName && (
            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 border-l-4 border-pink-400 pl-3 mb-4">商品情報</h2>
              <div className="bg-pink-50/30 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">{project.productName}</h3>
                <p className="text-gray-600 text-sm">{project.productDescription}</p>
              </div>
            </section>
          )}

          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 border-l-4 border-pink-400 pl-3 mb-4">報酬・条件</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">想定報酬</p>
                <p className="text-2xl font-bold text-pink-500">¥{project.rewardAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Users className="w-4 h-4" /> 必要フォロワー数</span>
                  <span className="font-medium">{project.requiredFollowers.toLocaleString()}人以上</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600">対象プラットフォーム</span>
                  <div className="flex gap-1">
                    {project.platforms.includes("instagram") && <Instagram className="w-4 h-4 text-pink-500" />}
                    {project.platforms.includes("tiktok") && <span className="text-xs font-bold text-black border border-black px-1 rounded">Tk</span>}
                    {project.platforms.includes("youtube") && <Youtube className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {project.deliverables.length > 0 && (
            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 border-l-4 border-pink-400 pl-3 mb-4">求められる投稿</h2>
              <ul className="space-y-3">
                {project.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 border-l-4 border-pink-400 pl-3 mb-4">スケジュール</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="bg-white p-2 rounded-full shadow-sm text-pink-500"><Calendar className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-gray-500">応募締切</p>
                  <p className="font-bold text-gray-900">{project.deadlineApp}</p>
                  <p className={`text-xs font-bold ${daysRemaining < 3 ? "text-red-500" : "text-blue-500"}`}>あと {daysRemaining} 日</p>
                </div>
              </div>
              {project.deadlinePost && (
                <div className="flex-1 flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="bg-white p-2 rounded-full shadow-sm text-purple-500"><Calendar className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs text-gray-500">投稿締切</p>
                    <p className="font-bold text-gray-900">{project.deadlinePost}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 border-l-4 border-pink-400 pl-3 mb-4">企業情報</h2>
            <div className="space-y-3">
              <h3 className="font-bold">{project.companyName}</h3>
              {project.companyDescription && <p className="text-sm text-gray-600">{project.companyDescription}</p>}
              {project.websiteUrl && (
                <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline inline-flex items-center gap-1">
                  ウェブサイトを見る <Share2 className="w-3 h-3" />
                </a>
              )}
            </div>
          </section>
        </div>

        <div className="lg:w-1/3">
          <div className="sticky top-20 space-y-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-4 text-white text-center">
                <p className="text-xs opacity-90 mb-1">報酬金額</p>
                <p className="text-3xl font-bold">¥{project.rewardAmount.toLocaleString()}</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  {isDeadlinePassed ? (
                    <div className="text-red-500 font-bold bg-red-50 py-2 rounded">募集終了</div>
                  ) : (
                    <p className={`text-sm font-bold ${daysRemaining < 3 ? "text-red-500" : "text-gray-600"}`}>
                      応募締切まであと <span className="text-lg">{daysRemaining}</span> 日
                    </p>
                  )}
                </div>

                {application ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-bold text-green-700">応募済み</p>
                      <p className="text-xs text-green-600 mt-1">応募日: {new Date(application.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500">あなたの応募動機:</p>
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 italic">"{application.motivation}"</div>
                    </div>
                    {project.status === "recruiting" && (
                      <button onClick={handleCancel} className="w-full text-xs text-gray-400 hover:text-red-500 underline py-2">応募をキャンセルする</button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border-t border-gray-100 pt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">応募動機 <span className="text-red-500">*</span></label>
                      <Textarea
                        placeholder="この案件に応募する理由や、どのような投稿ができるかを教えてください。"
                        className="mb-4"
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                      />
                      <div className="flex items-start gap-2">
                        <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(c as boolean)} />
                        <label htmlFor="terms" className="text-xs text-gray-500 leading-tight pt-0.5 cursor-pointer">
                          <Link to="/terms" className="underline">応募規約</Link>および<Link to="/privacy" className="underline">プライバシーポリシー</Link>に同意します
                        </label>
                      </div>
                    </div>
                    <Button
                      onClick={handleApply}
                      disabled={isDeadlinePassed || isSubmitting || !agreedToTerms}
                      className={`w-full py-6 font-bold text-lg shadow-lg ${isDeadlinePassed ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-pink-500 text-white hover:bg-pink-400"}`}
                    >
                      {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "この案件に応募する"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Button variant="outline" className="w-full bg-white text-gray-500 border-gray-200 hover:text-pink-500 hover:bg-pink-50 gap-2">
              <Heart className="w-4 h-4" /> 気になるリストに追加
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
