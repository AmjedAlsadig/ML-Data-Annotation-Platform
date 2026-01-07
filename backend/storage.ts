import { db } from "./db";
import {
  users, type InsertUser, type User,
  projects, type InsertProject, type Project,
  labels, type InsertLabel, type Label,
  labelClasses, type InsertLabelClass, type LabelClass,
  images, type InsertImage, type Image,
  annotations, type InsertAnnotation, type Annotation,
  projectAssignments, type InsertProjectAssignment, type ProjectAssignment,
  projectImages, type InsertProjectImage, type ProjectImage
} from "@shared/schema";
import { eq, and, desc, asc, sql, count, inArray, gt } from "drizzle-orm";

export interface AnnotationDetailsDTO {
  id: string;
  projectName: string | null;
  labelTypeName: string | null;
  labelClassName: string | null;
  annotatorName: string | null;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  // deleteUserByEmail(id: string): Promise<void>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: 'annotator' | 'data_specialist' | 'admin' | 'ml_engineer'): Promise<void>;

  saveResetToken(userId: string, token: string, expires: Date): Promise<void>;  
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;

  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByCreator(userId: string): Promise<Project[]>;
  getProjectsByAnnotator(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;

  deleteProject(id: string): Promise<void>

  // getProjectProgress(projectId: string): Promise<{ totalImages: number, annotatedImages: number }>;
  updateProjectStatus(id: string, status: "not_started" | "in_progress" | "completed"): Promise<void>;

  assignImagesToProject(projectId: string, imageIds: string[]): Promise<ProjectImage[]>
  removeImageAssignment(projectId: string, imageId: string): Promise<ProjectImage>
  updateProjectImagePublishedState(projectId: string, imageId: string, published: boolean): Promise<ProjectImage>
  getProjectImagePublishedState(projectId: string, imageId: string): Promise<boolean>
  getProjectStats(projectId: string): Promise<{
    numberOfImages: number;
    annotatedImages: number;
    totalAnnotations: number;
    activeAnnotators: number;
  }>

  // Label methods
  // getLabelsByProject(projectId: string): Promise<Label[]>;
  createLabel(label: InsertLabel): Promise<Label>;
  deleteLabel(id: string): Promise<void>;



  getAllLabelTypes(): Promise<(Label & { classCount: number })[]>;
  getLabelType(id: string): Promise<(Label & { classCount: number }) | undefined>;
  // createLabelType(labelType: InsertLabel): Promise<Label>;
  updateLabelType(id: string, labelType: Partial<InsertLabel>): Promise<Label>;
  deleteLabelTypes(ids: string[]): Promise<Label[]>;

  // Label Class methods
  getLabelClassesByType(labelTypeId: string): Promise<LabelClass[]>;
  addLabelClass(labelClass: InsertLabelClass): Promise<LabelClass>;
  removeLabelClass(labelTypeId: string, classId: string): Promise<LabelClass>;


  // Image methods
  getImagesByProject(projectId: string): Promise<(Image & { published: boolean })[]>;
  getImage(id: string): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  deleteImage(id: string): Promise<void>;
  getAllImages(): Promise<Image[] | undefined>
  getImagesByFilename(filename: string): Promise<Image[]>;

  // getPortfolioImages(userId: string, filters?: {
  //   projectId?: string;
  //   sortBy?: 'uploadedAt' | 'projectName';
  //   sortOrder?: 'asc' | 'desc';
  //   limit?: number;
  //   offset?: number;
  // }): Promise<{
  //   images: Array<Image & { projectName: string; projectId: string; isAnnotated: boolean }>;
  //   total: number;
  //   stats: {
  //     totalImages: number;
  //     totalProjects: number;
  //     annotatedImages: number;
  //   };
  // }>;

  // Annotation methods
  getAnnotationsByImage(imageId: string): Promise<AnnotationDetailsDTO[]>;
  getAnnotationsByUser(userId: string): Promise<Annotation[]>;
  // createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;


  // using the images assignment table


  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  deleteAnnotation(annotationId: string, annotatorId?: string): Promise<Annotation>;
  getAnnotation(id: string): Promise<(Annotation & {
    imageFilename: string;
    imageUrl: string;
    labelClassName: string;
    labelTypeName: string;
    annotatorUsername: string;
  }) | undefined>;

  // Project assignment methods
  assignUserToProject(assignment: InsertProjectAssignment): Promise<ProjectAssignment>;
  getProjectAssignments(projectId: string): Promise<ProjectAssignment[]>;


  // ML Engineer Methods 
  getEnrichedAnnotationsByImageIds(imageIds: string[]): Promise<any[]>
  getAllProjectsWithManifest(): Promise<any[]>
}

export class DbStorage implements IStorage {

  // User methods

async getUser(id: string): Promise<User> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid user id");
  }

  let user: User | undefined;

