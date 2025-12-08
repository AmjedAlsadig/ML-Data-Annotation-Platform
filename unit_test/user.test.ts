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
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  orderBy: vi.fn(),
  execute: vi.fn()
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

const mockUsers = [
  { id: "u1", username: "alpha", email: "alpha@test.com", role: "annotator" },
  { id: "u2", username: "beta", email: "beta@test.com", role: "data_specialist" },
] as const;

const mockProjects = [
  { id: "p1", name: "Project 1", createdBy: "u1" },
  { id: "p2", name: "Project 2", createdBy: "u2" },
] as const;


/// ---- User (verification, retrieval) tests -----
describe("User Storage Methods", () => {

  // Reset mocks before each test
  beforeEach(() => {
    qb.select.mockReturnThis();
    qb.from.mockReturnThis();
    qb.insert.mockReturnThis();
    qb.update.mockReturnThis();
    qb.where.mockReturnThis();
    qb.values?.mockReturnThis?.();
    qb.returning?.mockReturnThis?.();
  });

  // getUser
  test("getUser returns a user by ID", async () => {
    
    qb.where.mockImplementation(() =>
        Promise.resolve(mockUsers.filter(u => u.id === "u1"))
    );


    const storage = new DbStorage();
    const result = await storage.getUser("u1");

    expect(result?.id).toBe("u1");
    expect(result?.email).toBe("alpha@test.com");
  });

  test("getUser returns undefined when not found", async () => {
    qb.where.mockImplementation(() => Promise.resolve([])); // no user found

    const storage = new DbStorage();
    const result = await storage.getUser("missing");

    expect(result).toBeUndefined();
  });


  // getUserByEmail
  test("getUserByEmail returns a user by email", async () => {

    qb.where.mockImplementation(() =>
        Promise.resolve(mockUsers.filter(u => u.email === "beta@test.com"))
    )

    const storage = new DbStorage();
    const result = await storage.getUserByEmail("beta@test.com");

    expect(result?.id).toBe("u2");
    expect(result?.username).toBe("beta");
  });

  test("getUserByEmail returns undefined when no match", async () => {

    qb.where.mockImplementation(() => Promise.resolve([])); // no user found

    const storage = new DbStorage();
    const result = await storage.getUserByEmail("none@test.com");

    expect(result).toBeUndefined();
  });

  // createUser 
  test("createUser inserts a new user", async () => {
    const newUser = { id: "u3", email: "new@test.com", username: "newuser", role: "annotator" };

    qb.values = vi.fn().mockReturnThis(); // for db.insert(users).values()
    qb.returning = vi.fn().mockReturnValue([newUser]);

    const storage = new DbStorage();
    const result = await storage.createUser(newUser as any);

    expect(result.id).toBe("u3");
    expect(result.email).toBe("new@test.com");
  });

  // getAllUsers
  test("getAllUsers returns all users", async () => {
    qb.select.mockReturnThis();
    qb.from.mockImplementation(() =>
        Promise.resolve(mockUsers)
    );

    const storage = new DbStorage();
    const result = await storage.getAllUsers();

    expect(result.length).toBe(2);
    expect(result[1].username).toBe("beta");
  });

  // updateUserRole 
  test("updateUserRole updates a user's role", async () => {
    qb.update.mockReturnThis();
    qb.set = vi.fn().mockReturnThis();
    qb.where.mockReturnThis();
    qb.execute = vi.fn().mockResolvedValue([]);

    const storage = new DbStorage();
    await storage.updateUserRole("u1", "admin");

    expect(qb.set).toHaveBeenCalledWith({ role: "admin" });
  });

});


describe("Project Methods", () => {
  test("getProject by ID", async () => {

    qb.where.mockImplementation(() =>
        Promise.resolve(mockProjects.filter(p => p.id === "p1"))
    )

    const storage = new DbStorage();
    const project = await storage.getProject("p1");

    expect(project?.name).toBe("Project 1");
  });

  test("getProjectsByCreator", async () => {

    qb.where.mockImplementation(() =>
        Promise.resolve(mockProjects.filter(p => p.createdBy === "u1"))
    )

    const storage = new DbStorage();
    const projects = await storage.getProjectsByCreator("u1");

    expect(projects.length).toBe(1);
    expect(projects[0].name).toBe("Project 1");
  });
});
