import React from "react";
import { motion } from "motion/react";
import { Shield, Users, Heart, Scale, Feather, Compass, Globe, HelpCircle } from "lucide-react";

interface ManifestoPageProps {
  language: "zh" | "en";
}

export default function ManifestoPage({ language }: ManifestoPageProps) {
  // We can render bilingual text or just provide a highly polished bilingual-supported view
  const isZh = language === "zh";

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 page-fade-in text-left">
      {/* Decorative top breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-6">
        <Compass className="w-3.5 h-3.5 animate-spin-slow" />
        <span>{isZh ? "Loomscape 生态宪章" : "Loomscape Charter"}</span>
        <span className="text-stone-300">•</span>
        <span>{isZh ? "开源立场与公共共享" : "Open Source Position"}</span>
      </div>

      {/* Main manifesto card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white border border-[#E5E1D8] p-8 md:p-14 rounded-3xl card-shadow relative overflow-hidden"
      >
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#5A5A40]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#E5E1D8]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Header Section */}
        <div className="border-b border-[#E5E1D8] pb-8 md:pb-10 mb-8 md:mb-10 relative z-10">
          <h2 className="serif text-3xl md:text-4xl font-semibold text-[#2D2D2D] leading-tight mb-3">
            Loomscape 开源与公共共享宣言
          </h2>
          <h3 className="serif text-xl md:text-2xl text-[#5A5A40] italic font-medium leading-normal mb-6">
            Loomscape Open Source & Commons Manifesto
          </h3>
          
          <div className="bg-[#F9F8F6] border-l-4 border-[#5A5A40] p-5 rounded-r-2xl font-serif text-sm md:text-base italic text-[#5A5A40] leading-relaxed">
            “用一行代码的温柔，治愈具体之人的困痛；将一整片天空的广阔，无私地交付予所有人。”
          </div>
        </div>

        {/* Body content */}
        <div className="space-y-8 text-[#2D2D2D] text-sm md:text-base leading-relaxed relative z-10">
          <p className="font-serif italic text-stone-600 border-b border-[#E5E1D8]/40 pb-6">
            在 Loomscape，我们不仅在构建一套分布式网络，更在重新定义技术、代码与创作者之间的契约。
          </p>

          <p>
            我们注意到，传统的互联网技术生态陷入了一种宏大的虚无：资本与科技巨头可以任意无偿地攫取独立开发者的智慧，并将其包装为昂贵的商业垄断工具；而真正身处微观困境的创作者、数字游民和微观个体，却依然在为趁手的数字工具支付高昂的门槛。
          </p>

          <p className="font-medium text-[#2D2D2D]">
            这正是 Loomscape 必须存在的理由。我们拒绝这种冰冷的流水线，选择站在具体的人这一边。
          </p>

          {/* Our position section */}
          <div className="bg-amber-50/40 border border-amber-100 p-6 md:p-8 rounded-2xl my-8 space-y-6">
            <h4 className="serif text-lg font-bold text-amber-950 flex items-center gap-2 border-b border-amber-200/60 pb-3">
              <Scale className="w-5 h-5 text-[#5A5A40]" />
              <span>⚖️ 我们的生态立场 (Our Position)</span>
            </h4>
            
            <p className="text-stone-700 text-sm italic">
              当你在 Loomscape 看到某些工具采用了类似 PolyForm Noncommercial（非商业共享）这类不允许大厂白嫖、但对普通个体完全免费开放的协议时，可能会有人质疑：“这不符合开源促进会（OSI）的古板定义，这算什么开源？”
            </p>

            <p className="font-bold text-[#2D2D2D] text-sm">
              对此，我们的回答是坦荡且坚定的：
            </p>

            {/* Sub-position 1 */}
            <div className="space-y-2">
              <h5 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm md:text-base">
                <span className="text-[#5A5A40]">✦</span>
                <span>我们死守个体的安全与自由 (Individual Freedom First)</span>
              </h5>
              <p className="text-stone-600 text-xs md:text-sm pl-4 leading-relaxed">
                Loomscape 的核心底层数据座舱与基础设施永远保持最纯粹、绝对的开源与透明。任何人都有权审查我们的代码，确保自己数据的绝对安全。
              </p>
            </div>

            {/* Sub-position 2 */}
            <div className="space-y-2">
              <h5 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm md:text-base">
                <span className="text-[#5A5A40]">✦</span>
                <span>我们拥抱“公地共享”，而非“资本剥削” (Commons-Shared, Not Capital-Exploited)</span>
              </h5>
              <p className="text-stone-600 text-xs md:text-sm pl-4 leading-relaxed">
                我们支持并且鼓励生态内的伙伴工具采用保障创作者权益的公平共享协议（如 Fair-Code / Source-Available / PolyForm）。我们不委曲求全去迎合商业巨头定义的“绝对自由”，因为那种自由往往以牺牲独立开发者的生存为代价。
              </p>
            </div>

            {/* Sub-position 3 */}
            <div className="space-y-2">
              <h5 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm md:text-base">
                <span className="text-[#5A5A40]">✦</span>
                <span>技术的流动，必须首先滋养具体的人 (Technology for Concrete Individuals)</span>
              </h5>
              <p className="text-stone-600 text-xs md:text-sm pl-4 leading-relaxed">
                如果一个许可证能够保护一位独立创作者免受资本掠夺，同时又能无私地把使用权交到每一个具体的学生、游民和艺术家手中，那它就是符合 Loomscape 灵魂的。我们交付的“所有人”，是每一个有名字、有温度的微观个体，而不是冰冷的法人实体。
              </p>
            </div>
          </div>

          {/* Acknowledgments section */}
          <div className="space-y-4 pt-4 border-t border-[#E5E1D8]/60">
            <h4 className="serif text-lg font-bold text-[#5A5A40] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#5A5A40]" />
              <span>🤝 我们的致敬 (Our Acknowledgments)</span>
            </h4>
            
            <p>
              Loomscape 是一个包容的、有弹性的分布式网络。在这里：
            </p>

            <ul className="list-disc pl-5 space-y-2 text-stone-700 text-sm md:text-base">
              <li>
                我们向无条件奉献的绝对开源主义者致敬；
              </li>
              <li>
                我们同样向通过协议守护自身创作资产、对抗商业吞噬的数字游侠们致敬。
              </li>
            </ul>

            <p className="italic font-serif text-stone-600">
              这里没有冰冷的螺丝钉，只有互相编织的赛博邻居。每一位带着代码或创意加入 Loomscape 的伙伴，都是在用技术进行一场微型的行侠仗义。
            </p>
          </div>
        </div>

        {/* Footer/Slogan section */}
        <div className="mt-12 pt-8 border-t border-[#E5E1D8] text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40] mb-4">
            <Heart className="w-5 h-5 fill-[#5A5A40]" />
          </div>
          <p className="serif text-base font-bold text-[#5A5A40]">
            欢迎来到 Loomscape。
          </p>
          <p className="text-stone-500 text-xs mt-1.5 font-medium tracking-wider">
            让我们一起，为具体的人创造，对所有人共享。
          </p>
        </div>
      </motion.div>
    </div>
  );
}
