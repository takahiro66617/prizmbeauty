import { useState, useEffect } from "react";
import { PenTool, Clock, CheckCircle, Instagram, Youtube, Video, Image as ImageIcon, X, ExternalLink, Send, MessageSquare, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Application { id: string; projectId: string; userId: string; status: string; project?: any; }
interface Post {
  id: string; applicationId: string; userId: string; projectId: string;
  platform: string; postType: string; postUrl: string; caption: string;
  submittedAt: string; status: string; rejectionReason?: string;
  engagement?: { likes: number; views: number; comments: number };
  thumbnail?: string; project?: any;
}

const TABS = [
  { id: "waiting", label: "投稿待ち" },
  { id: "reviewing", label: "審査中" },
  { id: "approved", label: "承認済み" },
  { id: "remanded", label: "差し戻し" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Video },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

export default function MyPagePosts() {
  const [activeTab, setActiveTab] = useState("waiting");
  const [applications, setApplications] = useState<Application[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({ platform: "instagram", postType: "feed", postUrl: "", caption: "", hashtagsChecked: false });

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    if (!currentUser) return;
    const storedApps = JSON.parse(localStorage.getItem("prizm_applications") || "[]");
    const storedProjects = JSON.parse(localStorage.getItem("prizm_projects") || "[]");
    const storedPosts = JSON.parse(localStorage.getItem("prizm_posts") || "[]");

    const myApps = storedApps.filter((a: any) => a.userId === currentUser.id && a.status === "approved").map((a: any) => {
      const p = storedProjects.find((pr: any) => String(pr.id) === String(a.projectId));
      return { ...a, project: p ? { id: String(p.id), title: p.title, companyName: p.companyName || p.company?.name, mainImage: p.mainImage || p.images?.[0], deadlinePost: p.deadlinePost || "" } : null };
    });
    setApplications(myApps);

    const myPosts = storedPosts.filter((p: any) => p.userId === currentUser.id).map((post: any) => {
      const p = storedProjects.find((pr: any) => String(pr.id) === String(post.projectId));
      return { ...post, project: p ? { id: String(p.id), title: p.title, companyName: p.companyName || p.company?.name, mainImage: p.mainImage || p.images?.[0] } : null };
    });
    setPosts(myPosts);
    setIsLoading(false);
  }, []);

  const waitingApps = applications.filter((a) => !posts.some((p) => p.applicationId === a.id));
  const filteredPosts = activeTab === "remanded" ? posts.filter((p) => ["remanded", "rejected"].includes(p.status)) : posts.filter((p) => p.status === activeTab);

  const handleSubmit = () => {
    if (!selectedApplication || !formData.postUrl || !formData.hashtagsChecked) { alert("必須項目を入力してください"); return; }
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    const newPost: Post = {
      id: `post_${Date.now()}`, applicationId: selectedApplication.id, userId: currentUser.id,
      projectId: selectedApplication.projectId, platform: formData.platform, postType: formData.postType,
      postUrl: formData.postUrl, caption: formData.caption, submittedAt: new Date().toISOString(),
      status: "reviewing", thumbnail: selectedApplication.project?.mainImage,
    };
    const existing = JSON.parse(localStorage.getItem("prizm_posts") || "[]");
    localStorage.setItem("prizm_posts", JSON.stringify([...existing, newPost]));
    alert("投稿を提出しました！審査結果をお待ちください。");
    window.location.reload();
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

  const items = activeTab === "waiting" ? waitingApps : filteredPosts;

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><PenTool className="w-6 h-6 text-pink-500" /> 投稿管理</h1>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {TABS.map((tab) => {
            let count = 0;
            if (tab.id === "waiting") count = waitingApps.length;
            else if (tab.id === "remanded") count = posts.filter((p) => ["remanded", "rejected"].includes(p.status)).length;
            else count = posts.filter((p) => p.status === tab.id).length;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {tab.label}
                <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === tab.id ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600"}`}>{count}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === "waiting" && (items as Application[]).map((app) => (
          <Card key={app.id} className="border-l-4 border-l-pink-400 overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div><h3 className="font-bold text-gray-900 line-clamp-1">{app.project?.title}</h3><p className="text-sm text-gray-500">{app.project?.companyName}</p></div>
                <div className="bg-pink-100 text-pink-700 p-2 rounded-full"><Clock className="w-5 h-5" /></div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1"><p className="text-gray-600 font-medium">投稿締切</p><p className="text-gray-900 font-bold text-lg">{app.project?.deadlinePost || "未定"}</p></div>
              <Button onClick={() => { setSelectedApplication(app); setFormData({ platform: "instagram", postType: "feed", postUrl: "", caption: "", hashtagsChecked: false }); setIsModalOpen(true); }} className="w-full bg-pink-500 hover:bg-pink-400 text-white shadow-md">
                <Send className="w-4 h-4 mr-2" /> 投稿を提出する
              </Button>
            </CardContent>
          </Card>
        ))}

        {activeTab !== "waiting" && (items as Post[]).map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow group">
            <div className="relative h-40 bg-gray-200">
              {post.thumbnail ? <img src={post.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-8 h-8" /></div>}
              <div className="absolute top-2 right-2">
                <Badge className={`${post.status === "approved" ? "bg-green-500" : post.status === "reviewing" ? "bg-blue-500" : "bg-red-500"} text-white shadow-sm`}>
                  {post.status === "approved" ? "承認済み" : post.status === "reviewing" ? "審査中" : "差し戻し"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div><h3 className="font-bold text-gray-900 line-clamp-1">{post.project?.title}</h3><div className="flex items-center text-xs text-gray-500 mt-1"><span className="capitalize">{post.platform}</span><span className="mx-1">•</span><span>{new Date(post.submittedAt).toLocaleDateString()} 提出</span></div></div>
              {post.status === "approved" && post.engagement && (
                <div className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="flex items-center"><Heart className="w-3 h-3 mr-1" /> {post.engagement.likes}</div>
                  <div className="flex items-center"><MessageSquare className="w-3 h-3 mr-1" /> {post.engagement.comments}</div>
                  <div className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {post.engagement.views}</div>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => { setSelectedPost(post); setIsDetailModalOpen(true); }} className="w-full">詳細を見る</Button>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
            <PenTool className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>該当する項目はありません</p>
          </div>
        )}
      </div>

      {isModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-xl text-gray-800">投稿の提出</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 p-4 rounded-lg flex gap-4 items-center">
                <div className="w-16 h-16 bg-white rounded-md overflow-hidden shrink-0"><img src={selectedApplication.project?.mainImage} alt="" className="w-full h-full object-cover" /></div>
                <div className="flex-1"><h4 className="font-bold text-blue-900 text-sm">{selectedApplication.project?.title}</h4></div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">プラットフォーム</label>
                <div className="flex gap-4">
                  {PLATFORMS.map((p) => (
                    <label key={p.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 justify-center transition-all ${formData.platform === p.id ? "border-pink-500 bg-pink-50 text-pink-700" : "border-gray-200 hover:bg-gray-50"}`}>
                      <input type="radio" name="platform" value={p.id} checked={formData.platform === p.id} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="hidden" />
                      <p.icon className="w-5 h-5" /><span className="font-medium text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">投稿URL</label><Input placeholder="https://instagram.com/p/..." value={formData.postUrl} onChange={(e) => setFormData({ ...formData, postUrl: e.target.value })} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">キャプション</label><Textarea placeholder="投稿のキャプションを入力してください" className="h-32" value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} /></div>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <input type="checkbox" id="hashtag-check" className="w-4 h-4 mt-0.5" checked={formData.hashtagsChecked} onChange={(e) => setFormData({ ...formData, hashtagsChecked: e.target.checked })} />
                <label htmlFor="hashtag-check" className="text-sm text-yellow-800 cursor-pointer"><span className="font-bold block mb-1">ハッシュタグの確認</span>指定された必須ハッシュタグが全て含まれていることを確認しました。</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>キャンセル</Button>
              <Button className="bg-pink-500 text-white hover:bg-pink-400 px-8" onClick={handleSubmit}>提出する</Button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setIsDetailModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video bg-black">
              {selectedPost.thumbnail ? <img src={selectedPost.thumbnail} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>}
              <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div><h3 className="font-bold text-lg text-gray-900">{selectedPost.project?.title}</h3><a href={selectedPost.postUrl} target="_blank" rel="noreferrer" className="flex items-center text-blue-500 text-sm hover:underline mt-1">{selectedPost.postUrl} <ExternalLink className="w-3 h-3 ml-1" /></a></div>
                <Badge>{selectedPost.status}</Badge>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 max-h-40 overflow-y-auto"><p className="font-bold text-gray-800 mb-2">キャプション:</p>{selectedPost.caption}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
