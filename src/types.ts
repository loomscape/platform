export interface ProjectComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  content: string;
  createdAt: string;
  authorUsername?: string; // Links comment to user account
}

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatar: string;
  role: string;
  createdAt: string;
  favorites: string[];       // Project IDs
  followedWeavers: string[]; // Creator GitHub handles
  github?: string;           // Optional github handle
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  status: 'approved' | 'pending';
  author: {
    name: string;
    github: string;
    avatarUrl?: string;
    email?: string;
  };
  targetPerson: {
    name: string;
    relationship: string;
    description: string;
  };
  problemDescription: string;
  solutionDescription: string;
  githubUrl: string;
  demoUrl?: string;
  createdAt: string;
  readmeProject: string; // README 1: Introduce the tool
  readmeStory: string;   // README 2: For whom, why, and how it helped
  likes: number;
  tags: string[];
  comments?: ProjectComment[];
}

export interface Contributor {
  id: string;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  contributions: number;
  role?: string;
}

export interface Commit {
  sha: string;
  author: {
    name: string;
    login: string;
    avatarUrl: string;
  };
  message: string;
  date: string;
  repoName: string;
}

export interface ProjectLink {
  url: string;
  title: string;
  favicon?: string;
}

export interface CoreMember {
  id: string;
  name: string;
  github: string;
  avatarUrl?: string;
  websiteUrl: string;
  projectLinks: ProjectLink[];
}

export interface BrandSponsor {
  id: string;
  name: string;
  logoUrl: string;
  homepageUrl: string;
  tier: string;
}

export interface Donor {
  id: string;
  name: string;
  amount?: string;
  source: 'github' | 'sponsor_page';
  date?: string;
}
