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

// -------------------- Generic QB helper (za testove koji trebaju chain) --------------------
function createQB(rows: any[]) {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnValue(rows),
  };
}

// -------------------- Mock DB --------------------
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

// -------------------- Common mock data --------------------
const mockAnnotations = [
  {
    id: "1",
    projectId: "101",
    imageId: "1001",
    userId: "501",
    labelClassesId: "301",
    annotatedAt: "2025-01-10T12:34:56Z",
    labelId: "5001",
    imageFilename: "image_001.jpg",
    imageUrl: "https://example.com/images/image_001.jpg",
    labelClassName: "Dog",
    labelTypeName: "Border Collie",
    annotatorUsername: "testa",
    annotatorFirstName: "Alfred",
    annotatorLastName: "Test",
  },
  {
    id: "2",
    projectId: "101",
    imageId: "1002",
    userId: "502",
    labelClassesId: "302",
    annotatedAt: "2025-01-11T09:15:22Z",
    labelId: "5002",
    imageFilename: "image_002.png",
    imageUrl: "https://example.com/images/image_002.png",
    labelClassName: "Cat",
    labelTypeName: "Shorthair",
    annotatorUsername: "testb",
    annotatorFirstName: "Boris",
    annotatorLastName: "Test",
  },
  {
    id: "3",
    projectId: "102",
    imageId: "1003",
    userId: "503",
    labelClassesId: "303",
    annotatedAt: "2025-01-12T17:03:10Z",
    labelId: "5003",
    imageFilename: "image_003.jpeg",
    imageUrl: "https://example.com/images/image_003.jpeg",
    labelClassName: "Bird",
    labelTypeName: "Eagle",
    annotatorUsername: "testc",
    annotatorFirstName: "Charlie",
    annotatorLastName: "Test",
  },
] as const;

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- AT-1, AT-2, AT-3 ----
// getAnnotationsByProject
describe("Annotator – getAnnotationsByProject", () => {
  test("returns annotations for a project (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnValue(
        mockAnnotations.filter((r) => r.projectId === "101")
      ),
    });

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByProject("101");

    expect(result.length).toBe(2);
    expect(result[0].imageFilename).toBe("image_001.jpg");
  });

  test("throws on invalid project id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.getAnnotationsByProject("" as any)
    ).rejects.toThrow("Invalid project id");
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.getAnnotationsByProject("101")
    ).rejects.toThrow("Failed to fetch annotations by project");
  });
});

// getAnnotationsByProjectAndAnnotator
describe("Annotator – getAnnotationsByProjectAndAnnotator", () => {
  test("returns annotations for project and annotator (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnValue(
        mockAnnotations.filter(
          (r) => r.projectId === "101" && r.userId === "502"
        )
      ),
    });

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByProjectAndAnnotator(
      "101",
      "502"
    );

    expect(result.length).toBe(1);
    expect(result[0].imageFilename).toBe("image_002.png");
  });

  test("throws on invalid project id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.getAnnotationsByProjectAndAnnotator("" as any, "502")
    ).rejects.toThrow("Invalid project id");
  });

  test("throws on invalid annotator id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.getAnnotationsByProjectAndAnnotator("101", "" as any)
    ).rejects.toThrow("Invalid annotator id");
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.getAnnotationsByProjectAndAnnotator("101", "502")
    ).rejects.toThrow(
      "Failed to fetch annotations by project and annotator"
    );
  });
});

// getLabelClassesByType
describe("Annotator – getLabelClassesByType", () => {
  test("returns label classes for given type (happy path)", async () => {
    const mockLabelClasses = [
      { id: "1", name: "Border Collie", labelTypeId: "t1" },
      { id: "2", name: "German Shepherd", labelTypeId: "t1" },
      { id: "3", name: "Elephant", labelTypeId: "t2" },
    ] as const;

    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnValue(mockLabelClasses),
    });

    const storage = new DbStorage();
    const result = await storage.getLabelClassesByType("t1");

    const filtered = result.filter((r) => r.labelTypeId === "t1");

    expect(filtered.length).toBe(2);
    expect(filtered[0].name).toBe("Border Collie");
    expect(filtered[1].name).toBe("German Shepherd");
  });

  test("throws on invalid label type id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.getLabelClassesByType("" as any)
    ).rejects.toThrow("Invalid label type id");
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.getLabelClassesByType("t1")
    ).rejects.toThrow("Failed to fetch label classes");
  });
});

