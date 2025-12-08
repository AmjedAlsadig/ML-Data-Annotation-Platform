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

// Mock DB functions
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

describe("User basic storage tests", () => {

  test("getUser returns one user", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ id: "u1", name: "Nikola" }]
      })
    });

    const storage = new DbStorage();
    const result = await storage.getUser("u1");

    expect(result?.id).toBe("u1");
  });

  test("getUserByEmail returns one user", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ email: "test@mail.com" }]
      })
    });

    const storage = new DbStorage();
    const result = await storage.getUserByEmail("test@mail.com");

    expect(result?.email).toBe("test@mail.com");
  });

  test("createUser returns inserted user", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [{
          id: "u5",
          email: "new@mail.com"
        }]
      })
    });

    const storage = new DbStorage();
    const result = await storage.createUser({
      email: "new@mail.com",
      password: "pass"
    });

    expect(result.id).toBe("u5");
  });

  test("getAllUsers returns list", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ([
        { id: "1" },
        { id: "2" }
      ])
    });

    const storage = new DbStorage();
    const result = await storage.getAllUsers();

    expect(result.length).toBe(2);
  });

  test("updateUserRole updates value", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({})
      })
    });

    const storage = new DbStorage();
    await storage.updateUserRole("u1", "ml_engineer");

    expect(db.update).toHaveBeenCalled();
  });

});
describe("Project storage tests", () => {

  test("getProject returns project", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [{ id: "p1", name: "Project" }]
      })
    });

    const storage = new DbStorage();
    const result = await storage.getProject("p1");

    expect(result?.id).toBe("p1");
  });

  test("deleteProject calls db.delete", async () => {
    (db.delete as any).mockReturnValueOnce({
      where: () => ({})
    });

    const storage = new DbStorage();
    await storage.deleteProject("p1");

    expect(db.delete).toHaveBeenCalled();
  });

  test("updateProjectStatus updates row", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({})
      })
    });

    const storage = new DbStorage();
    await storage.updateProjectStatus("p1", "completed");

    expect(db.update).toHaveBeenCalled();
  });

});
//////////
test("getImage returns single image", async () => {

  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([{ id: "img10", filename: "car.png" }])
    })
  });

  const storage = new DbStorage();
  const result = await storage.getImage("img10");

  expect(result?.id).toBe("img10");
  expect(result?.filename).toBe("car.png");
});

test("getAnnotationsByUser returns all user annotations", async () => {

  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([
        { id: "a1", userId: "u1" },
        { id: "a2", userId: "u1" }
      ])
    })
  });

  const storage = new DbStorage();
  const result = await storage.getAnnotationsByUser("u1");

  expect(result.length).toBe(2);
});

test("removeImageAssignment removes assignment", async () => {

  (db.delete as any).mockReturnValueOnce({
    where: () => ({
      returning: () => ([
        { projectId: "p1", imageId: "img5" }
      ])
    })
  });

  const storage = new DbStorage();
  const result = await storage.removeImageAssignment("p1", "img5");

  expect(result.imageId).toBe("img5");
});


test("assignUserToProject returns existing assignment if already exists", async () => {

  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([{ projectId: "p1", userId: "u1" }])
    })
  });

  const storage = new DbStorage();
  const result = await storage.assignUserToProject({ projectId: "p1", userId: "u1" });

  expect(result.projectId).toBe("p1");
});

test("assignUserToProject inserts new assignment", async () => {

  // no existing assignment
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([]),
    })
  });

  (db.insert as any).mockReturnValueOnce({
    values: () => ({
      returning: () => ([
        { projectId: "p1", userId: "u2" }
      ])
    })
  });

  const storage = new DbStorage();
  const result = await storage.assignUserToProject({ projectId: "p1", userId: "u2" });

  expect(result.userId).toBe("u2");
});

test("getProjectsByCreator returns projects with stats", async () => {

  // mock select of projects
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([
        { id: "p1", name: "Project One", createdBy: "u1" }
      ])
    })
  });

  // mock getProjectStats() internal call
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([
        {
          totalAnnotations: 5,
          annotatedImages: 2,
          activeAnnotators: 1
        }
      ])
    })
  });

  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([
        { numberOfImages: 10 }
      ])
    })
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
        where: () => ([
          { project: { id: "p100", name: "TestProj" } }
        ])
      })
    })
  });

  // Mock getProjectStats internal calls:
  // 1) annotations stats
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([{
        totalAnnotations: 3,
        annotatedImages: 2,
        activeAnnotators: 1
      }])
    })
  });

  // 2) image count
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ([{
        numberOfImages: 8
      }])
    })
  });

  const storage = new DbStorage();
  const result = await storage.getProjectsByAnnotator("u501");

  expect(result.length).toBe(1);
  expect(result[0].id).toBe("p100");
  expect(result[0].numberOfImages).toBe(8);
});