  try {
    [user] = await db.select().from(users).where(eq(users.id, id));
  } catch {
    throw new Error("Failed to fetch user");
  }

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// async deleteUserByEmail(email: string): Promise<void> {
//   if (!email || typeof email !== "string") {
//     throw new Error("Invalid email");
//   }

//   await db.transaction(async (tx) => {

//     // 1. Fetch user id
//     const existing = await tx
//       .select({ id: users.id })
//       .from(users)
//       .where(eq(users.email, email));

//     if (!existing.length) {
//       throw new Error("User not found");
//     }

//     const userId = existing[0].id;

//     // 2. Delete dependents FIRST
//     await tx.delete(projects).where(eq(projects.createdBy, userId));
//     await tx.delete(annotations).where(eq(annotations.userId, userId));
//     await tx.delete(projectAssignments).where(eq(projectAssignments.userId, userId));

//     // 3. Delete user
//     const result = await tx
//       .delete(users)
//       .where(eq(users.id, userId))
//       .execute();

//     if ((result as any)?.rowCount === 0) {
//       throw new Error("User not found");
//     }
//   });
// }


async getUserByEmail(email: string): Promise<User> {
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email");
  }

  let user: User | undefined;

  try {
    [user] = await db.select().from(users).where(eq(users.email, email));
  } catch {
    throw new Error("Failed to fetch user by email");
  }

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}


  async createUser(insertUser: InsertUser): Promise<User> {

    if(!insertUser?.email || !insertUser?.password || !insertUser?.name || !insertUser?.role
       || !insertUser?.firstName || !insertUser?.lastName
    ){

      throw new Error("Invalid user data");

    }

    let user: User | undefined;

    try{
    [user] = await db.insert(users).values(insertUser).returning();
    } catch {
      throw new Error("Failed to create user");
    }

    if (!user) {
      throw new Error("User creation failed");
    }

    return user;

  }

  // ======= ADMIN =========
  async getAllUsers(): Promise<User[]> {
  try {
    return await db.select().from(users);
  } catch {
    throw new Error("Failed to fetch users");
  }
}

  async updateUserRole(id: string, role: 'annotator' | 'data_specialist' | 'admin' | 'ml_engineer'): Promise<void> {
     if (!id || typeof id !== "string") {
    throw new Error("Invalid user id");
  }

  let result: unknown;

  try {
    result = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .execute();
  } catch {
    throw new Error("Failed to update user role");
  }

  if ((result as any)?.rowCount === 0) {
    throw new Error("User not found");
  }

  }


  
  // ====== end ADMIN =========


  // Rest password --> todo:  test in user.test.ts
  async saveResetToken(userId: string, token: string, expires: Date): Promise<void> {
     if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user id");
  }
  if (!token || typeof token !== "string") {
    throw new Error("Invalid reset token");
  }
  if (!(expires instanceof Date) || isNaN(expires.getTime())) {
    throw new Error("Invalid expiration date");
  }

  let result: unknown;

  try {
    result = await db.update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      })
      .where(eq(users.id, userId))
      .execute();
  } catch {
    throw new Error("Failed to save reset token");
  }

  if ((result as any)?.rowCount === 0) {
    throw new Error("User not found");
  }
  }

  // todo: user.test.ts
  async getUserByResetToken(token: string): Promise<User> {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid reset token");
  }

  let user: User | undefined;

  try {
    [user] = await db.select().from(users)
      .where(and(
        eq(users.resetPasswordToken, token),
        gt(users.resetPasswordExpires, new Date())
      ));
  } catch {
    throw new Error("Failed to fetch user by reset token");
  }

  if (!user) {
    throw new Error("Reset token not found or expired");
  }

  return user;
}


  // 3. Update Password and clear token
 async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user id");
  }
  if (!newPasswordHash || typeof newPasswordHash !== "string") {
    throw new Error("Invalid password hash");
  }

  let result: unknown;

  try {
    result = await db.update(users)
      .set({
        password: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.id, userId))
      .execute();
  } catch {
    throw new Error("Failed to update user password");
  }

  if ((result as any)?.rowCount === 0) {
    throw new Error("User not found");
  }
}

// Get all images with their published status from project assignments
  async getAllImagesWithPublishStatus(): Promise<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: Date;
    projectId: string | null;
    projectName: string | null;
    published: boolean | null;
  }[]> {
    const result = await db
      .select({
        id: images.id,
        filename: images.filename,
        url: images.url,
        uploadedAt: images.uploadedAt,
        projectId: projectImages.projectId,
        projectName: projects.name,
        published: projectImages.published,
      })
      .from(images)
      .leftJoin(projectImages, eq(images.id, projectImages.imageId))
      .leftJoin(projects, eq(projectImages.projectId, projects.id))
      .orderBy(images.uploadedAt);

    return result;
  }
  
  // Project methods == testing in storage-basic.test.ts

