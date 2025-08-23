import { Commit } from "./git";

export interface AnalysisResult {
  repositoryId: number;
  commits: Commit[];
  fileMetrics: FileMetrics[];
  patterns: Pattern[];
  teamInsights: TeamInsights;
  processingTime: number;
}

export interface FileMetrics {
  filePath: string;
  commitCount: number;
  authorCount: number;
  riskScore: number;
  totalChanges: number;
  bugCommits: number;
  lastModified: Date;
  authors: string[];
}

export interface RiskScore {
  filePath: string;
  score: number;
  factors: {
    changeFrequency: number;
    authorDiversity: number;
    changeVolume: number;
    bugRatio: number;
  };
  recommendations: string[];
}

export interface TeamInsights {
  collaborationPatterns: CollaborationPattern[];
  knowledgeSilos: KnowledgeSilo[];
  contributionMetrics: ContributionMetrics;
  reviewPatterns: ReviewPattern[];
}

export interface CollaborationPattern {
  developers: string[];
  sharedFiles: string[];
  collaborationScore: number;
}

export interface KnowledgeSilo {
  filePath: string;
  owner: string;
  riskLevel: "low" | "medium" | "high";
}

export interface ContributionMetrics {
  totalCommits: number;
  activeContributors: number;
  codeOwnership: Record<string, number>;
}

export interface ReviewPattern {
  reviewer: string;
  reviewCount: number;
  averageResponseTime: number;
}

export interface Pattern {
  type: string;
  description: string;
  confidence: number;
  files: string[];
}
