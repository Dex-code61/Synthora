import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmbeddingGenerator } from "../embedding-generator";
import { prisma } from "@/lib/prisma";

// Mock OpenAI
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn(),
    },
  })),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    embedding: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    commit: {
      findMany: vi.fn(),
    },
  },
}));

describe("EmbeddingGenerator", () => {
  let embeddingGenerator: EmbeddingGenerator;
  let mockOpenAI: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";

    // Get the mocked OpenAI constructor
    const OpenAI = vi.mocked(await import("openai")).default;
    mockOpenAI = {
      embeddings: {
        create: vi.fn(),
      },
    };
    (OpenAI as any).mockImplementation(() => mockOpenAI);

    embeddingGenerator = new EmbeddingGenerator();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe("constructor", () => {
    it("should throw error if OPENAI_API_KEY is not set", () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new EmbeddingGenerator()).toThrow(
        "OPENAI_API_KEY environment variable is required"
      );
    });

    it("should initialize with API key", () => {
      expect(() => new EmbeddingGenerator()).not.toThrow();
    });
  });

  describe("generateEmbedding", () => {
    it("should generate embedding for text", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await embeddingGenerator.generateEmbedding("test text");

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: "text-embedding-3-small",
        input: "test text",
        encoding_format: "float",
      });
      expect(result).toEqual(mockEmbedding);
    });

    it("should handle API errors", async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error("API Error"));

      await expect(
        embeddingGenerator.generateEmbedding("test text")
      ).rejects.toThrow("Failed to generate embedding");
    });
  });

  describe("generateAndStoreEmbeddings", () => {
    it("should generate and store embeddings in batches", async () => {
      const contents = Array.from({ length: 150 }, (_, i) => ({
        contentType: "commit" as const,
        contentId: `commit-${i}`,
        contentText: `Commit message ${i}`,
        repositoryId: 1,
      }));

      const mockEmbeddings = Array.from({ length: 100 }, (_, i) => [
        i * 0.1,
        i * 0.2,
      ]);
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: mockEmbeddings.map((embedding) => ({ embedding })),
      });

      vi.mocked(prisma.embedding.createMany).mockResolvedValue({ count: 100 });

      await embeddingGenerator.generateAndStoreEmbeddings(contents);

      // Should be called twice (100 + 50 items)
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2);
      expect(prisma.embedding.createMany).toHaveBeenCalledTimes(2);
    });

    it("should continue processing if one batch fails", async () => {
      const contents = Array.from({ length: 150 }, (_, i) => ({
        contentType: "commit" as const,
        contentId: `commit-${i}`,
        contentText: `Commit message ${i}`,
        repositoryId: 1,
      }));

      mockOpenAI.embeddings.create
        .mockRejectedValueOnce(new Error("First batch failed"))
        .mockResolvedValueOnce({
          data: Array.from({ length: 50 }, (_, i) => ({
            embedding: [i * 0.1],
          })),
        });

      vi.mocked(prisma.embedding.createMany).mockResolvedValue({ count: 50 });

      await embeddingGenerator.generateAndStoreEmbeddings(contents);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2);
      expect(prisma.embedding.createMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("generateCommitEmbeddings", () => {
    it("should generate embeddings for all commits in repository", async () => {
      const mockCommits = [
        {
          sha: "abc123",
          message: "Fix bug",
          authorName: "John",
          timestamp: new Date(),
        },
        {
          sha: "def456",
          message: "Add feature",
          authorName: "Jane",
          timestamp: new Date(),
        },
      ];

      vi.mocked(prisma.commit.findMany).mockResolvedValue(mockCommits as any);
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: mockCommits.map(() => ({ embedding: [0.1, 0.2] })),
      });
      vi.mocked(prisma.embedding.createMany).mockResolvedValue({ count: 2 });

      await embeddingGenerator.generateCommitEmbeddings(1);

      expect(prisma.commit.findMany).toHaveBeenCalledWith({
        where: { repositoryId: 1 },
        select: {
          sha: true,
          message: true,
          authorName: true,
          timestamp: true,
        },
      });

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: "text-embedding-3-small",
        input: ["Fix bug (by John)", "Add feature (by Jane)"],
        encoding_format: "float",
      });
    });
  });

  describe("searchSimilar", () => {
    it("should search for similar embeddings", async () => {
      const queryEmbedding = [1.0, 0.0, 0.0];
      const mockEmbeddings = [
        {
          id: 1,
          contentType: "commit",
          contentId: "abc123",
          contentText: "Fix bug",
          embedding: [0.9, 0.1, 0.1], // High similarity (cosine ~0.9)
        },
        {
          id: 2,
          contentType: "commit",
          contentId: "def456",
          contentText: "Add feature",
          embedding: [0.1, 0.9, 0.1], // Low similarity (cosine ~0.1)
        },
      ];

      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: queryEmbedding }],
      });
      vi.mocked(prisma.embedding.findMany).mockResolvedValue(mockEmbeddings as any);

      const results = await embeddingGenerator.searchSimilar("bug fix", 1, {
        limit: 5,
        threshold: 0.7,
      });

      expect(results).toHaveLength(1);
      expect(results[0].contentId).toBe("abc123");
      expect(results[0].similarity).toBeGreaterThan(0.7);
    });

    it("should filter by content types", async () => {
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: [0.5, 0.5, 0.5] }],
      });
      vi.mocked(prisma.embedding.findMany).mockResolvedValue([]);

      await embeddingGenerator.searchSimilar("test query", 1, {
        contentTypes: ["commit", "pr"],
      });

      expect(prisma.embedding.findMany).toHaveBeenCalledWith({
        where: {
          repositoryId: 1,
          contentType: { in: ["commit", "pr"] },
        },
      });
    });
  });

  describe("hasEmbeddings", () => {
    it("should return true if embeddings exist", async () => {
      vi.mocked(prisma.embedding.count).mockResolvedValue(5);

      const result = await embeddingGenerator.hasEmbeddings(1);

      expect(result).toBe(true);
      expect(prisma.embedding.count).toHaveBeenCalledWith({
        where: { repositoryId: 1 },
      });
    });

    it("should return false if no embeddings exist", async () => {
      vi.mocked(prisma.embedding.count).mockResolvedValue(0);

      const result = await embeddingGenerator.hasEmbeddings(1);

      expect(result).toBe(false);
    });
  });

  describe("deleteRepositoryEmbeddings", () => {
    it("should delete all embeddings for repository", async () => {
      vi.mocked(prisma.embedding.deleteMany).mockResolvedValue({ count: 10 });

      await embeddingGenerator.deleteRepositoryEmbeddings(1);

      expect(prisma.embedding.deleteMany).toHaveBeenCalledWith({
        where: { repositoryId: 1 },
      });
    });
  });
});