async getAllProjects() {
   return await db.select().from(projects);
}


  async getProject(id: string): Promise<Project | undefined> {

    if(!id || typeof id !== "string"){

      throw new Error("Invalid project id");
    }

    let project : Project | undefined;

    try{
    [project] = await db.select().from(projects).where(eq(projects.id, id));
    } catch {

      throw new Error("Failed to fetch project");
    }

    return project;
  }

async getProjectsByCreator(userId: string): Promise<Project[]> {
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user id");
  }

  let baseProjects: Project[];

  try {
    baseProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.createdBy, userId));
  } catch {
    throw new Error("Failed to fetch projects");
  }

  try {
    return await Promise.all(
      baseProjects.map(async (p) => {
        const progress = await this.getProjectStats(p.id);
        return { ...p, ...progress };
      })
    );
  } catch {
    throw new Error("Failed to compute project statistics");
  }
}


  async getProjectsByAnnotator(userId: string): Promise<Project[]> {
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user id");
  }

  let assignments: { project: Project }[];

  try {
    assignments = await db
      .select({ project: projects })
      .from(projectAssignments)
      .innerJoin(projects, eq(projectAssignments.projectId, projects.id))
      .where(eq(projectAssignments.userId, userId));
  } catch {
    throw new Error("Failed to fetch assigned projects");
  }

  try {
    return await Promise.all(
      assignments.map(async (a) => {
        const progress = await this.getProjectStats(a.project.id);
        return { ...a.project, ...progress };
      })
    );
  } catch {
    throw new Error("Failed to compute project statistics");
  }
}

// === Data specialist , to test in data-specialist.test.ts 


  async createProject(insertProject: InsertProject): Promise<Project> {

  if (!insertProject?.name || !insertProject?.createdBy) {
    throw new Error("Invalid project payload");
  }

  let project: Project | undefined;

  try {
    [project] = await db.insert(projects).values(insertProject).returning();
  } catch {
    throw new Error("DB insert failed");
  }

  if (!project) {
    throw new Error("Failed to create project");
  }

  return project;
}

async deleteProject(id: string): Promise<void> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid project id");
  }

  let result: unknown;

  try {
    result = await db.delete(projects)
      .where(eq(projects.id, id))
      .execute();
  } catch {
    throw new Error("Failed to delete project");
  }

  if ((result as any)?.rowCount === 0) {
    throw new Error("Project not found");
  }
}


  async updateProjectStatus(id: string, status: "not_started" | "in_progress" | "completed"): Promise<void> {
      if (!id || typeof id !== "string") {
    throw new Error("Invalid project id");
  }

  let result: unknown;

  try {
    result = await db.update(projects)
      .set({ status })
      .where(eq(projects.id, id))
      .execute();
  } catch {
    throw new Error("Failed to update project status");
  }

  if ((result as any)?.rowCount === 0) {
    throw new Error("Project not found");
  }
  }

 async assignImagesToProject(projectId: string, imageIds: string[]): Promise<ProjectImage[]> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }

  if (!Array.isArray(imageIds)) {
    throw new Error("Invalid image id list");
  }

  if (imageIds.length === 0) {
    return [];
  }

  if (imageIds.some(id => !id || typeof id !== "string")) {
    throw new Error("Invalid image id");
  }

  let existingImages: { id: string }[];

  try {
    existingImages = await db
      .select({ id: images.id })
      .from(images)
      .where(inArray(images.id, imageIds));
  } catch {
    throw new Error("Failed to verify images");
  }

  if (existingImages.length !== imageIds.length) {
    throw new Error("Some images not found");
  }

  const assignments = imageIds.map(imageId => ({
    projectId,
    imageId,
  }));

  let result: ProjectImage[];

  try {
    result = await db
      .insert(projectImages)
      .values(assignments)
      .onConflictDoNothing()
      .returning();
  } catch {
    throw new Error("Failed to assign images to project");
  }

  return result;
}


async createLabel(insertLabel: InsertLabel): Promise<Label> {
  if (!insertLabel?.name) {
    throw new Error("Invalid label payload");
  }

  let label: Label | undefined;

  try {
    [label] = await db.insert(labels).values(insertLabel).returning();
  } catch {
    throw new Error("DB insert failed");
  }

  if (!label) {
    throw new Error("Failed to create label");
  }

  return label;
}


 async deleteLabel(id: string): Promise<void> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid label id");
  }

  let result: unknown;

  try {
    result = await db.delete(labels)
      .where(eq(labels.id, id))
      .execute();
  } catch {
    throw new Error("Failed to delete label");
  }

  if ((result as any)?.rowCount === 0) {
    throw new Error("Label not found");
  }
}


