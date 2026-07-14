import React, { useState } from "react";
import { Check, X, ShieldAlert, BookOpen, User, Github, CheckCircle, Clock, Trash2, ShieldCheck } from "lucide-react";
import { Project } from "../types";
import { renderMarkdown } from "../lib/markdown";

interface ModeratorPortalProps {
  pendingProjects: Project[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
}

export default function ModeratorPortal({ pendingProjects, onApprove, onReject, onRefresh }: ModeratorPortalProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"story" | "readme">("story");

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 md:px-0 page-fade-in text-left">
      
      {/* Portal Banner Header */}
      <div className="bg-stone-900 text-[#faf9f6] p-6 md:p-8 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#ebd9c5] text-xs font-bold font-mono tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4 text-[#ebd9c5]" />
            <span>LOOMSCAPE CORE GUARD</span>
          </div>
          <h2 className="serif text-xl md:text-2xl font-medium tracking-tight">守望角 · 项目叙事审核终端</h2>
          <p className="text-stone-400 text-xs md:text-sm mt-2 max-w-xl leading-relaxed">
            每一个加入织机风景的项目，都承载着对具体个体的关怀与奉献。
            作为守护者，请严格审视是否包含“两个 README”，即：一个介绍项目代码，另一个真挚地记录“他是为了谁、解决了什么困难”。
          </p>
        </div>

        <button 
          onClick={onRefresh}
          className="bg-[#faf9f6]/10 hover:bg-[#faf9f6]/20 text-[#faf9f6] border border-stone-700 font-semibold px-4.5 py-2.5 rounded-full text-xs transition-colors cursor-pointer shrink-0"
        >
          刷新等待队列 / Sync
        </button>
      </div>

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
                    <span className="font-bold text-stone-400 uppercase tracking-widest block mb-1">受助人现状 & 关系</span>
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

    </div>
  );
}
