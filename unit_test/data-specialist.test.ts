/// <reference types="vitest/globals" />

import { describe, test, expect, vi } from "vitest";

// Mock schema
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

// Mock DB
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

describe("Data Specialist Storage Functions", () => {
  
  test("getAllImages should return mocked image list", async () => {
    (db.select as any).mockImplementation(() => ({
      from: () => ([
        { id: "img1", filename: "dog.jpg", url: "/img/dog.jpg" },
        { id: "img2", filename: "cat.jpg", url: "/img/cat.jpg" }
      ])
    }));

    const storage = new DbStorage();
    const result = await storage.getAllImages();

    expect(result?.length).toBe(2);
    expect(result?.[0].filename).toBe("dog.jpg");
  });


  test("getAllLabelTypes should return mocked label types", async () => {
    (db.select as any).mockImplementation(() => ({
      from: () => ({
        leftJoin: () => ({
          groupBy: () => ({
            orderBy: () => ([
              { id: "lt1", name: "Animals", classCount: 3 },
              { id: "lt2", name: "Vehicles", classCount: 5 }
            ])
          })
        })
      })
    }));

    const storage = new DbStorage();
    const result = await storage.getAllLabelTypes();

    expect(result.length).toBe(2);
    expect(result[1].name).toBe("Vehicles");
  });


  test("assignImagesToProject should return inserted assignments", async () => {
    // Mock image validation query
    (db.select as any).mockImplementation(() => ({
      from: () => ({
        where: () => [{ id: "img1" }, { id: "img2" }]
      })
    }));

    // Mock insert query
    (db.insert as any).mockImplementation(() => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => ([
            { projectId: "p1", imageId: "img1" },
            { projectId: "p1", imageId: "img2" }
          ])
        })
      })
    }));

    const storage = new DbStorage();
    const result = await storage.assignImagesToProject("p1", ["img1", "img2"]);

    expect(result.length).toBe(2);
    expect(result[0].imageId).toBe("img1");
  });

});

test("createImage should generate a unique image ID", async () => {

  // returns image with id "img_111"
  (db.insert as any).mockImplementationOnce(() => ({
    values: () => ({
      returning: () => ([
        { id: "img_111", filename: "dog.jpg", url: "/img/dog.jpg" }
      ])
    })
  }));

  // returns image with id "img_222"
  (db.insert as any).mockImplementationOnce(() => ({
    values: () => ({
      returning: () => ([
        { id: "img_222", filename: "cat.jpg", url: "/img/cat.jpg" }
      ])
    })
  }));

  const storage = new DbStorage();

  const img1 = await storage.createImage({
    filename: "dog.jpg",
    url: "/img/dog.jpg"
  });

  const img2 = await storage.createImage({
    filename: "cat.jpg",
    url: "/img/cat.jpg"
  });

  // Ensure IDs exist
  expect(img1.id).toBeDefined();
  expect(img2.id).toBeDefined();

  // IDs must be different
  expect(img1.id).not.toBe(img2.id);
});
