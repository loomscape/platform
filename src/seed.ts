import { Project, Contributor, Commit } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "project-1",
    title: "听觉智能眼镜 / Hearing Watch & Glass",
    tagline: "为耳背的奶奶开发的水壶沸腾与门铃振动提醒器",
    status: "approved",
    author: {
      name: "林织羽 (Lin Zhiyu)",
      github: "linzhiyu",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      email: "zhiyu@loomscape.org"
    },
    targetPerson: {
      name: "外婆 (Grandmother)",
      relationship: "隔代至亲 / 82岁的老人",
      description: "外婆由于年龄增长重度耳背，日常不愿佩戴沉重且啸叫的助听器。厨房烧开水、有人按门铃时，她经常完全听不见，导致水烧干、燃气未关等极大安全隐患。"
    },
    problemDescription: "市面上的助听器噪音大，外婆觉得戴着不舒服，常常偷偷摘掉。而普通的智能家居提醒系统要么过于复杂需要智能手机（外婆不会用），要么屏幕字体极小。我们需要一个零操作、即插即用、通过身体直接震动和高亮闪烁来提醒特定频率声音（开水沸腾音、门铃音）的专用物理硬件/软件。",
    solutionDescription: "使用 ESP32 芯片和高敏麦克风传感器，写了一个专用的频率捕获算法，实时监听水壶鸣笛声（约 3.2kHz 窄频）以及特定的门铃音频。当捕捉到信号时，外婆手腕上佩戴的小型振动环会发出轻快、间歇性震动，并在一块 1.3 英寸 OLED 屏幕上用极大字体显示「水烧开啦！」或「有人按门铃！」，没有任何多余的按钮，插电即用，让外婆重新拥有了安全的独居空间。",
    githubUrl: "https://github.com/loomscape/hearing-watch",
    demoUrl: "https://github.com/loomscape/hearing-watch#demo",
    createdAt: "2026-06-15T12:00:00Z",
    likes: 42,
    tags: ["ESP32", "音频识别", "助老硬件", "无障碍"],
    readmeProject: `# Hearing Watch - 音频频率振动提醒系统

这是一个基于 ESP32 微控制器的低功耗音频监测与触觉反馈系统。

## ⚙️ 核心功能
* **窄频声波检测**：针对 3.1kHz - 3.4kHz（水壶沸腾鸣笛声）与 800Hz（特定机械门铃）进行高频采样与 FFT 变换。
* **触觉震动编码**：根据不同的声音源，产生不同节奏的震动模式，帮助用户区分事件。
* **超大字符 OLED 渲染**：支持简体中文 32px 超大点阵字体渲染，专为视力不佳的老人设计。

## 🛠️ 硬件清单
* ESP32-WROOM-32E 核心板 x1
* INMP441 全向麦克风模块 x1
* 扁平震动马达 x1
* SSD1306 OLED 显示屏 (128x64) x1

## 🚀 编译与烧录
1. 使用 VS Code 打开 PlatformIO 导入本项目。
2. 配置 \`platformio.ini\`。
3. 点击 Upload 烧录至 ESP32。`,
    readmeStory: `# 为外婆编织的「安全丝线」- 关于 Hearing Watch

## 🌸 缘起：那壶冒着白烟却寂静的水
我的外婆今年 82 岁了。她有些执拗，助听器发出的刺耳金属尖叫声让她烦躁，所以她总是悄悄把它关掉。
有一次，我去她家，刚走到门口就闻到一股焦味。推开门，厨房里的开水壶已经烧干，壶底通红，正冒着滚滚白烟，而外婆正背对着厨房在客厅安静地看电视。
那一刻我惊出一身冷汗。我意识到，对重度耳背的老人来说，现代楼房就像是一个无声的孤岛。

## 🧵 为谁：外婆（以及不愿戴助听器的独居老人）
外婆需要一个工具。这个工具：
1. **不能有复杂的交互**：她不会使用触屏智能手机，更记不住各种配对。
2. **不能有佩戴负担**：必须像手镯一样轻，且不需要塞进耳朵里。
3. **极高可靠性**：不能因为网络断线、软件更新或后台被杀而失效。

## 💡 编织：我是如何解决它的
我没有用任何复杂的 AI 语音识别，因为那需要联网和昂贵的算力。我只是拿来了一个旧的 ESP32 开发板，接上麦克风，搬出大学时学过的傅里叶变换（FFT）。
我录下了外婆家水壶烧开时的尖锐叫声，发现它的频率非常高且纯净，稳定在 3.2kHz 左右。门铃声则是双频交替。
我在代码里写了一个简单的带通滤波器和幅度阈值：当连续 2 秒检测到 3.2kHz 的强声波，就通过 GPIO 输出电平驱动震动马达。
马达会强烈地颤抖，像一个温柔的拳头，在外婆手腕上敲击。
屏幕上会闪烁：**「水烧开了！」**

## 🌟 结局
现在这个小小的手环已经戴在外婆手上一年了。
她现在每次水开时，都会不慌不忙地起身走进厨房。她笑着跟我说：“这小东西比你外公当年叫得还准，而且不吵人。”
这就是 Loomscape 的精神——**不为宏大的时代写赞歌，只为具体的人，编织一根能拉住她的、微小却坚韧的丝线。**`
  },
  {
    id: "project-2",
    title: "懒人眼神阅读器 / Lazy Eye-Reader",
    tagline: "利用眨眼与眼动为渐冻症挚友开发的免手翻页阅读器",
    status: "approved",
    author: {
      name: "周墨 (Zhou Mo)",
      github: "zhoumo-dev",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      email: "zhoumo@loomscape.org"
    },
    targetPerson: {
      name: "小陈 (Xiao Chen)",
      relationship: "大学挚友 / 渐冻症患者",
      description: "小陈在两年前被诊断出运动神经元病（ALS）。他的双手逐渐失去力量，目前已无法拿起实体书，也无法在平板电脑上进行精准的划屏翻页。"
    },
    problemDescription: "虽然市面上有一些商业眼动仪，但价格高昂（数万元），且软件界面对电子书（特别是 PDF/EPUB）的阅读体验极差。小陈只是想躺在床上，用廉价的平板或普通网页摄像头，舒适地阅读他最喜欢的历史小说，不需要用手，也不需要复杂的硬件头戴设备。",
    solutionDescription: "开发了一个纯前端的网页阅读器。利用 MediaPipe Face Landmarker 模型，实时检测用户面部的 468 个三维特征点。通过计算左右眼睑纵横比（EAR）和眼球注视点估算，实现了「左眨眼翻上一页，右眨眼翻下一页，长闭眼 1.5 秒唤出菜单」的纯视觉交互。完美支持 PDF 和 EPUB 格式，并带有自适应夜间模式与护眼排版，只要有普通前置摄像头即可工作。",
    githubUrl: "https://github.com/loomscape/lazy-reader",
    demoUrl: "https://github.com/loomscape/lazy-reader#demo",
    createdAt: "2026-07-01T09:30:00Z",
    likes: 56,
    tags: ["React", "MediaPipe", "眼动追踪", "无障碍阅读"],
    readmeProject: `# Lazy Eye-Reader - 纯视觉面部姿态与眨眼检测阅读器

基于 Web 技术和 Google MediaPipe FaceMesh 开发的免手触控、眼神交互式电子书阅读器。

## ✨ 技术栈
* **React 19 + TypeScript + Tailwind CSS**
* **MediaPipe Face Mesh / Face Landmarker**：提取面部关键点，计算眼睑张开度（EAR）
* **Epub.js / PDF.js**：解析与渲染跨平台电子书格式
* **Localforage**：本地存储阅读进度与书籍资源

## 👁️ 眼神指令定义
* **右眼眨单次 (眨眼持续时间 200-500ms)**：下一页 / 向下滚动
* **左眼眨单次 (眨眼持续时间 200-500ms)**：上一页 / 向上滚动
* **双眼闭合超 1.5 秒**：打开/关闭设置面板与书架

## ⚙️ 部署说明
\`\`\`bash
npm install
npm run dev
\`\`\`
需要保证浏览器拥有摄像头权限 (https 或 localhost 下运行)。`,
    readmeStory: `# 用眼神翻过世界的围墙 - 编织 Lazy Eye-Reader

## 📕 缘起：一本无法合上的书
小陈是我的大学室友，一个疯狂的书迷。
当他的身体开始逐渐像冰雪般消融时，他最痛苦的不是无法下床，而是无法拿起书本。
有一次我去探望他，看到他的书桌上放着一本翻开到 112 页的《万历十五年》。那本书已经在那里放了半个月了，落了一层薄薄的灰。
因为家人上班后，他独自躺在床上，如果风把书页吹乱，或者看完了这一页，他就只能盯着那一页看上一整天。
那一幕击中了我。在这个连马斯克都在讨论脑机接口的时代，一个普通人想看书，难道就只能等死吗？

## 🧵 为谁：失去双手控制能力、但双眼仍闪烁着灵魂火花的人
小陈要的很简单：
1. **零成本**：买不起昂贵的进口眼动仪。
2. **极简操作**：不需要任何人帮他戴上头盔或接线。
3. **沉浸感**：看书时，不能有任何多余的弹窗和控制点打扰他的视线。

## 💡 编织：我们如何越过身体的樊篱
我决定用小陈床头那台旧安卓平板的普通摄像头来实现这一切。
借助 MediaPipe 的 Web 端面部识别，我们能以每秒 30 帧的速度捕捉他的眼睛形状。
我定义了眼睑张开度比率（EAR）。通过和小陈反复调试，我们找到了最适合他的阈值：
他的右眼稍微用力眨一下，屏幕就会像微风吹过一样，顺畅地翻到下一页。
为了防止正常的无意识眨眼引起误翻，我设计了一个时间滤波器：只有眨眼时间在 250 毫秒到 500 毫秒之间（比自然眨眼略慢，但不需要费力）才会被判定为翻页。

## 🌟 结局
小陈现在每天能用这个阅读器看 2 小时的书。
他甚至在书签的最后一页给我留言：**“墨子，谢谢你。手虽然动不了，但我的眼睛还能翻过那些高墙，看到很远很远的地方。”**
单织一缕线，或许微不足道，但当这缕线让一个被禁锢在躯壳里的灵魂重新飞翔，它就有了最耀眼的光芒。`
  },
  {
    id: "project-3",
    title: "记忆光影画框 / Framer Memory Canvas",
    tagline: "为阿尔茨海默症初期的父亲开发的温情面部识别与记忆唤醒画框",
    status: "approved",
    author: {
      name: "陈叙白 (Chen Xubai)",
      github: "xubai-design",
      avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=150&q=80",
      email: "xubai@loomscape.org"
    },
    targetPerson: {
      name: "父亲 (Father)",
      relationship: "父亲 / 阿尔茨海默症初期患者",
      description: "父亲去年被确诊为阿尔茨海默症初期，开始频繁出现认知障碍，尤其是在亲戚和老朋友突然来访时，他常因想不起对方的名字和身份而感到极度自责、紧张甚至拒绝交流。"
    },
    problemDescription: "市面上的阿尔茨海默症辅助产品往往极具侵入性（比如挂在胸前的定位牌，或者频繁的强制智力测试题），这深深地伤害了父亲的自尊。父亲喜欢看着客厅里的老相框。我们希望能将这个老相框改造成一个默默守护、极其低调的智能伴侣：它平日里只是播放温暖的家庭相册，当有熟悉的人走近时，它会无声地提示对方的名字和他们之间最重要的一段共同回忆，保护老人的体面。",
    solutionDescription: "使用树莓派和高清摄像头，嵌入在原木复古画框中。运行轻量级的 FaceNet 本地人脸识别模型。当检测到有人进入镜头时，画框会极其自然地淡入一张该人与父亲过去的合影，并在右下角用极具温度的文字写道：「这是您的女儿叙白，上周她带您去吃了您最爱的桂花糕」或者「这是您的老战友李国强，1978年你们一起在漠河当兵」。若无人走近，则循环播放风景画，无任何摄像头痕迹，完美保护父亲的隐私与自尊。",
    githubUrl: "https://github.com/loomscape/framer-memory",
    demoUrl: "https://github.com/loomscape/framer-memory#demo",
    createdAt: "2026-07-10T15:45:00Z",
    likes: 68,
    tags: ["树莓派", "人脸识别", "老龄关怀", "智能画框"],
    readmeProject: `# Framer Memory Canvas - 温情本地人脸识别电子画框

这是一个基于 Raspberry Pi 4 部署的温情智能相框系统。

## 🎯 设计初衷
不同于传统带有极强冷冰冰科技感的传感器，本项目旨在打造一款融入家居环境、默默守护失智老人的情感化软硬件系统。

## 📦 系统架构
* **树莓派4B + 500w像素摄像头（隐藏式针孔）**
* **Python + OpenCV + FaceNet**：离线、本地的面部检测与高维特征比对，保证隐私安全。
* **Electron 壳程序 / Tailwind + React 前端**：实现极其缓慢、舒适的淡入淡出画面过渡。

## 📁 记忆配置文件示例 (\`memory.json\`)
\`\`\`json
{
  "feature_vector_id": "user_xubai",
  "relation": "女儿陈叙白",
  "tip": "上周她带您去吃了您最爱的桂花糕，还给您买了一件蓝色毛衣。",
  "joint_photo": "photos/xubai_and_father.jpg"
}
\`\`\``,
    readmeStory: `# 留住风中的名字 - 记忆光影画框的设计故事

## 🌸 缘起：父亲眼底的那抹惊慌
父亲一辈子是个极其体面、好强的人。
但从去年秋天开始，我发现他变了。每当家里来人，哪怕是堂哥或者相处了三十年的老邻居，他打开门的那一瞬间，眼神里都会闪过一丝极深、极复杂的惊慌和局促。
他会呆立两秒钟，然后假装去倒水，一去就是很久。
有一次，他悄悄拉着我到阳台，红着眼眶小声说：“叙白，我是个废人了，我连建国（大伯）的名字都想不起来了，我刚才差点叫错……”
那一刻，我看到一个曾经像大树一样保护我的男人，在时间的侵蚀面前，卑微、无助得像个迷路的孩子。
我想保护他的体面，保护他的记忆。

## 🧵 为谁：不想失去尊严、正被时间温柔剥夺记忆的阿尔茨海默症老人
父亲需要一个工具，这个工具：
1. **不能有挫败感**：不能提醒他“你又忘了”，而是要在他意识到遗忘之前，悄悄告诉他。
2. **隐藏技术痕迹**：不能在家里挂一个冷冰冰的显示屏和摄像头，那会让他觉得被监视。
3. **有温度的叙事**：不能只有冷冰冰的“大伯，58岁”，而要有关怀的、带有细节的记忆连接。

## 💡 编织：不留痕迹的温柔
我买来一个宽边框的经典复古实木相框，在木纹深处开了一个极其微小的孔，藏进了一个广角树莓派摄像头。
我们在树莓派里部署了完全本地运行的轻量级人脸识别。
最核心的不是代码，而是那份「记忆词典」。我把全家人的照片、与父亲的合照、以及最具体的日常小事，一个字一个字写进配置文件里：
*“这是您的小外孙沐沐，今年 5 岁了。您上个月教他折了纸飞机，他现在手里还拿着呢。”*
*“这是老邻居张阿姨，她住在我们家对门，经常送我们家她自己腌的咸鸭蛋。”*

每当相框前的摄像头检测到大伯走近时，相框不会发出任何声音，只是原本正在播放的黄山风景画，会像晨雾散去一样，极其缓慢地（设置了 5 秒的淡入时间）过渡成一张二十年前大伯和父亲在照相馆的合影。
合影右下角，用柔和的宋体写着：
*“这是大伯陈建国。1998年，你们俩一起去深圳进货，在火车站吃了一大碗面。”*

## 🌟 结局
现在，每当家里来人，父亲总能在看一眼相框后，自如、体面地叫出对方的名字，并聊起那些泛黄却温暖的往事。
大伯甚至惊讶地和我说：“你爸这记性真神了，二十年前火车站吃面的事他都记得一清二楚。”
父亲看着我，狡黠地笑了一下，眼神里那抹曾经让他彻夜难眠的惊恐，再也没有出现过。
**独织者众，终成风景。我们用代码编织的，不是冰冷的代码块，而是具体的人，那不可侵犯的尊严与爱。**`
  }
];

