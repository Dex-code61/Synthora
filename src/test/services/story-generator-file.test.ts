import { describe, it, expect, vi, beforeEach } from "vitest";
import { StoryGenerator } from "@/lib/services/story-generator";

// Mock dependencies
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "Mocked AI response",
              },
            },
          ],
        }),
      },
    },
  })),
}));

vi.mock("@/lib/services/story-cache", () => ({
  StoryCache: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("@/lib/services/story-error-handler", () => ({
  StoryErrorHandler: vi.fn().mockImplementation(() => ({
    handleError: vi.fn(),
  })),
}));

const mockFileMetrics = {
  commitCount: 15,
  authorCount: 3,
  riskScore: 0.6,
  totalChanges: 120,
  bugCommits: 2,
  lastModified: new Date(),
};

const mockFileHistory = [
  {
    sha: "abc123def456",
    authorName: "John Doe",
    message: "Fix component rendering issue",
    timestamp: new Date(),
    fileChanges: [
      {
        changeType: "modified",
        insertions: 5,
        deletions: 2,
      },
    ],
  },
];

const mockRelatedFiles = [
  { filePath: "src/components/related.tsx", frequency: 5 },
  { filePath: "src/utils/helper.ts", frequency: 3 },
];

describe("StoryGenerator - File Story Methods", () => {
  let storyGenerator: StoryGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    storyGenerator = new StoryGenerator();
  });

  describe("generateDetailedFileStory", () => {
    it("should generate a detailed file story", async () => {
      const options = {
        repositoryId: 1,
        filePath: "src/components/test.tsx",
        fileMetrics: mockFileMetrics,
        fileHistory: mockFileHistory,
        relatedFiles: mockRelatedFiles,
        includeMetrics: true,
      };

      const story = await storyGenerator.generateDetailedFileStory(options);

      expect(story).toBeDefined();
      expect(story.repositoryId).toBe(1);
      expect(story.filePath).toBe("src/components/test.tsx");
      expect(story.content).toContain("# The Story of src/components/test.tsx");
      expect(story.content).toContain("Risk Assessment");
      expect(story.content).toContain("Recent Activity");
      expect(story.content).toContain("Related Files");
      expect(story.summary).toBeDefined();
      expect(story.insights).toBeInstanceOf(Array);
      expect(story.recommendations).toBeInstanceOf(Array);
      expect(story.version).toBe("1.0");
    });

    it("should include metrics when requested", async () => {
      const options = {
        repositoryId: 1,
        filePath: "src/components/test.tsx",
        fileMetrics: mockFileMetrics,
        fileHistory: mockFileHistory,
        relatedFiles: mockRelatedFiles,
        includeMetrics: true,
      };

      const story = await storyGenerator.generateDetailedFileStory(options);

      expect(story.content).toContain("Total commits: 15");
      expect(story.content).toContain("Contributors: 3");
      expect(story.content).toContain("Bug fixes: 2");
    });

    it("should exclude metrics when not requested", async () => {
      const options = {
        repositoryId: 1,
        filePath: "src/components/test.tsx",
        fileMetrics: mockFileMetrics,
        fileHistory: mockFileHistory,
        relatedFiles: mockRelatedFiles,
        includeMetrics: false,
      };

      const story = await storyGenerator.generateDetailedFileStory(options);

      expect(story.content).not.toContain("Risk Assessment");
      expect(story.content).not.toContain("Total commits:");
    });
  });

  describe("generateCustomDetailedFileStory", () => {
    it("should generate a custom file story with focus areas", async () => {
      const options = {
        repositoryId: 1,
        filePath: "src/components/test.tsx",
        fileMetrics: mockFileMetrics,
        fileHistory: mockFileHistory,
        customPrompt: "Focus on security aspects",
        focusAreas: ["security", "performance"],
        includeMetrics: true,
      };

      const story = await storyGenerator.generateCustomDetailedFileStory(options);

      expect(story).toBeDefined();
      expect(story.repositoryId).toBe(1);
      expect(story.filePath).toBe("src/components/test.tsx");
      expect(story.content).toContain("# Custom Analysis: src/components/test.tsx");
      expect(story.content).toContain("Focus on security aspects");
      expect(story.content).toContain("1. security");
      expect(story.content).toContain("2. performance");
      expect(story.version).toBe("1.0-custom");
      expect(story.customOptions).toBeDefined();
      expect(story.customOptions?.prompt).toBe("Focus on security aspects");
      expect(story.customOptions?.focusAreas).toEqual(["security", "performance"]);
    });

    it("should include custom insights and recommendations", async () => {
      const options = {
        repositoryId: 1,
        filePath: "src/components/test.tsx",
        fileMetrics: mockFileMetrics,
        fileHistory: mockFileHistory,
        customPrompt: "Security review needed",
        focusAreas: ["security"],
        includeMetrics: true,
      };

      const story = await storyGenerator.generateCustomDetailedFileStory(options);

      expect(story.insights).toContain("Security review recommended for this file");
      expect(story.recommendations).toContain("Conduct security audit");
      expect(story.recommendations).toContain("Review for common vulnerabilities");
    });
  });

  describe("risk level assessment", () => {
    it("should correctly assess critical risk level", async () => {
      const highRiskMetrics = { ...mockFileMetrics, riskScore: 0.9 };
      const options = {
        repositoryId: 1,
        filePath: "src/components/critical.tsx",
        fileMetrics: highRiskMetrics,
        fileHistory: mockFileHistory,
        relatedFiles: mockRelatedFiles,
        includeMetrics: true,
      };

      const story = await storyGenerator.generateDetailedFileStory(options);

      expect(story.content).toContain("Critical");
      expect(story.insights).toContain("This file has a high risk score and may need attention");
      expect(story.recommendations).toContain("Consider refactoring to reduce complexity");
    });

    it("should correctly assess low risk level", async () => {
      const lowRiskMetrics = { ...mockFileMetrics, riskScore: 0.2 };
      const options = {
        repositoryId: 1,
        filePath: "src/components/stable.tsx",
        fileMetrics: lowRiskMetrics,
        fileHistory: mockFileHistory,
        relatedFiles: mockRelatedFiles,
        includeMetrics: true,
      };

      const story = await storyGenerator.generateDetailedFileStory(options);

      expect(story.content).toContain("Low");
    });
  });

  describe("change frequency assessment", () => {
    it("should correctly assess very active files", async () => {
      const veryActiveMetrics = { ...mockFileMetrics, commitCount: 60 };
      const options = {
        repositoryId: 1,
        filePath: "src/components/active.tsx",
        fileMetrics: veryActiveMetrics,
        fileHistory: mockFileHistory,
        relatedFiles: mockRelatedFiles,
        includeMetrics: true,
      };

      const story = await storyGenerator.generateDetailedFileStory(options);

      expect(story.content).toContain("very active");
    });

    it("should correctly assess stable files", async () => {
      const stableMetrics = { ...mockFileMetrics, commitCount: 5 };
      const options = {
        repositoryId: 1,
        filePath: "src/components/stable.tsx",
        fileMetrics: stableMetrics,
        fileHistory: mockFileHistory,
        relatedFiles: mockRelatedFiles,
        includeMetrics: true,
      };

      const story = await storyGenerator.generateDetailedFileStory(options);

      expect(story.content).toContain("stable");
    });
  });
});