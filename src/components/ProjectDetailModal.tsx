import React, { useState, useEffect } from "react";
import { 
  X, 
  Github, 
  ExternalLink, 
  User as UserIcon, 
  Heart, 
  Clock, 
  Mail, 
  BookOpen, 
  Sparkles, 
  Send, 
  Star, 
  HelpCircle, 
  CheckCircle2, 
  UserPlus,
  Key,
  Copy,
  Check
} from "lucide-react";
import { Project, User } from "../types";
import { renderMarkdown } from "../lib/markdown";

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onLike: (id: string) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onUpdateProject?: () => void;
}

export default function ProjectDetailModal({ 
  project, 
  onClose, 
  onLike, 
  currentUser, 
  onLoginClick,
  onUpdateProject 
}: ProjectDetailModalProps) {
  if (!project) return null;

  const [activeTab, setActiveTab] = useState<"story" | "readme">("story");
  const [likesCount, setLikesCount] = useState(project.likes || 0);
  const [liked, setLiked] = useState(false);
  const [weaverLiked, setWeaverLiked] = useState(false);
  const [weaverLikesCount, setWeaverLikesCount] = useState(0);

  // Favorites state
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWeaverFollowed, setIsWeaverFollowed] = useState(false);

  // Comments state
  const [comments, setComments] = useState<any[]>(project.comments || []);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Hardware instructions modal state
  const [showHardwareGuide, setShowHardwareGuide] = useState(false);

  // Direct share link state
  const [shareCopied, setShareCopied] = useState(false);
  const handleCopyShareLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#/project/${project.id}`;
    navigator.clipboard.writeText(link);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Claim ownership states
  const [claimInput, setClaimInput] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");
  const [claiming, setClaiming] = useState(false);

  const handleClaimProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onLoginClick();
      return;
    }
    if (!claimInput.trim()) return;

    setClaiming(true);
    setClaimError("");
    setClaimSuccess("");

    try {
      const response = await fetch("/api/projects/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          claimCode: claimInput.trim(),
          userId: currentUser.id
        })
      });

      if (response.ok) {
        setClaimSuccess("恭喜！该项目已成功移交并合并到您的个人账号下。现在您拥有此项目的署名和编辑管理权限。");
        setClaimInput("");
        if (onUpdateProject) {
          onUpdateProject();
        }
      } else {
        const data = await response.json();
        setClaimError(data.error || "认领验证密码错误，请重试。");
      }
    } catch (err) {
      console.error(err);
      setClaimError("服务器连接失败，请稍后重试。");
    } finally {
      setClaiming(false);
    }
  };

  // Load local interaction states
  useEffect(() => {
    // Check if project liked
    const likedProjects = JSON.parse(localStorage.getItem("loomscape_liked_projects") || "[]");
    if (likedProjects.includes(project.id)) {
      setLiked(true);
    }

    // Check if weaver liked
    const likedWeavers = JSON.parse(localStorage.getItem("loomscape_liked_weavers") || "[]");
    if (likedWeavers.includes(project.author.github)) {
      setWeaverLiked(true);
    }

    // Check if project favorited
    const favProjects = JSON.parse(localStorage.getItem("loomscape_fav_projects") || "[]");
    if (favProjects.includes(project.id)) {
      setIsFavorited(true);
    }

    // Check if weaver followed
    const favWeavers = JSON.parse(localStorage.getItem("loomscape_fav_weavers") || "[]");
    if (favWeavers.includes(project.author.github)) {
      setIsWeaverFollowed(true);
    }

    // Fetch dynamic contributor likes count
    const fetchWeaverLikes = async () => {
      try {
        const response = await fetch("/api/github/contributors");
        if (response.ok) {
          const contributors = await response.json();
          const match = contributors.find((c: any) => c.login.toLowerCase() === project.author.github.toLowerCase());
          if (match) {
            setWeaverLikesCount(match.likes || 0);
          }
        }
      } catch (e) {
        console.error("Failed to fetch weaver likes", e);
      }
    };
    fetchWeaverLikes();
  }, [project]);

  const handleLike = () => {
    onLike(project.id);
    if (!liked) {
      const likedProjects = JSON.parse(localStorage.getItem("loomscape_liked_projects") || "[]");
      likedProjects.push(project.id);
      localStorage.setItem("loomscape_liked_projects", JSON.stringify(likedProjects));
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleLikeWeaver = async () => {
    if (weaverLiked) return;

    try {
      const response = await fetch("/api/weavers/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github: project.author.github })
      });
      if (response.ok) {
        const data = await response.json();
        setWeaverLikesCount(data.likes);
        setWeaverLiked(true);

        const likedWeavers = JSON.parse(localStorage.getItem("loomscape_liked_weavers") || "[]");
        likedWeavers.push(project.author.github);
        localStorage.setItem("loomscape_liked_weavers", JSON.stringify(likedWeavers));
        
        if (onUpdateProject) onUpdateProject();
      }
    } catch (error) {
      console.error("Failed to like weaver", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      onLoginClick();
      return;
    }

    try {
      const response = await fetch("/api/users/toggle-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, projectId: project.id })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedFavs = data.favorites || [];
        localStorage.setItem("loomscape_fav_projects", JSON.stringify(updatedFavs));
        setIsFavorited(updatedFavs.includes(project.id));
        
        // Update user storage
        const stored = localStorage.getItem("loomscape_user");
        if (stored) {
          const userObj = JSON.parse(stored);
          userObj.favorites = updatedFavs;
          localStorage.setItem("loomscape_user", JSON.stringify(userObj));
        }

        if (onUpdateProject) onUpdateProject();
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Failed to toggle favorite on server", e);
    }
  };

  const handleToggleFollowWeaver = async () => {
    if (!currentUser) {
      onLoginClick();
      return;
    }

    try {
      const response = await fetch("/api/users/toggle-follow-weaver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, github: project.author.github })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedWeavers = data.followedWeavers || [];
        localStorage.setItem("loomscape_fav_weavers", JSON.stringify(updatedWeavers));
        setIsWeaverFollowed(updatedWeavers.map((g: string) => g.toLowerCase()).includes(project.author.github.toLowerCase()));
        
        // Update user storage
        const stored = localStorage.getItem("loomscape_user");
        if (stored) {
          const userObj = JSON.parse(stored);
          userObj.followedWeavers = updatedWeavers;
          localStorage.setItem("loomscape_user", JSON.stringify(userObj));
        }

        if (onUpdateProject) onUpdateProject();
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Failed to toggle follow on server", e);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onLoginClick();
      return;
    }
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await fetch("/api/projects/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          authorName: currentUser.nickname,
          authorAvatar: currentUser.avatar,
          authorRole: currentUser.role,
          authorUsername: currentUser.username,
          content: newCommentText.trim()
        })
      });
      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewCommentText("");
        if (onUpdateProject) {
          onUpdateProject();
        }
      }
    } catch (e) {
      console.error("Failed to submit comment on server", e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formattedDate = new Date(project.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in">
      <div 
        id="detail-modal-container"
        className="bg-[#FDFCFB] border border-[#E5E1D8] w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[88vh] overflow-hidden"
      >
        
        {/* Modal Header */}
        <div className="border-b border-[#E5E1D8] px-4 sm:px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5A5A40] bg-[#E5E1D8]/40 border border-[#E5E1D8] px-2.5 py-1 rounded-full">
              💝 双 README 温暖织集
            </span>
            <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              {formattedDate} 发布
            </span>
          </div>
          <button 
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-[#5A5A40] hover:bg-[#E5E1D8]/30 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Split: Narrative & Sidebar */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#E5E1D8]">
          
          {/* Left panel: Narrative Reader & Warm Core Content */}
          <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col space-y-6 overflow-y-auto max-h-[70vh] md:max-h-[80vh] scrollbar-thin">
            
            {/* Title, Slogan & Friendly description */}
            <div className="text-left bg-gradient-to-r from-amber-50/40 to-transparent p-5 rounded-2xl border border-amber-100/40">
              <h2 className="serif text-2xl sm:text-3xl font-semibold text-[#2D2D2D] tracking-tight">{project.title}</h2>
              <p className="text-xs sm:text-sm italic text-amber-900 mt-2 font-serif leading-relaxed">
                “ {project.tagline} ”
              </p>
            </div>

            {/* Readme Toggle Tabs */}
            <div className="flex border-b border-[#E5E1D8] text-xs sm:text-sm">
              <button
                id="tab-readme-story"
                onClick={() => setActiveTab("story")}
                className={`pb-2.5 px-3 sm:px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "story"
                    ? "border-amber-700 text-amber-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>💝 独织故事（为了谁、解决什么）</span>
              </button>
              <button
                id="tab-readme-project"
                onClick={() => setActiveTab("readme")}
                className={`pb-2.5 px-3 sm:px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "readme"
                    ? "border-[#5A5A40] text-stone-700"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <Github className="w-4 h-4 shrink-0" />
                <span>🛠️ 工具规格与工程代码细节</span>
              </button>
            </div>

            {/* Main view area depending on tabs */}
            <div className="space-y-6 text-left">
              {activeTab === "story" ? (
                <>
                  {/* Warm Care Archive Card (Highly approachable for non-geeky users) */}
                  <div className="bg-[#FAF8F5] border border-[#ebd9c5] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/20 rounded-full blur-2xl pointer-events-none" />
                    
                    <h3 className="serif text-sm font-bold text-amber-900 flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
                      <span>本项目的关怀原点与温情档案 / Care Profile</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-4 text-xs sm:text-sm">
                      {/* Recipient */}
                      <div className="bg-white p-3 rounded-xl border border-stone-100">
                        <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block mb-1">
                          💝 关怀对象是谁
                        </span>
                        <p className="text-stone-800">
                          <strong className="text-amber-950">{project.targetPerson.name}</strong> 
                          <span className="text-stone-500 font-medium ml-1.5 bg-[#E5E1D8]/40 px-2 py-0.5 rounded text-[11px]">{project.targetPerson.relationship}</span>
                        </p>
                        <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                          {project.targetPerson.description}
                        </p>
                      </div>

                      {/* Obstacle */}
                      <div className="bg-white p-3 rounded-xl border border-stone-100">
                        <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block mb-1">
                          🌪️ 遭遇的具体生活阻碍
                        </span>
                        <p className="text-stone-700 text-xs leading-relaxed">
                          {project.problemDescription}
                        </p>
                      </div>

                      {/* Solution */}
                      <div className="bg-[#E5E1D8]/20 p-3.5 rounded-xl border border-[#E5E1D8]/60">
                        <span className="font-bold text-[#5A5A40] text-[10px] uppercase tracking-wider block mb-1">
                          🧶 编织出的伙伴工具解法
                        </span>
                        <p className="text-stone-800 text-xs font-medium leading-relaxed">
                          {project.solutionDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Narrative Journal content */}
                  <div className="bg-white border border-[#E5E1D8] p-5 sm:p-6 md:p-7 rounded-2xl card-shadow">
                    <h4 className="serif text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-4 pb-1.5 border-b border-stone-100">
                      📖 完整创作者自叙 / Diary Log
                    </h4>
                    <article className="readme-content leading-relaxed text-stone-800">
                      {renderMarkdown(project.readmeStory)}
                    </article>
                  </div>
                </>
              ) : (
                /* Technical specs tab */
                <div className="bg-white border border-stone-200 p-5 sm:p-6 rounded-2xl">
                  <article className="readme-content font-mono text-xs">
                    {renderMarkdown(project.readmeProject)}
                  </article>
                </div>
              )}
            </div>

            {/* Echo comments board section (Moved here for spacious, readable, note-like visual feel) */}
            <div className="border-t border-[#E5E1D8] pt-8 text-left">
              <div className="flex items-center justify-between mb-2">
                <h3 className="serif text-md font-bold text-stone-900 flex items-center gap-2">
                  <span>💬 留给编织者的温暖共鸣 / Echoes of Resonance</span>
                  <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {comments.length}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-stone-500 mb-6 font-serif">
                您的每一句感谢或技术反馈，都是微小烛光，照亮独织者继续编织的路途。
              </p>

              {/* Comment Input Box */}
              <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={currentUser ? "写下您温暖的感言、建议或者对受助老人的祝福吧..." : "💬 登记身份后，留下您的温暖共鸣..."}
                    className="w-full bg-white border border-[#E5E1D8] rounded-2xl p-4 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-700 focus:border-amber-700 text-stone-900 placeholder-stone-400"
                    onClick={() => {
                      if (!currentUser) {
                        onLoginClick();
                      }
                    }}
                  />
                  {!currentUser && (
                    <div className="absolute inset-0 bg-[#FDFCFB]/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl cursor-pointer" onClick={onLoginClick}>
                      <button type="button" className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md flex items-center gap-1.5 transition-all">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>登记您的身份以写留言</span>
                      </button>
                    </div>
                  )}
                </div>

                {currentUser && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 flex items-center gap-1.5">
                      <span>正在以居民身份留言:</span>
                      <strong className="text-stone-800 flex items-center gap-1">
                        {currentUser.avatar && (currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("/")) ? (
                          <img src={currentUser.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          currentUser.avatar
                        )}
                        <span>{currentUser.nickname}</span>
                      </strong>
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment || !newCommentText.trim()}
                      className="bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-bold px-5 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>发出共鸣</span>
                    </button>
                  </div>
                )}
              </form>

              {/* Comments Note List */}
              {comments.length === 0 ? (
                <div className="bg-[#FAF8F5] border border-dashed border-[#ebd9c5] p-8 rounded-2xl text-center text-stone-400 text-xs">
                  <p>这里还很安静。写下第一句共鸣，让编织者知道他并不孤单吧 🏮</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {comments.map((comment: any) => (
                    <div 
                      key={comment.id}
                      className="bg-[#FAF8F5] border border-[#ebd9c5]/45 p-4 rounded-2xl text-xs relative shadow-sm hover:scale-[1.01] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg bg-white h-7 w-7 rounded-full border border-stone-100 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                              {comment.authorAvatar && (comment.authorAvatar.startsWith("http") || comment.authorAvatar.startsWith("/")) ? (
                                <img src={comment.authorAvatar} className="w-full h-full object-cover rounded-full" alt="" referrerPolicy="no-referrer" />
                              ) : (
                                comment.authorAvatar || "🌸"
                              )}
                            </span>
                            <div>
                              <span className="font-bold text-stone-800 block leading-tight">{comment.authorName}</span>
                              <span className="text-[9px] text-[#5A5A40] font-semibold tracking-wider uppercase">{comment.authorRole}</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-stone-400 font-mono">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-stone-700 font-sans leading-relaxed mt-1 whitespace-pre-line text-left">
                          {comment.content}
                        </p>
                      </div>
                      <div className="mt-3 text-right">
                        <span className="inline-block h-1 w-12 bg-amber-700/20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Meta Sidebar, Action triggers & Follower options */}
          <div className="w-full md:w-80 bg-[#FAF9F6] p-5 sm:p-6 flex flex-col justify-between gap-6 overflow-y-auto">
            <div className="space-y-5 text-left">
              
              {/* Creator details */}
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                  编织创作者 / Loom Artisan
                </h4>
                <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    {project.author.avatarUrl ? (
                      <img 
                        src={project.author.avatarUrl} 
                        alt={project.author.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-[#E5E1D8] object-cover" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 border border-[#E5E1D8]">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h5 className="text-sm font-semibold text-[#2D2D2D]">{project.author.name}</h5>
                      <a 
                        href={`https://github.com/${project.author.github}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-[#5A5A40] hover:underline flex items-center gap-1 font-mono mt-0.5"
                      >
                        <Github className="w-3.5 h-3.5" />
                        @{project.author.github}
                      </a>
                    </div>
                  </div>

                  {project.author.email && (
                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pl-1">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{project.author.email}</span>
                    </div>
                  )}

                  {/* Follow and Appreciation stats inside details */}
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={handleLikeWeaver}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                        weaverLiked
                          ? "bg-rose-50 text-rose-600 border-rose-200"
                          : "bg-white text-stone-600 hover:text-rose-600 hover:bg-rose-50/40 border-[#E5E1D8]"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${weaverLiked ? "fill-rose-600 text-rose-600" : ""}`} />
                      <span>点赞创作者 ({weaverLikesCount})</span>
                    </button>

                    <button
                      onClick={handleToggleFollowWeaver}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                        isWeaverFollowed
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-white text-stone-600 hover:text-amber-800 hover:bg-amber-50/40 border-[#E5E1D8]"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isWeaverFollowed ? "fill-amber-500 text-amber-500" : ""}`} />
                      <span>{isWeaverFollowed ? "已关注" : "关注"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tag / Tech Details */}
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                  技术织线与标签 / Fabric Threads
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(project.tags || []).map((tag, i) => (
                    <span 
                      key={i} 
                      className="text-xs bg-white text-[#5A5A40] px-3 py-1 rounded-full border border-[#E5E1D8]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* License Details */}
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                  开源许可证 / License
                </h4>
                <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60 text-xs text-stone-700 flex items-start gap-2">
                  <span className="text-sm mt-0.5">⚖️</span>
                  <div>
                    <span className="font-bold text-amber-950 font-mono text-xs block">{project.license || "MIT"}</span>
                    <span className="text-[10px] text-[#6B665E] block leading-normal mt-1">
                      {(() => {
                        const lic = project.license;
                        if (lic === "MIT") {
                          return "极简且极为宽松的开源协议。允许任何人自由进行商业化或闭源修改，仅需在代码中保留原作者的版权与许可声明。";
                        }
                        if (lic === "Apache-2.0") {
                          return "对商业与企业极友好的开源协议。提供明确的专利授权保护，要求修改者保留原作者商标、版权声明及修改说明。";
                        }
                        if (lic === "GPL-3.0") {
                          return "强传染性开源保护协议。任何采用、修改或衍生的版本都必须同样开源，坚守代码共享的公地，防止其被闭源化垄断。";
                        }
                        if (lic === "AGPL-3.0") {
                          return "针对网络/云服务的强传染协议。即使通过网页或 SaaS 提供服务，其后端修改后的源代码也必须公开，专门防止大厂白嫖。";
                        }
                        if (lic === "BSD-3-Clause") {
                          return "经典、简洁且稳健的宽松协议。允许任意修改与分发，但未经明确许可，不得使用原作者或机构的名称做商业宣传。";
                        }
                        if (lic === "MPL-2.0") {
                          return "模块级弱传染保护协议。仅对修改过的原文件强制开源，允许将其作为软件库直接与商业闭源程序联合编译使用。";
                        }
                        if (lic === "MulanPSL-2.0") {
                          return "木兰宽松许可证 v2。中国首个对中英双语、法律合规及专利授予均十分友好的宽松开源许可证。";
                        }
                        if (lic === "PolyForm-NC-1.0.0") {
                          return "非商业公平共享协议。对所有普通个体、学生、艺术家与学术研究完全免费开放，但限制商业巨头无偿将其拿去商业牟利。";
                        }
                        if (lic === "CC-BY-NC-SA-4.0") {
                          return "知识共享（署名-非商业性使用-相同方式共享）协议。极适合内容叙事、软硬件设计和艺术共创的非商业级协作分发。";
                        }
                        return "自主申明开源授权。秉承 Loomscape 生态初心：保护独立创作者免受掠夺，用技术滋养每一个有温度的赛博邻居。";
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Claim Ownership Panel */}
              {project.claimedStatus === "unclaimed" && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-2xl border border-amber-200/60 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                    <span className="animate-pulse">🏮</span>
                    <span>认领原作者身份 / Claim Ownership</span>
                  </div>
                  <p className="text-[10px] text-stone-600 leading-relaxed">
                    这是由社区或管理代理代为上传的<strong>「未认领项目」</strong>。如果您是该伙伴工具的本尊，欢迎注册登录本站并输入初始认领密码，即可一键将该项目署名和永久管理权移交至您的当前账号。
                  </p>

                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="w-full bg-[#5A5A40] text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-sm hover:bg-[#484833] transition-all cursor-pointer"
                    >
                      登录并开始认领项目 / Login to Claim
                    </button>
                  ) : (
                    <form onSubmit={handleClaimProject} className="space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          placeholder="请输入代填时的认领密码"
                          value={claimInput}
                          onChange={(e) => setClaimInput(e.target.value)}
                          className="flex-1 text-[11px] bg-white border border-[#E5E1D8] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-700 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={claiming || !claimInput.trim()}
                          className="bg-amber-800 hover:bg-amber-950 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all cursor-pointer shrink-0"
                        >
                          {claiming ? "认领中..." : "认领"}
                        </button>
                      </div>
                      {claimError && (
                        <p className="text-[10px] text-red-600 font-semibold text-left">{claimError}</p>
                      )}
                      {claimSuccess && (
                        <p className="text-[10px] text-green-600 font-semibold text-left leading-normal">{claimSuccess}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

            </div>

            {/* Main Interactive Action Center */}
            <div className="pt-4 border-t border-[#E5E1D8] space-y-3">
              
              {/* Premium Green "使用工具" Action button */}
              <button 
                id="modal-use-tool-btn"
                onClick={() => {
                  if (project.demoUrl && project.demoUrl !== "" && !project.demoUrl.includes("#demo")) {
                    window.open(project.demoUrl, "_blank", "noreferrer");
                  } else {
                    // Show friendly inline hardware/deployment guide if no demo URL
                    setShowHardwareGuide(true);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold py-3 px-4 rounded-full shadow-md transition-all transform active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>使用工具 / Launch Tool</span>
              </button>

              {/* Bookmark Tool Button */}
              <button 
                id="modal-fav-tool-btn"
                onClick={handleToggleFavorite}
                className={`flex items-center justify-center gap-2 w-full text-xs font-bold py-2.5 px-4 rounded-full border transition-all cursor-pointer ${
                  isFavorited
                    ? "bg-amber-100 text-amber-900 border-amber-300 shadow-xs"
                    : "bg-white text-stone-700 border-[#E5E1D8] hover:bg-stone-50"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorited ? "fill-amber-500 text-amber-500" : ""}`} />
                <span>{isFavorited ? "已放入我的收藏箱" : "收藏该工具 / Favorite Tool"}</span>
              </button>

              {/* Support Like Badge */}
              <button 
                id="modal-like-tool-btn"
                onClick={handleLike}
                className={`flex items-center justify-center gap-2 w-full text-xs font-semibold py-2.5 px-4 rounded-full border transition-all cursor-pointer ${
                  liked 
                    ? "bg-rose-50 text-rose-600 border-rose-200" 
                    : "bg-white text-stone-600 hover:text-rose-600 border-[#E5E1D8]"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? "fill-rose-600 text-rose-600" : ""}`} />
                <span>赞许这个工具 ({likesCount})</span>
              </button>

              {/* Github link */}
              <a 
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-semibold py-2.5 px-4 rounded-full shadow-xs transition-all"
              >
                <Github className="w-4 h-4" />
                <span>查看开源源码仓库</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              {/* Copy Shareable Link Button */}
              <button 
                id="modal-share-tool-btn"
                onClick={handleCopyShareLink}
                className="flex items-center justify-center gap-2 w-full bg-[#FAF9F6] hover:bg-[#F2EFE9] text-stone-700 text-xs font-semibold py-2.5 px-4 rounded-full border border-[#E5E1D8] transition-all cursor-pointer"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">专属分享链接已复制！ / Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>分享此项目直达链接 / Share Project</span>
                  </>
                )}
              </button>

              <p className="text-[9px] text-stone-400 text-center italic mt-2 leading-relaxed">
                * 本伙伴工具受 MIT / GPL-3.0 保护，源码全公开，杜绝商业绑架。
              </p>

            </div>

          </div>

        </div>

        {/* Dynamic Hardware/Software deployment walkthrough popup */}
        {showHardwareGuide && (
          <div className="fixed inset-0 z-[110] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E1D8] w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-left">
              <button 
                onClick={() => setShowHardwareGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="serif text-sm font-bold text-amber-900 flex items-center gap-1.5 mb-3">
                <HelpCircle className="w-4 h-4" />
                <span>如何部署与开始使用该工具</span>
              </h3>

              <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
                <p>
                  因为这是一个<strong>实物硬件项目</strong>或需要<strong>本地配置运行的工具</strong>，为了在保障您绝对隐私的前提下运行，不设置云端代理。
                </p>
                <ol className="list-decimal list-inside space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                  <li>
                    点击 <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-amber-800 underline font-medium">访问开源仓库</a> 获取完整的电路图与软件固件源码。
                  </li>
                  <li>
                    根据 README 中的「硬件清单」采购相应的基础板件（通常只需数十元人民币）。
                  </li>
                  <li>
                    双击或利用编译助手直接进行一键烧录，即插即用！
                  </li>
                </ol>
                <p className="text-[11px] text-[#5A5A40] italic">
                  💡 如果您在安装配置过程中遇到任何阻碍，或者需要织网人协助编译，请直接在下方的评论区留下留言与联系方式，社区伙伴会竭尽所能协助您！
                </p>
              </div>

              <button
                onClick={() => setShowHardwareGuide(false)}
                className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-[#FAF9F6] font-bold text-xs py-2.5 rounded-full transition-all cursor-pointer"
              >
                我知道了，返回
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