export const INITIAL_CONTRIBUTORS: Contributor[] = [
  {
    id: "c-1",
    login: "linzhiyu",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    htmlUrl: "https://github.com/linzhiyu",
    contributions: 34,
    role: "Core Weaver"
  },
  {
    id: "c-2",
    login: "zhoumo-dev",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    htmlUrl: "https://github.com/zhoumo-dev",
    contributions: 28,
    role: "Loom Guard"
  },
  {
    id: "c-3",
    login: "xubai-design",
    avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=150&q=80",
    htmlUrl: "https://github.com/xubai-design",
    contributions: 19,
    role: "Aesthetic Weaver"
  },
  {
    id: "c-4",
    login: "johndoe",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    htmlUrl: "https://github.com/johndoe",
    contributions: 8,
    role: "Thread Contributor"
  }
];

export const INITIAL_COMMITS: Commit[] = [
  {
    sha: "a3f4e2c81d9b0a7c6f5e4d3c2b1a0f9e8d7c6b5a",
    author: {
      name: "林织羽 (Lin Zhiyu)",
      login: "linzhiyu",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    },
    message: "feat: Optimize narrow-band frequency detection for SSD1306 screens",
    date: "2026-07-12T14:32:00Z",
    repoName: "hearing-watch"
  },
  {
    sha: "f7d3e2b9c8a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7",
    author: {
      name: "周墨 (Zhou Mo)",
      login: "zhoumo-dev",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    message: "fix: Stabilize eye-blink threshold (EAR) filtering on low-lit screens",
    date: "2026-07-11T18:15:00Z",
    repoName: "lazy-reader"
  },
  {
    sha: "b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3",
    author: {
      name: "陈叙白 (Chen Xubai)",
      login: "xubai-design",
      avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=150&q=80"
    },
    message: "docs: Add WHY_ME.md narrative and complete setup logs for Framer Raspberry Pi",
    date: "2026-07-10T11:05:00Z",
    repoName: "framer-memory"
  }
];
