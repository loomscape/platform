import React from "react";
import { GitMerge, Compass, PlusCircle, Radio, Settings, UserCheck, User as UserIcon } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  pendingCount, 
  currentUser, 
  onLoginClick, 
  onLogoutClick 
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#F9F8F6]/90 backdrop-blur-md border-b border-[#E5E1D8] px-4 md:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setCurrentTab("projects")}
          className="flex items-center gap-3 cursor-pointer group"
          id="navbar-brand"
        >
          {/* Custom Weaving Logo Icon */}
          <div className="relative w-9 h-9 bg-[#5A5A40] rounded-lg flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-105 shadow-md">
            <div className="absolute inset-0 opacity-20 flex flex-col justify-between p-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-0.5 w-full bg-white" />
              ))}
            </div>
            <div className="absolute inset-0 opacity-20 flex justify-between p-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-0.5 h-full bg-white" />
              ))}
            </div>
            <GitMerge className="w-5 h-5 text-white relative z-10 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
          </div>

          <div className="text-left">
            <h1 className="text-xl md:text-2xl font-serif font-medium tracking-tight text-[#2D2D2D] flex items-center gap-1.5">
              <span>Loomscape</span>
              <span className="serif text-xl text-[#5A5A40] opacity-50">/</span>
              <span className="text-xs font-sans font-medium text-white bg-[#5A5A40] px-1.5 py-0.5 rounded">织机风景</span>
            </h1>
            <p className="text-[10px] text-stone-500 font-sans tracking-widest hidden sm:block">
              Solitary threads, an infinite landscape.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#E5E1D8]/40 p-1 rounded-full border border-[#E5E1D8] text-[13px] sm:text-sm">
          <button
            id="tab-btn-projects"
            onClick={() => setCurrentTab("projects")}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 ${
              currentTab === "projects"
                ? "bg-[#5A5A40] text-white shadow-sm"
                : "text-stone-600 hover:text-[#5A5A40] hover:bg-[#E5E1D8]/50"
            }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>风景<span className="hidden sm:inline"> / Landscapes</span></span>
          </button>

          <button
            id="tab-btn-apply"
            onClick={() => setCurrentTab("apply")}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 ${
              currentTab === "apply"
                ? "bg-[#5A5A40] text-white shadow-sm"
                : "text-stone-600 hover:text-[#5A5A40] hover:bg-[#E5E1D8]/50"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>编织<span className="hidden sm:inline"> / Create</span></span>
          </button>

          <button
            id="tab-btn-github"
            onClick={() => setCurrentTab("github")}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 ${
              currentTab === "github"
                ? "bg-[#5A5A40] text-white shadow-sm"
                : "text-stone-600 hover:text-[#5A5A40] hover:bg-[#E5E1D8]/50"
            }`}
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>动态<span className="hidden sm:inline"> / Dynamics</span></span>
          </button>

          {currentUser && (currentUser.role === "admin" || currentUser.role === "moderator" || currentUser.role === "守护者") && (
            <button
              id="tab-btn-admin"
              onClick={() => setCurrentTab("admin")}
              className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 relative ${
                currentTab === "admin"
                  ? "bg-[#5A5A40] text-white shadow-sm"
                  : "text-stone-600 hover:text-[#5A5A40] hover:bg-[#E5E1D8]/50"
              }`}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>守望角<span className="hidden sm:inline"> / Moderate</span></span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* User Identity widget */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] pl-2.5 pr-3 py-1.5 rounded-full card-shadow">
              <div 
                onClick={() => setCurrentTab("profile")}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 group/user"
                title="进入我的居民空间"
              >
                <span className="text-lg bg-stone-50 h-8 w-8 rounded-full border border-stone-100 flex items-center justify-center transition-transform group-hover/user:scale-105" title={currentUser.role}>
                  {currentUser.avatar}
                </span>
                <div className="text-left pr-1.5">
                  <div className="text-xs font-bold text-stone-900 leading-tight group-hover/user:text-[#5A5A40] transition-colors">{currentUser.nickname}</div>
                  <span className="text-[9px] text-[#5A5A40] font-semibold tracking-wider uppercase block leading-none mt-0.5">{currentUser.role}</span>
                </div>
              </div>
              <button 
                onClick={onLogoutClick}
                className="text-[10px] text-stone-400 hover:text-red-500 font-mono font-medium pl-2 border-l border-stone-200 transition-colors cursor-pointer"
              >
                登出
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-4.5 py-2.5 rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>登记身份 / Register ID</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
