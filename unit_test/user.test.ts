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
  { id: "u1", name: "alpha", firstname: "alpha", lastname: "alpha", email: "alpha@test.com", password: "hashedpwd", role: "annotator", createAt: new Date(), resetPasswordToken: null, resetPassworToken: null, resetPasswordExpires: null },
  { id: "u2", name: "beta", firstname: "beta", lastname: "beta", email: "beta@test.com", password: "hashedpwd1", role: "data_specialist",  createAt: new Date(), resetPasswordToken: null, resetPassworToken: null, resetPasswordExpires: null },
] as const;

const mockProjects = [
  { id: "p1", name: "Project 1", createdBy: "u1" },
  { id: "p2", name: "Project 2", createdBy: "u2" },
] as const;


/// ---- User (verification, retrieval) tests -----
describe("User Storage Methods", () => {

  // Reset mocks before each test
beforeEach(() => {
  qb.select = vi.fn(() => qb);
  qb.insert = vi.fn(() => qb);
  qb.update = vi.fn(() => qb);
  qb.delete = vi.fn(() => qb);
  qb.from   = vi.fn(() => qb);
  qb.where  = vi.fn(() => qb);
  qb.innerJoin = vi.fn(() => qb);
  qb.values = vi.fn(() => qb);
  qb.set    = vi.fn(() => qb);
  qb.orderBy = vi.fn(() => qb);
  qb.execute = vi.fn();
  qb.returning = vi.fn();
});


  // ========= getUser =========

  test("getUser returns a user by ID when user exists", async () => {
    
    qb.where.mockImplementation(() =>  
        Promise.resolve(mockUsers.filter(u => u.id === "u1"))
    );

    const storage = new DbStorage();
    const result = await storage.getUser("u1");

    expect(result).toEqual(mockUsers[0]);
  });

test("getUser throws when user does not exist", async () => {
  qb.where.mockResolvedValue([]);

  const storage = new DbStorage();

  await expect(storage.getUser("missing-id"))
    .rejects
    .toThrow("User not found");
});

test("getUser throws when invalid user id type", async () => {
  
  const storage = new DbStorage();

  await expect(storage.getUser("" as any))
    .rejects
    .toThrow("Invalid user id");

    expect(qb.where).not.toHaveBeenCalled();

});



  // ======== getUserByEmail ========


  test("getUserByEmail returns a user by email if the user exists", async () => {

    qb.where.mockImplementation(() =>
        Promise.resolve(mockUsers.filter(u => u.email === "beta@test.com"))
    )

    const storage = new DbStorage();
    const result = await storage.getUserByEmail("beta@test.com");

    expect(result).toEqual(mockUsers[1]);

  });


  test("getUserByEmail returns undefined when no match", async () => {
    qb.where.mockResolvedValue([]);
    const storage = new DbStorage();

    await expect(storage.getUserByEmail("missing-user@mail.com"))
    .rejects
    .toThrow("User not found");

  });


  test("getUserByEmail throws when user type is invalid", async () => {
    const storage = new DbStorage();

    await expect(storage.getUserByEmail("" as any))
    .rejects
    .toThrow("Invalid email");

    expect(qb.where).not.toHaveBeenCalled();

  });

  // ======== createUser ========


test("createUser inserts a new user", async () => {
  const newUser = {
    id: "u3",
    name: "newuser",
    firstName: "New",
    lastName: "User",
    email: "new@test.com",
    password: "hashedpwd",
    role: "annotator",
    createdAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null
  };

  qb.values = vi.fn(() => qb);
  qb.returning = vi.fn().mockResolvedValue([newUser]);

  const storage = new DbStorage();
  const result = await storage.createUser(newUser as any);

  expect(result).toEqual(newUser);
});


  test("createUser throws when missing required fields", async () => {
    const incompleteUser = {
      name: "incomplete",
      email: "",
      password: "pwd"
    };
    const storage = new DbStorage();
    await expect(storage.createUser(incompleteUser as any))
      .rejects
      .toThrow("Invalid user data");
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
