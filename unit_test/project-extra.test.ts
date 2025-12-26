/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

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
// ====================== getProjectsByCreator ========================
// ===================================================================
describe("Project extra – getProjectsByCreator", () => {
  test("throws on invalid user id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.getProjectsByCreator("" as any)
    ).rejects.toThrow("Invalid user id");
  });

  test("throws when DB fails in base query", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.getProjectsByCreator("u1")
    ).rejects.toThrow("Failed to fetch projects");
  });

  test("throws when computing statistics fails", async () => {
    // 1) base query – vrati neki projekat
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [
          { id: "p1", name: "P1", createdBy: "u1" },
        ],
      }),
    });

    // 2) stats query – baci grešku
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.getProjectsByCreator("u1")
    ).rejects.toThrow("Failed to compute project statistics");
  });
});

// ===================================================================
// ==================== getProjectsByAnnotator ========================
// ===================================================================
describe("Project extra – getProjectsByAnnotator", () => {
  test("throws on invalid annotator id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.getProjectsByAnnotator("" as any)
    ).rejects.toThrow("Invalid user id");
  });

  test("throws when DB fails in base query", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.getProjectsByAnnotator("u2")
    ).rejects.toThrow("Failed to fetch assigned projects");
  });
});

// ===================================================================
// ========== updateProjectImagePublishedState / getProjectImagePublishedState =========
// ===================================================================
describe("Project extra – project image published state", () => {
  test("updateProjectImagePublishedState updates published flag (happy path)", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => [
            {
              projectId: "p1",
              imageId: "img1",
              published: true,
            },
          ],
        }),
      }),
    });

    const storage = new DbStorage();
    const result = await storage.updateProjectImagePublishedState(
      "p1",
      "img1",
      true
    );

    expect(result.projectId).toBe("p1");
    expect(result.imageId).toBe("img1");
    expect(result.published).toBe(true);
  });

  test("updateProjectImagePublishedState throws on invalid ids", async () => {
    const storage = new DbStorage();

    await expect(
      storage.updateProjectImagePublishedState("" as any, "img1", true)
    ).rejects.toThrow("Invalid project id");

    await expect(
      storage.updateProjectImagePublishedState("p1", "" as any, true)
    ).rejects.toThrow("Invalid image id");
  });

  test("updateProjectImagePublishedState throws when DB update fails", async () => {
    (db.update as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.updateProjectImagePublishedState("p1", "img1", true)
    ).rejects.toThrow("Failed to update project image state");
  });

  test("updateProjectImagePublishedState throws when assignment not found", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => [],
        }),
      }),
    });

    const storage = new DbStorage();

    await expect(
      storage.updateProjectImagePublishedState("p1", "img1", true)
    ).rejects.toThrow("Image assignment not found");
  });

  test("getProjectImagePublishedState throws on invalid ids", async () => {
    const storage = new DbStorage();

    await expect(
      storage.getProjectImagePublishedState("" as any, "img1")
    ).rejects.toThrow("Invalid project id");

    await expect(
      storage.getProjectImagePublishedState("p1", "" as any)
    ).rejects.toThrow("Invalid image id");
  });

  test("getProjectImagePublishedState throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.getProjectImagePublishedState("p1", "img1")
    ).rejects.toThrow("Failed to fetch project image state");
  });
});
