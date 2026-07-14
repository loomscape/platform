import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { INITIAL_PROJECTS, INITIAL_CONTRIBUTORS, INITIAL_COMMITS } from "./src/seed";
import { Project } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to file-based persistent DB
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data directory and db.json exist
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      projects: INITIAL_PROJECTS,
      contributors: INITIAL_CONTRIBUTORS,
      commits: INITIAL_COMMITS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    console.log("Database initialized with seed data.");
  }
}

initDatabase();

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.users) {
      parsed.users = [];
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file, returning seed fallbacks", error);
    return {
      projects: INITIAL_PROJECTS,
      contributors: INITIAL_CONTRIBUTORS,
      commits: INITIAL_COMMITS,
      users: []
    };
  }
}

// Helper to write database
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to database file", error);
  }
}

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI features will fallback gracefully.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API Routes
// ----------------------------------------------------

// 1. Get all approved projects (narrative list)
app.get("/api/projects", (req, res) => {
  const db = readDB();
  const approved = db.projects.filter((p: Project) => p.status === "approved");
  res.json(approved);
});

// 2. Get pending projects (for moderator panel)
app.get("/api/pending-projects", (req, res) => {
  const db = readDB();
  const pending = db.projects.filter((p: Project) => p.status === "pending");
  res.json(pending);
});

// 3. Like a project
app.post("/api/projects/like", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing project ID" });

  const db = readDB();
  const project = db.projects.find((p: Project) => p.id === id);
  if (project) {
    project.likes = (project.likes || 0) + 1;
    writeDB(db);
    return res.json({ success: true, likes: project.likes });
  }
  res.status(404).json({ error: "Project not found" });
});

// 3.5. Add a comment to a project
app.post("/api/projects/comment", (req, res) => {
  const { projectId, authorName, authorAvatar, authorRole, content, authorUsername } = req.body;
  if (!projectId || !authorName || !content) {
    return res.status(400).json({ error: "Required comment fields are missing." });
  }

  const db = readDB();
  const project = db.projects.find((p: Project) => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  if (!project.comments) {
    project.comments = [];
  }

  const newComment = {
    id: `comment-${Date.now()}`,
    authorName,
    authorAvatar: authorAvatar || "🌸",
    authorRole: authorRole || "普通读者",
    content,
    createdAt: new Date().toISOString(),
    authorUsername: authorUsername || ""
  };

  project.comments.push(newComment);
  writeDB(db);

  res.json({ success: true, comment: newComment });
});

// --- Authentication & User Identity Management ---

// A1. Register a new user
app.post("/api/auth/register", (req, res) => {
  const { username, password, nickname, avatar, role } = req.body;
  if (!username || !password || !nickname) {
    return res.status(400).json({ error: "账号、密码和称呼均为必填项。" });
  }

  const db = readDB();
  const normalizedUsername = username.trim().toLowerCase();
  
  const userExists = db.users.some((u: any) => u.username === normalizedUsername);
  if (userExists) {
    return res.status(400).json({ error: "该账号已被占用，请尝试其他账号。" });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    username: normalizedUsername,
    password: password,
    nickname: nickname.trim(),
    avatar: avatar || "🌸",
    role: role || "普通读者",
    createdAt: new Date().toISOString(),
    favorites: [],
    followedWeavers: []
  };

  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ success: true, user: userWithoutPassword });
});

