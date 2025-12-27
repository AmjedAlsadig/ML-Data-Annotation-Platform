/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock schema
vi.mock("@shared/schema", () => ({
  users: {},
  projects: {},
  labels: {},
  labelClasses: {},
  images: {},
  annotations: {},
  projectAssignments: {},
  projectImages: {},
}));

// Mock DB
vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { DbStorage } from "../backend/storage";
import { db } from "../backend/db";

beforeEach(() => {
  vi.clearAllMocks();
});

// ======================= createImage =======================
describe("Image – createImage", () => {
  test("creates image (happy path)", async () => {
    const newImage = {
      id: "img1",
      filename: "cat.png",
      url: "https://example.com/cat.png",
      uploadedAt: new Date(),
    };

    (db.insert as any).mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnValue([newImage]),
    });

    const storage = new DbStorage();
    const result = await storage.createImage(newImage as any);

    expect(result).toEqual(newImage);
  });

  test("throws on invalid image payload", async () => {
    const storage = new DbStorage();

    await expect(
      storage.createImage({ filename: "", url: "" } as any)
    ).rejects.toThrow("Invalid image payload");
  });

  test("throws when DB insert fails", async () => {
    (db.insert as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.createImage({
        filename: "cat.png",
        url: "https://example.com/cat.png",
      } as any)
    ).rejects.toThrow("DB insert failed");
  });

  test("throws when DB insert returns no image", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnValue([]),
    });

    const storage = new DbStorage();

    await expect(
      storage.createImage({
        filename: "cat.png",
        url: "https://example.com/cat.png",
      } as any)
    ).rejects.toThrow("Failed to create image");
  });
});

// ======================= getAllImages =======================
describe("Image – getAllImages", () => {
  test("returns all images (happy path)", async () => {
    const rows = [
      { id: "img1", filename: "a.png" },
      { id: "img2", filename: "b.png" },
    ];

    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue(rows),
    });

    const storage = new DbStorage();
    const result = await storage.getAllImages();

    expect(result.length).toBe(2);
    expect(result[0].id).toBe("img1");
  });

  test("throws when DB select fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(storage.getAllImages()).rejects.toThrow(
      "Failed to fetch images"
    );
  });
});

// ======================= getImagesByFilename =======================
describe("Image – getImagesByFilename", () => {
  test("returns images by filename (happy path)", async () => {
    const rows = [
      { id: "img1", filename: "cat.png" },
      { id: "img2", filename: "cat.png" },
    ];

    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue(rows),
    });

    const storage = new DbStorage();
    const result = await storage.getImagesByFilename("cat.png");

    expect(result.length).toBe(2);
    expect(result[0].filename).toBe("cat.png");
  });

  test("throws on invalid filename", async () => {
    const storage = new DbStorage();

    await expect(
      storage.getImagesByFilename("" as any)
    ).rejects.toThrow("Invalid filename");
  });

  test("throws when DB select fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.getImagesByFilename("cat.png")
    ).rejects.toThrow("Failed to fetch images by filename");
  });
});

// ======================= getAnnotationsByImage =======================
describe("Image – getAnnotationsByImage", () => {
  test("returns annotation details for image (happy path)", async () => {
    const rows = [
      {
        id: "a1",
        projectName: "Proj",
        labelTypeName: "Animal",
        labelClassName: "Cat",
        annotatorName: "Test User",
      },
    ];

    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue(rows),
    });

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByImage("img1");

    expect(result.length).toBe(1);
    expect(result[0].labelClassName).toBe("Cat");
  });

  test("throws on invalid image id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.getAnnotationsByImage("" as any)
    ).rejects.toThrow("Invalid image id");
  });

  test("throws when DB select fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.getAnnotationsByImage("img1")
    ).rejects.toThrow("Failed to fetch annotations by image");
  });
});
