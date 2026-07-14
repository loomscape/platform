import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { INITIAL_PROJECTS, INITIAL_CONTRIBUTORS, INITIAL_COMMITS } from "./src/seed";
import { Project } from "./src/types";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.set("trust proxy", true);
app.use(express.json());

// Path to file-based persistent DB (acting as a secondary offline/fallback cache)
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure local data directory and backup file exist
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      projects: INITIAL_PROJECTS,
      contributors: INITIAL_CONTRIBUTORS,
      commits: INITIAL_COMMITS,
      users: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    console.log("Local backup database initialized with seed data.");
  }
}

initDatabase();

// In-Memory Database Cache (serves fast, synchronous client reads with Firestore as dynamic source of truth)
let dbCache: any = {
  projects: [],
  contributors: [],
  commits: [],
  users: []
};

// Local read fallback
function readLocalDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.users) parsed.users = [];
      if (!parsed.projects) parsed.projects = [];
      if (!parsed.contributors) parsed.contributors = [];
      if (!parsed.commits) parsed.commits = [];
      return parsed;
    }
  } catch (error) {
    console.error("Error reading local db backup", error);
  }
  return {
    projects: INITIAL_PROJECTS,
    contributors: INITIAL_CONTRIBUTORS,
    commits: INITIAL_COMMITS,
    users: []
  };
}

// Local write fallback
function writeLocalDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing local db backup", error);
  }
}

// Firebase Admin & Firestore setup
let firestoreDb: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp({
      projectId: firebaseConfig.projectId,
    }, "loomscape-app"); // Use a distinct named app to avoid collisions
    
    // Initialize Firestore using the specific databaseId if provided
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);
    console.log("Firebase Admin successfully connected to Firestore Database ID:", firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("firebase-applet-config.json not found. Operating with local backup storage.");
  }
} catch (error) {
  console.error("Firebase Admin initialization failed. Falling back to local backup database:", error);
}

// Helper to seed Firestore if it's completely empty
async function seedFirestoreIfEmpty() {
  if (!firestoreDb) return;
  try {
    const projectsSnapshot = await firestoreDb.collection("projects").limit(1).get();
    if (projectsSnapshot.empty) {
      console.log("Firestore database is empty. Injecting Loomscape seed data and default narratives...");
      
      // Batch seed projects
      const projectsBatch = firestoreDb.batch();
      INITIAL_PROJECTS.forEach((p: any) => {
        const ref = firestoreDb.collection("projects").doc(p.id);
        projectsBatch.set(ref, p);
      });
      await projectsBatch.commit();
      
      // Batch seed contributors
      const contributorsBatch = firestoreDb.batch();
      INITIAL_CONTRIBUTORS.forEach((c: any) => {
        const ref = firestoreDb.collection("contributors").doc(c.id);
        contributorsBatch.set(ref, c);
      });
      await contributorsBatch.commit();

      // Batch seed commits
      const commitsBatch = firestoreDb.batch();
      INITIAL_COMMITS.forEach((commit: any) => {
        const ref = firestoreDb.collection("commits").doc(commit.sha);
        commitsBatch.set(ref, commit);
      });
      await commitsBatch.commit();

      console.log("Firestore successfully seeded with projects, contributors, and commits.");
    }
  } catch (err) {
    console.error("Failed to seed initial Firestore data:", err);
  }
}

// Global data synchronization from Firestore to memory Cache on startup
async function loadDataFromFirestore() {
  if (!firestoreDb) {
    dbCache = readLocalDB();
    return;
  }

  try {
    await seedFirestoreIfEmpty();
    console.log("Synchronizing memory buffers with active cloud Firestore...");

    const [projectsSnapshot, contributorsSnapshot, commitsSnapshot, usersSnapshot] = await Promise.all([
      firestoreDb.collection("projects").get(),
      firestoreDb.collection("contributors").get(),
      firestoreDb.collection("commits").get(),
      firestoreDb.collection("users").get()
    ]);

    const projects: any[] = [];
    projectsSnapshot.forEach((doc: any) => projects.push(doc.data()));

    const contributors: any[] = [];
    contributorsSnapshot.forEach((doc: any) => contributors.push(doc.data()));

    const commits: any[] = [];
    commitsSnapshot.forEach((doc: any) => commits.push(doc.data()));

    const users: any[] = [];
    usersSnapshot.forEach((doc: any) => users.push(doc.data()));

    dbCache = { projects, contributors, commits, users };
    writeLocalDB(dbCache);
    console.log(`Firestore Sync Complete: Synchronized ${projects.length} projects, ${contributors.length} contributors, ${commits.length} commits, and ${users.length} registered residents.`);
  } catch (error) {
    console.error("Firestore retrieval error. Defaulting to local dbCache backup:", error);
    dbCache = readLocalDB();
  }
}

// Firestore mutators
async function saveToFirestore(collectionName: string, docId: string, data: any) {
  if (!firestoreDb) return;
  try {
    await firestoreDb.collection(collectionName).doc(docId).set(data);
  } catch (error) {
    console.error(`Firestore save failed for ${collectionName}/${docId}:`, error);
  }
}