// ---- AT-4, AT-5, AT-6, AT-7 ----
// getAnnotation
describe("Annotator – getAnnotation", () => {
  test("returns single annotation with details (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue(
        mockAnnotations.filter((r) => r.id === "1")
      ),
    });

    const storage = new DbStorage();
    const result = await storage.getAnnotation("1");

    expect(result?.id).toBe("1");
    expect(result?.imageFilename).toBe("image_001.jpg");
    expect(result?.labelClassName).toBe("Dog");
    expect(result?.annotatorUsername).toBe("testa");
  });

  test("throws when annotation not found", async () => {
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue([]),
  });

  const storage = new DbStorage();
  await expect(storage.getAnnotation("999")).rejects.toThrow(
    "Annotation not found"
  );
});


  test("throws on invalid annotation id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.getAnnotation("" as any)
    ).rejects.toThrow("Invalid annotation id");
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(storage.getAnnotation("1")).rejects.toThrow(
      "Failed to fetch annotation"
    );
  });
});

// deleteAnnotation
describe("Annotator – deleteAnnotation", () => {
  test("user deletes their own annotation (happy path)", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnValue([{ id: "1", userId: "501" }]),
    });

    const storage = new DbStorage();
    const result = await storage.deleteAnnotation("1", "501");

    expect(result.id).toBe("1");
    expect(result.userId).toBe("501");
  });

  test("user cannot delete someone else's annotation", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnValue([]),
    });

    const storage = new DbStorage();

    await expect(
      storage.deleteAnnotation("1", "999")
    ).rejects.toThrow("Annotation not found");
  });

  test("admin deletes any annotation (no userId param)", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnValue([{ id: "1", userId: "501" }]),
    });

    const storage = new DbStorage();
    const result = await storage.deleteAnnotation("1");

    expect(result.id).toBe("1");
  });

  test("throws when DB delete fails", async () => {
    (db.delete as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.deleteAnnotation("1", "501")
    ).rejects.toThrow("Failed to delete annotation");
  });
});

// createAnnotation
describe("Annotator – createAnnotation", () => {
  test("creates annotation and returns inserted row (happy path)", async () => {
  const newAnnotation = {
    id: "10",
    projectId: "200",
    imageId: "300",
    userId: "900",
    labelClassesId: "700",
    annotatedAt: "2025-01-01T00:00:00Z",
    labelId: "abc123",
  };

  // 1. provjera postoji li već anotacija → vrati prazan niz (nema postojeće)
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue([]),
  });

  // 2. insert nove anotacije
  (db.insert as any).mockReturnValueOnce({
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnValue([newAnnotation]),
  });

  const storage = new DbStorage();
  const result = await storage.createAnnotation(newAnnotation as any);

  expect(result).toBeDefined();
  expect(result.id).toBe("10");
  expect(result.projectId).toBe("200");
  expect(result.userId).toBe("900");
  expect(result.labelClassesId).toBe("700");
});


  test("throws on invalid payload (missing projectId)", async () => {
    const storage = new DbStorage();

    await expect(
      storage.createAnnotation({
        id: "x",
        projectId: "" as any,
      } as any)
    ).rejects.toThrow("Invalid annotation payload");
  });

  test("throws when DB insert fails", async () => {
  // 1. provjera – nema postojeće anotacije
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue([]),
  });

  // 2. insert baca grešku
  (db.insert as any).mockImplementationOnce(() => {
    throw new Error("db fail");
  });

  const storage = new DbStorage();

  await expect(
    storage.createAnnotation({
      id: "10",
      projectId: "200",
      imageId: "300",
      userId: "900",
      labelClassesId: "700",
      annotatedAt: "2025-01-01T00:00:00Z",
      labelId: "abc123",
    } as any)
  ).rejects.toThrow("Failed to create annotation");
});


  test("throws when DB insert returns no row", async () => {
  
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue([]),
  });

 
  (db.insert as any).mockReturnValueOnce({
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnValue([]),
  });

  const storage = new DbStorage();

  await expect(
    storage.createAnnotation({
      id: "10",
      projectId: "200",
      imageId: "300",
      userId: "900",
      labelClassesId: "700",
      annotatedAt: "2025-01-01T00:00:00Z",
      labelId: "abc123",
    } as any)
    ).rejects.toThrow("Annotation creation failed");
});

});