async getAllLabelTypes(): Promise<(Label & { classCount: number })[]> {
  try {
    return await db
      .select({
        id: labels.id,
        name: labels.name,
        description: labels.description,
        createdAt: labels.createdAt,
        classCount: count(labelClasses.id),
      })
      .from(labels)
      .leftJoin(labelClasses, eq(labels.id, labelClasses.labelTypeId))
      .groupBy(labels.id)
      .orderBy(labels.createdAt);
  } catch {
    throw new Error("Failed to fetch label types");
  }
}


 async getLabelType(id: string): Promise<Label & { classCount: number }> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid label id");
  }

  let result: (Label & { classCount: number })[];

  try {
    result = await db
      .select({
        id: labels.id,
        name: labels.name,
        description: labels.description,
        createdAt: labels.createdAt,
        classCount: count(labelClasses.id),
      })
      .from(labels)
      .leftJoin(labelClasses, eq(labels.id, labelClasses.labelTypeId))
      .where(eq(labels.id, id))
      .groupBy(labels.id);
  } catch {
    throw new Error("Failed to fetch label type");
  }

  if (result.length === 0) {
    throw new Error("Label type not found");
  }

  return result[0];
}


  async updateLabelType(id: string, labelTypeData: Partial<InsertLabel>): Promise<Label> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid label id");
  }

  if (!labelTypeData || Object.keys(labelTypeData).length === 0) {
    throw new Error("Invalid label payload");
  }

  let labelType: Label | undefined;

  try {
    [labelType] = await db
      .update(labels)
      .set(labelTypeData)
      .where(eq(labels.id, id))
      .returning();
  } catch {
    throw new Error("Failed to update label type");
  }

  if (!labelType) {
    throw new Error("Label type not found");
  }

  return labelType;
}


// async deleteLabelTypes(ids: string[]): Promise<Label[]> {
//   if (!Array.isArray(ids)) {
//     throw new Error("Invalid label id list");
//   }

//   if (ids.length === 0) {
//     return [];
//   }

//   const validIds = ids.filter(id => typeof id === "string" && id.trim() !== "");

//   if (validIds.length !== ids.length) {
//     throw new Error("Invalid label id");
//   }

//   let result: Label[];

//   try {
//     result = await db
//       .delete(labels)
//       .where(inArray(sql`${labels.id}::text`, validIds))
//       .returning();
//   } catch {
//     throw new Error("Failed to delete label types");
//   }

//   if (result.length === 0) {
//     throw new Error("No label types found");
//   }

//   return result;
// }

async deleteLabelTypes(ids: string[]): Promise<Label[]> {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Invalid label id list");
  }

  const validIds = ids.filter(id =>
    typeof id === "string" &&
    /^[0-9a-fA-F-]{36}$/.test(id)
  );

  if (validIds.length !== ids.length) {
    throw new Error("Invalid label id");
  }

  return await db.transaction(async (tx) => {

    // 1. Verify existence
    const existing = await tx
      .select({ id: labels.id })
      .from(labels)
      .where(inArray(labels.id, validIds));

    if (!existing.length) {
      throw new Error("No label types found");
    }

    const existingIds = existing.map(r => r.id);

    // 2. Delete dependent annotations FIRST
    await tx
      .delete(annotations)
      .where(inArray(annotations.labelId, existingIds));

    // 3. Delete label types
    const deleted = await tx
      .delete(labels)
      .where(inArray(labels.id, existingIds))
      .returning();

    return deleted;
  });
}


  // Label Class Methods
async getLabelClassesByType(labelTypeId: string): Promise<LabelClass[]> {
  if (!labelTypeId || typeof labelTypeId !== "string") {
    throw new Error("Invalid label type id");
  }

  try {
    return await db
      .select()
      .from(labelClasses)
      .where(eq(labelClasses.labelTypeId, labelTypeId))
      .orderBy(labelClasses.name);
  } catch {
    throw new Error("Failed to fetch label classes");
  }
}


async addLabelClass(insertClass: InsertLabelClass): Promise<LabelClass> {
  if (!insertClass?.name || !insertClass?.labelTypeId) {
    throw new Error("Invalid label class payload");
  }

  let labelClass: LabelClass | undefined;

  try {
    [labelClass] = await db.insert(labelClasses).values(insertClass).returning();
  } catch {
    throw new Error("DB insert failed");
  }

  if (!labelClass) {
    throw new Error("Failed to create label class");
  }

  return labelClass;
}