// A2. Login existing user
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "请输入账号和密码。" });
  }

  const db = readDB();
  const normalizedUsername = username.trim().toLowerCase();
  const user = db.users.find((u: any) => u.username === normalizedUsername);

  if (!user || user.password !== password) {
    return res.status(400).json({ error: "账号或密码错误，请重试。" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

// A3. Update Profile
app.post("/api/users/profile-update", (req, res) => {
  const { id, nickname, avatar, role, password } = req.body;
  if (!id || !nickname) {
    return res.status(400).json({ error: "ID 和称呼是必填项。" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "找不到该居民档案。" });
  }

  user.nickname = nickname.trim();
  if (avatar) user.avatar = avatar;
  if (role) user.role = role;
  if (password && password.trim() !== "") {
    user.password = password;
  }

  writeDB(db);

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

// A4. Toggle Favorite Project
app.post("/api/users/toggle-favorite", (req, res) => {
  const { userId, projectId } = req.body;
  if (!userId || !projectId) {
    return res.status(400).json({ error: "缺少用户 ID 或项目 ID。" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "找不到该用户。" });
  }

  if (!user.favorites) {
    user.favorites = [];
  }

  const index = user.favorites.indexOf(projectId);
  if (index >= 0) {
    user.favorites.splice(index, 1);
  } else {
    user.favorites.push(projectId);
  }

  writeDB(db);
  res.json({ success: true, favorites: user.favorites });
});

// A5. Toggle Follow Weaver
app.post("/api/users/toggle-follow-weaver", (req, res) => {
  const { userId, github } = req.body;
  if (!userId || !github) {
    return res.status(400).json({ error: "缺少用户 ID 或创作者 GitHub 账号。" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "找不到该用户。" });
  }

  if (!user.followedWeavers) {
    user.followedWeavers = [];
  }

  const normalizedGithub = github.toLowerCase();
  const index = user.followedWeavers.map((g: string) => g.toLowerCase()).indexOf(normalizedGithub);
  if (index >= 0) {
    user.followedWeavers.splice(index, 1);
  } else {
    user.followedWeavers.push(github);
  }

  writeDB(db);
  res.json({ success: true, followedWeavers: user.followedWeavers });
});

// A6. Get rich profile stats and details for the user
app.get("/api/users/stats/:userId", (req, res) => {
  const { userId } = req.params;
  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "居民未注册或不存在。" });
  }

  const favIds = user.favorites || [];
  const favoriteProjects = db.projects.filter((p: Project) => favIds.includes(p.id) && p.status === "approved");

  const followedHandles = (user.followedWeavers || []).map((h: string) => h.toLowerCase());
  const followedWeavers = db.contributors.filter((c: any) => followedHandles.includes(c.login.toLowerCase()));

  const userComments: any[] = [];
  db.projects.forEach((p: Project) => {
    if (p.comments) {
      p.comments.forEach((c: any) => {
        const isMatch = c.authorUsername === user.username || 
                       (c.authorName === user.nickname && c.authorRole === user.role);
        if (isMatch) {
          userComments.push({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            projectId: p.id,
            projectTitle: p.title
          });
        }
      });
    }
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      favorites: user.favorites || [],
      followedWeavers: user.followedWeavers || []
    },
    favoriteProjects,
    followedWeavers,
    userComments
  });
});

// 3.6. Like a weaver (contributor)
app.post("/api/weavers/like", (req, res) => {
  const { github } = req.body;
  if (!github) return res.status(400).json({ error: "Missing weaver github handle" });

  const db = readDB();
  // Find in contributors list, if not found, create one or search in projects
  let contributor = db.contributors.find((c: any) => c.login.toLowerCase() === github.toLowerCase());
  
  if (!contributor) {
    // Dynamically insert since they might have submitted via form
    const project = db.projects.find((p: Project) => p.author.github.toLowerCase() === github.toLowerCase());
    contributor = {
      id: `c-${Date.now()}`,
      login: github,
      avatarUrl: project?.author.avatarUrl || `https://github.com/${github}.png`,
      htmlUrl: `https://github.com/${github}`,
      contributions: 1,
      role: "Weaver",
      likes: 0
    };
    db.contributors.push(contributor);
  }

  contributor.likes = (contributor.likes || 0) + 1;
  writeDB(db);

  res.json({ success: true, likes: contributor.likes });
});

// 4. Submit an application (narrative project)
app.post("/api/projects/submit", (req, res) => {
  const {
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
    readmeProject,
    readmeStory,
    tags
  } = req.body;

  if (!title || !authorName || !targetName || !problemDescription || !solutionDescription || !githubUrl) {
    return res.status(400).json({ error: "Required fields are missing." });
  }

  const db = readDB();
  const newProject: Project = {
    id: `project-${Date.now()}`,
    title,
    tagline: tagline || `为 ${targetName} 开发的专属伙伴工具`,
    status: "pending", // Always pending initially
    author: {
      name: authorName,
      github: authorGithub || "loomscape-member",
      avatarUrl: authorGithub ? `https://github.com/${authorGithub}.png` : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      email: authorEmail
    },
    targetPerson: {
      name: targetName,
      relationship: targetRelation || "特定的人",
      description: targetDesc || "遇到了具体的障碍需要技术协助"
    },
    problemDescription,
    solutionDescription,
    githubUrl,
    demoUrl: demoUrl || "",
    createdAt: new Date().toISOString(),
    readmeProject: readmeProject || `# ${title}\n\n介绍这个专为解决 ${targetName} 问题的开源伙伴工具。`,
    readmeStory: readmeStory || `# 为什么我们要为 ${targetName} 开发它\n\n叙述这根独织的丝线背后的故事。`,
    likes: 0,
    tags: tags && tags.length > 0 ? tags : ["开源伙伴工具"]
  };

  db.projects.unshift(newProject);
  writeDB(db);
  res.json({ success: true, project: newProject });
});

// 5. Approve a pending project
app.post("/api/projects/approve", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing project ID" });

  const db = readDB();
  const project = db.projects.find((p: Project) => p.id === id);
  if (project) {
    project.status = "approved";
    writeDB(db);
    return res.json({ success: true, project });
  }
  res.status(404).json({ error: "Project not found" });
});

