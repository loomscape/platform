import React, { useState, useEffect } from "react";
import { GitMerge, Compass, PlusCircle, Radio, Settings, UserCheck, Heart, X, Copy, Check, Globe, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  language: "zh" | "en";
  setLanguage: (lang: "zh" | "en") => void;
}

const getTiers = (currency: "CNY" | "USD", lang: "zh" | "en") => [
  {
    id: "coffee",
    price: currency === "CNY" ? "¥35" : "$5",
    title: lang === "zh" ? "一杯清啡 / Coffee" : "A Cup of Coffee",
    desc: lang === "zh" 
      ? "让代码在墨香中畅快织就，支持基础研发。" 
      : "Fuel basic development and keep the code writing fresh with caffeine."
  },
  {
    id: "guardian",
    price: currency === "CNY" ? "¥100" : "$15",
    title: lang === "zh" ? "守望者 / Guardian" : "The Guardian",
    desc: lang === "zh" 
      ? "支撑服务器与缓存托管，点亮终成风景的旅途。" 
      : "Support hosting servers, cache systems, and illuminating the journey."
  },
  {
    id: "weaver",
    price: currency === "CNY" ? "¥350" : "$50",
    title: lang === "zh" ? "织梦人 / Dreamweaver" : "The Dreamweaver",
    desc: lang === "zh" 
      ? "深度资助项目成长，名字将被记录于致谢鸣谢碑。" 
      : "Deeply sponsor project growth and have your name recorded on the hall of fame."
  },
  {
    id: "custom",
    price: currency === "CNY" ? "任意金额" : "Custom Amount",
    title: lang === "zh" ? "任意金额 / Custom Amount" : "Custom Amount",
    desc: lang === "zh"
      ? "自定任意支持金额，不论多寡，皆是风景的一部分。"
      : "Decide your own contribution amount. Any drop of support counts."
  }
];

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  pendingCount, 
  currentUser, 
  onLoginClick, 
  onLogoutClick,
  language,
  setLanguage
}: NavbarProps) {
  const [showDonate, setShowDonate] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"github" | "wechat_alipay" | "paypal">("github");
  const [currency, setCurrency] = useState<"CNY" | "USD">("CNY");
  const [selectedTier, setSelectedTier] = useState<string>("coffee");
  const [customAmount, setCustomAmount] = useState("");
  const [copiedText, setCopiedText] = useState("");
  const [logoPattern, setLogoPattern] = useState<string[][]>([]);

  useEffect(() => {
    const colors = [
      "#5A5A40", // Loom Slate
      "#8A9A86", // Sage Green
      "#D9A05B", // Ochre Yellow
      "#C27D65", // Terracotta Clay
      "#6B7F96", // Slate Blue
      "#C29B9B", // Muted Rose
      "#8E8294", // Muted Lavender
      "#D98373", // Soft Coral
    ];

    // Generate beautiful symmetrical 5x5 grid pattern
    const grid: string[][] = [];
    for (let r = 0; r < 5; r++) {
      grid[r] = [];
      for (let c = 0; c < 3; c++) {
        const isFilled = Math.random() > 0.35; // ~65% density
        grid[r][c] = isFilled ? colors[Math.floor(Math.random() * colors.length)] : "";
      }
      grid[r][3] = grid[r][1];
      grid[r][4] = grid[r][0];
    }
    setLogoPattern(grid);

    // Apply dynamic favicon using SVG data URI
    try {
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 5" width="32" height="32">
          ${grid.map((row, r) => 
            row.map((color, c) => 
              `<rect x="${c}" y="${r}" width="0.85" height="0.85" fill="${color || '#EAE6DF'}" rx="0.15" ry="0.15" />`
            ).join('')
          ).join('')}
        </svg>
      `;
      const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    } catch (e) {
      console.error("Failed to generate dynamic favicon:", e);
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const currentTiers = getTiers(currency, language);
  const selectedTierObj = currentTiers.find((t) => t.id === selectedTier);

  // Computed amount for QR Code display details
  const displayAmountText = selectedTier === "custom"
    ? (customAmount ? `${currency === "CNY" ? "¥" : "$"}${customAmount}` : (language === "zh" ? "未指定金额" : "Not Specified"))
    : (selectedTierObj ? selectedTierObj.price : "");

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F9F8F6]/90 backdrop-blur-md border-b border-[#E5E1D8] px-4 md:px-8 py-3.5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand / Logo */}
          <div 
            onClick={() => setCurrentTab("projects")}
            className="flex items-center gap-3 cursor-pointer group"
            id="navbar-brand"
          >
            {/* 5x5 Grid Matrix Logo Icon */}
            <div className="w-9 h-9 bg-[#F9F8F6] border border-[#E5E1D8] rounded-lg p-[3px] grid grid-cols-5 gap-[1.5px] transition-all duration-500 group-hover:scale-105 shadow-sm overflow-hidden shrink-0">
              {logoPattern.length > 0 ? (
                logoPattern.flatMap((row, r) => 
                  row.map((color, c) => (
                    <div 
                      key={`${r}-${c}`} 
                      className="rounded-[1.5px] transition-all duration-500"
                      style={{ backgroundColor: color || "#EAE6DF" }}
                    />
                  ))
                )
              ) : (
                // Fallback before pattern is loaded
                [...Array(25)].map((_, i) => (
                  <div key={i} className="bg-[#EAE6DF] rounded-[1.5px]" />
                ))
              )}
            </div>

            <div className="text-left">
              <h1 className="text-xl md:text-2xl font-serif font-medium tracking-tight text-[#2D2D2D] flex items-center gap-1.5">
                <span>Loomscape</span>
                <span className="serif text-xl text-[#5A5A40] opacity-50">/</span>
                <span className="text-xs font-sans font-medium text-white bg-[#5A5A40] px-1.5 py-0.5 rounded">
                  {language === "zh" ? "织景" : "Landscape"}
                </span>
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
              <span>{language === "zh" ? "风景" : "Landscapes"}</span>
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
              <span>{language === "zh" ? "编织" : "Create"}</span>
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
              <span>{language === "zh" ? "动态" : "Dynamics"}</span>
            </button>

            <button
              id="tab-btn-contributors"
              onClick={() => setCurrentTab("contributors")}
              className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 ${
                currentTab === "contributors"
                  ? "bg-[#5A5A40] text-white shadow-sm"
                  : "text-stone-600 hover:text-[#5A5A40] hover:bg-[#E5E1D8]/50"
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{language === "zh" ? "社区" : "Community"}</span>
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
                <span>{language === "zh" ? "守望角" : "Moderate"}</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* User Identity widget with integrated Sponsor Button & Lang Toggle */}
          <div className="flex items-center gap-2">
            
            {/* Global Language Toggle */}
            <button
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
              className="bg-white hover:bg-stone-50 text-stone-700 border border-[#E5E1D8] font-medium text-xs px-3 py-2.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 shrink-0"
              title={language === "zh" ? "Switch to English" : "切换至中文"}
            >
              <Globe className="w-3.5 h-3.5 text-stone-400" />
              <span>{language === "zh" ? "EN" : "中文"}</span>
            </button>

            {/* Elegant Open Source Sponsor Button - Bright Green Color */}
            <button
              onClick={() => setShowDonate(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
              id="sponsor-btn"
            >
              <Heart className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
              <span>{language === "zh" ? "赞助支持" : "Sponsor"}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] pl-2.5 pr-3 py-1.5 rounded-full card-shadow shrink-0">
                <div 
                  onClick={() => setCurrentTab("profile")}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 group/user"
                  title={language === "zh" ? "进入我的居民空间" : "Go to my profile"}
                >
                  <span className="text-lg bg-stone-50 h-8 w-8 rounded-full border border-stone-100 flex items-center justify-center transition-transform group-hover/user:scale-105 overflow-hidden" title={currentUser.role}>
                    {currentUser.avatar && (currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("/")) ? (
                      <img src={currentUser.avatar} className="w-full h-full object-cover rounded-full" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      currentUser.avatar
                    )}
                  </span>
                  <div className="text-left pr-1.5 hidden md:block">
                    <div className="text-xs font-bold text-stone-900 leading-tight group-hover/user:text-[#5A5A40] transition-colors">{currentUser.nickname}</div>
                    <span className="text-[9px] text-[#5A5A40] font-semibold tracking-wider uppercase block leading-none mt-0.5">{currentUser.role}</span>
                  </div>
                </div>
                <button 
                  onClick={onLogoutClick}
                  className="text-[10px] text-stone-400 hover:text-red-500 font-mono font-medium pl-2 border-l border-stone-200 transition-colors cursor-pointer"
                >
                  {language === "zh" ? "登出" : "Logout"}
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === "zh" ? "登记身份" : "Register ID"}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Elegant, Cohesive Sponsor Modal */}
      <AnimatePresence>
        {showDonate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDonate(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FBFBFA] border border-[#E5E1D8] w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden text-stone-800 flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              {/* Top Cover */}
              <div className="relative bg-[#5A5A40] px-6 py-6 text-white flex justify-between items-start">
                <div className="absolute inset-0 opacity-10 flex flex-col justify-between p-2 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-px w-full bg-white" />
                  ))}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
                    <span className="text-[11px] font-mono tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded text-stone-100">Open Source</span>
                  </div>
                  <h3 className="text-xl font-serif font-medium tracking-tight">
                    {language === "zh" ? "资助 Loomscape 织机风景" : "Sponsor Loomscape Project"}
                  </h3>
                  <p className="text-xs text-stone-200 mt-1 font-sans leading-relaxed">
                    {language === "zh" 
                      ? "孤独的线，在此终成风景。您的资助将直接支持项目维护与硬件开销。" 
                      : "Solitary threads, an infinite landscape. Your support directly funds server maintenance and technical operations."}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowDonate(false)}
                  className="bg-black/25 hover:bg-black/40 text-white rounded-full p-1.5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* 1. Currency Selector */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 tracking-wider uppercase mb-2.5">
                    {language === "zh" ? "1. 选择赞助币种 / Choose Currency" : "1. Choose Currency"}
                  </h4>
                  <div className="flex bg-[#E5E1D8]/40 p-1 rounded-lg border border-[#E5E1D8] text-xs font-medium w-full max-w-[240px]">
                    <button
                      type="button"
                      onClick={() => setCurrency("CNY")}
                      className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                        currency === "CNY" ? "bg-white text-stone-950 shadow-sm font-semibold" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      人民币 (CNY ¥)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency("USD")}
                      className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                        currency === "USD" ? "bg-white text-stone-950 shadow-sm font-semibold" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      美元 (USD $)
                    </button>
                  </div>
                </div>

                {/* 2. Support Tiers */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 tracking-wider uppercase mb-2.5">
                    {language === "zh" ? "2. 选择赞助档位 / Select a Tier" : "2. Select a Sponsor Tier"}
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentTiers.map((tier) => (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 relative ${
                          selectedTier === tier.id
                            ? "bg-[#5A5A40]/5 border-[#5A5A40] shadow-sm"
                            : "bg-white border-[#E5E1D8] hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif font-medium text-sm text-stone-900 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${selectedTier === tier.id ? "bg-[#5A5A40]" : "bg-stone-300"}`} />
                            {tier.title}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2 py-0.5 rounded-full">
                            {tier.price}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed pl-4.5">{tier.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Custom Amount Form Field */}
                  {selectedTier === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3.5 pl-4"
                    >
                      <label className="block text-xs font-semibold text-stone-500 mb-1.5">
                        {language === "zh" ? "输入您的支持金额" : "Enter Your Support Amount"}
                      </label>
                      <div className="relative rounded-lg shadow-sm w-full max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-stone-500 text-sm font-mono font-semibold">
                            {currency === "CNY" ? "¥" : "$"}
                          </span>
                        </div>
                        <input
                          type="number"
                          id="custom-amount-input"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="block w-full pl-8 pr-3 py-2 border border-[#E5E1D8] bg-white rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] font-mono"
                          placeholder="0.00"
                          min="1"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 3. Donation Channels */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 tracking-wider uppercase mb-2.5">
                    {language === "zh" ? "3. 选择赞助渠道 / Payment Channel" : "3. Choose Payment Channel"}
                  </h4>
                  <div className="flex bg-[#E5E1D8]/40 p-1 rounded-lg border border-[#E5E1D8] text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedTab("github")}
                      className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                        selectedTab === "github" ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      GitHub Sponsors
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTab("wechat_alipay")}
                      className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                        selectedTab === "wechat_alipay" ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      {language === "zh" ? "微信/支付宝" : "WeChat/Alipay"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTab("paypal")}
                      className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                        selectedTab === "paypal" ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      PayPal / Card
                    </button>
                  </div>
                </div>

                {/* Tab content area */}
                <div className="bg-white border border-[#E5E1D8] rounded-xl p-4 text-center">
                  {selectedTab === "github" && (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200">
                          <svg className="w-6 h-6 text-stone-900" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-900 text-sm">GitHub Sponsors Program</h5>
                        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
                          {language === "zh" 
                            ? "支持我们的官方 GitHub 项目，所有的赞助资金将被完全公开用于开发与基础运维。" 
                            : "Support our official GitHub organization. 100% of the funds are transparently allocated to feature development and infrastructure."}
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => handleCopy("https://github.com/sponsors/loomscape")}
                          className="bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs px-4 py-2 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-all"
                        >
                          {copiedText === "https://github.com/sponsors/loomscape" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{language === "zh" ? "链接已复制 / Copied" : "Link Copied!"}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{language === "zh" ? "复制赞助链接 / Copy Sponsors Link" : "Copy Sponsors Link"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTab === "wechat_alipay" && (
                    <div className="space-y-3 py-1 flex flex-col items-center">
                      {/* Symmetrical Elegant Vector mock QR to perfectly matching the art style */}
                      <div className="w-32 h-32 border-2 border-stone-200 rounded-xl p-2 bg-stone-50 flex items-center justify-center relative shadow-inner">
                        {/* Elegant minimalist QR representation */}
                        <div className="w-full h-full relative grid grid-cols-6 grid-rows-6 gap-1 opacity-80">
                          {/* Corners */}
                          <div className="col-span-2 row-span-2 bg-[#5A5A40] rounded-sm" />
                          <div className="col-start-5 col-span-2 row-span-2 bg-[#5A5A40] rounded-sm" />
                          <div className="row-start-5 col-span-2 row-span-2 bg-[#5A5A40] rounded-sm" />
                          
                          {/* Some random dots representing clean art style */}
                          <div className="col-start-3 row-start-1 bg-[#D9A05B] rounded-full" />
                          <div className="col-start-4 row-start-2 bg-[#C27D65] rounded-full" />
                          <div className="col-start-3 row-start-4 bg-[#6B7F96] rounded-sm" />
                          <div className="col-start-4 row-start-4 bg-[#5A5A40] rounded-sm" />
                          <div className="col-start-5 row-start-3 bg-[#D9A05B] rounded-sm" />
                          <div className="col-start-6 row-start-4 bg-[#C27D65] rounded-full" />
                          <div className="col-start-3 row-start-5 bg-[#5A5A40] rounded-sm" />
                          <div className="col-start-4 row-start-6 bg-[#6B7F96] rounded-sm" />

                          {/* Inner center brand logo mock */}
                          <div className="col-start-3 col-span-2 row-start-3 row-span-2 bg-white rounded flex items-center justify-center border border-stone-200">
                            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] rounded-xl" />
                      </div>
                      
                      <div className="text-center">
                        <h5 className="font-semibold text-stone-900 text-sm">
                          {language === "zh" ? "爱心发电 (微信与支付宝扫码)" : "Support via WeChat & Alipay QR"}
                        </h5>
                        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                          {language === "zh" 
                            ? "支持使用微信或支付宝。已设定金额：" 
                            : "Supports instant scan payment. Current selected amount: "}
                          <strong className="text-emerald-600 font-mono">
                            {displayAmountText}
                          </strong>
                        </p>
                      </div>

                      <div className="pt-1">
                        <span className="text-[10px] text-stone-400 font-serif italic">
                          {language === "zh" 
                            ? "* 扫描示意码进入爱心开发者合并转账 / Built with love for open source" 
                            : "* Scan the mockup QR to complete payment via global developers pool."}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedTab === "paypal" && (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                          <span className="font-serif font-black italic text-blue-700 text-lg">P</span>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-900 text-sm">PayPal / Global Credit Card</h5>
                        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
                          {language === "zh" 
                            ? "支持国际信用卡、储蓄卡、PayPal 极速安全赞助。" 
                            : "Supports international credit/debit cards and rapid checkout with PayPal."}
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => handleCopy("paypal.me/loomscape_xyz")}
                          className="bg-[#5A5A40] hover:bg-[#4A4A30] text-white font-medium text-xs px-4 py-2 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-all"
                        >
                          {copiedText === "paypal.me/loomscape_xyz" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>{language === "zh" ? "链接已复制 / Copied" : "Link Copied!"}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{language === "zh" ? "复制 PayPal 地址 / Copy PayPal link" : "Copy PayPal Link"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="bg-stone-50 border-t border-[#E5E1D8] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
                <span>
                  {language === "zh" 
                    ? `已经有 128 位织梦人加入了我们。` 
                    : `Over 128 dreamweavers have already joined us.`}
                </span>
                <button
                  onClick={() => setShowDonate(false)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-4 py-2 rounded-lg cursor-pointer transition-all"
                >
                  {language === "zh" ? "关闭" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
