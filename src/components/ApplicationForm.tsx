import React, { useState } from "react";
import { Sparkles, HelpCircle, FileText, Send, CheckCircle, ArrowRight, BookOpen, PenTool, Check } from "lucide-react";

interface ApplicationFormProps {
  onSubmitSuccess: () => void;
}

export default function ApplicationForm({ onSubmitSuccess }: ApplicationFormProps) {
  // Form states
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorGithub, setAuthorGithub] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetRelation, setTargetRelation] = useState("");
  const [targetDesc, setTargetDesc] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [solutionDescription, setSolutionDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // READMEs state
  const [readmeProject, setReadmeProject] = useState("");
  const [readmeStory, setReadmeStory] = useState("");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // AI Generation trigger
  const handleAIGenerate = async () => {
    if (!title || !targetName || !problemDescription || !solutionDescription) {
      setErrorMsg("请先填写：项目名称、受助人姓名、具体困难、以及解决方案，以便 AI 理解故事背景。");
      return;
    }

    setErrorMsg("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/gemini/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tagline,
          targetName,
          targetRelation,
          targetDesc,
          problemDescription,
          solutionDescription
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReadmeProject(data.readmeProject || "");
        setReadmeStory(data.readmeStory || "");
        setSuccessMsg("✨ AI 成功为您编织了双 README 文档！您可以在下方编辑器中进行微调。");
      } else {
        const err = await response.json();
        setErrorMsg(err.error || "AI 生成失败，请稍后重试或手动编写。");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("与服务器通信失败，请检查网络后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title || !authorName || !targetName || !problemDescription || !solutionDescription || !githubUrl) {
      setErrorMsg("请填写所有标有 * 的必填字段。");
      return;
    }

    // Ensure READMEs have content
    const finalProjectReadme = readmeProject || `# ${title}\n\n介绍这个专为解决 ${targetName} 问题的开源伙伴工具。`;
    const finalStoryReadme = readmeStory || `# 为什么我们要为 ${targetName} 开发它\n\n叙述这根独织的丝线背后的故事。`;

    setIsSubmitting(true);

    try {
      const parsedTags = tagsInput
        .split(/[,，]/)
        .map(t => t.trim())
        .filter(t => t !== "");

      const response = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tagline,
          authorName,
          authorGithub,
          authorEmail,
          targetName,
          targetRelation,
          targetDesc,
          problemDescription,
          solutionDescription,
          githubUrl,
          demoUrl,
          readmeProject: finalProjectReadme,
          readmeStory: finalStoryReadme,
          tags: parsedTags
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onSubmitSuccess();
        }, 2500);
      } else {
        const err = await response.json();
        setErrorMsg(err.error || "提交申请失败，请稍后重试。");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("服务器连接错误，提交失败。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-white border border-green-200 rounded-3xl card-shadow text-center page-fade-in">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl md:text-2xl font-serif font-medium text-stone-900 mb-2">编织申请提交成功！</h3>
        <p className="text-[#6B665E] text-sm max-w-md mx-auto mb-6 leading-relaxed">
          您的个人叙事项目已经进入「守望角」进行审核。
          审核通过后，它将以精美卡片流的形式展示在 Loomscape 织机风景主页中。
        </p>
        <div className="text-xs text-[#5A5A40] bg-[#E5E1D8]/40 inline-block px-4 py-2 rounded-full font-semibold border border-[#E5E1D8] animate-pulse">
          正在为您返回主风景流...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 md:px-0 page-fade-in">
      
      {/* Narrative Intro / Explanation Banner */}
      <div className="bg-white border border-[#E5E1D8] p-6 md:p-8 rounded-3xl mb-8 text-left relative overflow-hidden card-shadow">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
          <BookOpen className="w-full h-full text-stone-900" />
        </div>
        
        <h2 className="serif text-xl md:text-2xl font-medium text-stone-900 flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#5A5A40] animate-spin-slow" />
          <span>Loomscape 编织契约与规则说明</span>
        </h2>
        
        <p className="text-[#6B665E] text-sm leading-relaxed mb-4">
          在 Loomscape 社区，我们坚守一个纯粹的信念：<strong>“为具体的人开发具体的伙伴工具”</strong>。
          我们不追求宏大的叙事与抽象的用户指标，而珍视每一位具体个体的困境与微小的技术救赎。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 bg-[#F9F8F6] p-5 rounded-2xl border border-[#E5E1D8] text-xs text-stone-700">
          <div>
            <span className="font-bold text-stone-900 block mb-1">📖 README 1：介绍项目 / The Spec</span>
            <span className="leading-relaxed text-[#6B665E]">
              常规的软件规范。说明技术栈是什么、硬件清单、核心频率/姿态捕获算法、如何编译运行、API 数据结构以及开源协议。
            </span>
          </div>
          <div>
            <span className="font-bold text-[#5A5A40] block mb-1">🌸 README 2：介绍背景 / The Story</span>
            <span className="leading-relaxed text-[#6B665E]">
              充满人文温度的个人叙事。告诉读者<strong>“这是为了谁（是谁、关系、生活现状）”</strong>、<strong>“他们遇到了什么具体困难”</strong>、以及<strong>“你是如何怀着爱意去编织这段代码去救赎的”</strong>。
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-500 italic font-serif">
          * 如果您不习惯写 README，别担心！Loomscape 为您内置了 **Gemini 智能辅助工具**。在下方填写受助人和困难后，点击「AI 智能生成」即可自动编织两份标准文档。
        </p>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleFormSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Artisan Details */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5E1D8] text-left card-shadow">
              <h3 className="serif text-base font-bold text-[#5A5A40] uppercase tracking-widest mb-6 pb-2.5 border-b border-[#E5E1D8] flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-[#5A5A40]" />
                <span>1. 独织者信息 / Loom Artisan</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">您的名字 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如：林织羽 (Lin Zhiyu)" 
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none placeholder-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">GitHub 账号名 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如：linzhiyu" 
                    value={authorGithub}
                    onChange={(e) => setAuthorGithub(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none font-mono placeholder-stone-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">联系邮箱 (选填，仅限成员交流)</label>
                  <input 
                    type="email" 
                    placeholder="如：zhiyu@loomscape.org" 
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none placeholder-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Recipient Details */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5E1D8] text-left card-shadow">
              <h3 className="serif text-base font-bold text-[#5A5A40] uppercase tracking-widest mb-6 pb-2.5 border-b border-[#E5E1D8] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#5A5A40]" />
                <span>2. 你的具体受助人 / Intended Recipient</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">受助人称呼 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如：外婆" 
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none placeholder-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">关系或特征 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如：隔代至亲 / 82岁老人" 
                    value={targetRelation}
                    onChange={(e) => setTargetRelation(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none placeholder-stone-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">他的具体生活现状 *</label>
                  <textarea 
                    required
                    rows={2}
                    placeholder="描述他们当前的困难或生活背景，如：“奶奶年纪大重度耳背，在厨房烧水、门铃响了都听不到，水经常烧干带来安全隐患。”" 
                    value={targetDesc}
                    onChange={(e) => setTargetDesc(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none leading-relaxed placeholder-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Project core */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5E1D8] text-left card-shadow">
              <h3 className="serif text-base font-bold text-[#5A5A40] uppercase tracking-widest mb-6 pb-2.5 border-b border-[#E5E1D8] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#5A5A40]" />
                <span>3. 织造的工具详情 / Tool Details</span>
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">工具/项目名称 *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="如：听觉智能眼镜 / Hearing Watch" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none placeholder-stone-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">一句话 Slogan *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="如：为耳背的奶奶开发的水壶沸腾与门铃振动提醒器" 
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none placeholder-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">遇到的具体困难是什么？ *</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="阐明他们所经历的具体痛点。例如：“市面上助听器很沉且总啸叫，外婆不愿戴。我们需要一种零操作、纯依靠身体震动检测高频沸腾声的专用小工具。”" 
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none leading-relaxed placeholder-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">您的具体技术解法是什么？ *</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="介绍您是如何用轻量、优雅的代码解决的。例如：“使用 ESP32 芯片和高敏麦克风，写了一个带通傅里叶捕获，一旦探测到 3.2kHz 沸腾频率，强震手环上的扁平马达，并高亮 OLED 提示。”" 
                    value={solutionDescription}
                    onChange={(e) => setSolutionDescription(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none leading-relaxed placeholder-stone-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">GitHub 仓库地址 *</label>
                    <input 
                      type="url" 
                      required
                      placeholder="如：https://github.com/loomscape/hearing-watch" 
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none font-mono placeholder-stone-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">预览或演示地址 (选填)</label>
                    <input 
                      type="url" 
                      placeholder="如：https://hearing-watch-demo.vercel.app" 
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none font-mono placeholder-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">标签 (用逗号分隔，如：ESP32, 无障碍, 助老)</label>
                  <input 
                    type="text" 
                    placeholder="ESP32, 无障碍, 助老" 
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full text-sm bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none placeholder-stone-400"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: AI Generation & README editor */}
          <div className="space-y-6">
            
            {/* AI Assistant Control panel */}
            <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl text-left card-shadow">
              <h4 className="serif text-base font-bold text-[#5A5A40] flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4.5 h-4.5 text-[#5A5A40] animate-pulse" />
                <span>Loomscape AI 织品助手</span>
              </h4>
              <p className="text-xs text-[#6B665E] leading-relaxed mb-4 font-sans">
                写一个好故事和文档是耗费心力的。
                Loomscape 的内置 Gemini AI 引擎可以根据您左侧填写的**受助人特征、生活现状和代码解法**，自动编织成具有强大情感穿透力和技术规范的双 README 结构。
              </p>

              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-medium py-3 px-4 rounded-full shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>正在努力编织故事与代码...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI 智能生成双 README 结构</span>
                  </>
                )}
              </button>

              {successMsg && (
                <div className="mt-3 text-[11px] text-[#5A5A40] bg-[#E5E1D8]/20 p-3 rounded-xl border border-[#E5E1D8]">
                  {successMsg}
                </div>
              )}
            </div>

            {/* Document Preview & Editor 1 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8] text-left card-shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                  <span>README 一：为谁而开发 (情感故事)</span>
                </label>
                <span className="text-[10px] text-[#5A5A40] bg-[#E5E1D8]/40 px-2 py-0.5 rounded-full font-semibold font-mono">FOR_WHOM.md</span>
              </div>
              <textarea 
                rows={7}
                placeholder="# 为什么我们要为外婆开发它... (可通过上方 AI 智能一键生成，或手动编录 Markdown)" 
                value={readmeStory}
                onChange={(e) => setReadmeStory(e.target.value)}
                className="w-full text-xs bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl p-3 font-mono focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none leading-relaxed placeholder-stone-400"
              />
            </div>

            {/* Document Preview & Editor 2 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8] text-left card-shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                  <span>README 二：项目工具介绍 (技术规范)</span>
                </label>
                <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-semibold font-mono">README.md</span>
              </div>
              <textarea 
                rows={7}
                placeholder="# Hearing Watch - 音频振动提醒...\n\n技术架构、编译与烧录说明、引脚连线..." 
                value={readmeProject}
                onChange={(e) => setReadmeProject(e.target.value)}
                className="w-full text-xs bg-[#F9F8F6]/40 border border-[#E5E1D8] rounded-xl p-3 font-mono focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none leading-relaxed placeholder-stone-400"
              />
            </div>

          </div>

        </div>

        {/* Global errors and actions */}
        {errorMsg && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-4 rounded-xl text-left font-sans">
            ⚠️ <strong>提示错误:</strong> {errorMsg}
          </div>
        )}

        <div className="pt-6 border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400 italic text-left">
            * 提交即代表您已测试代码其高可靠性，且属于真实的针对具体个体的开发项目。
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-[#5A5A40] hover:bg-[#484833] text-white text-sm font-medium py-3.5 px-8 rounded-full shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>正在提交到织机守护端...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>申请发布个人叙事项目 / Submit</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
