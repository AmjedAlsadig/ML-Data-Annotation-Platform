/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

// ===================== MOCK SCHEMA =====================
vi.mock("@shared/schema", () => ({
  images: {},
  projects: {},
  projectImages: {},
  labels: {},
  labelClasses: {},
}));

// ===================== MOCK DB =====================
vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

import { DbStorage } from "../backend/storage";
import { db } from "../backend/db";

beforeEach(() => {
  vi.clearAllMocks();
});

// ===================================================================
// =========================== getAllImages ============================
// ===================================================================
describe("Data Specialist – getAllImages", () => {
  test("returns images (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => [
        { id: "img1", filename: "dog.jpg" },
        { id: "img2", filename: "cat.jpg" },
      ],
    });

    const storage = new DbStorage();
    const result = await storage.getAllImages();

    expect(result.length).toBe(2);
  });

  test("throws when DB fails", async () => {
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
// ============================ createImage ============================
// ===================================================================
describe("Data Specialist – createImage", () => {
  test("creates image successfully", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [{ id: "img1", filename: "dog.jpg", url: "/dog.jpg" }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.createImage({
      filename: "dog.jpg",
      url: "/dog.jpg",
    });

    expect(result.id).toBe("img1");
  });

  test("throws on invalid payload", async () => {
    const storage = new DbStorage();
    await expect(
      storage.createImage({ filename: "" } as any)
    ).rejects.toThrow("Invalid image payload");
  });
});

// ===================================================================
// ======================== assignImagesToProject ======================
// ===================================================================
describe("Data Specialist – assignImagesToProject", () => {
  test("assigns images successfully", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ id: "img1" }, { id: "img2" }],
      }),
    });

    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => [
            { projectId: "p1", imageId: "img1" },
            { projectId: "p1", imageId: "img2" },
          ],
        }),
      }),
    });

    const storage = new DbStorage();
    const result = await storage.assignImagesToProject("p1", ["img1", "img2"]);

    expect(result.length).toBe(2);
  });

  test("throws when images not found", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.assignImagesToProject("p1", ["imgX"])
    ).rejects.toThrow("Some images not found");
  });
});

// ===================================================================
// ======================= removeImageAssignment =======================
// ===================================================================
test("Data Specialist – removeImageAssignment removes row", async () => {
  (db.delete as any).mockReturnValueOnce({
    where: () => ({
      returning: () => [{ projectId: "p1", imageId: "img1" }],
    }),
  });

  const storage = new DbStorage();
  const result = await storage.removeImageAssignment("p1", "img1");

  expect(result.imageId).toBe("img1");
});

test("throws when fetching images fails", async () => {
  (db.select as any).mockResolvedValueOnce([
    { id: "p1", name: "Project 1" }
  ]);

  const storage = new DbStorage();
  vi.spyOn(storage, "getImagesByProject")
    .mockRejectedValueOnce(new Error("fail"));

  await expect(
    storage.getAllProjectsWithManifest()
  ).rejects.toThrow("Failed to fetch projects");
});


test("createProject throws when DB insert fails", async () => {
  (db.insert as any).mockImplementationOnce(() => {
    throw new Error("db fail");
  });

  const storage = new DbStorage();

  await expect(
    storage.createProject({ name: "X", createdBy: "u1" } as any)
  ).rejects.toThrow("DB insert failed");
});

test("deleteProject throws when project not found", async () => {
  (db.delete as any).mockReturnValueOnce({
    execute: vi.fn().mockResolvedValue({ rowCount: 0 }),
  });

  const storage = new DbStorage();

  await expect(
    storage.deleteProject("p1")
  ).rejects.toThrow("Failed to delete project");
});

test("updateProjectStatus throws on invalid id", async () => {
  const storage = new DbStorage();

  await expect(
    storage.updateProjectStatus("", "completed")
  ).rejects.toThrow("Invalid project id");
});

test("assignImagesToProject throws on invalid image id", async () => {
  const storage = new DbStorage();

  await expect(
    storage.assignImagesToProject("p1", [123 as any])
  ).rejects.toThrow("Invalid image id");
});

test("throws when image fetch throws", async () => {
  (db.select as any).mockResolvedValueOnce([
    { id: "p1", name: "Project 1" }
  ]);

  const storage = new DbStorage();
  vi.spyOn(storage, "getImagesByProject")
    .mockRejectedValueOnce(new Error("fail"));

  await expect(
    storage.getAllProjectsWithManifest()
  ).rejects.toThrow("Failed to fetch projects");
});

test("removeImageAssignment throws when not found", async () => {
  (db.delete as any).mockReturnValueOnce({
    where: () => ({
      returning: () => [],
    }),
  });

  const storage = new DbStorage();

  await expect(
    storage.removeImageAssignment("p1", "img1")
  ).rejects.toThrow("Image assignment not found");
});

test("createImage throws when DB fails", async () => {
  (db.insert as any).mockImplementationOnce(() => {
    throw new Error("db fail");
  });

  const storage = new DbStorage();

  await expect(
    storage.createImage({ filename: "x", url: "y" })
  ).rejects.toThrow("DB insert failed");
});

test("createImage throws when DB fails", async () => {
  (db.insert as any).mockImplementationOnce(() => {
    throw new Error("db fail");
  });

  const storage = new DbStorage();

  await expect(
    storage.createImage({ filename: "x", url: "y" })
  ).rejects.toThrow("DB insert failed");
});