// 6. Delete or reject a project
app.post("/api/projects/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing project ID" });

  const db = readDB();
  const initialCount = db.projects.length;
  db.projects = db.projects.filter((p: Project) => p.id !== id);
  if (db.projects.length < initialCount) {
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Project not found" });
});

// 7. Get GitHub Org Contributors and Members (Dynamic update with fallback)
app.get("/api/github/contributors", async (req, res) => {
  const db = readDB();
  try {
    // Try calling GitHub API for the loomscape organization
    // Since Loomscape is a real organization/page, we can fetch public info
    const response = await fetch("https://api.github.com/orgs/loomscape/members", {
      headers: { "User-Agent": "Loomscape-Portal" }
    });
    if (response.ok) {
      const members = await response.json();
      if (Array.isArray(members) && members.length > 0) {
        // Map to our Contributor format
        const mapped: any[] = members.map((m: any, index: number) => ({
          id: `gh-${m.id}`,
          login: m.login,
          avatarUrl: m.avatar_url,
          htmlUrl: m.html_url,
          contributions: Math.max(12, 45 - index * 8), // Synthesize some contributions
          role: index === 0 ? "Founding Weaver" : "Active Weaver"
        }));

        // Merge with our seed contributors to show a rich community
        const merged = [...mapped];
        db.contributors.forEach((sc: any) => {
          if (!merged.some(m => m.login.toLowerCase() === sc.login.toLowerCase())) {
            merged.push(sc);
          }
        });
        return res.json(merged);
      }
    }
  } catch (error) {
    console.warn("Failed to fetch real GitHub members, using local DB store", error);
  }
  // Return fallback from local DB
  res.json(db.contributors);
});

