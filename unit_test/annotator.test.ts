/// <reference types="vitest/globals" />

import { describe, test, expect, vi } from "vitest";

vi.mock("@shared/schema", () => ({
  users: {},
  projects: {},
  labels: {},
  labelClasses: {},
  images: {},
  annotations: {},
  projectAssignments: {},
  projectImages: {}
}));

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


describe("getLabelClassesByType", () => {
  test("returns mocked result", async () => {

    (db.select as any).mockImplementation(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => [
            { id: "1", name: "MockedClass", labelTypeId: "t1" }
          ]
        })
      })
    }));

    const storage = new DbStorage();
    const result = await storage.getLabelClassesByType("t1");

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("MockedClass");
  });
});
