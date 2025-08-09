import { users, canvases, verificationCodes, type User, type InsertUser, type Canvas, type InsertCanvas, type UpdateCanvas, type CanvasNode, type CanvasEdge, type VerificationCode, type InsertVerificationCode } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getVerificationCode(phoneNumber: string, code: string): Promise<VerificationCode | undefined>;
  markVerificationCodeUsed(id: number): Promise<void>;
  
  getCanvas(id: number): Promise<Canvas | undefined>;
  getCanvasesByUserId(userId: number): Promise<Canvas[]>;
  createCanvas(canvas: InsertCanvas): Promise<Canvas>;
  updateCanvas(id: number, canvas: UpdateCanvas): Promise<Canvas | undefined>;
  deleteCanvas(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private canvases: Map<number, Canvas>;
  private verificationCodes: Map<number, VerificationCode>;
  private currentUserId: number;
  private currentCanvasId: number;
  private currentVerificationCodeId: number;

  constructor() {
    this.users = new Map();
    this.canvases = new Map();
    this.verificationCodes = new Map();
    this.currentUserId = 1;
    this.currentCanvasId = 1;
    this.currentVerificationCodeId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: Date.now()
    };
    this.users.set(id, user);
    return user;
  }

  async createVerificationCode(insertCode: InsertVerificationCode): Promise<VerificationCode> {
    const id = this.currentVerificationCodeId++;
    const verificationCode: VerificationCode = {
      ...insertCode,
      id,
      used: false,
      createdAt: Date.now()
    };
    this.verificationCodes.set(id, verificationCode);
    return verificationCode;
  }

  async getVerificationCode(phoneNumber: string, code: string): Promise<VerificationCode | undefined> {
    return Array.from(this.verificationCodes.values()).find(
      (vc) => vc.phoneNumber === phoneNumber && vc.code === code && !vc.used && vc.expiresAt > Date.now()
    );
  }

  async markVerificationCodeUsed(id: number): Promise<void> {
    const code = this.verificationCodes.get(id);
    if (code) {
      code.used = true;
      this.verificationCodes.set(id, code);
    }
  }

  async getCanvas(id: number): Promise<Canvas | undefined> {
    return this.canvases.get(id);
  }

  async getCanvasesByUserId(userId: number): Promise<Canvas[]> {
    return Array.from(this.canvases.values()).filter(
      (canvas) => canvas.userId === userId
    );
  }

  async createCanvas(insertCanvas: InsertCanvas): Promise<Canvas> {
    const id = this.currentCanvasId++;
    const canvas: Canvas = { 
      ...insertCanvas, 
      id,
      nodes: (insertCanvas.nodes as CanvasNode[]) || [],
      edges: (insertCanvas.edges as CanvasEdge[]) || [],
      viewport: insertCanvas.viewport || { x: 0, y: 0, zoom: 1 }
    };
    this.canvases.set(id, canvas);
    return canvas;
  }

  async updateCanvas(id: number, updateCanvas: UpdateCanvas): Promise<Canvas | undefined> {
    const existing = this.canvases.get(id);
    if (!existing) return undefined;

    const updated: Canvas = { 
      ...existing, 
      ...updateCanvas,
      nodes: (updateCanvas.nodes as CanvasNode[]) || existing.nodes,
      edges: (updateCanvas.edges as CanvasEdge[]) || existing.edges,
      viewport: updateCanvas.viewport || existing.viewport
    };
    this.canvases.set(id, updated);
    return updated;
  }

  async deleteCanvas(id: number): Promise<boolean> {
    return this.canvases.delete(id);
  }
}

export const storage = new MemStorage();
