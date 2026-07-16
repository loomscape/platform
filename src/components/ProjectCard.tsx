import React, { useState } from "react";
import { Heart, User, ArrowUpRight, Github, ExternalLink, HelpCircle } from "lucide-react";
import { Project } from "../types";

interface ProjectCardProps {
  key?: string;
  project: Project;
  onOpenDetails: (project: Project) => void;
  onLike: (id: string) => void;
}

export default function ProjectCard({ project, onOpenDetails, onLike }: ProjectCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(project.likes || 0);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(project.id);
    if (!liked) {
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  return (
    <div 
      id={`project-card-${project.id}`}
      onClick={() => onOpenDetails(project)}
      className="group relative bg-white border border-[#E5E1D8] rounded-3xl p-6 md:p-8 card-shadow transition-all duration-300 hover:shadow-xl hover:border-[#5A5A40]/40 flex flex-col justify-between cursor-pointer overflow-hidden"
    >
      {/* Decorative vertical thread thread */}
      <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-[#E5E1D8] via-[#5A5A40] to-[#E5E1D8] group-hover:via-[#484833] transition-colors duration-300" />

      <div>
        {/* Author header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {project.author.avatarUrl ? (
              <img 
                src={project.author.avatarUrl} 
                alt={project.author.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-[#E5E1D8] object-cover" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#F9F8F6] flex items-center justify-center text-stone-600 border border-[#E5E1D8]">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="text-left">
              <span className="text-xs font-semibold text-[#2D2D2D]">{project.author.name}</span>
              <span className="text-[10px] text-stone-400 block font-mono">@{project.author.github}</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            {(project.tags || []).slice(0, 2).map((tag, i) => (
              <span 
                key={i} 
                className="text-[10px] font-medium bg-[#E5E1D8]/40 text-[#5A5A40] px-2.5 py-0.5 rounded-full border border-[#E5E1D8]/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Project title & tagline */}
        <div className="text-left mb-3">
          <h3 className="serif text-xl md:text-2xl font-medium text-[#2D2D2D] group-hover:text-[#5A5A40] transition-colors leading-snug flex items-start gap-1">
            {project.title}
          </h3>
          <p className="text-xs text-[#5A5A40] font-serif font-medium mt-1 italic leading-relaxed">
            “ {project.tagline} ”
          </p>
        </div>

        {/* Narrative Box - For Whom */}
        <div className="bg-[#E5E1D8]/20 rounded-xl p-3.5 text-left border border-[#E5E1D8]/40 my-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
            <span>故事主人公 / For Whom :</span>
            <span className="text-[#5A5A40] bg-[#E5E1D8]/60 px-2 py-0.5 rounded-full font-normal text-[10px]">
              {project.targetPerson.relationship}
            </span>
          </div>
          <p className="text-xs text-[#6B665E] font-sans line-clamp-2">
            {project.targetPerson.description}
          </p>
        </div>

        {/* Problem and Solution teasers */}
        <div className="space-y-3.5 text-left text-xs text-[#6B665E]">
          <div>
            <span className="font-bold text-[#2D2D2D] block mb-0.5">遇到的具体困难：</span>
            <p className="line-clamp-2 text-[#6B665E] font-sans leading-relaxed">
              {project.problemDescription}
            </p>
          </div>

          <div>
            <span className="font-bold text-[#5A5A40] block mb-0.5">独织者的解法：</span>
            <p className="line-clamp-2 text-[#6B665E] font-sans leading-relaxed">
              {project.solutionDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer actions */}
      <div className="mt-6 pt-4 border-t border-[#E5E1D8] flex items-center justify-between">
        
        {/* Like Button */}
        <button 
          id={`like-btn-${project.id}`}
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
            liked 
              ? "bg-rose-50 text-rose-600 border border-rose-200/50" 
              : "bg-white text-stone-500 hover:text-rose-600 border border-[#E5E1D8] hover:bg-rose-50/30"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-rose-600 text-rose-600" : ""}`} />
          <span>{likesCount}</span>
        </button>

        {/* Secondary code links (iconic) */}
        <div className="flex items-center gap-3">
          <a 
            href={project.githubUrl} 
            target="_blank" 
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-stone-400 hover:text-[#5A5A40] transition-colors"
            title="查看源码"
          >
            <Github className="w-4 h-4" />
          </a>
          
          <button 
            id={`open-detail-btn-${project.id}`}
            onClick={() => onOpenDetails(project)}
            className="text-xs font-semibold text-stone-700 hover:text-[#5A5A40] flex items-center gap-0.5 transition-colors"
          >
            <span>故事与文档 / Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
