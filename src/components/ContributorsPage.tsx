import React, { useState, useEffect } from "react";
import { 
  Users, Plus, Trash2, Edit2, ExternalLink, Globe, Heart, 
  Github, ArrowUpRight, Loader2, Sparkles, AlertCircle, Link2, Eye, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Project, User, CoreMember, BrandSponsor, Donor, ProjectLink } from "../types";

interface ContributorsPageProps {
  currentUser: User | null;
  projects: Project[];
  language: "zh" | "en";
}

export default function ContributorsPage({ currentUser, projects, language }: ContributorsPageProps) {
  // Page state
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([]);
  const [brandSponsors, setBrandSponsors] = useState<BrandSponsor[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin action triggers
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CoreMember | null>(null);

  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<BrandSponsor | null>(null);

  const [showDonorModal, setShowDonorModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  // Detail Popovers
  const [selectedSubmitter, setSelectedSubmitter] = useState<{
    name: string;
    github: string;
    avatarUrl: string;
    projects: Project[];
  } | null>(null);

  // Form states
  const [memberForm, setMemberForm] = useState<{
    name: string;
    github: string;
    websiteUrl: string;
    projectLinks: ProjectLink[];
  }>({
    name: "",
    github: "",
    websiteUrl: "",
    projectLinks: []
  });

  const [sponsorForm, setSponsorForm] = useState<{
    name: string;
    logoUrl: string;
    homepageUrl: string;
    tier: string;
  }>({
    name: "",
    logoUrl: "",
    homepageUrl: "",
    tier: "钻石赞助商 / Diamond"
  });

  const [donorForm, setDonorForm] = useState<{
    name: string;
    amount: string;
    source: 'github' | 'sponsor_page';
    date: string;
  }>({
    name: "",
    amount: "",
    source: "sponsor_page",
    date: new Date().toISOString().split('T')[0]
  });

  // URL link state for auto-fetch in member form
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const isAdmin = currentUser && (
    currentUser.role === "admin" || 
    currentUser.role === "moderator" || 
    currentUser.role === "守护者" || 
    currentUser.email?.toLowerCase() === "xisco.han@gmail.com"
  );

  // Fetch page-level data
  const loadPageData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contributors/page-data");
      if (res.ok) {
        const data = await res.json();
        setCoreMembers(data.coreMembers || []);
        setBrandSponsors(data.brandSponsors || []);
        setDonors(data.donors || []);
      } else {
        throw new Error("Failed to load contributors statistics.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  // Compute dynamic App Submitters from approved projects
  const submitters = React.useMemo(() => {
    const approved = projects.filter(p => p.status === "approved");
    const grouped: { [github: string]: { name: string; github: string; avatarUrl: string; projects: Project[] } } = {};
    
    approved.forEach(p => {
      const handle = p.author.github.trim().toLowerCase();
      if (!handle) return;
      if (!grouped[handle]) {
        grouped[handle] = {
          name: p.author.name,
          github: p.author.github,
          avatarUrl: p.author.avatarUrl || `https://github.com/${p.author.github}.png`,
          projects: []
        };
      }
      grouped[handle].projects.push(p);
    });

    return Object.values(grouped);
  }, [projects]);

  // Handle URL metadata fetching
  const handleFetchMetadata = async () => {
    if (!newLinkUrl) return;
    setFetchingMetadata(true);
    try {
      const res = await fetch(`/api/contributors/fetch-metadata?url=${encodeURIComponent(newLinkUrl)}`);
      if (res.ok) {
        const meta = await res.json();
        setMemberForm(prev => ({
          ...prev,
          projectLinks: [
            ...prev.projectLinks,
            { url: newLinkUrl, title: meta.title || newLinkUrl, favicon: meta.favicon }
          ]
        }));
        setNewLinkUrl("");
      } else {
        throw new Error();
      }
    } catch {
      // Fallback in case of parse error
      setMemberForm(prev => ({
        ...prev,
        projectLinks: [
          ...prev.projectLinks,
          { url: newLinkUrl, title: new URL(newLinkUrl).hostname || newLinkUrl }
        ]
      }));
      setNewLinkUrl("");
    } finally {
      setFetchingMetadata(false);
    }
  };

  // Submit Core Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contributors/core-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser?.email || "",
          "x-user-id": currentUser?.id || "",
          "x-user-role": currentUser?.role || ""
        },
        body: JSON.stringify({
          id: editingMember?.id,
          ...memberForm,
          currentUserEmail: currentUser?.email,
          currentUserId: currentUser?.id,
          currentUserRole: currentUser?.role
        })
      });
      if (res.ok) {
        await loadPageData();
        setShowMemberModal(false);
        setEditingMember(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Save failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving member details.");
    }
  };

  // Delete Core Member
  const handleDeleteMember = async (id: string) => {
    if (!window.confirm(language === "zh" ? "确定要移除此核心成员吗？" : "Are you sure you want to remove this core member?")) return;
    try {
      const res = await fetch("/api/contributors/core-members/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser?.email || "",
          "x-user-id": currentUser?.id || "",
          "x-user-role": currentUser?.role || ""
        },
        body: JSON.stringify({ 
          id, 
          currentUserEmail: currentUser?.email,
          currentUserId: currentUser?.id,
          currentUserRole: currentUser?.role
        })
      });
      if (res.ok) {
        await loadPageData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Brand Sponsor
  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contributors/brand-sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser?.email || "",
          "x-user-id": currentUser?.id || "",
          "x-user-role": currentUser?.role || ""
        },
        body: JSON.stringify({
          id: editingSponsor?.id,
          ...sponsorForm,
          currentUserEmail: currentUser?.email,
          currentUserId: currentUser?.id,
          currentUserRole: currentUser?.role
        })
      });
      if (res.ok) {
        await loadPageData();
        setShowSponsorModal(false);
        setEditingSponsor(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Save failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Brand Sponsor
  const handleDeleteSponsor = async (id: string) => {
    if (!window.confirm(language === "zh" ? "确定要移除此品牌赞助商吗？" : "Are you sure you want to remove this brand sponsor?")) return;
    try {
      const res = await fetch("/api/contributors/brand-sponsors/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser?.email || "",
          "x-user-id": currentUser?.id || "",
          "x-user-role": currentUser?.role || ""
        },
        body: JSON.stringify({ 
          id, 
          currentUserEmail: currentUser?.email,
          currentUserId: currentUser?.id,
          currentUserRole: currentUser?.role
        })
      });
      if (res.ok) {
        await loadPageData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Donor
  const handleSaveDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contributors/donors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser?.email || "",
          "x-user-id": currentUser?.id || "",
          "x-user-role": currentUser?.role || ""
        },
        body: JSON.stringify({
          id: editingDonor?.id,
          ...donorForm,
          currentUserEmail: currentUser?.email,
          currentUserId: currentUser?.id,
          currentUserRole: currentUser?.role
        })
      });
      if (res.ok) {
        await loadPageData();
        setShowDonorModal(false);
        setEditingDonor(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Save failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Donor
  const handleDeleteDonor = async (id: string) => {
    if (!window.confirm(language === "zh" ? "确定要移除此捐赠记录吗？" : "Are you sure you want to remove this donor?")) return;
    try {
      const res = await fetch("/api/contributors/donors/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser?.email || "",
          "x-user-id": currentUser?.id || "",
          "x-user-role": currentUser?.role || ""
        },
        body: JSON.stringify({ 
          id, 
          currentUserEmail: currentUser?.email,
          currentUserId: currentUser?.id,
          currentUserRole: currentUser?.role
        })
      });
      if (res.ok) {
        await loadPageData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open member dialog in create/edit mode
  const openMemberDialog = (member: CoreMember | null) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name,
        github: member.github,
        websiteUrl: member.websiteUrl || "",
        projectLinks: member.projectLinks || []
      });
    } else {
      setEditingMember(null);
      setMemberForm({
        name: "",
        github: "",
        websiteUrl: "",
        projectLinks: []
      });
    }
    setShowMemberModal(true);
  };

  // Open sponsor dialog in create/edit mode
  const openSponsorDialog = (sponsor: BrandSponsor | null) => {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setSponsorForm({
        name: sponsor.name,
        logoUrl: sponsor.logoUrl,
        homepageUrl: sponsor.homepageUrl || "",
        tier: sponsor.tier
      });
    } else {
      setEditingSponsor(null);
      setSponsorForm({
        name: "",
        logoUrl: "",
        homepageUrl: "",
        tier: "钻石赞助商 / Diamond"
      });
    }
    setShowSponsorModal(true);
  };

  // Open donor dialog in create/edit mode
  const openDonorDialog = (donor: Donor | null) => {
    if (donor) {
      setEditingDonor(donor);
      setDonorForm({
        name: donor.name,
        amount: donor.amount || "",
        source: donor.source,
        date: donor.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingDonor(null);
      setDonorForm({
        name: "",
        amount: "",
        source: "sponsor_page",
        date: new Date().toISOString().split('T')[0]
      });
    }
    setShowDonorModal(true);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40] mx-auto" />
        <p className="text-xs font-mono tracking-widest uppercase">
          {language === "zh" ? "正在召集织梦社区数据..." : "Assembling dreamer community..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 text-left space-y-16">
      
      {/* Intro Header */}
      <section className="space-y-4 border-b border-[#E5E1D8] pb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/60">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>{language === "zh" ? "开源共建 · 互助星火" : "Open Source & Solidary Fire"}</span>
        </div>
        <h2 className="serif text-4xl font-medium text-stone-800 tracking-tight">
          {language === "zh" ? "贡献者与赞助星空" : "Contributors & Sponsorship Constellation"}
        </h2>
        <p className="text-sm text-stone-500 max-w-2xl leading-relaxed font-sans">
          {language === "zh" 
            ? "Loomscape 的每一行代码、每一次修复、每一笔赞助，都是微观世界中一次温暖的握手。在此，我们记录下那些以代码、设计、故事和资金点亮具体个体的开源黑客与守护者。" 
            : "Every line of code, every bugfix, and every sponsor of Loomscape represents a warm handshake in the micro-cosmos. Here, we honor the open-source hackers and guardians who light up specific lives with technology, design, narratives, and funding."}
        </p>
      </section>

      {/* SECTION 1: Core Maintenance Team */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E1D8]/70 pb-3">
          <div className="space-y-1">
            <h3 className="serif text-2xl font-semibold text-stone-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#5A5A40]" />
              <span>{language === "zh" ? "核心维护团队" : "Core Maintenance Team"}</span>
            </h3>
            <p className="text-xs text-stone-400">
              {language === "zh" ? "负责 Loomscape 底层织机协议、应用治理与守望角审核的核心守护者" : "Core guardians handling bottom weaving protocols, application curation, and moderation."}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openMemberDialog(null)}
              className="bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "添加核心成员" : "Add Core Member"}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreMembers.map(member => (
            <div 
              key={member.id} 
              className="bg-white border border-[#E5E1D8] rounded-2xl p-6 relative group transition-all duration-300 hover:shadow-md hover:border-stone-400"
            >
              {isAdmin && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openMemberDialog(member)}
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                    title={language === "zh" ? "编辑成员" : "Edit member"}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    title={language === "zh" ? "移除成员" : "Remove member"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-start gap-4">
                <img 
                  src={member.avatarUrl || `https://github.com/${member.github}.png`}
                  alt={member.name}
                  className="w-14 h-14 rounded-xl border border-[#E5E1D8] bg-stone-50 object-cover"
                />
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-stone-800 flex items-center gap-1">
                    <span>{member.name}</span>
                  </h4>
                  <a 
                    href={`https://github.com/${member.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-stone-400 hover:text-[#5A5A40] flex items-center gap-1 font-mono"
                  >
                    <Github className="w-3 h-3" />
                    <span>@{member.github}</span>
                  </a>
                  {member.websiteUrl && (
                    <a 
                      href={member.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#5A5A40] hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{language === "zh" ? "个人主页" : "Website"}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Showcase Projects */}
              {member.projectLinks && member.projectLinks.length > 0 && (
                <div className="mt-5 pt-4 border-t border-dashed border-[#E5E1D8] text-left">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-2">
                    {language === "zh" ? "精选作品 / SHOWCASE PROJECTS" : "SHOWCASE PROJECTS"}
                  </div>
                  <div className="space-y-2">
                    {member.projectLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-stone-50 hover:bg-[#5A5A40]/10 hover:text-[#5A5A40] border border-[#E5E1D8]/60 hover:border-[#5A5A40]/30 rounded-xl px-3 py-2 text-xs flex items-center justify-between group/link transition-all"
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          {link.favicon ? (
                            <img src={link.favicon} alt="" className="w-4 h-4 rounded shrink-0" onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://github.com/favicon.ico";
                            }} />
                          ) : (
                            <Link2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          )}
                          <span className="truncate font-medium text-stone-700 group-hover/link:text-[#5A5A40]">{link.title}</span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 shrink-0 transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {coreMembers.length === 0 && (
            <div className="col-span-full bg-stone-50 border border-[#E5E1D8] border-dashed rounded-2xl py-12 text-center text-stone-400 text-xs">
              {language === "zh" ? "暂无核心成员。请管理员在上方点击添加。" : "No core members found. Click above to add."}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Approved Application Submitters */}
      <section className="space-y-6">
        <div className="border-b border-[#E5E1D8]/70 pb-3">
          <h3 className="serif text-2xl font-semibold text-stone-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#5A5A40]" />
            <span>{language === "zh" ? "应用生态贡献者" : "App Submitters & Ecosystem weavers"}</span>
          </h3>
          <p className="text-xs text-stone-400">
            {language === "zh" ? "在 Loomscape 生态中提交过真实解决具体个体卡点的独立开发者（点击可查看其创作作品）" : "Independent creators who submitted real applications serving specific protagonists in Loomscape."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {submitters.map(sub => (
            <div
              key={sub.github}
              onClick={() => setSelectedSubmitter(sub)}
              className="bg-white border border-[#E5E1D8] rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer group transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-stone-400"
            >
              <div className="relative">
                <img
                  src={sub.avatarUrl}
                  alt={sub.name}
                  className="w-16 h-16 rounded-full border border-[#E5E1D8] shadow-sm object-cover bg-stone-50"
                />
                <span className="absolute bottom-0 right-0 bg-[#5A5A40] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full scale-90 border border-white">
                  {sub.projects.length}
                </span>
              </div>
              <div className="text-left w-full text-center">
                <h4 className="text-xs font-bold text-stone-800 group-hover:text-[#5A5A40] transition-colors truncate">
                  {sub.name}
                </h4>
                <p className="text-[10px] text-stone-400 font-mono truncate">@{sub.github}</p>
              </div>
              <div className="text-[9px] text-[#5A5A40] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-3 h-3" />
                <span>{language === "zh" ? "查看作品" : "View projects"}</span>
              </div>
            </div>
          ))}

          {submitters.length === 0 && (
            <div className="col-span-full bg-stone-50 border border-[#E5E1D8] border-dashed rounded-2xl py-12 text-center text-stone-400 text-xs">
              {language === "zh" ? "暂无已经发布应用并通过展示的生态贡献者。" : "No ecosystem app contributors available yet."}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: Sponsors & Donors */}
      <section className="space-y-10">
        
        {/* Brand Sponsors */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E1D8]/70 pb-3">
            <div className="space-y-1">
              <h3 className="serif text-2xl font-semibold text-stone-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                <span>{language === "zh" ? "品牌赞助商" : "Brand Sponsors"}</span>
              </h3>
              <p className="text-xs text-stone-400">
                {language === "zh" ? "深切认同 Loomscape “为具体之人而创作”的黑客浪漫，并提供资金或算力等基础设施支撑的企业与品牌" : "Enterprises and brands deeply endorsing Loomscape's spirit and funding infrastructure or hosting support."}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => openSponsorDialog(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === "zh" ? "添加赞助商" : "Add Brand Sponsor"}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {brandSponsors.map(sponsor => (
              <div
                key={sponsor.id}
                className="bg-white border border-[#E5E1D8] rounded-2xl p-6 relative flex flex-col items-center justify-between text-center group transition-all hover:shadow-md hover:border-stone-400"
              >
                {/* Badge top-left defined by admin */}
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-amber-50 text-amber-800 text-[9px] font-bold rounded border border-amber-200 uppercase tracking-wider">
                  {sponsor.tier}
                </div>

                {isAdmin && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openSponsorDialog(sponsor)}
                      className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                      title={language === "zh" ? "编辑" : "Edit"}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteSponsor(sponsor.id)}
                      className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      title={language === "zh" ? "删除" : "Delete"}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="h-16 w-auto max-w-full rounded-lg object-contain"
                  />
                  <h4 className="font-bold text-stone-800 text-sm">{sponsor.name}</h4>
                </div>

                {sponsor.homepageUrl && (
                  <a
                    href={sponsor.homepageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#5A5A40] hover:underline font-semibold flex items-center gap-1 group-hover:text-amber-800 transition-colors"
                  >
                    <span>{language === "zh" ? "官方主页" : "Visit Website"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}

            {brandSponsors.length === 0 && (
              <div className="col-span-full bg-stone-50 border border-[#E5E1D8] border-dashed rounded-2xl py-12 text-center text-stone-400 text-xs">
                {language === "zh" ? "暂无赞助商信息。管理员可以点击上方添加。" : "No brand sponsors found. Admins can click above to add."}
              </div>
            )}
          </div>
        </div>

        {/* General Donors / Backers */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E1D8]/70 pb-3">
            <div className="space-y-1">
              <h3 className="serif text-xl font-semibold text-stone-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{language === "zh" ? "所有捐赠支持者" : "Individual Donors & Backers"}</span>
              </h3>
              <p className="text-xs text-stone-400">
                {language === "zh" ? "感谢通过 GitHub Sponsorship 及本站微信、支付宝赞助支持 Loomscape 运转的独立贡献者" : "Gratitude to individual developers sponsoring Loomscape via GitHub Sponsorship or general donation page."}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => openDonorDialog(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === "zh" ? "添加捐赠者" : "Add Donor"}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {donors.map(donor => (
              <div
                key={donor.id}
                className="bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 flex items-center justify-between group transition-all hover:border-stone-400"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-2 h-2 rounded-full bg-[#5A5A40]" />
                  <div className="text-left overflow-hidden">
                    <div className="text-xs font-bold text-stone-800 truncate">{donor.name}</div>
                    <div className="flex items-center gap-1.5 text-[9px] text-stone-400">
                      <span>{donor.date}</span>
                      <span>·</span>
                      <span className={`px-1 rounded ${
                        donor.source === "github" ? "bg-stone-100 text-stone-700" : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                      }`}>
                        {donor.source === "github" ? "GitHub" : (language === "zh" ? "赞助支持页" : "Donation Page")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {donor.amount && (
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {donor.amount}
                    </span>
                  )}
                  {isAdmin && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openDonorDialog(donor)}
                        className="p-1 rounded text-stone-500 hover:bg-stone-100"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteDonor(donor.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {donors.length === 0 && (
              <div className="col-span-full bg-stone-50 border border-[#E5E1D8] border-dashed rounded-xl py-8 text-center text-stone-400 text-xs">
                {language === "zh" ? "暂无捐赠者记录。" : "No donor records available."}
              </div>
            )}
          </div>
        </div>

      </section>

      {/* POPUP MODAL 1: Submitter Showcase Details */}
      <AnimatePresence>
        {selectedSubmitter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#faf9f6] border border-[#E5E1D8] max-w-lg w-full rounded-3xl p-6 relative shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedSubmitter(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>

              <div className="flex items-center gap-4 border-b border-[#E5E1D8] pb-4 mb-5 text-left shrink-0">
                <img
                  src={selectedSubmitter.avatarUrl}
                  alt={selectedSubmitter.name}
                  className="w-16 h-16 rounded-2xl border border-[#E5E1D8] bg-stone-50 object-cover"
                />
                <div>
                  <h4 className="font-serif text-xl font-bold text-stone-800">{selectedSubmitter.name}</h4>
                  <a
                    href={`https://github.com/${selectedSubmitter.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-stone-400 hover:text-[#5A5A40] flex items-center gap-1 font-mono mt-0.5"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>@{selectedSubmitter.github}</span>
                  </a>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-left pr-1 scrollbar-none">
                <h5 className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  {language === "zh" 
                    ? `已发布的应用 (${selectedSubmitter.projects.length})` 
                    : `PUBLISHED LANDSCAPES (${selectedSubmitter.projects.length})`}
                </h5>

                <div className="space-y-3">
                  {selectedSubmitter.projects.map(proj => (
                    <div
                      key={proj.id}
                      className="bg-white border border-[#E5E1D8] rounded-xl p-4 space-y-2 hover:border-[#5A5A40]/40 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h6 className="font-bold text-stone-800 text-sm leading-snug">{proj.title}</h6>
                        <span className="text-[10px] text-[#5A5A40] bg-[#5A5A40]/5 border border-[#5A5A40]/10 px-2 py-0.5 rounded-full shrink-0 font-medium font-sans">
                          {proj.tags[0]}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed truncate-2-lines">{proj.tagline}</p>
                      <div className="flex items-center gap-2 pt-1 border-t border-[#E5E1D8]/40">
                        <span className="text-[10px] text-stone-400">
                          {language === "zh" ? "主人公：" : "Protagonist: "}
                          <strong className="text-stone-600 font-medium">{proj.targetPerson.name}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E1D8] shrink-0">
                <a
                  href={`https://github.com/${selectedSubmitter.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#5A5A40] hover:bg-[#484833] text-white rounded-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Github className="w-4 h-4 text-white" />
                  <span>{language === "zh" ? "访问其 GitHub 主页" : "Visit GitHub Profile"}</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN DIALOG 1: Core Member Create/Edit */}
      <AnimatePresence>
        {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#faf9f6] border border-[#E5E1D8] max-w-lg w-full rounded-3xl p-6 relative shadow-xl overflow-hidden flex flex-col"
            >
              <button
                onClick={() => setShowMemberModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>

              <h4 className="serif text-xl font-bold mb-4 text-left">
                {editingMember ? (language === "zh" ? "编辑核心成员" : "Edit Core Member") : (language === "zh" ? "添加核心成员" : "Add Core Member")}
              </h4>

              <form onSubmit={handleSaveMember} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "成员姓名" : "Member Name"}</label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: 林织羽"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "GitHub 用户名" : "GitHub Username"}</label>
                  <input
                    type="text"
                    required
                    value={memberForm.github}
                    onChange={(e) => setMemberForm({ ...memberForm, github: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: linzhiyu"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "个人网站" : "Personal Website"}</label>
                  <input
                    type="url"
                    value={memberForm.websiteUrl}
                    onChange={(e) => setMemberForm({ ...memberForm, websiteUrl: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: https://linzhiyu.github.io"
                  />
                </div>

                {/* Custom Project Link addition with auto metadata */}
                <div className="space-y-2 pt-2 border-t border-[#E5E1D8]">
                  <label className="text-xs font-bold text-stone-600 flex items-center justify-between">
                    <span>{language === "zh" ? "精选展示作品链接" : "Showcase Project Links"}</span>
                    <span className="text-[10px] text-stone-400 font-normal">{language === "zh" ? "输入主页地址自动读取标题与Favicon" : "Enter website URL to auto-retrieve meta"}</span>
                  </label>
                  
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="flex-1 bg-white border border-[#E5E1D8] rounded-xl px-4 py-1.5 text-xs focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    />
                    <button
                      type="button"
                      disabled={fetchingMetadata}
                      onClick={handleFetchMetadata}
                      className="bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-semibold px-4 rounded-xl flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      {fetchingMetadata ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>{language === "zh" ? "读取生成" : "Fetch"}</span>
                    </button>
                  </div>

                  {/* Showcase list with delete */}
                  <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto pr-1">
                    {memberForm.projectLinks.map((link, idx) => (
                      <div key={idx} className="bg-white border border-[#E5E1D8] rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <img src={link.favicon || "https://github.com/favicon.ico"} alt="" className="w-3.5 h-3.5 rounded shrink-0" onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://github.com/favicon.ico";
                          }} />
                          <span className="truncate text-stone-700 font-medium">{link.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMemberForm({
                            ...memberForm,
                            projectLinks: memberForm.projectLinks.filter((_, i) => i !== idx)
                          })}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E1D8] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="border border-[#E5E1D8] text-stone-600 rounded-full px-5 py-2 text-xs font-semibold"
                  >
                    {language === "zh" ? "取消" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-[#5A5A40] hover:bg-[#484833] text-white rounded-full px-5 py-2 text-xs font-semibold"
                  >
                    {language === "zh" ? "保存" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN DIALOG 2: Brand Sponsor Create/Edit */}
      <AnimatePresence>
        {showSponsorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#faf9f6] border border-[#E5E1D8] max-w-lg w-full rounded-3xl p-6 relative shadow-xl overflow-hidden"
            >
              <button
                onClick={() => setShowSponsorModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>

              <h4 className="serif text-xl font-bold mb-4 text-left">
                {editingSponsor ? (language === "zh" ? "编辑品牌赞助商" : "Edit Brand Sponsor") : (language === "zh" ? "添加品牌赞助商" : "Add Brand Sponsor")}
              </h4>

              <form onSubmit={handleSaveSponsor} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "赞助商名称" : "Sponsor Name"}</label>
                  <input
                    type="text"
                    required
                    value={sponsorForm.name}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: Antigravity"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "Logo 链接地址" : "Logo Link URL"}</label>
                  <input
                    type="url"
                    required
                    value={sponsorForm.logoUrl}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, logoUrl: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: https://images.unsplash.com/photo-..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "赞助商官网" : "Sponsor Website"}</label>
                  <input
                    type="url"
                    value={sponsorForm.homepageUrl}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, homepageUrl: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "赞助商级别 / 类型" : "Sponsor Tier / Type"}</label>
                  <input
                    type="text"
                    required
                    value={sponsorForm.tier}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: 钻石赞助商 / Diamond"
                  />
                </div>

                <div className="pt-4 border-t border-[#E5E1D8] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSponsorModal(false)}
                    className="border border-[#E5E1D8] text-stone-600 rounded-full px-5 py-2 text-xs font-semibold"
                  >
                    {language === "zh" ? "取消" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-5 py-2 text-xs font-semibold"
                  >
                    {language === "zh" ? "保存" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN DIALOG 3: General Donor Create/Edit */}
      <AnimatePresence>
        {showDonorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#faf9f6] border border-[#E5E1D8] max-w-lg w-full rounded-3xl p-6 relative shadow-xl overflow-hidden"
            >
              <button
                onClick={() => setShowDonorModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>

              <h4 className="serif text-xl font-bold mb-4 text-left">
                {editingDonor ? (language === "zh" ? "编辑捐赠支持记录" : "Edit Donor Record") : (language === "zh" ? "添加捐赠支持记录" : "Add Donor Record")}
              </h4>

              <form onSubmit={handleSaveDonor} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "捐赠者尊称" : "Donor Name"}</label>
                  <input
                    type="text"
                    required
                    value={donorForm.name}
                    onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: 张明"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "捐赠支持金额" : "Donation Amount"}</label>
                  <input
                    type="text"
                    value={donorForm.amount}
                    onChange={(e) => setDonorForm({ ...donorForm, amount: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                    placeholder="如: ¥100 或 $15"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "捐赠渠道来源" : "Donation Source"}</label>
                  <select
                    value={donorForm.source}
                    onChange={(e) => setDonorForm({ ...donorForm, source: e.target.value as any })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                  >
                    <option value="sponsor_page">{language === "zh" ? "赞助支持页面" : "Sponsor/Donation Page"}</option>
                    <option value="github">GitHub Sponsorship</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600">{language === "zh" ? "支持日期" : "Sponsorship Date"}</label>
                  <input
                    type="date"
                    required
                    value={donorForm.date}
                    onChange={(e) => setDonorForm({ ...donorForm, date: e.target.value })}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-[#E5E1D8] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDonorModal(false)}
                    className="border border-[#E5E1D8] text-stone-600 rounded-full px-5 py-2 text-xs font-semibold"
                  >
                    {language === "zh" ? "取消" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-5 py-2 text-xs font-semibold"
                  >
                    {language === "zh" ? "保存" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
