/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

// -------------------- Schema mocks --------------------
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

// -------------------- DB mocks --------------------
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
// ============================ createLabel ===========================
// ===================================================================
describe("Label – createLabel", () => {
  test("creates label (happy path)", async () => {
    const newLabel = {
      id: "l1",
      name: "Type A",
      description: "Test label",
      projectId: "p1",
      createdAt: new Date(),
    };

    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [newLabel],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.createLabel(newLabel as any);

    expect(result).toEqual(newLabel);
  });

  test("throws on invalid label payload (missing name or projectId)", async () => {
    const storage = new DbStorage();

    await expect(
      storage.createLabel({ name: "", projectId: "" } as any)
    ).rejects.toThrow("Invalid label payload");
  });

  test("throws when DB insert fails", async () => {
    (db.insert as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.createLabel({
        name: "Type A",
        description: "Test",
        projectId: "p1",
      } as any)
    ).rejects.toThrow("DB insert failed");
  });

  test("throws when DB insert returns no label", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [],
      }),
    });

    const storage = new DbStorage();

    await expect(
      storage.createLabel({
        name: "Type A",
        description: "Test",
        projectId: "p1",
      } as any)
    ).rejects.toThrow("Failed to create label");
  });
});

// ===================================================================
// ============================ deleteLabel ===========================
// ===================================================================
describe("Label – deleteLabel", () => {
  test("deletes label (happy path)", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
      }),
    });

    const storage = new DbStorage();

    await expect(storage.deleteLabel("l1")).resolves.toBeUndefined();
  });

  test("throws on invalid label id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.deleteLabel("" as any)
    ).rejects.toThrow("Invalid label id");
  });

  test("throws when DB delete fails", async () => {
    (db.delete as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.deleteLabel("l1")
    ).rejects.toThrow("Failed to delete label");
  });

  test("throws when label not found", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        execute: vi.fn().mockResolvedValue({ rowCount: 0 }),
      }),
    });

    const storage = new DbStorage();

    await expect(
      storage.deleteLabel("l1")
    ).rejects.toThrow("Label not found");
  });
});

// ===================================================================
// ============================ addLabelClass =========================
// ===================================================================
describe("Label – addLabelClass", () => {
  test("adds label class (happy path)", async () => {
    const labelClass = {
      id: "c1",
      name: "Class A",
      labelTypeId: "l1",
    };

    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [labelClass],
      }),
    });

    const storage = new DbStorage();

    const result = await storage.addLabelClass({
      name: "Class A",
      labelTypeId: "l1",
    } as any);

    expect(result).toEqual(labelClass);
  });

  test("throws on invalid label type id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.addLabelClass({ name: "x", labelTypeId: "" } as any)
    ).rejects.toThrow("Invalid label class payload");
  });

  test("throws on invalid label class payload", async () => {
    const storage = new DbStorage();

    await expect(
      storage.addLabelClass({ name: "", labelTypeId: "l1" } as any)
    ).rejects.toThrow("Invalid label class payload");
  });

  test("throws when DB insert fails", async () => {
    (db.insert as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.addLabelClass({ name: "Class A", labelTypeId: "l1" } as any)
    ).rejects.toThrow("DB insert failed");
  });

  test("throws when DB insert returns no class", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [],
      }),
    });

    const storage = new DbStorage();

    await expect(
      storage.addLabelClass({ name: "Class A", labelTypeId: "l1" } as any)
    ).rejects.toThrow("Failed to create label class");
  });
});

// ===================================================================
// =========================== removeLabelClass =======================
// ===================================================================
describe("Label – removeLabelClass", () => {
  test("removes label class (happy path)", async () => {
    const existingClass = {
      id: "c1",
      name: "Class A",
      labelTypeId: "l1",
    };

    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        returning: () => [existingClass],
      }),
    });

    const storage = new DbStorage();

    const result = await storage.removeLabelClass("l1", "c1");

    expect(result).toEqual(existingClass);
  });

  test("throws on invalid label type id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.removeLabelClass("" as any, "c1")
    ).rejects.toThrow("Invalid label type id");
  });

  test("throws on invalid label class id", async () => {
    const storage = new DbStorage();

    await expect(
      storage.removeLabelClass("l1", "" as any)
    ).rejects.toThrow("Invalid label class id");
  });

  test("throws when DB delete fails", async () => {
    (db.delete as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.removeLabelClass("l1", "c1")
    ).rejects.toThrow("Failed to remove label class");
  });

  test("throws when label class not found", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({
        returning: () => [],
      }),
    });

    const storage = new DbStorage();

    await expect(
      storage.removeLabelClass("l1", "c1")
    ).rejects.toThrow("Label class not found");
  });
});
