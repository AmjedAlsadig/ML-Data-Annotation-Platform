/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

// ===================== MOCK SCHEMA =====================
vi.mock("@shared/schema", () => ({
  annotations: {},
  images: {},
  projects: {},
  labelClasses: {},
  labels: {},
  users: {},
  projectImages: {},
  projectAssignments: {},
}));

// ===================== MOCK DB =====================
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

// ===================================================================
// ========================= getProjectStats ===========================
// ===================================================================
describe("ML Engineer – getProjectStats", () => {
  test("returns full project stats (happy path)", async () => {
    // annotationStats
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [
          {
            totalAnnotations: 5,
            annotatedImages: 3,
            activeAnnotators: 2,
          },
        ],
      }),
    });

    // projectStats
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [
          {
            numberOfImages: 10,
          },
        ],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getProjectStats("p1");

    expect(result.totalAnnotations).toBe(5);
    expect(result.annotatedImages).toBe(3);
    expect(result.activeAnnotators).toBe(2);
    expect(result.numberOfImages).toBe(10);
  });

  test("returns zeros when DB returns empty stats", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getProjectStats("p1");

    expect(result.totalAnnotations).toBe(0);
    expect(result.annotatedImages).toBe(0);
    expect(result.activeAnnotators).toBe(0);
    expect(result.numberOfImages).toBe(0);
  });

  test("throws on invalid project id", async () => {
    const storage = new DbStorage();
    await expect(storage.getProjectStats("" as any)).rejects.toThrow(
      "Invalid project id"
    );
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(storage.getProjectStats("p1")).rejects.toThrow(
      "Failed to fetch project statistics"
    );
  });
});

// ===================================================================
// ========== getEnrichedAnnotationsByImageIds =========================
// ===================================================================
describe("ML Engineer – getEnrichedAnnotationsByImageIds", () => {
  test("returns empty array when imageIds is empty", async () => {
    const storage = new DbStorage();
    const result = await storage.getEnrichedAnnotationsByImageIds([]);

    expect(result).toEqual([]);
  });

  test("throws when imageIds is not an array", async () => {
    const storage = new DbStorage();
    await expect(
      // @ts-expect-error intentionally wrong
      storage.getEnrichedAnnotationsByImageIds("not-array")
    ).rejects.toThrow("Invalid image id list");
  });

  test("throws on invalid image id in list", async () => {
    const storage = new DbStorage();
    await expect(
      storage.getEnrichedAnnotationsByImageIds(["", "img2"])
    ).rejects.toThrow("Invalid image id");
  });

  test("returns enriched annotations (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([
        {
          annotationId: "a1",
          imageId: "img1",
          projectId: "p1",
          labelClass: "Dog",
          labelType: "Animal",
          annotatorId: "u1",
        },
      ]),
    });

    const storage = new DbStorage();
    const result = await storage.getEnrichedAnnotationsByImageIds(["img1"]);

    expect(result.length).toBe(1);
    expect(result[0].labelClass).toBe("Dog");
    expect(result[0].imageId).toBe("img1");
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.getEnrichedAnnotationsByImageIds(["img1"])
    ).rejects.toThrow("Failed to fetch enriched annotations");
  });
});

// ===================================================================
// =================== getAllProjectsWithManifest ======================
// ===================================================================
describe("ML Engineer – getAllProjectsWithManifest", () => {
  test("returns projects with images (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => [
            {
              id: "p1",
              name: "Project 1",
              description: "desc",
              status: "in_progress",
              createdAt: new Date(),
              labelType: { id: "lt1", name: "Animals" },
              createdBy: {
                id: "u1",
                email: "u@test.com",
                name: "Test User",
              },
            },
          ],
        }),
      }),
    });

    const storage = new DbStorage();
    vi.spyOn(storage, "getImagesByProject").mockResolvedValue([
      { id: "img1", filename: "dog.jpg", url: "/dog.jpg", published: true },
    ] as any);

    const result = await storage.getAllProjectsWithManifest();

    expect(result.length).toBe(1);
    expect(result[0].images.length).toBe(1);
    expect(result[0].labelType.name).toBe("Animals");
  });

  test("returns empty list when no projects exist", async () => {
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      leftJoin: () => ({
        leftJoin: () => [],
      }),
    }),
  });

  const storage = new DbStorage();
  const res = await storage.getAllProjectsWithManifest();

  expect(res).toEqual([]);
});


  test("returns project with empty images", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => [
            {
              id: "p1",
              name: "Project 1",
              description: "desc",
              status: "in_progress",
              createdAt: new Date(),
              labelType: { id: "lt1", name: "Animals" },
              createdBy: {
                id: "u1",
                email: "u@test.com",
                name: "Test User",
              },
            },
          ],
        }),
      }),
    });

    const storage = new DbStorage();
    vi.spyOn(storage, "getImagesByProject").mockResolvedValue([]);

    const res = await storage.getAllProjectsWithManifest();

    expect(res[0].images).toEqual([]);
  });

  test("throws when DB fails in base query", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const storage = new DbStorage();
    await expect(storage.getAllProjectsWithManifest()).rejects.toThrow(
      "Failed to fetch projects"
    );
  });

  test("throws when fetching images for project fails", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => [
            {
              id: "p1",
              name: "Project 1",
              description: "desc",
              status: "in_progress",
              createdAt: new Date(),
              labelType: { id: "lt1", name: "Animals" },
              createdBy: {
                id: "u1",
                email: "u@test.com",
                name: "Test User",
              },
            },
          ],
        }),
      }),
    });

    const storage = new DbStorage();
    vi.spyOn(storage, "getImagesByProject").mockRejectedValue(
      new Error("fail")
    );

    await expect(storage.getAllProjectsWithManifest()).rejects.toThrow(
      "Failed to fetch project manifest"
    );
  });
});

// ===================================================================
// ====================== getImage / getAllImages ======================
// ===================================================================
describe("ML Engineer – image read APIs", () => {
  test("getImage returns image (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [
          { id: "img1", filename: "x.png", url: "/x.png" },
        ],
      }),
    });

    const storage = new DbStorage();
    const image = await storage.getImage("img1");

    expect(image.filename).toBe("x.png");
  });

  test("getImage throws on invalid id", async () => {
    const storage = new DbStorage();
    await expect(storage.getImage("" as any)).rejects.toThrow(
      "Invalid image id"
    );
  });

  test("getImage throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(storage.getImage("img1")).rejects.toThrow(
      "Failed to fetch image"
    );
  });

  test("getImage throws when image not found", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    const storage = new DbStorage();
    await expect(storage.getImage("img1")).rejects.toThrow("Image not found");
  });

  test("getAllImages returns images", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => [{ id: "i1" }, { id: "i2" }],
    });

    const storage = new DbStorage();
    const images = await storage.getAllImages();

    expect(images.length).toBe(2);
  });

  test("getAllImages throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const storage = new DbStorage();
    await expect(storage.getAllImages()).rejects.toThrow(
      "Failed to fetch images"
    );
  });
});

// ===================================================================
// ======================= getAllLabelTypes ============================
// ===================================================================
describe("ML Engineer – getAllLabelTypes", () => {
  test("returns list of label types (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({
          groupBy: () => ({
            orderBy: () => [
              { id: "lt1", name: "Animals", classCount: 3 },
            ],
          }),
        }),
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getAllLabelTypes();

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Animals");
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(storage.getAllLabelTypes()).rejects.toThrow(
      "Failed to fetch label types"
    );
  });
});
