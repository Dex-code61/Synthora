import { describe, it, expect, vi, beforeEach } from "vitest";
import { SemanticSearchService } from "../semantic-search";
import { EmbeddingGenerator } from "../embedding-generator";
import { prisma } from "@/lib/prisma";

// Mock EmbeddingGenerator
vi.mock("../embedding-generator");

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    commit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    embedding: {
      findFirst: vi.fn(),
    },
  },
}));

describe("SemanticSearchService", () => {
  let searchService: SemanticSearchService;
  let mockEmbeddingGenerator: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmbeddingGenerator = {
      searchSimilar: vi.fn(),
      hasEmbeddings: vi.fn(),
      generateCommitEmbeddings: vi.fn(),
      generateAndStoreEmbeddings: vi.fn(),
    };

    vi.mocked(EmbeddingGenerator).mockImplementation(
      () => mockEmbeddingGenerator
    );

    searchService = new SemanticSearchService();
  });

  describe("search", () => {
    it("should perform semantic search and return results", async () => {
      const mockEmbeddingResults = [
        {
          id: 1,
          contentType: "commit",
          contentId: "abc123",
          contentText: "Fix authentication bug",
          embedding: [0.1, 0.2],
          similarity: 0.85,
        },
      ];

      const mockCommit = {
        id: 1,
        createdAt: new Date("2024-01-01"),
        repositoryId: 1,
        sha: "abc123",
        authorName: "John Doe",
        authorEmail: "john@example.com",
        message: "Fix authentication bug",
        timestamp: new Date("2024-01-01"),
        filesChanged: 2,
        insertions: 10,
        deletions: 5,
        fileChanges: [
          { filePath: "src/auth.ts" },
          { filePath: "src/login.ts" },
        ],
      };

      mockEmbeddingGenerator.searchSimilar.mockResolvedValue(
        mockEmbeddingResults
      );
      vi.mocked(prisma.commit.findUnique).mockResolvedValue(mockCommit);

      const result = await searchService.search("authentication bug", 1, {
        limit: 10,
        offset: 0,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({
        id: "abc123",
        type: "commit",
        title: "Fix authentication bug",
        similarity: 0.85,
        author: "John Doe",
        filePaths: ["src/auth.ts", "src/login.ts"],
      });
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it("should apply filters correctly", async () => {
      const dateRange = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
      };

      const mockEmbeddingResults = [
        {
          id: 1,
          contentType: "commit",
          contentId: "abc123",
          contentText: "Fix bug",
          embedding: [0.1, 0.2],
          similarity: 0.85,
        },
      ];

      const mockCommit = {
        id: 1,
        createdAt: new Date("2024-01-15"),
        repositoryId: 1,
        sha: "abc123",
        authorName: "John Doe",
        authorEmail: "john@example.com",
        message: "Fix bug",
        timestamp: new Date("2024-01-15"), // Within range
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        fileChanges: [],
      };

      mockEmbeddingGenerator.searchSimilar.mockResolvedValue(
        mockEmbeddingResults
      );
      vi.mocked(prisma.commit.findUnique).mockResolvedValue(mockCommit);

      const result = await searchService.search("bug fix", 1, {
        filters: {
          dateRange,
          authors: ["John Doe"],
          contentTypes: ["commit"],
        },
      });

      expect(mockEmbeddingGenerator.searchSimilar).toHaveBeenCalledWith(
        "bug fix",
        1,
        expect.objectContaining({
          contentTypes: ["commit"],
        })
      );
      expect(result.results).toHaveLength(1);
    });

    it("should filter out results outside date range", async () => {
      const dateRange = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
      };

      const mockEmbeddingResults = [
        {
          id: 1,
          contentType: "commit",
          contentId: "abc123",
          contentText: "Fix bug",
          embedding: [0.1, 0.2],
          similarity: 0.85,
        },
      ];

      const mockCommit = {
        id: 1,
        createdAt: new Date("2024-02-15"),
        repositoryId: 1,
        sha: "abc123",
        authorName: "John Doe",
        authorEmail: "john@example.com",
        message: "Fix bug",
        timestamp: new Date("2024-02-15"), // Outside range
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        fileChanges: [],
      };

      mockEmbeddingGenerator.searchSimilar.mockResolvedValue(
        mockEmbeddingResults
      );
      vi.mocked(prisma.commit.findUnique).mockResolvedValue(mockCommit);

      const result = await searchService.search("bug fix", 1, {
        filters: { dateRange },
      });

      expect(result.results).toHaveLength(0);
    });

    it("should handle pagination correctly", async () => {
      const mockEmbeddingResults = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        contentType: "commit",
        contentId: `commit-${i}`,
        contentText: `Commit ${i}`,
        embedding: [0.1, 0.2],
        similarity: 0.8,
      }));

      mockEmbeddingGenerator.searchSimilar.mockResolvedValue(
        mockEmbeddingResults
      );
      vi.mocked(prisma.commit.findUnique).mockImplementation(
        ({ where }) =>
          Promise.resolve({
            id: 1,
            createdAt: new Date(),
            repositoryId: 1,
            sha: where.sha,
            authorName: "Author",
            authorEmail: "author@example.com",
            message: `Message for ${where.sha}`,
            timestamp: new Date(),
            filesChanged: 0,
            insertions: 0,
            deletions: 0,
            fileChanges: [],
          }) as any
      );

      const result = await searchService.search("test", 1, {
        limit: 10,
        offset: 0,
      });

      expect(result.results).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(25);
    });
  });

  describe("getSearchSuggestions", () => {
    it("should return search suggestions based on commit messages", async () => {
      const mockCommits = [
        { message: "Fix authentication bug in login system" },
        { message: "Update authentication middleware" },
        { message: "Add authentication tests" },
      ];

      vi.mocked(prisma.commit.findMany).mockResolvedValue(mockCommits as any);

      const suggestions = await searchService.getSearchSuggestions(
        1,
        "auth",
        5
      );

      expect(prisma.commit.findMany).toHaveBeenCalledWith({
        where: {
          repositoryId: 1,
          message: {
            contains: "auth",
            mode: "insensitive",
          },
        },
        select: { message: true },
        take: 100,
      });

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it("should return empty array for short queries", async () => {
      const suggestions = await searchService.getSearchSuggestions(1, "a", 5);
      expect(suggestions).toEqual([]);
      // The method still calls the database but returns empty results for short queries
    });
  });

  describe("initializeRepositoryEmbeddings", () => {
    it("should generate embeddings if they do not exist", async () => {
      mockEmbeddingGenerator.hasEmbeddings.mockResolvedValue(false);

      await searchService.initializeRepositoryEmbeddings(1);

      expect(mockEmbeddingGenerator.hasEmbeddings).toHaveBeenCalledWith(1);
      expect(
        mockEmbeddingGenerator.generateCommitEmbeddings
      ).toHaveBeenCalledWith(1);
    });

    it("should skip generation if embeddings already exist", async () => {
      mockEmbeddingGenerator.hasEmbeddings.mockResolvedValue(true);

      await searchService.initializeRepositoryEmbeddings(1);

      expect(mockEmbeddingGenerator.hasEmbeddings).toHaveBeenCalledWith(1);
      expect(
        mockEmbeddingGenerator.generateCommitEmbeddings
      ).not.toHaveBeenCalled();
    });
  });

  describe("updateEmbeddings", () => {
    it("should generate embeddings for new commits", async () => {
      const latestEmbedding = {
        createdAt: new Date("2024-01-01"),
      };

      const newCommits = [
        { sha: "new123", message: "New commit", authorName: "Author" },
      ];

      vi.mocked(prisma.embedding.findFirst).mockResolvedValue(
        latestEmbedding as any
      );
      vi.mocked(prisma.commit.findMany).mockResolvedValue(newCommits as any);

      await searchService.updateEmbeddings(1);

      expect(prisma.commit.findMany).toHaveBeenCalledWith({
        where: {
          repositoryId: 1,
          createdAt: { gt: latestEmbedding.createdAt },
        },
        select: {
          sha: true,
          message: true,
          authorName: true,
        },
      });

      expect(
        mockEmbeddingGenerator.generateAndStoreEmbeddings
      ).toHaveBeenCalledWith([
        {
          contentType: "commit",
          contentId: "new123",
          contentText: "New commit (by Author)",
          repositoryId: 1,
        },
      ]);
    });

    it("should handle case with no previous embeddings", async () => {
      vi.mocked(prisma.embedding.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.commit.findMany).mockResolvedValue([] as any);

      await searchService.updateEmbeddings(1);

      expect(prisma.commit.findMany).toHaveBeenCalledWith({
        where: {
          repositoryId: 1,
        },
        select: {
          sha: true,
          message: true,
          authorName: true,
        },
      });
    });

    it("should skip if no new commits", async () => {
      vi.mocked(prisma.embedding.findFirst).mockResolvedValue({
        createdAt: new Date("2024-01-01"),
      } as any);
      vi.mocked(prisma.commit.findMany).mockResolvedValue([] as any);

      await searchService.updateEmbeddings(1);

      expect(
        mockEmbeddingGenerator.generateAndStoreEmbeddings
      ).not.toHaveBeenCalled();
    });
  });

  describe("extractSnippet", () => {
    it("should return full content if under max length", () => {
      const content = "Short content";
      const result = searchService["extractSnippet"](content, 100);
      expect(result).toBe(content);
    });

    it("should truncate content if over max length", () => {
      const content =
        "This is a very long content that exceeds the maximum length limit";
      const result = searchService["extractSnippet"](content, 20);
      expect(result).toBe("This is a very lo...");
      expect(result.length).toBe(20);
    });
  });

  describe("applyFilters", () => {
    const mockResults = [
      {
        id: "1",
        type: "commit" as const,
        title: "Fix bug",
        content: "Fix authentication bug",
        snippet: "Fix authentication bug",
        similarity: 0.9,
        timestamp: new Date("2024-01-15"),
        author: "John Doe",
        filePaths: ["src/auth.ts"],
      },
      {
        id: "2",
        type: "commit" as const,
        title: "Add feature",
        content: "Add new feature",
        snippet: "Add new feature",
        similarity: 0.8,
        timestamp: new Date("2024-02-15"),
        author: "Jane Smith",
        filePaths: ["src/feature.ts"],
      },
    ];

    it("should filter by authors", () => {
      const filtered = searchService["applyFilters"](mockResults, {
        authors: ["John Doe"],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].author).toBe("John Doe");
    });

    it("should filter by file paths", () => {
      const filtered = searchService["applyFilters"](mockResults, {
        filePaths: ["auth"],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].filePaths).toContain("src/auth.ts");
    });

    it("should filter by date range", () => {
      const filtered = searchService["applyFilters"](mockResults, {
        dateRange: {
          from: new Date("2024-01-01"),
          to: new Date("2024-01-31"),
        },
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].timestamp).toEqual(new Date("2024-01-15"));
    });
  });
});