async function deleteFromFirestore(collectionName: string, docId: string) {
  if (!firestoreDb) return;
  try {
    await firestoreDb.collection(collectionName).doc(docId).delete();
  } catch (error) {
    console.error(`Firestore delete failed for ${collectionName}/${docId}:`, error);
  }
}

// Synchronous wrapper helpers matched to Express route handlers
function readDB() {
  return dbCache;
}

function writeDB(data: any) {
  dbCache = data;
  writeLocalDB(dbCache);
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
app.post("/api/projects/like", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing project ID" });

  const db = readDB();
  const project = db.projects.find((p: Project) => p.id === id);
  if (project) {
    project.likes = (project.likes || 0) + 1;
    writeDB(db);
    await saveToFirestore("projects", project.id, project);
    return res.json({ success: true, likes: project.likes });
  }
  res.status(404).json({ error: "Project not found" });
});

// 3.5. Add a comment to a project
app.post("/api/projects/comment", async (req, res) => {
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
  await saveToFirestore("projects", project.id, project);

  res.json({ success: true, comment: newComment });
});

// --- Authentication & User Identity Management ---

// A1. Register a new user
app.post("/api/auth/register", async (req, res) => {
  const { username, password, email, nickname, avatar, role } = req.body;
  if (!username || !password || !email || !nickname) {
    return res.status(400).json({ error: "账号、密码、邮箱和称呼均为必填项。" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "请输入有效的电子邮箱地址。" });
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
    email: email.trim(),
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
  await saveToFirestore("users", newUser.id, newUser);

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

// --- OAuth Integration (GitHub & Google) ---

// A2.1. Check if OAuth is configured
app.get("/api/auth/oauth-status", (req, res) => {
  const hasGithubSecret = !!(process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SEC || process.env.GITHUB_CLIENT_SECR || process.env.GITHUB_CLIENT_SECF);
  const hasGoogleSecret = !!(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SEC || process.env.GOOGLE_CLIENT_SECR || process.env.GOOGLE_CLIENT_SECF);
  res.json({
    githubConfigured: !!(process.env.GITHUB_CLIENT_ID && hasGithubSecret),
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && hasGoogleSecret),
  });
});

// A2.2. Get GitHub OAuth Authorize URL
app.get("/api/auth/github/url", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({ error: "GitHub OAuth has not been configured on this workspace." });
  }

  // Use configured APP_URL or fallback to request host with robust protocol checking
  const host = req.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("0.0.0.0");
  const protocol = isLocalhost ? req.protocol : "https";
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state: "github",
  });

  res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
});

// A2.3. Get Google OAuth Authorize URL
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({ error: "Google OAuth has not been configured on this workspace." });
  }

  // Use configured APP_URL or fallback to request host with robust protocol checking
  const host = req.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("0.0.0.0");
  const protocol = isLocalhost ? req.protocol : "https";
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: "google",
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

// A2.4. Local simulation route for development/preview testing without secrets
app.post("/api/auth/oauth-simulate", async (req, res) => {
  const { provider } = req.body;
  if (!provider || (provider !== "github" && provider !== "google")) {
    return res.status(400).json({ error: "Invalid provider specified" });
  }

  const db = readDB();
  const timestamp = Date.now();
  const providerLabel = provider === "github" ? "GitHub" : "Google";
  const simulatedUsername = `${provider}_resident_${timestamp}`;
  const simulatedNickname = `温情织女 (${providerLabel}居民-${String(timestamp).slice(-4)})`;
  const simulatedEmail = `simulated_${provider}_${timestamp}@loomscape.io`;
  const simulatedAvatar = provider === "github" ? "🧶" : "🏮";

  const newUser = {
    id: `user-${timestamp}`,
    username: simulatedUsername,
    email: simulatedEmail,
    password: `oauth_simulated_pwd_${timestamp}`,
    nickname: simulatedNickname,
    avatar: simulatedAvatar,
    role: "普通读者",
    createdAt: new Date().toISOString(),
    favorites: [],
    followedWeavers: []
  };

  db.users.push(newUser);
  writeDB(db);
  await saveToFirestore("users", newUser.id, newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ success: true, user: userWithoutPassword });
});

