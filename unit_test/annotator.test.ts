import { describe, test, expect, vi, beforeEach } from "vitest";

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

// -------------------- Generic Query Builder Mock --------------------
// We mimic drizzle-like fluent API. IMPORTANT: methods that are awaited must return arrays.
function createQB(rows: any[] = []) {
  const qb: any = {
    _rows: rows,
    _filtered: rows,

    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),

    // By default, where returns rows (array). You can override per-test with mockImplementation.
    where: vi.fn().mockImplementation(() => qb._filtered),

    // Some queries use orderBy after where; return array as well.
    orderBy: vi.fn().mockImplementation(() => qb._filtered),

    // Insert/update/delete chains
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),

    returning: vi.fn().mockImplementation(() => qb._filtered),
  };

  return qb;
}

// We keep ONE shared qb instance for most tests, but we reset its mocks in beforeEach.
const qb = createQB();

vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(() => qb),
    insert: vi.fn(() => qb),
    update: vi.fn(() => qb),
    delete: vi.fn(() => qb),
  }
}));

import { DbStorage } from "../backend/storage";
import { db } from "../backend/db";

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

beforeEach(() => {
  vi.clearAllMocks();

  // Reset qb behaviour to safe defaults
  qb._rows = [];
  qb._filtered = [];
  qb.from.mockReturnThis();
  qb.innerJoin.mockReturnThis();
  qb.leftJoin.mockReturnThis();
  qb.groupBy.mockReturnThis();
  qb.limit.mockReturnThis();
  qb.offset.mockReturnThis();
  qb.values.mockReturnThis();
  qb.set.mockReturnThis();
  qb.onConflictDoNothing.mockReturnThis();

  // Default: where/orderBy return qb._filtered (array)
  qb.where.mockImplementation(() => qb._filtered);
  qb.orderBy.mockImplementation(() => qb._filtered);
  qb.returning.mockImplementation(() => qb._filtered);
});

// -------------------- AT-1, AT-2, AT-3 --------------------

describe("getAnnotationsByProject", () => {
  test("Check results", async () => {
    qb._filtered = mockAnnotations.filter(r => r.projectId === "101");
    qb.where.mockImplementation(() => qb);              // where returns qb (fluent)
    qb.orderBy.mockImplementation(() => qb._filtered);  // orderBy returns final array

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByProject("101");

    expect(result.length).toBe(2);
    expect(result[0].imageFilename).toContain("image_001.jpg");
  });
});

describe("getAnnotationsByProjectAndAnnotator", () => {
  test("Check results", async () => {
    qb._filtered = mockAnnotations.filter(r => r.projectId === "101" && r.userId === "502");
    qb.where.mockImplementation(() => qb);
    qb.orderBy.mockImplementation(() => qb._filtered);

    const storage = new DbStorage();
    const result = await storage.getAnnotationsByProjectAndAnnotator("101", "502");

    expect(result.length).toBe(1);
    expect(result[0].imageFilename).toContain("image_002.png");
  });
});

describe("getLabelClassesByType", () => {
  test("Check results", async () => {
    const mockLabelClasses = [
      { id: "1", name: "Border Collie", labelTypeId: "t1" },
      { id: "2", name: "German Shepherd", labelTypeId: "t1" },
      { id: "3", name: "Elephant", labelTypeId: "t2" }
    ] as const;

    qb._filtered = [...mockLabelClasses];
    qb.where.mockImplementation(() => qb);
    qb.orderBy.mockImplementation(() => qb._filtered);

    const storage = new DbStorage();
    const result = await storage.getLabelClassesByType("t1");
    const filtered = result.filter(r => r.labelTypeId === "t1");

    expect(filtered.length).toBe(2);
    expect(filtered[0].name).toBe("Border Collie");
    expect(filtered[1].name).toBe("German Shepherd");
  });
});

// -------------------- AT-4, AT-5, AT-6, AT-7 --------------------

describe("getAnnotation", () => {
  test("returns mocked annotation with details", async () => {
    qb._filtered = mockAnnotations.filter(r => r.id === "1");
    qb.where.mockImplementation(() => qb._filtered); // awaited on where in storage.getAnnotation

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
    qb._filtered = [{id: "1", userId: "501"}];
    qb.where.mockReturnThis();
    qb.returning.mockImplementation(() => qb._filtered);

    const storage = new DbStorage();
    const result = await storage.deleteAnnotation("1", "501");

    expect(result.id).toBe("1");
    expect(result.userId).toBe("501");
  });

  test("user cannot delete someone else's annotation", async () => {
    qb.where.mockReturnThis();                 // IMPORTANT: keep chaining
    qb._filtered = [];                         // no row deleted
    qb.returning.mockImplementation(() => qb._filtered);

    const storage = new DbStorage();

    await expect(storage.deleteAnnotation("1", "999"))
        .rejects
        .toThrow("not found or access denied");
  });

  test("admin deletes any annotation", async () => {
    qb.where.mockReturnThis();                 // IMPORTANT: keep chaining
    qb._filtered = [{id: "1", userId: "501"}];
    qb.returning.mockImplementation(() => qb._filtered);

    const storage = new DbStorage();
    const result = await storage.deleteAnnotation("1");

    expect(result.id).toBe("1");
  });

// -------------------- createAnnotation --------------------

  describe("createAnnotation", () => {
    test("creates annotation and returns inserted row", async () => {
      const newAnnotation = {
        id: "10",
        projectId: "200",
        imageId: "300",
        userId: "900",
        labelClassesId: "700",
        annotatedAt: "2025-01-01T00:00:00Z",
        labelId: "abc123"
      };

      // createAnnotation does:
      // 1) select().from().where(...) -> array (existingAnnotation) => we want NONE
      // 2) insert(...).values(...).returning() -> array with inserted row
      (db.select as any).mockImplementationOnce(() => {
        const qb1 = createQB([]);
        qb1.where.mockImplementation(() => []); // IMPORTANT: returns array (awaited)
        return qb1;
      });

      (db.insert as any).mockImplementationOnce(() => {
        const qb2 = createQB([newAnnotation]);
        qb2.values.mockReturnThis();
        qb2.returning.mockImplementation(() => [newAnnotation]);
        return qb2;
      });

      const storage = new DbStorage();
      const result = await storage.createAnnotation(newAnnotation as any);

      expect(result).toBeDefined();
      expect(result.id).toBe("10");
      expect(result.projectId).toBe("200");
      expect(result.userId).toBe("900");
      expect(result.labelClassesId).toBe("700");
    });
  });
});