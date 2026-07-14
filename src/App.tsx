import React, { useState, useEffect } from "react";
import { Compass, Filter, Sparkles, HelpCircle, GitCommit, Heart, BookOpen, ExternalLink, GitMerge, ChevronRight, ShieldAlert } from "lucide-react";
import Navbar from "./components/Navbar";
import ProjectCard from "./components/ProjectCard";
import ProjectDetailModal from "./components/ProjectDetailModal";
import ApplicationForm from "./components/ApplicationForm";
import GithubTimeline from "./components/GithubTimeline";
import ModeratorPortal from "./components/ModeratorPortal";
import LoginModal from "./components/LoginModal";
import UserProfile from "./components/UserProfile";
import { Project, User } from "./types";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // User identity and Favorites states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Stats / state loaders
  const [loading, setLoading] = useState(true);

  // Fetch approved projects
  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  // Fetch pending projects (for badge and admin tab)
  const fetchPendingProjects = async () => {
    try {
      const response = await fetch("/api/pending-projects");
      if (response.ok) {
        const data = await response.json();
        setPendingProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch pending projects", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchProjects(), fetchPendingProjects()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();

    // Read initial local user state
    const storedUser = localStorage.getItem("loomscape_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    // Monitor storage events to instantly capture favorites updates
    const handleStorageChange = () => {
      // Force React state update
      setProjects(prev => [...prev]);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("loomscape_user", JSON.stringify(user));
    if (user.favorites) {
      localStorage.setItem("loomscape_fav_projects", JSON.stringify(user.favorites));
    }
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("loomscape_user");
    localStorage.removeItem("loomscape_fav_projects");
    localStorage.removeItem("loomscape_fav_weavers");
    setOnlyFavorites(false);
    setCurrentTab("projects");
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("loomscape_user", JSON.stringify(updatedUser));
    if (updatedUser.favorites) {
      localStorage.setItem("loomscape_fav_projects", JSON.stringify(updatedUser.favorites));
    }
  };

  const handleUpdateProject = async () => {
    await loadAllData();
    // Keep modal content fully in-sync with comments / edits in real-time
    if (selectedProject) {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const list = await response.json();
          const fresh = list.find((p: Project) => p.id === selectedProject.id);
          if (fresh) {
            setSelectedProject(fresh);
          }
        }
      } catch (e) {
        console.error("Failed to sync selected project state", e);
      }
    }
  };

  // Handle Like trigger
  const handleLikeProject = async (id: string) => {
    try {
      const response = await fetch("/api/projects/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        // Increment locally to avoid full re-fetch jitter
        setProjects(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
      }
    } catch (error) {
      console.error("Failed to like project", error);
    }
  };

  // Handle Approve trigger
  const handleApproveProject = async (id: string) => {
    try {
      const response = await fetch("/api/projects/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error("Failed to approve project", error);
    }
  };

  // Handle Reject/Delete trigger
  const handleRejectProject = async (id: string) => {
    try {
      const response = await fetch("/api/projects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  // Extract all distinct tags for filtering
  const allTags = Array.from(
    new Set(projects.flatMap(p => p.tags || []))
  );

  // Filter projects by query, tag, and favorites status
  const filteredProjects = projects.filter(p => {
    const matchesQuery = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetPerson.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetPerson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.solutionDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag ? p.tags.includes(selectedTag) : true;

    let matchesFavorites = true;
    if (onlyFavorites) {
      const favs = JSON.parse(localStorage.getItem("loomscape_fav_projects") || "[]");
      matchesFavorites = favs.includes(p.id);
    }

    return matchesQuery && matchesTag && matchesFavorites;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Shared Header Navigation */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          // Auto scroll to top on tab swap
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingCount={pendingProjects.length}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogoutClick={handleLogout}
      />

      {/* Main Page Layout Container */}
      <main className="flex-1 pb-16">
        
        {currentTab === "projects" && (
          <div className="page-fade-in">
            
            {/* Elegant Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-12 border-b border-[#E5E1D8] bg-[#F9F8F6] loom-grid">
              {/* Background elegant weaving grid pattern overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F9F8F6]/90 pointer-events-none" />

              <div className="max-w-4xl mx-auto text-left px-6 relative z-10">
                {/* Visual badge */}
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E5E1D8]/60 text-[#5A5A40] text-xs font-semibold mb-6 border border-[#E5E1D8]">
                  <GitMerge className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>倡导「为具体的人开发伙伴工具」的开源社区</span>
                </div>

                {/* Slogan Pair */}
                <h2 className="serif text-5xl md:text-6xl font-medium text-[#2D2D2D] leading-tight mb-4">
                  独织者众，<span className="italic text-[#5A5A40]">终成风景</span>
                </h2>
                <p className="text-md md:text-lg font-serif italic text-[#5A5A40] tracking-wider mb-6">
                  Solitary threads, an infinite landscape.
                </p>

                {/* Deep romantic expression paragraph */}
                <p className="text-sm md:text-base text-[#6B665E] sans max-w-2xl border-l-2 border-[#5A5A40] pl-6 py-2 leading-relaxed mb-8">
                  我们不汇聚平庸的流量，只赞美每一份为具体的人解决具体问题的独立叙事。我们崇尚<strong>“独立书写”</strong>——去关怀你身边具体的那个人，发现他们生活中具体的障碍，编织出一根微小而坚固的技术丝线。当无数个角落里的微光交织，便自然而然地铺陈出了一片壮丽、温暖而共享的风景。
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
                  <button
                    id="hero-btn-apply"
                    onClick={() => setCurrentTab("apply")}
                    className="w-full sm:w-auto bg-[#5A5A40] hover:bg-[#484833] text-white text-sm font-medium px-8 py-3 rounded-full shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>参与编织，提交项目</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>

                  <a
                    href="https://github.com/loomscape"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto bg-white hover:bg-[#5A5A40] hover:text-white border border-[#5A5A40] text-[#5A5A40] text-sm font-medium px-8 py-3 rounded-full transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>GitHub 组织页面</span>
                    <ExternalLink className="w-4 h-4 opacity-70" />
                  </a>
                </div>

              </div>
            </section>

            {/* Filter and Cards Feed section */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 mt-12 text-left">
              
              {/* Filter controls panel */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-5 border-b border-[#E5E1D8]">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    id="search-input"
                    placeholder="搜寻故事、受助人或技术织线..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E5E1D8] rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] placeholder-stone-400"
                  />
                </div>

                {/* Tag Pills */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                  <div className="flex items-center gap-1.5 text-xs text-stone-400 font-semibold uppercase tracking-wider mr-2 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-stone-400" />
                    <span>分类：</span>
                  </div>

                  <button
                    id="tag-pill-all"
                    onClick={() => setSelectedTag(null)}
                    className={`text-xs px-4 py-1.5 rounded-full transition-all shrink-0 ${
                      selectedTag === null
                        ? "bg-[#5A5A40] text-white font-medium"
                        : "bg-white text-stone-600 hover:text-[#5A5A40] border border-[#E5E1D8]"
                    }`}
                  >
                    全部项目 ({projects.length})
                  </button>

                  {/* Favorites Filter button */}
                  <button
                    id="tag-pill-favorites"
                    onClick={() => {
                      if (!currentUser) {
                        setShowLoginModal(true);
                      } else {
                        setOnlyFavorites(!onlyFavorites);
                      }
                    }}
                    className={`text-xs px-4 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 font-medium cursor-pointer ${
                      onlyFavorites
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-amber-800 hover:text-amber-900 border border-amber-200"
                    }`}
                  >
                    <span className="text-amber-600 text-xs">★</span>
                    <span>我的收藏箱 ({JSON.parse(localStorage.getItem("loomscape_fav_projects") || "[]").length})</span>
                  </button>

                  {allTags.map(tag => (
                    <button
                      key={tag}
                      id={`tag-pill-${tag}`}
                      onClick={() => setSelectedTag(tag)}
                      className={`text-xs px-4 py-1.5 rounded-full transition-all shrink-0 ${
                        selectedTag === tag
                          ? "bg-[#5A5A40] text-white font-medium"
                          : "bg-white text-stone-600 hover:text-[#5A5A40] border border-[#E5E1D8]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

              </div>

              {/* Loader */}
              {loading ? (
                <div className="py-20 text-center text-stone-400 space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5A5A40] border-t-transparent mx-auto" />
                  <p className="text-xs font-mono tracking-widest">LOADING LOOMSCAPE FEED...</p>
                </div>
              ) : (
                <>
                  {/* Results grid */}
                  {filteredProjects.length === 0 ? (
                    <div className="bg-white border border-[#E5E1D8] rounded-2xl p-16 text-center text-stone-500">
                      <Compass className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                      <h4 className="font-bold text-stone-800 mb-1">未搜索到织造故事</h4>
                      <p className="text-xs max-w-sm mx-auto text-stone-400 leading-relaxed">
                        没有符合当前搜索条件的项目。请尝试清空过滤器或搜寻其他关键词。
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProjects.map(p => (
                        <ProjectCard 
                          key={p.id}
                          project={p}
                          onOpenDetails={(proj) => setSelectedProject(proj)}
                          onLike={handleLikeProject}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

            </section>

          </div>
        )}

        {currentTab === "apply" && (
          <ApplicationForm onSubmitSuccess={() => {
            loadAllData();
            setCurrentTab("projects");
          }} />
        )}

        {currentTab === "github" && (
          <GithubTimeline />
        )}

        {currentTab === "admin" && (
          currentUser && (currentUser.role === "admin" || currentUser.role === "moderator" || currentUser.role === "守护者") ? (
            <ModeratorPortal 
              pendingProjects={pendingProjects}
              onApprove={handleApproveProject}
              onReject={handleRejectProject}
              onRefresh={loadAllData}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E5E1D8] rounded-3xl text-center space-y-4 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-[#5A5A40] mx-auto animate-pulse" />
              <h3 className="serif text-xl font-bold">守望角权限受限 / Restricted</h3>
              <p className="text-stone-500 text-xs leading-relaxed">
                您当前没有守望者（管理员）管理权限。请登录一个具有管理员角色的账号，或让主理人在 Firestore 数据库的 <code>users</code> 集合中将您的用户角色属性（<code>role</code>）修改为 <code>"admin"</code> 或 <code>"moderator"</code>。
              </p>
            </div>
          )
        )}

        {currentTab === "profile" && (
          <UserProfile
            currentUser={currentUser}
            onLoginClick={() => setShowLoginModal(true)}
            onLogoutClick={handleLogout}
            onOpenProjectDetails={(proj) => setSelectedProject(proj)}
            onUpdateUser={handleUpdateUser}
          />
        )}

      </main>

      {/* Footer information bar */}
      <footer className="border-t border-[#E5E1D8] bg-white py-8 text-xs text-[#A5A097]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left font-medium uppercase tracking-widest flex flex-wrap items-center justify-center md:justify-start gap-4">
            <span className="serif text-sm font-medium tracking-tight text-[#2D2D2D] normal-case">Loomscape <span className="text-[#5A5A40]">/</span> 织机风景</span>
            <span className="hidden md:inline text-stone-300">|</span>
            <span>Github.com/loomscape</span>
            <span className="hidden md:inline text-stone-300">•</span>
            <span>Built for Humans</span>
            <span className="hidden md:inline text-stone-300">•</span>
            <span>Open Source Solidarity</span>
          </div>

          <div className="flex gap-4">
            <a href="https://github.com/loomscape" target="_blank" rel="noreferrer" className="hover:text-[#5A5A40] transition-colors">
              GitHub 组织
            </a>
            <span className="text-stone-300">|</span>
            <span className="italic font-serif text-[#7A756D]">为具体的人开发具体的工具</span>
          </div>
        </div>
      </footer>

      {/* Narrative Readme detail lightbox */}
      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onLike={handleLikeProject}
          currentUser={currentUser}
          onLoginClick={() => setShowLoginModal(true)}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* Citizen Identity Registration Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

    </div>
  );
}