// 8. Get GitHub commits / project dynamics
app.get("/api/github/commits", async (req, res) => {
  const db = readDB();
  try {
    // Try fetching public event timeline of organization
    const response = await fetch("https://api.github.com/orgs/loomscape/events", {
      headers: { "User-Agent": "Loomscape-Portal" }
    });
    if (response.ok) {
      const events = await response.json();
      if (Array.isArray(events) && events.length > 0) {
        // Filter PushEvents
        const pushEvents = events.filter((e: any) => e.type === "PushEvent");
        if (pushEvents.length > 0) {
          const mappedCommits: any[] = [];
          pushEvents.forEach((pe: any) => {
            const repoSimple = pe.repo.name.replace("loomscape/", "");
            if (pe.payload && pe.payload.commits) {
              pe.payload.commits.forEach((c: any) => {
                mappedCommits.push({
                  sha: c.sha.substring(0, 7),
                  author: {
                    name: pe.actor.login,
                    login: pe.actor.login,
                    avatarUrl: pe.actor.avatar_url
                  },
                  message: c.message,
                  date: pe.created_at,
                  repoName: repoSimple
                });
              });
            }
          });
          if (mappedCommits.length > 0) {
            // Merge and take top
            const merged = [...mappedCommits, ...db.commits].slice(0, 8);
            return res.json(merged);
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to fetch GitHub timeline events, using local DB store", error);
  }
  res.json(db.commits);
});

// 9. Gemini AI Dual-README Generator helper
app.post("/api/gemini/generate-readme", async (req, res) => {
  const { title, tagline, targetName, targetRelation, targetDesc, problemDescription, solutionDescription } = req.body;

  if (!title || !targetName || !problemDescription || !solutionDescription) {
    return res.status(400).json({ error: "Insufficient details provided for AI generation" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return a beautiful simulated template if the API key is not configured, to keep it functional
    return res.json({
      readmeProject: `# ${title} - ${tagline || '专属伙伴工具'}\n\n这是一个专为解决特定需求而开发的开源项目。\n\n## 🚀 功能特性\n- 针对具体场景设计的免配置流程\n- 本地化运行，极佳的隐私防护\n- 简单直接的触觉或视觉交互\n\n## 🛠️ 开始使用\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``,
      readmeStory: `# 为什么我们要为 ${targetName} 开发它\n\n## 🌸 缘起\n生活里有很多被通用科技遗忘的角落。${targetName}（${targetRelation || '特定的人'}）遇到了这样的具体障碍：${targetDesc || '日常的不便'}\n\n## 🧵 给 ${targetName} 的解法\n我们设计了 \`${title}\`。它通过特定机制解决了“${problemDescription}”这一具体问题。最终，这个工具不声不响，却像一根温柔的丝线，将爱与便利拉近。`
    });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are the AI narrative helper for Loomscape (织机风景), an open-source community advocating "developing tools for concrete individuals" (为具体的人开发工具).
Loomscape believes that open-source software should solve concrete problems for actual, specific people close to us, rather than chasing vague generic scale.
Each project submission is required to have TWO distinct READMEs:
1. README.md: A technical, clear product specification README, documenting core features, hardware/software stack, installation/setup commands, and usage steps.
2. WHY_ME.md / FOR_WHOM.md (Story README): An emotional, touching, personal narrative describing WHO the tool was built for, their specific life background, the problem they faced, how the author developed this solution for them, and the profound human value it created.

Generate these two files in Chinese based on the following input:
- Title: "${title}"
- Tagline: "${tagline || ''}"
- Target Person: "${targetName}" (Relation: "${targetRelation || ''}", Description: "${targetDesc || ''}")
- Problem: "${problemDescription}"
- Solution: "${solutionDescription}"

Your output must be a JSON object with exactly two string fields: "readmeProject" and "readmeStory".
Make the narrative of readmeStory extremely beautiful, emotional, romantic, yet humble and concrete. It should read like a warm narrative story from Loomscape.
Return ONLY valid JSON output. Do NOT wrap it in any markdown code block indicators (like \`\`\`json).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate the two README contents based on the system criteria.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            readmeProject: { type: "STRING" },
            readmeStory: { type: "STRING" }
          },
          required: ["readmeProject", "readmeStory"]
        }
      }
    });

    const text = response.text;
    if (text) {
      try {
        const result = JSON.parse(text.trim());
        return res.json(result);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini text, sending raw backup", e);
        return res.json({
          readmeProject: `# ${title}\n\n${text}`,
          readmeStory: `# 为 ${targetName} 编织的风景\n\n自动生成的内容无法解析，以下是原始产出：\n\n${text}`
        });
      }
    }
    throw new Error("Empty response from Gemini");
  } catch (error: any) {
    console.error("Error generating readmes with Gemini:", error);
    res.status(500).json({ error: "AI generation failed, please write manually or try again." });
  }
});

// ----------------------------------------------------
// Frontend Serving & Dev Server Setup
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Setup Vite as development middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Loomscape Server listening on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
