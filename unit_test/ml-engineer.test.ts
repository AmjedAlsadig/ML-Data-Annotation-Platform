/// <reference types="vitest/globals" />

import { describe, test, expect, vi } from "vitest";

// Mock @shared/schema jer storage ga uvozi
vi.mock("@shared/schema", () => ({
  annotations: {},
  images: {},
  projects: {},
  labelClasses: {},
  users: {},
  projectImages: {},
}));

// Mock DB funkcija
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


describe("ML Engineer – getProjectStats()", () => {

  test("returns correct project statistics", async () => {

    // Mock first query (annotations)
    (db.select as any).mockImplementationOnce(() => ({
      from: () => ({
        where: () => [{
          totalAnnotations: 10,
          annotatedImages: 5,
          activeAnnotators: 2,
        }]
      })
    }));

    // Mock second query (projectImages)
    ;(db.select as any).mockImplementationOnce(() => ({
      from: () => ({
        where: () => [{
          numberOfImages: 12
        }]
      })
    }));

    const storage = new DbStorage();
    const result = await storage.getProjectStats("test-project");

    expect(result.totalAnnotations).toBe(10);
    expect(result.annotatedImages).toBe(5);
    expect(result.activeAnnotators).toBe(2);
    expect(result.numberOfImages).toBe(12);
  });
});
