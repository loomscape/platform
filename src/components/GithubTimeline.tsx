import React, { useState, useEffect } from "react";
import { GitBranch, GitCommit, GitPullRequest, Users, Activity, ExternalLink, RefreshCw, Star, Heart } from "lucide-react";
import { Contributor, Commit } from "../types";

export default function GithubTimeline() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [contribRes, commitRes] = await Promise.all([
        fetch("/api/github/contributors"),
        fetch("/api/github/commits")
      ]);

      if (contribRes.ok && commitRes.ok) {
        const contribData = await contribRes.json();
        const commitData = await commitRes.json();
        setContributors(contribData);
        setCommits(commitData);
      } else {
        setError("无法从 GitHub 织造网获取实时数据，请稍后刷新重试。");
      }
    } catch (err) {
      console.error(err);
      setError("网络错误：无法建立与 Loomscape 组织的网络连接。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 md:px-0 page-fade-in text-left">
      
      {/* Dynamic Sync Banner */}
      <div className="bg-[#F9F8F6] border border-[#E5E1D8] p-6 md:p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-shadow">
        <div>
          <h2 className="serif text-xl md:text-2xl font-medium text-[#2D2D2D] flex items-center gap-2">
            <Activity className="w-5.5 h-5.5 text-[#5A5A40] animate-pulse" />
            <span>GitHub 织造脉搏 & 贡献者看板</span>
          </h2>
          <p className="text-[#6B665E] text-sm mt-2 max-w-2xl leading-relaxed">
            与官方 GitHub 组织 <a href="https://github.com/loomscape" target="_blank" rel="noreferrer" className="text-[#5A5A40] font-semibold hover:underline inline-flex items-center gap-0.5">@loomscape <ExternalLink className="w-3.5 h-3.5" /></a> 深度集成。
            独织者的每一步，都是正在延展的织网。
          </p>
        </div>

        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#484833] text-white px-4.5 py-2.5 rounded-full text-xs font-semibold shadow transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>同步最新动态 / Sync</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 border border-rose-200 text-xs p-4 rounded-2xl mb-6">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-stone-500 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5A5A40] border-t-transparent mx-auto" />
          <p className="text-xs font-mono tracking-widest text-[#5A5A40]">CONNECTING TO LOOMSCAPE FABRIC NETWORK...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel (2 spans): Weaving commits activity */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-white p-5 rounded-3xl border border-[#E5E1D8] card-shadow">
              <div className="text-center md:text-left">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-400 tracking-wider block">项目流 / Repos</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-[#2D2D2D] mt-1 block">3</span>
              </div>
              <div className="text-center md:text-left border-x border-stone-100 px-2 sm:px-4">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-400 tracking-wider block">独织人 / Weavers</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-[#2D2D2D] mt-1 block">{contributors.length}</span>
              </div>
              <div className="text-center md:text-left pl-1 sm:pl-2">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-400 tracking-wider block">提交数 / Commits</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-[#2D2D2D] mt-1 block">{commits.length}</span>
              </div>
            </div>

            {/* Commits List */}
            <div className="bg-white rounded-3xl border border-[#E5E1D8] p-5 sm:p-6 card-shadow">
              <h3 className="serif text-base font-bold text-[#5A5A40] uppercase tracking-widest mb-6 pb-2.5 border-b border-[#E5E1D8] flex items-center gap-2">
                <GitCommit className="w-4.5 h-4.5 text-[#5A5A40]" />
                <span>织机运作近况 / Commit Log</span>
              </h3>

              {commits.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center font-mono">暂无近期代码变更</p>
              ) : (
                <div className="relative border-l-2 border-[#E5E1D8]/40 pl-5 sm:pl-6 ml-2.5 space-y-6 text-left">
                  {commits.map((c, i) => (
                    <div key={c.sha} className="relative group page-fade-in">
                      
                      {/* Thread Node Bullet */}
                      <span className="absolute -left-[30px] sm:-left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#faf9f6] border-2 border-[#5A5A40] ring-4 ring-[#faf9f6] group-hover:bg-[#5A5A40] transition-colors" />

                      {/* Commit details */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-[#2D2D2D] group-hover:text-[#5A5A40] transition-colors">
                              {c.message}
                            </span>
                            <span className="text-[10px] font-mono bg-[#E5E1D8]/40 text-[#5A5A40] border border-[#E5E1D8]/60 px-1.5 py-0.5 rounded">
                              {c.repoName}
                            </span>
                          </div>

                          <span className="text-[10px] text-stone-400 font-mono shrink-0">
                            {new Date(c.date).toLocaleString("zh-CN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Author info & hash */}
                        <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            <img 
                              src={c.author.avatarUrl} 
                              alt={c.author.login}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full border border-[#E5E1D8] object-cover" 
                            />
                            <span className="text-[11px] text-stone-500">
                              <span className="font-semibold text-stone-700">{c.author.name || c.author.login}</span> 提交代码
                            </span>
                          </div>

                          <a 
                            href={`https://github.com/loomscape/${c.repoName}/commit/${c.sha}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-[#5A5A40] font-mono hover:underline hover:text-[#484833]"
                          >
                            {c.sha.substring(0, 7)}
                          </a>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Contributors list */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-3xl p-5 card-shadow">
              <h3 className="serif text-base font-bold text-[#5A5A40] uppercase tracking-widest mb-4 pb-2.5 border-b border-[#E5E1D8] flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-[#5A5A40]" />
                <span>社区独织人 / Weavers</span>
              </h3>

              <div className="space-y-3.5 text-left">
                {contributors.map(c => (
                  <div 
                    key={c.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-[#E5E1D8] rounded-2xl hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={c.avatarUrl} 
                        alt={c.login}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-[#E5E1D8] object-cover" 
                      />
                      <div>
                        <span className="text-xs font-bold text-[#2D2D2D] block">
                          {c.login}
                        </span>
                        
                        {c.role && (
                          <span className="text-[9px] bg-[#E5E1D8]/40 text-[#5A5A40] border border-[#E5E1D8]/60 px-1.5 py-0.5 rounded font-mono font-medium block mt-1 w-max">
                            {c.role}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-[#2D2D2D] font-mono block">
                        {c.contributions} 次
                      </span>
                      <a 
                        href={c.htmlUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] text-stone-400 hover:text-[#5A5A40] flex items-center justify-end gap-0.5 mt-1 group-hover:underline"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#E5E1D8] text-center">
                <p className="text-[10px] text-stone-500 italic font-serif">
                  * 编织者排名不分先后，仅代表近期为 Loomscape 生态做出的贡献。
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
