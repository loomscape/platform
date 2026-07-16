import React, { useState, useEffect } from "react";
import { User, Project, Contributor } from "../types";
import { 
  Heart, 
  Star, 
  Trash, 
  Edit, 
  Sparkles, 
  ExternalLink, 
  UserCheck, 
  Radio, 
  MessageSquare, 
  Calendar, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  ArrowLeft 
} from "lucide-react";

interface UserProfileProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onOpenProjectDetails: (project: Project) => void;
  onUpdateUser: (updatedUser: User) => void;
}

interface ProfileStats {
  favoriteProjects: Project[];
  followedWeavers: Contributor[];
  userComments: {
    id: string;
    content: string;
    createdAt: string;
    projectId: string;
    projectTitle: string;
  }[];
}

export default function UserProfile({ 
  currentUser, 
  onLoginClick, 
  onLogoutClick, 
  onOpenProjectDetails,
  onUpdateUser
}: UserProfileProps) {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit profile form states
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatar, setEditAvatar] = useState("🌸");
  const [editRole, setEditRole] = useState("普通读者");
  const [editPassword, setEditPassword] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  const avatars = [
    { char: "🌸", label: "桃花 / Peach blossom" },
    { char: "🏮", label: "灯笼 / Lantern" },
    { char: "☕", label: "清茶 / Gentle tea" },
    { char: "🌾", label: "麦穗 / Wheat stalk" },
    { char: "🧵", label: "丝线 / Thread" },
    { char: "🧶", label: "线团 / Yarn" },
    { char: "⛵", label: "孤舟 / Solitary boat" },
    { char: "🏡", label: "屋宇 / Cottage" }
  ];

  const roles = [
    "普通读者",
    "主人公亲友",
    "技术织网人"
  ];

  // Load user data from server dynamically
  const loadProfileStats = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/stats/${currentUser.id}`);
      if (!response.ok) {
        throw new Error("同步居民档案失败。");
      }
      const data = await response.json();
      if (data.success) {
        setStats({
          favoriteProjects: data.favoriteProjects,
          followedWeavers: data.followedWeavers,
          userComments: data.userComments
        });
        // Sync parent/localStorage user if database matches
        onUpdateUser(data.user);
      }
    } catch (err: any) {
      console.error(err);
      setError("无法连接到织网中央档，请稍后刷新重试。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProfileStats();
      // Initialize edit states
      setEditNickname(currentUser.nickname);
      setEditEmail(currentUser.email || "");
      setEditAvatar(currentUser.avatar);
      setEditRole(currentUser.role);
      setEditGithub(currentUser.github || "");
    }
  }, [currentUser?.id]);

  // Handle unfavorite project action
  const handleUnfavorite = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const response = await fetch("/api/users/toggle-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, projectId })
      });
      if (response.ok) {
        const data = await response.json();
        // Update local stats view
        if (stats) {
          setStats({
            ...stats,
            favoriteProjects: stats.favoriteProjects.filter(p => p.id !== projectId)
          });
        }
        // Force sync with localstorage or window events
        const localFavs = JSON.parse(localStorage.getItem("loomscape_fav_projects") || "[]");
        const newFavs = localFavs.filter((id: string) => id !== projectId);
        localStorage.setItem("loomscape_fav_projects", JSON.stringify(newFavs));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("Failed to unfavorite project", err);
    }
  };

  // Handle unfollow weaver action
  const handleUnfollowWeaver = async (github: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/users/toggle-follow-weaver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, github })
      });
      if (response.ok) {
        if (stats) {
          setStats({
            ...stats,
            followedWeavers: stats.followedWeavers.filter(w => w.login.toLowerCase() !== github.toLowerCase())
          });
        }
      }
    } catch (err) {
      console.error("Failed to unfollow creator", err);
    }
  };

  // Update profile handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setEditLoading(true);
    setError(null);
    setEditSuccessMsg(null);

    if (!editNickname.trim()) {
      setError("昵称称呼不能为空。");
      setEditLoading(false);
      return;
    }

    if (editEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editEmail)) {
        setError("请输入有效的电子邮箱地址。");
        setEditLoading(false);
        return;
      }
    } else {
      setError("电子邮箱不能为空。");
      setEditLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/users/profile-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser.id,
          nickname: editNickname,
          email: editEmail,
          avatar: editAvatar,
          role: editRole,
          password: editPassword,
          github: editGithub
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "修改居民卡失败。");
      }

      onUpdateUser(data.user);
      setIsEditing(false);
      setEditPassword("");
      setEditSuccessMsg("您的居民档案信息已安全编织写入服务器。");
      setTimeout(() => setEditSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "请求失败，请稍后重试。");
    } finally {
      setEditLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="bg-[#F3EFE6] border border-[#E5E1D8] p-12 rounded-3xl shadow-md space-y-6">
          <div className="w-16 h-16 bg-[#5A5A40]/10 rounded-full flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-[#5A5A40]" />
          </div>
          <h2 className="serif text-3xl font-bold text-stone-900">属于您的织机风景居民证</h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            在这里，你可以随时取用您的专属伙伴工具收藏箱、追踪您关注的温情织网人，或是打理在每一个作品深处留下的回忆印记。
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={onLoginClick}
              className="bg-[#5A5A40] hover:bg-[#484833] text-white text-sm font-bold px-8 py-3 rounded-full shadow-md transition-all cursor-pointer"
            >
              登记身份 / Login & Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const joinDate = new Date(currentUser.createdAt || Date.now()).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 text-left page-fade-in">
      
      {/* Dynamic Alert message */}
      {editSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-5 py-4 rounded-2xl flex items-center gap-3 mb-6 animate-fade-in shadow-sm">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{editSuccessMsg}</span>
        </div>
      )}

      {/* Profile Header Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: User Passport Block */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 md:p-8 card-shadow flex flex-col justify-between h-fit relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl bg-[#F9F8F6] border-2 border-amber-800/40 h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden">
                {currentUser.avatar && (currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("/")) ? (
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.avatar
                )}
              </span>
              <div>
                <h3 className="serif text-2xl font-bold text-stone-900 leading-tight">{currentUser.nickname}</h3>
                <p className="text-xs text-stone-400 font-mono mt-1">ID: {currentUser.username}</p>
              </div>
            </div>

            <div className="space-y-3.5 border-t border-b border-[#E5E1D8] py-4 text-xs text-stone-600">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">社区居民角色</span>
                <span className="px-3 py-1 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] font-bold">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">电子邮箱</span>
                <span className="font-medium text-stone-800 font-mono">
                  {currentUser.email || "未填写"}
                </span>
              </div>
              {currentUser.github && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">GitHub 绑定</span>
                  <a 
                    href={`https://github.com/${currentUser.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-stone-800 hover:text-[#5A5A40] transition-colors flex items-center gap-1 font-mono"
                  >
                    @{currentUser.github}
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-stone-400">入住时间</span>
                <span className="font-medium text-stone-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  {joinDate}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">收藏的伙伴工具</span>
                <span className="font-bold text-[#5A5A40]">
                  {stats?.favoriteProjects.length ?? currentUser.favorites?.length ?? 0} 个
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">守望的织网人</span>
                <span className="font-bold text-[#5A5A40]">
                  {stats?.followedWeavers.length ?? currentUser.followedWeavers?.length ?? 0} 位
                </span>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setError(null);
                }}
                className="w-full bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>修改居民档案信息 / Edit Profile</span>
              </button>

              <button
                onClick={onLogoutClick}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>解绑并安全登出 / Safe Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive Content Panels */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROFILE EDIT FORM PANEL (Only shown when editing) */}
          {isEditing && (
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-3xl p-6 md:p-8 card-shadow space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-amber-200 pb-3">
                <h4 className="serif text-lg font-bold text-amber-950 flex items-center gap-1.5">
                  <Edit className="w-5 h-5 text-amber-800" />
                  <span>更新您的居民档案卡</span>
                </h4>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
                >
                  取消
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                {/* Nickname */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    称呼昵称 / Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    电子邮箱 / Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                  />
                </div>

                {/* GitHub Username */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    GitHub 绑定 / GitHub Username
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="例如: amusingcompany"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value.trim())}
                      className="flex-1 bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                    />
                    {editGithub && (
                      <button
                        type="button"
                        onClick={() => {
                          const avatarUrl = `https://github.com/${editGithub}.png`;
                          setEditAvatar(avatarUrl);
                        }}
                        className="bg-stone-50 hover:bg-stone-100 text-[#5A5A40] border border-[#E5E1D8] rounded-xl px-4 py-2.5 font-bold transition-all text-xs shrink-0 cursor-pointer flex items-center gap-1"
                        title="自动获取并使用该 Github 账号的头像"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>自动同步头像</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    输入 GitHub 用户名后，可一键点击“自动同步头像”按钮将社区印章更改为您的 GitHub 真实头像。
                  </p>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    社区主要身份 / Identity Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setEditRole(r)}
                        className={`py-2 px-2 rounded-xl border font-bold text-center transition-all ${
                          editRole === r
                            ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                            : "bg-white text-stone-600 border-[#E5E1D8] hover:border-[#5A5A40]/50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avatar Motif Selection */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    选择您的专属心仪印章 / Passport Motif
                  </label>
                  <div className="flex flex-wrap gap-2 bg-white p-2.5 rounded-xl border border-[#E5E1D8] mb-2">
                    {avatars.map((av) => (
                      <button
                        type="button"
                        key={av.char}
                        onClick={() => setEditAvatar(av.char)}
                        title={av.label}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                          editAvatar === av.char
                            ? "bg-amber-50 border-2 border-amber-700/60 scale-105"
                            : "hover:bg-stone-50 border border-transparent"
                        }`}
                      >
                        {av.char}
                      </button>
                    ))}
                    {editAvatar && (editAvatar.startsWith("http") || editAvatar.startsWith("/")) && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar(editAvatar)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center border-2 border-amber-700/60 scale-105 overflow-hidden shadow-sm shrink-0"
                        title="当前选中的自定义/GitHub 头像"
                      >
                        <img src={editAvatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      或输入自定义头像图片网址 / Custom Avatar Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/your-avatar.jpg"
                      value={(editAvatar && (editAvatar.startsWith("http") || editAvatar.startsWith("/"))) ? editAvatar : ""}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                    />
                  </div>
                </div>

                {/* Password update optional */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    更改您的居民密码 (留空则保持不变) / Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editPassword}
                      placeholder="留空则保持原密码"
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-white border border-[#E5E1D8] rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-[#5A5A40] hover:bg-[#484833] disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-center cursor-pointer"
                  >
                    {editLoading ? "正在重织印记..." : "保存居民卡信息"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-white border border-[#E5E1D8] hover:bg-stone-50 text-stone-700 font-bold py-2.5 px-4 rounded-xl transition-all text-center cursor-pointer"
                  >
                    放弃
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab Content 1: My Favorites Block */}
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 md:p-8 card-shadow space-y-5">
            <h4 className="serif text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-[#E5E1D8] pb-3">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>我的伙伴工具收藏箱 ({stats?.favoriteProjects.length ?? 0})</span>
            </h4>

            {loading ? (
              <div className="py-12 text-center text-stone-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5A5A40] border-t-transparent mx-auto mb-2" />
                <p className="text-[10px] font-mono tracking-wider">SYNCING FAVORITE SHELVES...</p>
              </div>
            ) : !stats || stats.favoriteProjects.length === 0 ? (
              <div className="py-12 text-center bg-stone-50 border border-dashed border-[#E5E1D8] rounded-2xl text-stone-400">
                <Star className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                <p className="text-xs">您的工具箱空荡荡。快去风景页面给心仪的工具点亮星星（★ 收藏）吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.favoriteProjects.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => onOpenProjectDetails(p)}
                    className="group border border-[#E5E1D8] hover:border-[#5A5A40] rounded-2xl p-4 bg-[#FBFBFA] hover:bg-white transition-all cursor-pointer flex flex-col justify-between h-40 card-shadow hover:scale-[1.01]"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="font-bold text-stone-900 text-sm group-hover:text-[#5A5A40] transition-colors line-clamp-1">
                          {p.title}
                        </h5>
                        <button
                          onClick={(e) => handleUnfavorite(p.id, e)}
                          title="移出收藏"
                          className="text-stone-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 font-sans font-medium">
                        为 <span className="text-[#5A5A40] font-bold">{p.targetPerson.name}</span> 开发 ({p.targetPerson.relationship})
                      </p>
                      <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                        {p.tagline}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-[#E5E1D8] pt-2 mt-2 text-[10px] text-stone-400">
                      <span>🌸 By {p.author.name}</span>
                      <span className="font-mono text-amber-600 font-bold flex items-center gap-0.5">
                        ♥ {p.likes} 点赞
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab Content 2: Followed Creators Block */}
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 md:p-8 card-shadow space-y-5">
            <h4 className="serif text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-[#E5E1D8] pb-3">
              <Radio className="w-5 h-5 text-emerald-600" />
              <span>守望温情织网人 ({stats?.followedWeavers.length ?? 0})</span>
            </h4>

            {loading ? (
              <div className="py-8 text-center text-stone-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mx-auto mb-2" />
                <p className="text-[10px] font-mono tracking-wider">LOADING CO-WEAVERS...</p>
              </div>
            ) : !stats || stats.followedWeavers.length === 0 ? (
              <div className="py-12 text-center bg-stone-50 border border-dashed border-[#E5E1D8] rounded-2xl text-stone-400">
                <Radio className="w-8 h-8 text-stone-200 mx-auto mb-2 animate-pulse" />
                <p className="text-xs">暂未关注任何技术创作者。打开他们的作品卡片，即可一键关注！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.followedWeavers.map((w) => (
                  <div 
                    key={w.id}
                    className="border border-[#E5E1D8] rounded-2xl p-4 flex items-center justify-between bg-[#FBFBFA]"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={w.avatarUrl} 
                        alt={w.login} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl border border-stone-100 object-cover" 
                      />
                      <div>
                        <h5 className="font-bold text-stone-900 text-xs">{w.login}</h5>
                        <p className="text-[10px] text-stone-400 mt-0.5 font-medium">{w.role || "织线工程师"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={w.htmlUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-stone-400 hover:text-[#5A5A40] p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                        title="查看 Github"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleUnfollowWeaver(w.login)}
                        className="text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700 px-2 py-1 rounded-lg border border-red-200/50 transition-colors font-medium cursor-pointer"
                      >
                        取消关注
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab Content 3: Comment Log Block */}
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 md:p-8 card-shadow space-y-5">
            <h4 className="serif text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-[#E5E1D8] pb-3">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <span>我的温度留言记录 ({stats?.userComments.length ?? 0})</span>
            </h4>

            {loading ? (
              <div className="py-8 text-center text-stone-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5A5A40] border-t-transparent mx-auto mb-2" />
                <p className="text-[10px] font-mono tracking-wider">RESTORING DIALOGUES...</p>
              </div>
            ) : !stats || stats.userComments.length === 0 ? (
              <div className="py-12 text-center bg-stone-50 border border-dashed border-[#E5E1D8] rounded-2xl text-stone-400">
                <MessageSquare className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                <p className="text-xs">您还没有留言记录。快去伙伴工具的「详情页面」写下您的反馈吧！</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.userComments.map((c) => (
                  <div 
                    key={c.id}
                    className="border-l-2 border-indigo-200 bg-[#FBFBFA] hover:bg-stone-50 p-4 rounded-r-2xl transition-all text-left space-y-2"
                  >
                    <div className="flex justify-between items-start text-[10px] text-stone-400">
                      <span>
                        在工具 <span className="font-bold text-stone-700">《{c.projectTitle}》</span> 下的发言
                      </span>
                      <span>
                        {new Date(c.createdAt).toLocaleDateString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 leading-relaxed italic bg-white p-2.5 rounded-xl border border-[#E5E1D8]/60">
                      "{c.content}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
