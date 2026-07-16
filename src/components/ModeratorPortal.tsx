import React, { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  ShieldAlert, 
  BookOpen, 
  User, 
  Github, 
  CheckCircle, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  Edit, 
  Eye, 
  EyeOff, 
  Search, 
  Settings, 
  Users, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Globe
} from "lucide-react";
import { Project, User as UserModel } from "../types";
import { renderMarkdown } from "../lib/markdown";

interface ModeratorPortalProps {
  pendingProjects: Project[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
  currentUser: UserModel | null;
}

export default function ModeratorPortal({ 
  pendingProjects, 
  onApprove, 
  onReject, 
  onRefresh,
  currentUser 
}: ModeratorPortalProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "published" | "users">("pending");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"story" | "readme">("story");

  // Admin states
  const [publishedProjects, setPublishedProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Search states
  const [searchProjectQuery, setSearchProjectQuery] = useState("");
  const [searchUserQuery, setSearchUserQuery] = useState("");

  // Edit states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editTargetName, setEditTargetName] = useState("");
  const [editTargetRelationship, setEditTargetRelationship] = useState("");
  const [editTargetDescription, setEditTargetDescription] = useState("");
  const [editProblem, setEditProblem] = useState("");
  const [editSolution, setEditSolution] = useState("");
  const [editGithubUrl, setEditGithubUrl] = useState("");
  const [editDemoUrl, setEditDemoUrl] = useState("");
  const [editReadmeProject, setEditReadmeProject] = useState("");
  const [editReadmeStory, setEditReadmeStory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "hidden">("public");
  const [editStatus, setEditStatus] = useState<"approved" | "pending">("approved");

  // Fetch all projects for management
  const fetchPublishedProjects = async () => {
    if (!currentUser) return;
    setLoadingPublished(true);
    try {
      const response = await fetch("/api/admin/all-projects", {
        headers: {
          "x-user-id": currentUser.id,
          "x-user-email": currentUser.email || "",
          "x-user-role": currentUser.role
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPublishedProjects(data);
      }
    } catch (e) {
      console.error("Failed to fetch all projects", e);
    } finally {
      setLoadingPublished(false);
    }
  };

  // Fetch all users for authorization
  const fetchUsers = async () => {
    if (!currentUser) return;
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          "x-user-id": currentUser.id,
          "x-user-email": currentUser.email || "",
          "x-user-role": currentUser.role
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Trigger loads on tab change
  useEffect(() => {
    if (activeTab === "published") {
      fetchPublishedProjects();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  // Open Edit Form Modal for a project
  const startEditing = (p: Project) => {
    setEditingProject(p);
    setEditTitle(p.title || "");
    setEditTagline(p.tagline || "");
    setEditTargetName(p.targetPerson?.name || "");
    setEditTargetRelationship(p.targetPerson?.relationship || "");
    setEditTargetDescription(p.targetPerson?.description || "");
    setEditProblem(p.problemDescription || "");
    setEditSolution(p.solutionDescription || "");
    setEditGithubUrl(p.githubUrl || "");
    setEditDemoUrl(p.demoUrl || "");
    setEditReadmeProject(p.readmeProject || "");
    setEditReadmeStory(p.readmeStory || "");
    setEditTags(p.tags ? p.tags.join(", ") : "");
    setEditVisibility(p.visibility || "public");
    setEditStatus(p.status || "approved");
  };

  // Save project edits
  const handleSaveProjectEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !currentUser) return;
    setSavingProject(true);
    try {
      const response = await fetch("/api/projects/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-email": currentUser.email || "",
          "x-user-role": currentUser.role
        },
        body: JSON.stringify({
          id: editingProject.id,
          title: editTitle,
          tagline: editTagline,
          targetPerson: {
            name: editTargetName,
            relationship: editTargetRelationship,
            description: editTargetDescription
          },
          problemDescription: editProblem,
          solutionDescription: editSolution,
          githubUrl: editGithubUrl,
          demoUrl: editDemoUrl,
          readmeProject: editReadmeProject,
          readmeStory: editReadmeStory,
          tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
          visibility: editVisibility,
          status: editStatus
        })
      });

      if (response.ok) {
        setEditingProject(null);
        await fetchPublishedProjects();
        onRefresh(); // Refresh pending queue counts too
      } else {
        const data = await response.json();
        alert(data.error || "保存修改失败");
      }
    } catch (err) {
      console.error(err);
      alert("网络错误，保存修改失败");
    } finally {
      setSavingProject(false);
    }
  };

  // Update user role
  const handleUpdateUserRole = async (targetUserId: string, newRole: string) => {
    if (!currentUser) return;
    setUpdatingUserRole(targetUserId);
    try {
      const response = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-email": currentUser.email || "",
          "x-user-role": currentUser.role
        },
        body: JSON.stringify({ targetUserId, newRole })
      });
      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || "授权失败");
      }
    } catch (err) {
      console.error(err);
      alert("网络错误，授权失败");
    } finally {
      setUpdatingUserRole(null);
    }
  };

