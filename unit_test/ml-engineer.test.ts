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
}));

// ===================== GENERIC QB =====================
function createQB(rows: any[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue(rows),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnValue(rows),
  };
}

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
    (db.select as any).mockImplementationOnce(() =>
      createQB([{ totalAnnotations: 5, annotatedImages: 3, activeAnnotators: 2 }])
    );
    (db.select as any).mockImplementationOnce(() =>
      createQB([{ numberOfImages: 10 }])
    );

    const storage = new DbStorage();
    const result = await storage.getProjectStats("p1");

    expect(result.totalAnnotations).toBe(5);
    expect(result.annotatedImages).toBe(3);
    expect(result.activeAnnotators).toBe(2);
    expect(result.numberOfImages).toBe(10);
  });

  test("throws on invalid project id", async () => {
    const storage = new DbStorage();
    await expect(storage.getProjectStats("" as any)).rejects.toThrow(
      "Invalid project id"
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

  test("returns enriched annotations (happy path)", async () => {
    (db.select as any).mockImplementationOnce(() =>
      createQB([
        {
          annotationId: "a1",
          imageId: "img1",
          labelClass: "Dog",
          labelType: "Animal",
        },
      ])
    );

    const storage = new DbStorage();
    const result = await storage.getEnrichedAnnotationsByImageIds(["img1"]);

    expect(result.length).toBe(1);
    expect(result[0].labelClass).toBe("Dog");
  });

  test("throws on invalid image id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.getEnrichedAnnotationsByImageIds([""])
    ).rejects.toThrow("Invalid image id");
  });
});

// ===================================================================
// =================== getAllProjectsWithManifest ======================
// ===================================================================
describe("ML Engineer – getAllProjectsWithManifest", () => {
  test("returns projects with images", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => [
            {
              id: "p1",
              name: "Project 1",
              status: "in_progress",
              labelType: { id: "lt1", name: "Animals" },
              createdBy: { id: "u1", email: "u@test.com" },
            },
          ],
        }),
      }),
    });

    const storage = new DbStorage();
    vi.spyOn(storage, "getImagesByProject").mockResolvedValue([
      { id: "img1", filename: "dog.jpg", url: "/dog.jpg" },
    ]);

    const result = await storage.getAllProjectsWithManifest();

    expect(result.length).toBe(1);
    expect(result[0].images.length).toBe(1);
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const storage = new DbStorage();
    await expect(storage.getAllProjectsWithManifest()).rejects.toThrow(
      "Failed to fetch projects"
    );
  });
});

// ===================================================================
// ====================== getImage / getAllImages ======================
// ===================================================================
test("ML Engineer – getImage returns image", async () => {
  (db.select as any).mockImplementationOnce(() =>
    createQB([{ id: "img1", filename: "x.png" }])
  );

  const storage = new DbStorage();
  const image = await storage.getImage("img1");

  expect(image.filename).toBe("x.png");
});

test("ML Engineer – getAllImages returns images", async () => {
  (db.select as any).mockReturnValueOnce({
    from: () => [{ id: "i1" }, { id: "i2" }],
  });

  const storage = new DbStorage();
  const images = await storage.getAllImages();

  expect(images.length).toBe(2);
});

// ===================================================================
// ======================= getAllLabelTypes ============================
// ===================================================================
test("ML Engineer – getAllLabelTypes returns list", async () => {
  (db.select as any).mockImplementationOnce(() =>
    createQB([{ id: "lt1", name: "Animals", classCount: 3 }])
  );

  const storage = new DbStorage();
  const result = await storage.getAllLabelTypes();

  expect(result.length).toBe(1);
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

test("throws when DB fails", async () => {
  (db.select as any).mockImplementationOnce(() => {
    throw new Error("db fail");
  });

  const storage = new DbStorage();

  await expect(
    storage.getEnrichedAnnotationsByImageIds(["img1"])
  ).rejects.toThrow("Failed to fetch enriched annotations");
});

test("throws on invalid image id list", async () => {
  const storage = new DbStorage();

  await expect(
    storage.getEnrichedAnnotationsByImageIds([""])
  ).rejects.toThrow("Invalid image id");
});

test("returns empty list when no projects exist", async () => {
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      leftJoin: () => ({
        leftJoin: () => []
      })
    })
  });

  const storage = new DbStorage();
  const res = await storage.getAllProjectsWithManifest();

  expect(res).toEqual([]);
});


test("getProjectStats throws when DB fails", async () => {
  (db.select as any).mockImplementationOnce(() => {
    throw new Error("db fail");
  });

  const storage = new DbStorage();

  await expect(
    storage.getProjectStats("p1")
  ).rejects.toThrow("Failed to fetch project statistics");
});

test("getProjectStats throws when DB fails", async () => {
  (db.select as any).mockImplementationOnce(() => {
    throw new Error("db fail");
  });

  const storage = new DbStorage();

  await expect(
    storage.getProjectStats("p1")
  ).rejects.toThrow("Failed to fetch project statistics");
});

test("returns project with empty images", async () => {
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      leftJoin: () => ({
        leftJoin: () => [
          {
            id: "p1",
            name: "Project 1",
            status: "in_progress",
            labelType: { id: "lt1", name: "Animals" },
            createdBy: { id: "u1", email: "u@test.com" }
          }
        ]
      })
    })
  });

  const storage = new DbStorage();
  vi.spyOn(storage, "getImagesByProject").mockResolvedValue([]);

  const res = await storage.getAllProjectsWithManifest();

  expect(res[0].images).toEqual([]);
});