async removeLabelClass(labelTypeId: string, classId: string): Promise<LabelClass> {
  if (!labelTypeId || typeof labelTypeId !== "string") {
    throw new Error("Invalid label type id");
  }
  if (!classId || typeof classId !== "string") {
    throw new Error("Invalid label class id");
  }

  let labelClass: LabelClass | undefined;

  try {
    [labelClass] = await db
      .delete(labelClasses)
      .where(and(
        eq(labelClasses.id, classId),
        eq(labelClasses.labelTypeId, labelTypeId)
      ))
      .returning();
  } catch {
    throw new Error("Failed to remove label class");
  }

  if (!labelClass) {
    throw new Error("Label class not found");
  }

  return labelClass;
}


 async removeImageAssignment(projectId: string, imageId: string): Promise<ProjectImage> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }
  if (!imageId || typeof imageId !== "string") {
    throw new Error("Invalid image id");
  }

  let image: ProjectImage | undefined;

  try {
    [image] = await db
      .delete(projectImages)
      .where(and(
        eq(projectImages.projectId, projectId),
        eq(projectImages.imageId, imageId)
      ))
      .returning();
  } catch {
    throw new Error("Failed to remove image assignment");
  }

  if (!image) {
    throw new Error("Image assignment not found");
  }

  return image;
}


  async updateProjectImagePublishedState(projectId: string, imageId: string, published: boolean): Promise<ProjectImage> {
    if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }
  if (!imageId || typeof imageId !== "string") {
    throw new Error("Invalid image id");
  }

  let projectImage: ProjectImage | undefined;

  try {
    [projectImage] = await db
      .update(projectImages)
      .set({ published })
      .where(and(
        eq(projectImages.projectId, projectId),
        eq(projectImages.imageId, imageId)
      ))
      .returning();
  } catch {
    throw new Error("Failed to update project image state");
  }

  if (!projectImage) {
    throw new Error("Image assignment not found");
  }

  return projectImage;
  }

 async getProjectImagePublishedState(projectId: string, imageId: string): Promise<boolean> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }
  if (!imageId || typeof imageId !== "string") {
    throw new Error("Invalid image id");
  }

  let projectImage: { published: boolean } | undefined;

  try {
    [projectImage] = await db
      .select({ published: projectImages.published })
      .from(projectImages)
      .where(and(
        eq(projectImages.projectId, projectId),
        eq(projectImages.imageId, imageId)
      ));
  } catch {
    throw new Error("Failed to fetch project image state");
  }

  if (!projectImage) {
    throw new Error("Image assignment not found");
  }

  return projectImage.published;
}


 
async getImagesByProject(projectId: string): Promise<(Image & { published: boolean })[]> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }

  try {
    return await db
      .select({
        id: images.id,
        filename: images.filename,
        url: images.url,
        uploadedAt: images.uploadedAt,
        published: projectImages.published,
      })
      .from(projectImages)
      .innerJoin(images, eq(projectImages.imageId, images.id))
      .where(eq(projectImages.projectId, projectId))
      .orderBy(images.uploadedAt);
  } catch {
    throw new Error("Failed to fetch project images");
  }
}


 async getImage(id: string): Promise<Image> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid image id");
  }

  let image: Image | undefined;

  try {
    [image] = await db.select().from(images).where(eq(images.id, id));
  } catch {
    throw new Error("Failed to fetch image");
  }

  if (!image) {
    throw new Error("Image not found");
  }

  return image;
}


 async createImage(insertImage: InsertImage): Promise<Image> {
  if (!insertImage?.filename || !insertImage?.url) {
    throw new Error("Invalid image payload");
  }



  let image: Image | undefined;

  try {
    [image] = await db.insert(images).values(insertImage).returning();
  } catch {
    throw new Error("DB insert failed");
  }

  if (!image) {
    throw new Error("Failed to create image");
  }

  return image;
}

async getAllImages(): Promise<Image[]> {
  try {
    return await db.select().from(images);
  } catch {
    throw new Error("Failed to fetch images");
  }
}


async getImagesByFilename(filename: string): Promise<Image[]> {
  if (!filename || typeof filename !== "string") {
    throw new Error("Invalid filename");
  }

  try {

    return await db
      .select()
      .from(images)
      .where(eq(images.filename, filename));


  } catch {
    throw new Error("Failed to fetch images by filename");
  }
}

async getAnnotationsByImage(imageId: string): Promise<AnnotationDetailsDTO[]> {
  if (!imageId || typeof imageId !== "string") {
    throw new Error("Invalid image id");
  }

  try {

    return await db
      .select({
        id: annotations.id,
        projectName: projects.name,
        labelTypeName: labels.name,
        labelClassName: labelClasses.name,
        annotatorName: users.name,
      })
      .from(annotations)
      .leftJoin(projects, eq(projects.id, annotations.projectId))
      .leftJoin(labels, eq(labels.id, annotations.labelId))
      .leftJoin(labelClasses, eq(labelClasses.id, annotations.labelClassesId))
      .leftJoin(users, eq(users.id, annotations.userId))
      .where(eq(annotations.imageId, imageId));


  } catch {
    throw new Error("Failed to fetch annotations by image");

  }
}