// A2.5. Common OAuth Callback Handler
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #FAF9F6; color: #444;">
          <h3>授权失败 / Auth Failed</h3>
          <p>没有接收到有效的授权 Code，请重试。</p>
          <button onclick="window.close()" style="background: #5A5A40; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">关闭窗口</button>
        </body>
      </html>
    `);
  }

  // Use configured APP_URL or fallback to request host with robust protocol checking
  const host = req.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("0.0.0.0");
  const protocol = isLocalhost ? req.protocol : "https";
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/auth/callback`;
  
  let userData: any = null;

  try {
    if (state === "github") {
      // 1. Exchange code for access token
      const gitHubSecret = process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SEC || process.env.GITHUB_CLIENT_SECR || process.env.GITHUB_CLIENT_SECF;
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: gitHubSecret,
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData: any = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || "Failed to exchange GitHub authorization code.");
      }

      // 2. Fetch User Profile
      const userProfileResponse = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "User-Agent": "Loomscape-App"
        }
      });
      const profile: any = await userProfileResponse.json();
      
      userData = {
        username: `github_${profile.login.toLowerCase()}`,
        email: profile.email || `${profile.login.toLowerCase()}@github-user.com`,
        nickname: profile.name || profile.login,
        avatar: "🧶",
      };
    } else if (state === "google") {
      // 1. Exchange code for access token
      const googleSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SEC || process.env.GOOGLE_CLIENT_SECR || process.env.GOOGLE_CLIENT_SECF;
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: googleSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      const tokenData: any = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || "Failed to exchange Google authorization code.");
      }

      // 2. Fetch User Profile
      const userProfileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      });
      const profile: any = await userProfileResponse.json();
      
      userData = {
        username: `google_${profile.id}`,
        email: profile.email,
        nickname: profile.name || "Google 读者",
        avatar: "🏮",
      };
    } else {
      throw new Error("Invalid state parameter inside authorization redirect.");
    }

    // Process user registration or retrieval in memory DB & Firestore
    const db = readDB();
    let user = db.users.find((u: any) => u.username === userData.username);

    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        password: `oauth_external_secret_${Date.now()}`,
        nickname: userData.nickname,
        avatar: userData.avatar,
        role: "普通读者",
        createdAt: new Date().toISOString(),
        favorites: [],
        followedWeavers: []
      };
      db.users.push(user);
      writeDB(db);
      await saveToFirestore("users", user.id, user);
    }

    const { password: _, ...userWithoutPassword } = user;

    // Send the user profile back to parent window using postMessage and close
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #FAF9F6; color: #5A5A40;">
          <h3 style="margin-bottom: 8px;">认证成功 / Authenticated</h3>
          <p style="font-size: 14px; color: #666; margin-bottom: 24px;">您已成功登录 Loomscape 独织者社区，正在返回应用...</p>
          <div style="width: 24px; height: 24px; border: 2.5px solid #5A5A40; border-top-color: transparent; border-radius: 50%; animate: spin 1s linear infinite; margin: 0 auto;"></div>
          <style>
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                user: ${JSON.stringify(userWithoutPassword)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);

  } catch (error: any) {
    console.error("OAuth process callback failure:", error);
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #FAF9F6; color: #444;">
          <h3 style="color: #991B1B;">认证出现错误 / Auth Error</h3>
          <p style="font-size: 14px; color: #666; margin-bottom: 24px;">${error.message || "无法完成外部账号的凭证置换，请检查网络或配置。"}</p>
          <button onclick="window.close()" style="background: #5A5A40; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold;">关闭窗口</button>
        </body>
      </html>
    `);
  }
});

// A3. Update Profile
app.post("/api/users/profile-update", async (req, res) => {
  const { id, nickname, avatar, role, password, email } = req.body;
  if (!id || !nickname) {
    return res.status(400).json({ error: "ID 和称呼是必填项。" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "找不到该居民档案。" });
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "请输入有效的电子邮箱地址。" });
    }
    user.email = email.trim();
  }

  user.nickname = nickname.trim();
  if (avatar) user.avatar = avatar;
  if (role) user.role = role;
  if (password && password.trim() !== "") {
    user.password = password;
  }

  writeDB(db);
  await saveToFirestore("users", user.id, user);

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

// A4. Toggle Favorite Project
app.post("/api/users/toggle-favorite", async (req, res) => {
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
  await saveToFirestore("users", user.id, user);
  res.json({ success: true, favorites: user.favorites });
});

// A5. Toggle Follow Weaver
app.post("/api/users/toggle-follow-weaver", async (req, res) => {
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
  await saveToFirestore("users", user.id, user);
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
app.post("/api/weavers/like", async (req, res) => {
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
  await saveToFirestore("contributors", contributor.id, contributor);

  res.json({ success: true, likes: contributor.likes });
});

// 4. Submit an application (narrative project)
app.post("/api/projects/submit", async (req, res) => {
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
  await saveToFirestore("projects", newProject.id, newProject);
  res.json({ success: true, project: newProject });
});

// 5. Approve a pending project
app.post("/api/projects/approve", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing project ID" });

  const db = readDB();
  const project = db.projects.find((p: Project) => p.id === id);
  if (project) {
    project.status = "approved";
    writeDB(db);
    await saveToFirestore("projects", project.id, project);
    return res.json({ success: true, project });
  }
  res.status(404).json({ error: "Project not found" });
});

// 6. Delete or reject a project
app.post("/api/projects/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing project ID" });

  const db = readDB();
  const initialCount = db.projects.length;
  db.projects = db.projects.filter((p: Project) => p.id !== id);
  if (db.projects.length < initialCount) {
    writeDB(db);
    await deleteFromFirestore("projects", id);
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
  // Load database cache from Firestore/local backup before handling any requests
  await loadDataFromFirestore();

  if (!process.env.VERCEL) {
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
}

startServer();

export default app;
