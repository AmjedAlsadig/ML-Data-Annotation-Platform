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

// Mock DB functions
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

describe("DbStorage basic project/image tests", () => {
  // ====================== Project basic ======================

  test("getProject returns project", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ id: "p1", name: "Project" }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getProject("p1");

    expect(result?.id).toBe("p1");
    expect(result?.name).toBe("Project");
  });

  test("getProject throws on invalid id", async () => {
    const storage = new DbStorage();

    await expect(storage.getProject("" as any)).rejects.toThrow(
      "Invalid project id",
    );
  });

  test("deleteProject calls db.delete", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        execute: () => ({ rowCount: 1 }),
      }),
    });

    const storage = new DbStorage();
    await storage.deleteProject("p1");

    expect(db.delete).toHaveBeenCalled();
  });

  test("updateProjectStatus updates row", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          execute: () => ({ rowCount: 1 }),
        }),
      }),
    });

    const storage = new DbStorage();
    await storage.updateProjectStatus("p1", "completed");

    expect(db.update).toHaveBeenCalled();
  });

  // ====================== Image / annotations ======================

  test("getImage returns single image", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ id: "img10", filename: "car.png" }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getImage("img10");

    expect(result?.id).toBe("img10");
    expect(result?.filename).toBe("car.png");
  });

  test("getImage throws on invalid id", async () => {
    const storage = new DbStorage();

    await expect(storage.getImage("" as any)).rejects.toThrow(
      "Invalid image id",
    );
  });

  test("getAnnotationsByUser returns all user annotations", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [
          { id: "a1", userId: "u1" },
          { id: "a2", userId: "u1" },
        ],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByUser("u1");

    expect(result.length).toBe(2);
    expect(result[0].userId).toBe("u1");
  });

  // ====================== Image assignment ======================

  test("removeImageAssignment removes assignment", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        returning: () => [{ projectId: "p1", imageId: "img5" }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.removeImageAssignment("p1", "img5");

    expect(result.imageId).toBe("img5");
    expect(result.projectId).toBe("p1");
  });

  // ====================== Project assignment ======================

  test("assignUserToProject returns existing assignment if already exists", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ projectId: "p1", userId: "u1" }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.assignUserToProject({
      projectId: "p1",
      userId: "u1",
    } as any);

    expect(result.projectId).toBe("p1");
    expect(result.userId).toBe("u1");
  });

  test("assignUserToProject inserts new assignment", async () => {
    // no existing assignment
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [{ projectId: "p1", userId: "u2" }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.assignUserToProject({
      projectId: "p1",
      userId: "u2",
    } as any);

    expect(result.userId).toBe("u2");
  });

  // ====================== Projects + stats ======================

  test("getProjectsByCreator returns projects with stats", async () => {
    // mock select of projects
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ id: "p1", name: "Project One", createdBy: "u1" }],
      }),
    });

    // mock getProjectStats() internal calls:
    // 1) annotations stats
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [
          {
            totalAnnotations: 5,
            annotatedImages: 2,
            activeAnnotators: 1,
          },
        ],
      }),
    });

    // 2) image count
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ numberOfImages: 10 }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getProjectsByCreator("u1");

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("p1");
    expect(result[0].totalAnnotations).toBe(5);
    expect(result[0].numberOfImages).toBe(10);
  });

  test("getProjectsByAnnotator returns annotated projects with stats", async () => {
    // Mock join that returns a project
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => [{ project: { id: "p100", name: "TestProj" } }],
        }),
      }),
    });

    // Mock getProjectStats internal calls:
    // 1) annotations stats
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [
          {
            totalAnnotations: 3,
            annotatedImages: 2,
            activeAnnotators: 1,
          },
        ],
      }),
    });

    // 2) image count
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ numberOfImages: 8 }],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getProjectsByAnnotator("u501");

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("p100");
    expect(result[0].numberOfImages).toBe(8);
  });
});