  // Delete project trigger from administrator panel
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("确定要永久删除该项目吗？此操作无法撤销。")) return;
    try {
      const response = await fetch("/api/projects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        if (activeTab === "published") {
          await fetchPublishedProjects();
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter projects inside published list
  const filteredPublished = publishedProjects.filter(p => {
    const q = searchProjectQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.author.name.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  // Filter users
  const filteredUsers = users.filter(u => {
    const q = searchUserQuery.toLowerCase();
    return (
      u.nickname.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 md:px-0 page-fade-in text-left">
      
      {/* Portal Banner Header */}
      <div className="bg-stone-900 text-[#faf9f6] p-6 md:p-8 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#ebd9c5] text-xs font-bold font-mono tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4 text-[#ebd9c5]" />
            <span>LOOMSCAPE CORE CONTROL TERMINAL</span>
          </div>
          <h2 className="serif text-xl md:text-2xl font-medium tracking-tight">守望角 · 管理大厅</h2>
          <p className="text-stone-400 text-xs md:text-sm mt-2 max-w-xl leading-relaxed">
            您可以在此进行项目初审、管理已发布项目（含编辑内容、设置公开/隐藏可见性），以及授权指定居民新的管理和守望者身份权限。
          </p>
        </div>

        <button 
          onClick={async () => {
            onRefresh();
            if (activeTab === "published") await fetchPublishedProjects();
            if (activeTab === "users") await fetchUsers();
          }}
          className="bg-[#faf9f6]/10 hover:bg-[#faf9f6]/20 text-[#faf9f6] border border-stone-700 font-semibold px-4.5 py-2.5 rounded-full text-xs transition-colors cursor-pointer shrink-0"
        >
          同步全局数据 / Sync Now
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap border-b border-[#E5E1D8] mb-6 gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-5 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "pending"
              ? "border-[#5A5A40] text-[#5A5A40] border-b-2 font-bold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>初审等待队列 / Pending Queue ({pendingProjects.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab("published")}
          className={`pb-3 px-5 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "published"
              ? "border-[#5A5A40] text-[#5A5A40] border-b-2 font-bold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>已发布项目管理 / Published Projects</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 px-5 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "users"
              ? "border-[#5A5A40] text-[#5A5A40] border-b-2 font-bold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>居民权限授权 / User Access Control</span>
        </button>
      </div>

      {/* TAB CONTENT 1: PENDING QUEUE */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: List of pending applications */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="serif text-xs font-bold text-stone-500 uppercase tracking-widest pb-2 border-b border-[#E5E1D8] flex items-center justify-between">
              <span>等待审核的项目 ({pendingProjects.length})</span>
              <span className="text-[10px] bg-[#E5E1D8]/40 text-[#5A5A40] px-2.5 py-0.5 rounded-full font-mono font-semibold">Pending Queue</span>
            </h3>

            {pendingProjects.length === 0 ? (
              <div className="bg-[#F9F8F6] border border-[#E5E1D8]/60 rounded-3xl p-8 text-center text-stone-500 text-xs card-shadow">
                <CheckCircle className="w-8 h-8 text-[#5A5A40] mx-auto mb-3" />
                <span className="font-semibold block text-stone-700">当前守望角一片宁静</span>
                <p className="text-[10px] text-stone-500 mt-1">没有处于等待中的编织申请，每一个故事都已被妥善安置。</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {pendingProjects.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      selectedProject?.id === p.id 
                        ? "bg-white border-[#5A5A40] shadow-sm ring-1 ring-[#5A5A40]/30" 
                        : "bg-[#F9F8F6] hover:bg-white border-[#E5E1D8] hover:border-stone-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] bg-[#E5E1D8]/50 text-[#5A5A40] px-2 py-0.5 rounded font-mono font-semibold">
                        {p.targetPerson.name}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 truncate">{p.title}</h4>
                    <p className="text-xs italic text-[#5A5A40] line-clamp-1 mt-0.5 font-serif">“ {p.tagline} ”</p>
                    
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-500 border-t border-stone-100 pt-2.5">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate font-semibold text-stone-700">{p.author.name} (Github: @{p.author.github})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (2 spans): Detail review and approval controls */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="bg-white border border-[#E5E1D8] rounded-3xl shadow-sm overflow-hidden flex flex-col page-fade-in card-shadow">
                
                {/* Review Header Controls */}
                <div className="bg-[#F9F8F6] border-b border-[#E5E1D8] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="serif text-base font-bold text-stone-900">{selectedProject.title}</h3>
                    <p className="text-xs text-[#6B665E] font-serif">审核独织者: {selectedProject.author.name}</p>
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      id="moderator-btn-reject"
                      onClick={() => {
                        onReject(selectedProject.id);
                        setSelectedProject(null);
                      }}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>驳回 / Reject</span>
                    </button>

                    <button
                      id="moderator-btn-approve"
                      onClick={() => {
                        onApprove(selectedProject.id);
                        setSelectedProject(null);
                      }}
                      className="flex items-center gap-1 bg-stone-900 hover:bg-stone-800 text-[#faf9f6] font-bold px-4.5 py-2.5 rounded-full text-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>批准发布 / Approve</span>
                    </button>
                  </div>
                </div>

                {/* Review Workspace Panels */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-100">
                  
                  {/* Details list */}
                  <div className="md:col-span-1 space-y-4 pr-1 text-xs">
                    <div>
                      <span className="font-bold text-stone-400 uppercase tracking-widest block mb-1">主人公现状 & 关系</span>
                      <p className="bg-[#f5f2eb] p-3 rounded-lg border border-[#ebd9c5]/60 text-stone-800 leading-relaxed font-sans">
                        <strong>{selectedProject.targetPerson.name} ({selectedProject.targetPerson.relationship}):</strong> {selectedProject.targetPerson.description}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-stone-400 uppercase tracking-widest block mb-1">具体遭遇阻碍</span>
                      <p className="text-stone-600 font-sans leading-relaxed">{selectedProject.problemDescription}</p>
                    </div>

                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-widest block mb-1">伙伴工具解法</span>
                      <p className="text-stone-600 font-sans leading-relaxed">{selectedProject.solutionDescription}</p>
                    </div>

                    <div>
                      <span className="font-bold text-stone-400 uppercase tracking-widest block mb-1">开源源码仓库</span>
                      <a 
                        href={selectedProject.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-700 font-mono hover:underline truncate block"
                      >
                        {selectedProject.githubUrl}
                      </a>
                    </div>
                  </div>

                  {/* README Markdown preview */}
                  <div className="md:col-span-2 pl-0 md:pl-6 pt-4 md:pt-0 flex flex-col">
                    
                    {/* README Switch */}
                    <div className="flex border-b border-stone-100 mb-4 text-xs">
                      <button
                        onClick={() => setActivePreviewTab("story")}
                        className={`pb-2 px-3 font-semibold border-b-2 transition-all ${
                          activePreviewTab === "story"
                            ? "border-amber-700 text-amber-900"
                            : "border-transparent text-stone-400 hover:text-stone-700"
                        }`}
                      >
                        FOR_WHOM.md 故事预览
                      </button>

                      <button
                        onClick={() => setActivePreviewTab("readme")}
                        className={`pb-2 px-3 font-semibold border-b-2 transition-all ${
                          activePreviewTab === "readme"
                            ? "border-amber-700 text-amber-900"
                            : "border-transparent text-stone-400 hover:text-stone-700"
                        }`}
                      >
                        README.md 代码规格
                      </button>
                    </div>

                    {/* Render Area */}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-left text-xs max-h-[40vh] overflow-y-auto">
                      <article className="readme-content select-none">
                        {activePreviewTab === "story" 
                          ? renderMarkdown(selectedProject.readmeStory)
                          : renderMarkdown(selectedProject.readmeProject)
                        }
                      </article>
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-[#fcfbfa] border border-dashed border-[#ebd9c5] rounded-2xl p-16 text-center text-stone-400 h-full flex flex-col items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-[#ebd9c5] mb-4" />
                <h4 className="text-stone-700 font-bold mb-1">请从左侧队列选择项目进行审查</h4>
                <p className="text-xs max-w-sm">您将在此双重校验申请材料，查看其叙事背景、源码以及 README 协议后予以审核。</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: PUBLISHED PROJECTS MANAGEMENT */}
      {activeTab === "published" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-[#E5E1D8] card-shadow">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="搜索项目、独织者或技术织线..."
                value={searchProjectQuery}
                onChange={(e) => setSearchProjectQuery(e.target.value)}
                className="w-full bg-stone-50 border border-[#E5E1D8] rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40]"
              />
            </div>
            <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
              共管理已审核项目: {publishedProjects.length} 个
            </div>
          </div>

          {loadingPublished ? (
            <div className="py-20 text-center text-stone-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5A5A40] border-t-transparent mx-auto mb-2" />
              <p className="text-xs font-mono tracking-widest">LOADING CONTROLLED PROJECTS...</p>
            </div>
          ) : filteredPublished.length === 0 ? (
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-16 text-center text-stone-500">
              <ShieldAlert className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h4 className="font-bold text-stone-800 mb-1">未搜索到匹配的管理项目</h4>
              <p className="text-xs max-w-sm mx-auto text-stone-400 mt-1">请换一个搜索词，或新增审核新的编织申请。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPublished.map(p => (
                <div 
                  key={p.id}
                  className="bg-white border border-[#E5E1D8] rounded-2xl p-5 hover:border-stone-400 transition-all card-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h4 className="font-bold text-stone-900 text-sm leading-tight line-clamp-1">{p.title}</h4>
                      <div className="flex gap-1.5 shrink-0">
                        {p.visibility === "hidden" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            <EyeOff className="w-3 h-3" />
                            <span>已隐藏</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Globe className="w-3 h-3 text-emerald-600" />
                            <span>公开中</span>
                          </span>
                        )}

                        {p.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span>待初审</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 italic font-serif line-clamp-1 mb-3">“ {p.tagline} ”</p>

                    <div className="space-y-1.5 text-[11px] text-stone-600 border-t border-b border-stone-100 py-3 mb-3 font-sans">
                      <div>
                        <strong className="text-stone-400 font-semibold mr-1">独织者:</strong> {p.author.name} (Github: @{p.author.github})
                      </div>
                      <div>
                        <strong className="text-stone-400 font-semibold mr-1">关怀对象:</strong> {p.targetPerson.name} ({p.targetPerson.relationship})
                      </div>
                      <div className="truncate">
                        <strong className="text-stone-400 font-semibold mr-1">代码仓:</strong> <span className="font-mono text-[10px]">{p.githubUrl}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs mt-2">
                    <span className="text-[10px] text-stone-400 font-mono">ID: {p.id}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(p)}
                        className="flex items-center gap-1 bg-stone-50 hover:bg-[#5A5A40] hover:text-white border border-[#E5E1D8] text-stone-700 font-bold px-3 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>编辑信息与状态</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProject(p.id)}
                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold p-1.5 rounded-xl transition-colors cursor-pointer"
                        title="永久删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: USER AUTHORIZATION AND ACCESS CONTROL */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-[#E5E1D8] card-shadow">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="搜索用户名、昵称或邮箱..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full bg-stone-50 border border-[#E5E1D8] rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40]"
              />
            </div>
            <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
              系统注册居民: {users.length} 位
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-20 text-center text-stone-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5A5A40] border-t-transparent mx-auto mb-2" />
              <p className="text-xs font-mono tracking-widest">LOADING RESIDENTS DATABASE...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-16 text-center text-stone-500">
              <ShieldAlert className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h4 className="font-bold text-stone-800 mb-1">未搜索到匹配的社区居民</h4>
              <p className="text-xs max-w-sm mx-auto text-stone-400 mt-1">请换一个搜索词，例如账号拼写或邮箱后缀。</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E1D8] rounded-2xl overflow-hidden card-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-sans text-stone-700">
                  <thead className="bg-[#F9F8F6] border-b border-[#E5E1D8] text-stone-400 font-semibold uppercase tracking-wider text-left text-[10px]">
                    <tr>
                      <th className="px-6 py-4">居民信息 / Name & Nickname</th>
                      <th className="px-6 py-4">登录账号 / Username</th>
                      <th className="px-6 py-4">电子邮箱 / Email</th>
                      <th className="px-6 py-4">注册日期 / Joined</th>
                      <th className="px-6 py-4 text-right">角色权限授权 / Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <span className="text-2xl h-8 w-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden">
                            {u.avatar && (u.avatar.startsWith("http") || u.avatar.startsWith("/")) ? (
                              <img src={u.avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              u.avatar || "👤"
                            )}
                          </span>
                          <div>
                            <span className="font-bold text-stone-900 text-sm block">{u.nickname}</span>
                            {u.github && (
                              <span className="text-[10px] text-stone-400 block font-mono">Github: @{u.github}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-stone-800">
                          {u.username}
                        </td>
                        <td className="px-6 py-4 font-mono text-stone-500">
                          {u.email || "—"}
                        </td>
                        <td className="px-6 py-4 text-stone-400 font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <select
                              value={u.role || "普通读者"}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              disabled={updatingUserRole === u.id}
                              className="bg-stone-50 border border-[#E5E1D8] rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#5A5A40] text-stone-800 disabled:opacity-50"
                            >
                              <option value="普通读者">普通读者 (Reader)</option>
                              <option value="主人公亲友">主人公亲友 (Relative)</option>
                              <option value="技术织网人">技术织网人 (Developer)</option>
                              <option value="moderator">守护者副手 (Moderator)</option>
                              <option value="admin">系统主理人 (Admin)</option>
                            </select>
                            {updatingUserRole === u.id && (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#5A5A40] border-t-transparent shrink-0" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAILED PROJECT EDIT LIGHTBOX MODAL */}
      {editingProject && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fade-in border border-stone-200">
            {/* Modal Header */}
            <div className="bg-[#F9F8F6] border-b border-[#E5E1D8] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] text-[#5A5A40] font-bold font-mono tracking-widest uppercase block mb-1">PROMPT PANEL / WEAVING WORKSPACE</span>
                <h3 className="serif text-base font-bold text-stone-900 flex items-center gap-1.5">
                  <Edit className="w-5 h-5 text-amber-800" />
                  <span>编辑项目信息 & 状态 Visibility</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full p-2 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <form onSubmit={handleSaveProjectEdit} className="p-6 overflow-y-auto space-y-5 text-left text-xs text-stone-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">项目名称 / Project Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">一句话定位 / Tagline</label>
                  <input
                    type="text"
                    required
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>
              </div>

              {/* Target Person Section */}
              <div className="bg-[#fcfbfa] border border-[#ebd9c5]/60 p-4 rounded-2xl space-y-3.5">
                <span className="font-bold text-amber-900 font-serif text-sm block">关怀之人设定 / Beneficiary Profile</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">称呼姓名 / Beneficiary Name</label>
                    <input
                      type="text"
                      required
                      value={editTargetName}
                      onChange={(e) => setEditTargetName(e.target.value)}
                      className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">社会关系 / Relationship (e.g. 奶奶, 盲人小李)</label>
                    <input
                      type="text"
                      required
                      value={editTargetRelationship}
                      onChange={(e) => setEditTargetRelationship(e.target.value)}
                      className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">生存状态或障碍背景 / Obstacle Description</label>
                  <textarea
                    required
                    rows={2}
                    value={editTargetDescription}
                    onChange={(e) => setEditTargetDescription(e.target.value)}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">具体遭遇痛点阻碍 / Problem Detail</label>
                  <textarea
                    required
                    rows={4}
                    value={editProblem}
                    onChange={(e) => setEditProblem(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">伙伴工具技术解法 / Solution Detail</label>
                  <textarea
                    required
                    rows={4}
                    value={editSolution}
                    onChange={(e) => setEditSolution(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">开源 GitHub 仓库网址 / GitHub Repo URL</label>
                  <input
                    type="url"
                    required
                    value={editGithubUrl}
                    onChange={(e) => setEditGithubUrl(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">在线演示 Demo 网址 / Demo Link (Optional)</label>
                  <input
                    type="url"
                    value={editDemoUrl}
                    onChange={(e) => setEditDemoUrl(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-bold text-stone-500 uppercase tracking-wider mb-1.5">技术织线标签 / Tags (Comma separated, e.g. iOS, Web, 语音助手)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              {/* Two READMEs text editors */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-[#5A5A40] uppercase tracking-wider mb-1.5">FOR_WHOM.md - 记叙“为了谁”的温度故事 / Narrative Story (Markdown)</label>
                  <textarea
                    required
                    rows={6}
                    value={editReadmeStory}
                    onChange={(e) => setEditReadmeStory(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 font-mono text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5A5A40] uppercase tracking-wider mb-1.5">README.md - 介绍“代码规格”与安装使用 / Code Readme (Markdown)</label>
                  <textarea
                    required
                    rows={6}
                    value={editReadmeProject}
                    onChange={(e) => setEditReadmeProject(e.target.value)}
                    className="w-full bg-stone-50 border border-[#E5E1D8] rounded-xl px-4 py-2.5 font-mono text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>
              </div>

              {/* Control flags: Visibility and status */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Visibility Toggle */}
                <div>
                  <span className="block font-bold text-stone-500 uppercase tracking-wider mb-2">项目发布可见性 / Visibility</span>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEditVisibility("public")}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                        editVisibility === "public"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                          : "bg-white text-stone-500 border-stone-200"
                      }`}
                    >
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>公开显示 (Public)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVisibility("hidden")}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                        editVisibility === "hidden"
                          ? "bg-stone-200 text-stone-800 border-stone-300 shadow-xs"
                          : "bg-white text-stone-500 border-stone-200"
                      }`}
                    >
                      <EyeOff className="w-4 h-4 text-stone-600" />
                      <span>隐藏项目 (Hidden)</span>
                    </button>
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <span className="block font-bold text-stone-500 uppercase tracking-wider mb-2">审核发布状态 / Status</span>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEditStatus("approved")}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                        editStatus === "approved"
                          ? "bg-stone-900 text-[#faf9f6] border-stone-900 shadow-xs"
                          : "bg-white text-stone-500 border-stone-200"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>审核通过 (Approved)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStatus("pending")}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                        editStatus === "pending"
                          ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                          : "bg-white text-stone-500 border-stone-200"
                      }`}
                    >
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>放回等待队列 (Pending)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 border-t border-stone-100 pt-4 shrink-0">
                <button
                  type="submit"
                  disabled={savingProject}
                  className="flex-1 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-[#faf9f6] font-bold py-3 rounded-xl transition-all shadow-md text-center cursor-pointer text-xs"
                >
                  {savingProject ? "正在保存更新中..." : "保存修改并写入服务器"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="bg-white border border-[#E5E1D8] hover:bg-stone-50 text-stone-700 font-bold px-6 py-3 rounded-xl transition-all text-center cursor-pointer text-xs"
                >
                  放弃修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