async getAnnotationsByUser(userId: string): Promise<Annotation[]> {
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user id");
  }

  try {
    return await db
      .select()
      .from(annotations)
      .where(eq(annotations.userId, userId));
  } catch {
    throw new Error("Failed to fetch annotations by user");
  }
}


  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
  if (
    !insertAnnotation?.imageId ||
    !insertAnnotation?.projectId ||
    !insertAnnotation?.labelId ||
    !insertAnnotation?.labelClassesId ||
    !insertAnnotation?.userId
  ) {
    throw new Error("Invalid annotation payload");
  }

  let existing: Annotation | undefined;

  try {
    [existing] = await db
      .select()
      .from(annotations)
      .where(and(
        eq(annotations.imageId, insertAnnotation.imageId),
        eq(annotations.projectId, insertAnnotation.projectId)
      ));
  } catch {
    throw new Error("Failed to check existing annotation");
  }

  if (existing) {
    let updated: Annotation | undefined;

    try {
      [updated] = await db
        .update(annotations)
        .set({
          labelClassesId: insertAnnotation.labelClassesId,
          labelId: insertAnnotation.labelId,
          userId: insertAnnotation.userId,
          annotatedAt: sql`NOW()`,
        })
        .where(eq(annotations.id, existing.id))
        .returning();
    } catch {
      throw new Error("Failed to update annotation");
    }

    if (!updated) {
      throw new Error("Annotation update failed");
    }

    return updated;
  }

  let created: Annotation | undefined;

  try {
    [created] = await db
      .insert(annotations)
      .values(insertAnnotation)
      .returning();
  } catch {
    throw new Error("Failed to create annotation");
  }

  if (!created) {
    throw new Error("Annotation creation failed");
  }

  return created;
}


 async deleteAnnotation(annotationId: string, annotatorId?: string): Promise<Annotation> {
  if (!annotationId || typeof annotationId !== "string") {
    throw new Error("Invalid annotation id");
  }

  if (annotatorId !== undefined && typeof annotatorId !== "string") {
    throw new Error("Invalid annotator id");
  }

  let deleted: Annotation | undefined;

  try {
    const whereCondition = annotatorId
      ? and(
          eq(annotations.id, annotationId),
          eq(annotations.userId, annotatorId)
        )
      : eq(annotations.id, annotationId);

    [deleted] = await db
      .delete(annotations)
      .where(whereCondition)
      .returning();
  } catch {
    throw new Error("Failed to delete annotation");
  }

  if (!deleted) {
    throw new Error("Annotation not found");
  }

  return deleted;
}


  // Get Annotation by ID with details
 async getAnnotation(id: string): Promise<Annotation & {
  imageFilename: string;
  imageUrl: string;
  labelClassName: string;
  labelTypeName: string;
  annotatorUsername: string;
}> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid annotation id");
  }

  let result: (Annotation & {
    imageFilename: string;
    imageUrl: string;
    labelClassName: string;
    labelTypeName: string;
    annotatorUsername: string;
  })[];

  try {
    result = await db
      .select({
        id: annotations.id,
        projectId: annotations.projectId,
        imageId: annotations.imageId,
        userId: annotations.userId,
        labelClassesId: annotations.labelClassesId,
        annotatedAt: annotations.annotatedAt,
        labelId: annotations.labelId,
        imageFilename: images.filename,
        imageUrl: images.url,
        labelClassName: labelClasses.name,
        labelTypeName: labels.name,
        annotatorUsername: users.name,
      })
      .from(annotations)
      .innerJoin(images, eq(annotations.imageId, images.id))
      .innerJoin(labelClasses, eq(annotations.labelClassesId, labelClasses.id))
      .innerJoin(labels, eq(labelClasses.labelTypeId, labels.id))
      .innerJoin(users, eq(annotations.userId, users.id))
      .where(eq(annotations.id, id));
  } catch {
    throw new Error("Failed to fetch annotation");
  }

  if (result.length === 0) {
    throw new Error("Annotation not found");
  }

  return result[0];
}


 async getAnnotationsByProjectAndAnnotator(projectId: string, annotatorId: string): Promise<any[]> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }
  if (!annotatorId || typeof annotatorId !== "string") {
    throw new Error("Invalid annotator id");
  }

  try {
    return await db
      .select({
        id: annotations.id,
        projectId: annotations.projectId,
        imageId: annotations.imageId,
        userId: annotations.userId,
        labelClassesId: annotations.labelClassesId,
        annotatedAt: annotations.annotatedAt,
        imageFilename: images.filename,
        imageUrl: images.url,
        labelClassName: labelClasses.name,
        labelTypeName: labels.name,
      })
      .from(annotations)
      .innerJoin(images, eq(annotations.imageId, images.id))
      .innerJoin(labelClasses, eq(annotations.labelClassesId, labelClasses.id))
      .innerJoin(labels, eq(labelClasses.labelTypeId, labels.id))
      .where(and(
        eq(annotations.projectId, projectId),
        eq(annotations.userId, annotatorId)
      ))
      .orderBy(desc(annotations.annotatedAt));
  } catch {
    throw new Error("Failed to fetch annotations by project and annotator");
  }
}

  async getAnnotationsByProject(projectId: string): Promise<any[]> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }

  try {
    return await db
      .select({
        id: annotations.id,
        projectId: annotations.projectId,
        imageId: annotations.imageId,
        userId: annotations.userId,
        labelClassesId: annotations.labelClassesId,
        annotatedAt: annotations.annotatedAt,
        imageFilename: images.filename,
        imageUrl: images.url,
        labelClassName: labelClasses.name,
        labelTypeName: labels.name,
        annotatorUsername: users.name,
        annotatorFirstName: users.firstName,
        annotatorLastName: users.lastName,
      })
      .from(annotations)
      .innerJoin(images, eq(annotations.imageId, images.id))
      .innerJoin(labelClasses, eq(annotations.labelClassesId, labelClasses.id))
      .innerJoin(labels, eq(labelClasses.labelTypeId, labels.id))
      .innerJoin(users, eq(annotations.userId, users.id))
      .where(eq(annotations.projectId, projectId))
      .orderBy(desc(annotations.annotatedAt));
  } catch {
    throw new Error("Failed to fetch annotations by project");
  }
}


  // Get annotation statistics for a project
 async getProjectStats(projectId: string): Promise<{
  numberOfImages: number;
  annotatedImages: number;
  totalAnnotations: number;
  activeAnnotators: number;
}> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }

  let annotationStats: any[];
  let projectStats: any[];

  try {
    annotationStats = await db
      .select({
        totalAnnotations: count(annotations.id),
        annotatedImages: count(sql`DISTINCT ${annotations.imageId}`),
        activeAnnotators: count(sql`DISTINCT ${annotations.userId}`),
      })
      .from(annotations)
      .where(eq(annotations.projectId, projectId));

    projectStats = await db
      .select({
        numberOfImages: count(projectImages.id),
      })
      .from(projectImages)
      .where(eq(projectImages.projectId, projectId));
  } catch {
    throw new Error("Failed to fetch project statistics");
  }

  return {
    numberOfImages: Number(projectStats[0]?.numberOfImages ?? 0),
    annotatedImages: Number(annotationStats[0]?.annotatedImages ?? 0),
    totalAnnotations: Number(annotationStats[0]?.totalAnnotations ?? 0),
    activeAnnotators: Number(annotationStats[0]?.activeAnnotators ?? 0),
  };
}


  // Project assignment methods
 async assignUserToProject(insertAssignment: InsertProjectAssignment): Promise<ProjectAssignment> {
  if (
    !insertAssignment?.projectId ||
    !insertAssignment?.userId
  ) {
    throw new Error("Invalid project assignment payload");
  }

  let existing: ProjectAssignment | undefined;

  try {
    [existing] = await db
      .select()
      .from(projectAssignments)
      .where(and(
        eq(projectAssignments.projectId, insertAssignment.projectId),
        eq(projectAssignments.userId, insertAssignment.userId)
      ));
  } catch {
    throw new Error("Failed to check existing project assignment");
  }

  if (existing) {
    return existing;
  }

  let assignment: ProjectAssignment | undefined;

  try {
    [assignment] = await db
      .insert(projectAssignments)
      .values(insertAssignment)
      .returning();
  } catch {
    throw new Error("Failed to create project assignment");
  }

  if (!assignment) {
    throw new Error("Project assignment creation failed");
  }

  return assignment;
}


