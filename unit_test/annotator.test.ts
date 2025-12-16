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


// -------------------- Mock DB functionalities --------------------

// Build fake DB backend with required mock functionalities
const qb: any = {
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  execute: vi.fn(),
};


vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(() => qb),
    insert: vi.fn(() => qb),
    update: vi.fn(() => qb),
    delete: vi.fn(() => qb),
  }
}));

import { DbStorage } from "../backend/storage";

// -------------------- Mock Data --------------------

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
    annotatorLastName: "Test"
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
    annotatorLastName: "Test"
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
    annotatorLastName: "Test"
  }
] as const;




/// ---- AT-1, AT-2, AT-3 -----

// Annotator can see all annotations belonging to a project
describe("getAnnotationsByProject", () => {
  test("Check results", async () => {

    qb.from.mockReturnThis();
    qb.innerJoin.mockReturnThis();
    qb.where.mockImplementation(() => {
      qb._filtered = mockAnnotations.filter(r => r.projectId === "101");
      return qb;
    });
    
     qb.orderBy.mockImplementation(() => qb._filtered);

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByProject("101");

    expect(result.length).toBe(2);
    expect(result[0].imageFilename).toContain("image_001.jpg");
  });
});


// Annotator can see all annotattions belonging to a project, entered by him/herself
describe("getAnnotationsByProjectAndAnnotator", () => {
  test("Check results", async () => {

    qb.from.mockReturnThis();
    qb.innerJoin.mockReturnThis();
    qb.where.mockImplementation(() => {

    qb._filtered = mockAnnotations.filter(r => r.projectId === "101" && r.userId === "502" );
      return qb;
    });

    qb.orderBy.mockImplementation(() => qb._filtered);

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByProjectAndAnnotator("101", "502");

    expect(result.length).toBe(1);
    expect(result[0].imageFilename).toContain("image_002.png");
  });
});


// getLabelClassesByType
describe("getLabelClassesByType", () => {
  test("Check results", async () => {

    const mockLabelClasses = [
      {
        id: "1",
        name: "Border Collie",
        labelTypeId: "t1"
      },
      {
        id: "2",
        name: "German Shepherd",
        labelTypeId: "t1"
      },
      {
        id: "3",
        name: "Elephant",
        labelTypeId: "t2"
      }
    ] as const;

    qb.from.mockReturnThis();
    qb.where.mockReturnThis();
    qb.orderBy.mockReturnValue(mockLabelClasses);

    const storage = new DbStorage();
    const result = await storage.getLabelClassesByType("t1");
    const filtered = result.filter(r => r.labelTypeId === "t1");

    expect(filtered.length).toBe(2);
    expect(filtered[0].name).toBe("Border Collie");
    expect(filtered[1].name).toBe("German Shepherd");
  });
});



/// ---- AT-4, AT-5, AT-6, AT-7 -----
describe("getAnnotation", () => {
  test("returns mocked annotation with details", async () => {

    qb.from.mockReturnThis();
    qb.innerJoin.mockReturnThis();
    qb.where.mockImplementation(() =>
      mockAnnotations.filter(r => r.id === "1")
    );

    const storage = new DbStorage();
    const result = await storage.getAnnotation("1");

    expect(result?.id).toBe("1");
    expect(result?.imageFilename).toBe("image_001.jpg");
    expect(result?.labelClassName).toBe("Dog");
    expect(result?.annotatorUsername).toBe("testa");
  });
});


describe("deleteAnnotation", () => {
  test("user deletes their own annotation", async () => {

    qb.delete.mockReturnThis();
    qb.where.mockReturnThis();
    qb.returning.mockReturnValue([
      { id: "1", userId: "501" }
    ]);

    const storage = new DbStorage();
    const result = await storage.deleteAnnotation("1", "501");

    expect(result.id).toBe("1");
    expect(result.userId).toBe("501");
  });

  test("user cannot delete someone else's annotation", async () => {

    qb.returning.mockReturnValue([]); // no row deleted

    const storage = new DbStorage();

    await expect(storage.deleteAnnotation("1", "999"))
      .rejects
      .toThrow("not found or access denied");
  });

  test("admin deletes any annotation", async () => {

    qb.returning.mockReturnValue([
      { id: "1", userId: "501" }
    ]);

    const storage = new DbStorage();
    const result = await storage.deleteAnnotation("1");

    expect(result.id).toBe("1");
  });
});


// describe("createAnnotation", () => {
//   test("creates annotation and returns inserted row", async () => {

//     const newAnnotation = {
//       id: "10",
//       projectId: "200",
//       imageId: "300",
//       userId: "900",
//       labelClassesId: "700",
//       annotatedAt: "2025-01-01T00:00:00Z",
//       labelId: "abc123"
//     };

    
//     qb.insert.mockReturnThis();
//     qb.values.mockReturnThis();
//     qb.returning.mockReturnValue([newAnnotation]);

//     const storage = new DbStorage();
//     const result = await storage.createAnnotation(newAnnotation);

//     expect(result).toBeDefined();
//     expect(result.id).toBe("10");
//     expect(result.projectId).toBe("200");
//     expect(result.userId).toBe("900");
//     expect(result.labelClassesId).toBe("700");
//   });
// });

