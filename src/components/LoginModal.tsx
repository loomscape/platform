import React, { useState } from "react";
import { X, Sparkles, Heart, Lock, User, Check, AlertCircle, Mail } from "lucide-react";
import { User as UserType } from "../types";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (user: UserType) => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  
  // Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🌸");
  const [selectedRole, setSelectedRole] = useState("普通读者");
  
  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    "受助人亲友",
    "技术织网人"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("请填写完整的账号与密码。");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      if (!email.trim()) {
        setError("请填写您的电子邮箱。");
        setLoading(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("请输入有效的电子邮箱地址。");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("两次输入的密码不一致，请重新输入。");
        setLoading(false);
        return;
      }
      if (!nickname.trim()) {
        setError("请填写您的称呼。");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" 
        ? { username, password } 
        : { username, password, email, nickname, avatar: selectedAvatar, role: selectedRole };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "发生了未知错误，请重试。");
      }

      // Successful Auth!
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "请求失败，请检查网络后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div 
        id="login-modal-container"
        className="bg-[#FDFCFB] border border-[#E5E1D8] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-[#E5E1D8]/40 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#5A5A40]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-[#5A5A40]" />
          </div>
          <h3 className="serif text-xl font-bold text-stone-950">
            {mode === "login" ? "登录您的居民证" : "申领织造风景居民证"}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {mode === "login" 
              ? "登录后即可同步收藏箱、关注创作者、留写温暖留言" 
              : "开启温情关注、留言互动与收藏您心仪的开源伙伴工具"}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#E5E1D8] mb-5 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 pb-2 font-bold border-b-2 text-center transition-all ${
              mode === "login"
                ? "border-[#5A5A40] text-[#5A5A40]"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            我已有居民证 / 登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 pb-2 font-bold border-b-2 text-center transition-all ${
              mode === "register"
                ? "border-[#5A5A40] text-[#5A5A40]"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            申领新居民证 / 注册
          </button>
        </div>

        {/* Feedback Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-start gap-2 mb-4 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Username */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              居民账号 / Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                required
                placeholder="请输入登录账号 (如: user_amin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-[#E5E1D8] rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
              />
            </div>
          </div>

          {/* Account Password */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              安全密码 / Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <input 
                type="password" 
                required
                placeholder="请输入您的居民安全密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E5E1D8] rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
              />
            </div>
          </div>

          {/* Registration only fields */}
          {mode === "register" && (
            <div className="space-y-4 pt-2 border-t border-dashed border-[#E5E1D8] animate-fade-in">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  电子邮箱 / Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                  <input 
                    type="email" 
                    required={mode === "register"}
                    placeholder="请输入您的电子邮箱地址 (如: user@example.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#E5E1D8] rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  确认安全密码 / Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                  <input 
                    type="password" 
                    required={mode === "register"}
                    placeholder="请再次输入您的居民安全密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#E5E1D8] rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                  />
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  您的称呼 / Nickname
                </label>
                <input 
                  type="text" 
                  required={mode === "register"}
                  placeholder="请输入您在社区的昵称，如「阿明」"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] text-stone-900"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  您的主要身份 / Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setSelectedRole(r)}
                      className={`py-2 px-1 rounded-xl border text-xs font-medium text-center transition-all ${
                        selectedRole === r
                          ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                          : "bg-white text-stone-600 border-[#E5E1D8] hover:border-[#5A5A40]/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Motif Stamps */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  申领专属心仪印章 / Stamp Motif
                </label>
                <div className="grid grid-cols-8 gap-1.5 bg-white p-2.5 rounded-2xl border border-[#E5E1D8]">
                  {avatars.map((av) => (
                    <button
                      type="button"
                      key={av.char}
                      onClick={() => setSelectedAvatar(av.char)}
                      title={av.label}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center text-xl transition-all ${
                        selectedAvatar === av.char
                          ? "bg-amber-50 border-2 border-amber-700/60 scale-105"
                          : "hover:bg-stone-50 border border-transparent"
                      }`}
                    >
                      {av.char}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5A5A40] hover:bg-[#484833] disabled:opacity-50 text-white font-bold text-sm py-3.5 px-4 rounded-full transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>{mode === "login" ? "登记并开始探索" : "织就居民证，加入社区"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