async getProjectAssignments(projectId: string): Promise<ProjectAssignment[]> {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project id");
  }

  try {
    return await db
      .select()
      .from(projectAssignments)
      .where(eq(projectAssignments.projectId, projectId));
  } catch {
    throw new Error("Failed to fetch project assignments");
  }
}


async deleteImage(id: string): Promise<void> {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid image id");
  }

  let result: unknown;

  try {
    result = await db
      .delete(images)
      .where(eq(images.id, id))
      .execute();
  } catch {
    throw new Error("Failed to delete image");
  }

  if ((result as any)?.rowCount === 0) {
    throw new Error("Image not found");
  }
}


  async getPortfolioImages(userId: string, filters?: {
    projectId?: string;
    sortBy?: 'uploadedAt' | 'projectName';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{
    images: Array<Image & { projectName: string; projectId: string; isAnnotated: boolean }>;
    total: number;
    stats: {
      totalImages: number;
      totalProjects: number;
      annotatedImages: number;
    };
  }> {
    const {
      projectId,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = filters || {};

    // Build the base query for images with project and annotation data
    // Images are now linked via projectImages table instead of direct projectId

    const query = db
      .select({
        id: images.id,
        projectId: projectImages.projectId,
        filename: images.filename,
        url: images.url,
        uploadedAt: images.uploadedAt,
        projectName: projects.name,
        isAnnotated: sql<boolean>`CASE WHEN ${annotations.id} IS NOT NULL THEN true ELSE false END`
      })
      .from(images)
      .innerJoin(projectImages, eq(images.id, projectImages.imageId))
      .innerJoin(projects, eq(projectImages.projectId, projects.id))
      .leftJoin(annotations, and(eq(images.id, annotations.imageId), eq(projectImages.projectId, annotations.projectId)))
      .where(
        and(
          eq(projects.createdBy, userId),
          projectId ? eq(projects.id, projectId) : undefined
        )
      );

    // Apply ordering
    const orderBy = sortOrder === 'asc' ? asc : desc;
    if (sortBy === 'projectName') {
      query.orderBy(orderBy(projects.name));
    } else {
      query.orderBy(orderBy(images.uploadedAt));
    }

    // Get paginated results
    const portfolioImages = await query.limit(limit).offset(offset);

    // Get total count and stats
    const totalCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .innerJoin(projectImages, eq(images.id, projectImages.imageId))
      .innerJoin(projects, eq(projectImages.projectId, projects.id))
      .where(
        and(
          eq(projects.createdBy, userId),
          projectId ? eq(projects.id, projectId) : undefined
        )
      );

    const [{ count: total }] = await totalCountQuery;

    // Get stats
    const statsQuery = db
      .select({
        totalImages: sql<number>`count(distinct ${images.id})`,
        totalProjects: sql<number>`count(distinct ${projects.id})`,
        annotatedImages: sql<number>`count(distinct case when ${annotations.id} is not null then ${images.id} end)`
      })
      .from(images)
      .innerJoin(projectImages, eq(images.id, projectImages.imageId))
      .innerJoin(projects, eq(projectImages.projectId, projects.id))
      .leftJoin(annotations, and(eq(images.id, annotations.imageId), eq(projectImages.projectId, annotations.projectId)))
      .where(eq(projects.createdBy, userId));

    const [stats] = await statsQuery;

    return {
      images: portfolioImages,
      total: Number(total),
      stats: {
        totalImages: Number(stats.totalImages),
        totalProjects: Number(stats.totalProjects),
        annotatedImages: Number(stats.annotatedImages)
      }
    };
  }


  /* 
    ML Engineer endpoints
  */

  // Get "Enriched" labels for ONE OR MANY images
async getEnrichedAnnotationsByImageIds(imageIds: string[]): Promise<any[]> {
  if (!Array.isArray(imageIds)) {
    throw new Error("Invalid image id list");
  }

  if (imageIds.length === 0) {
    return [];
  }

  if (imageIds.some(id => typeof id !== "string" || id.trim() === "")) {
    throw new Error("Invalid image id");
  }

  try {
    return await db
      .select({
        annotationId: annotations.id,
        imageId: annotations.imageId,
        projectId: annotations.projectId,
        labelClass: labelClasses.name,
        labelType: labels.name,
        annotatedAt: annotations.annotatedAt,
        annotatorId: annotations.userId,


      })
      .from(annotations)
      .innerJoin(labelClasses, eq(annotations.labelClassesId, labelClasses.id))
      .innerJoin(labels, eq(labelClasses.labelTypeId, labels.id))
      .innerJoin(projectImages, and(
        eq(annotations.imageId, projectImages.imageId),
        eq(annotations.projectId, projectImages.projectId)
      ))
      .where(inArray(annotations.imageId, imageIds));
  } catch {
    throw new Error("Failed to fetch enriched annotations");
  }
}



  // Get All Projects with their Images and Label Type
 async getAllProjectsWithManifest(): Promise<any[]> {
  let projectsList: any[];

  try {
    // Get the base project info + Label Type info
    projectsList = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
        labelType: {
          id: labels.id,
          name: labels.name,
          description: labels.description,
        },
        createdBy: {
          id: users.id,
          email: users.email,
        },
      })
      .from(projects)
      .leftJoin(labels, eq(projects.labelTypeId, labels.id))
      .leftJoin(users, eq(projects.createdBy, users.id));
      // For each project, fetch the list of assigned images -- IN PARALLEL for effeciency
  } catch {
    throw new Error("Failed to fetch projects");
  }

  try {
    return await Promise.all(
      projectsList.map(async (project) => {
        const imagesInProject = await this.getImagesByProject(project.id);

        return {
          ...project,
          // The requirement says "including images", so we attach the list here
          images: imagesInProject.map(img => ({
            id: img.id,
            filename: img.filename,
            url: img.url,


          })),

        };
      })
    );
  } catch {
    throw new Error("Failed to fetch project manifest");
  }
}


}

export const storage = new DbStorage();