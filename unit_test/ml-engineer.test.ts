/// <reference types="vitest/globals" />

import { describe, test, expect, vi } from "vitest";

// -------------------------- FIX SCHEMA MOCK --------------------------
vi.mock("@shared/schema", () => ({
  annotations: {},
  images: {},
  projects: {},
  labelClasses: {},
  labels: {},   // REQUIRED
  users: {},
  projectImages: {},
}));

// -------------------------- GENERIC QB --------------------------
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

vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

import { DbStorage } from "../backend/storage";
import { db } from "../backend/db";

// ================================ getProjectStats ================================
describe("ML Engineer – getProjectStats()", () => {
  test("returns correct project statistics", async () => {
    (db.select as any).mockImplementationOnce(() =>
        createQB([{ totalAnnotations: 10, annotatedImages: 5, activeAnnotators: 2 }])
    );

    (db.select as any).mockImplementationOnce(() =>
        createQB([{ numberOfImages: 12 }])
    );

    const storage = new DbStorage();
    const result = await storage.getProjectStats("p1");

    expect(result.totalAnnotations).toBe(10);
    expect(result.annotatedImages).toBe(5);
    expect(result.activeAnnotators).toBe(2);
    expect(result.numberOfImages).toBe(12);
  });
});

// ======================== getEnrichedAnnotationsByImageIds =========================
describe("ML Engineer – getEnrichedAnnotationsByImageIds()", () => {
  test("returns empty list when no ids", async () => {
    const storage = new DbStorage();
    expect(await storage.getEnrichedAnnotationsByImageIds([])).toEqual([]);
  });

  test("returns enriched annotations", async () => {
    const rows = [{
      annotationId: "a1",
      imageId: "img1",
      labelClass: "Dog",
      labelType: "Animal",
      annotatedAt: "2025-01-10",
      annotatorId: "u1"
    }];

    (db.select as any).mockImplementationOnce(() => createQB(rows));

    const storage = new DbStorage();
    const result = await storage.getEnrichedAnnotationsByImageIds(["img1"]);

    expect(result.length).toBe(1);
    expect(result[0].labelClass).toBe("Dog");
  });
});

// =========================== getAllProjectsWithManifest ===========================
describe("ML Engineer – getAllProjectsWithManifest()", () => {
  test("returns project manifest including images", async () => {
    const projectRows = [{
      id: "p1",
      name: "Project 1",
      description: "Demo",
      status: "in_progress",
      createdAt: "2025-01-01",
      labelType: { id: "lt1", name: "Animals", description: "Animal labels" },
      createdBy: { id: "u1", email: "user@mail.com" }
    }];

    (db.select as any).mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => projectRows
        })
      })
    });

    const mockImages = [
      {
        id: "img1",
        filename: "dog.jpg",
        url: "/i/dog.jpg",
        uploadedAt: new Date("2025-01-01T00:00:00Z"),
        published: true,
      },
    ];

    const storage = new DbStorage();
    vi.spyOn(storage, "getImagesByProject").mockResolvedValue(mockImages);

    const result = await storage.getAllProjectsWithManifest();

    expect(result.length).toBe(1);
    expect(result[0].images[0].filename).toBe("dog.jpg");
  });
});

// ================================ getAllImages ================================
test("ML Engineer – getAllImages returns images", async () => {
  (db.select as any).mockReturnValueOnce({
    from: () => [
      { id: "i1", filename: "dog.jpg" },
      { id: "i2", filename: "cat.jpg" }
    ]
  });

  const storage = new DbStorage();
  const result = await storage.getAllImages();

  expect(result!.length).toBe(2);
});

// ================================ getImage ================================
test("ML Engineer – getImage returns single image", async () => {
  (db.select as any).mockImplementationOnce(() =>
      createQB([{ id: "img1", filename: "x.png" }])
  );

  const storage = new DbStorage();
  const img = await storage.getImage("img1");

  expect(img?.filename).toBe("x.png");
});

// ================================ getAllLabelTypes ================================
test("ML Engineer – getAllLabelTypes returns list", async () => {
  (db.select as any).mockImplementationOnce(() =>
      createQB([{ id: "lt1", name: "Dogs", classCount: 4 }])
  );

  const storage = new DbStorage();
  const types = await storage.getAllLabelTypes();

  expect(types.length).toBe(1);
});