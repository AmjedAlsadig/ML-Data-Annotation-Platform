/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

// ===================== MOCK SCHEMA =====================
vi.mock("@shared/schema", () => ({
  images: {},
  projects: {},
  projectImages: {},
  labels: {},
  labelClasses: {},
  annotations: {},
}));

// ===================== MOCK DB =====================
vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
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
    } as any);

    expect(result.id).toBe("img1");
  });

  test("throws on invalid payload", async () => {
    const storage = new DbStorage();
    await expect(
      storage.createImage({ filename: "" } as any)
    ).rejects.toThrow("Invalid image payload");
  });

  test("throws when DB insert fails", async () => {
    (db.insert as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.createImage({ filename: "x", url: "y" } as any)
    ).rejects.toThrow("DB insert failed");
  });

  test("throws when DB insert returns no image", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [],
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.createImage({ filename: "x", url: "y" } as any)
    ).rejects.toThrow("Failed to create image");
  });
});

// ===================================================================
// ======================== assignImagesToProject ======================
// ===================================================================
describe("Data Specialist – assignImagesToProject", () => {
  test("assigns images successfully", async () => {
    (db.select as any).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: "img1" },
        { id: "img2" },
      ]),
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

  test("returns empty array when imageIds list is empty", async () => {
    const storage = new DbStorage();
    const res = await storage.assignImagesToProject("p1", []);

    expect(res).toEqual([]);
  });

  test("throws on invalid project id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.assignImagesToProject("" as any, ["img1"])
    ).rejects.toThrow("Invalid project id");
  });

  test("throws when imageIds is not an array", async () => {
    const storage = new DbStorage();

    await expect(
      storage.assignImagesToProject("p1", "not-array" as any)
    ).rejects.toThrow("Invalid image id list");
  });

  test("throws on invalid image id in list", async () => {
    const storage = new DbStorage();

    await expect(
      storage.assignImagesToProject("p1", ["", "img2"])
    ).rejects.toThrow("Invalid image id");
  });

  test("throws when images not found", async () => {
    (db.select as any).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    const storage = new DbStorage();
    await expect(
      storage.assignImagesToProject("p1", ["imgX"])
    ).rejects.toThrow("Some images not found");
  });

  test("throws when verifying images fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.assignImagesToProject("p1", ["img1"])
    ).rejects.toThrow("Failed to verify images");
  });

  test("throws when DB insert fails", async () => {
    (db.select as any).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: "img1" }]),
    });

    (db.insert as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.assignImagesToProject("p1", ["img1"])
    ).rejects.toThrow("Failed to assign images to project");
  });
});

// ===================================================================
// ======================= removeImageAssignment =======================
// ===================================================================
describe("Data Specialist – removeImageAssignment", () => {
  test("removes image assignment (happy path)", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        returning: () => [{ projectId: "p1", imageId: "img1" }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.removeImageAssignment("p1", "img1");

    expect(result.imageId).toBe("img1");
  });

  test("throws on invalid project id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.removeImageAssignment("" as any, "img1")
    ).rejects.toThrow("Invalid project id");
  });

  test("throws on invalid image id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.removeImageAssignment("p1", "" as any)
    ).rejects.toThrow("Invalid image id");
  });

  test("throws when DB delete fails", async () => {
    (db.delete as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.removeImageAssignment("p1", "img1")
    ).rejects.toThrow("Failed to remove image assignment");
  });

  test("throws when assignment not found", async () => {
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
});

// ===================================================================
// ======================= create / delete project =====================
// ===================================================================
describe("Data Specialist – createProject / deleteProject / updateProjectStatus", () => {
  test("createProject creates project (happy path)", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [{ id: "p1", name: "X", createdBy: "u1" }],
      }),
    });

    const storage = new DbStorage();
    const project = await storage.createProject({
      name: "X",
      createdBy: "u1",
    } as any);

    expect(project.id).toBe("p1");
  });

  test("createProject throws on invalid payload", async () => {
    const storage = new DbStorage();

    await expect(
      storage.createProject({ name: "" } as any)
    ).rejects.toThrow("Invalid project payload");
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

  test("createProject throws when DB insert returns no project", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [],
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.createProject({ name: "X", createdBy: "u1" } as any)
    ).rejects.toThrow("Failed to create project");
  });

  test("deleteProject succeeds when project exists", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
      }),
    });

    const storage = new DbStorage();
    await expect(storage.deleteProject("p1")).resolves.toBeUndefined();
  });

  test("deleteProject throws on invalid id", async () => {
    const storage = new DbStorage();
    await expect(storage.deleteProject("" as any)).rejects.toThrow(
      "Invalid project id"
    );
  });

  test("deleteProject throws when DB delete fails", async () => {
    (db.delete as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(storage.deleteProject("p1")).rejects.toThrow(
      "Failed to delete project"
    );
  });

  test("deleteProject throws when project not found", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        execute: vi.fn().mockResolvedValue({ rowCount: 0 }),
      }),
    });

    const storage = new DbStorage();

    await expect(storage.deleteProject("p1")).rejects.toThrow(
      "Project not found"
    );
  });

  test("updateProjectStatus succeeds (happy path)", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.updateProjectStatus("p1", "completed")
    ).resolves.toBeUndefined();
  });

  test("updateProjectStatus throws on invalid id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.updateProjectStatus("" as any, "completed")
    ).rejects.toThrow("Invalid project id");
  });

  test("updateProjectStatus throws when DB update fails", async () => {
    (db.update as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.updateProjectStatus("p1", "completed")
    ).rejects.toThrow("Failed to update project status");
  });

  test("updateProjectStatus throws when project not found", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          execute: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      }),
    });

    const storage = new DbStorage();

    await expect(
      storage.updateProjectStatus("p1", "completed")
    ).rejects.toThrow("Project not found");
  });
});
