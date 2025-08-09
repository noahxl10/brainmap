import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCanvasSchema, updateCanvasSchema, loginRequestSchema, verifyCodeSchema } from "@shared/schema";
import { z } from "zod";
import { generateVerificationCode, sendVerificationCode } from "./twilio";
import { generateAIResponse } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/request-code", async (req, res) => {
    try {
      const { phoneNumber, name } = loginRequestSchema.parse(req.body);
      
      // Generate and store verification code
      const code = generateVerificationCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      
      await storage.createVerificationCode({
        phoneNumber,
        code,
        expiresAt
      });
      
      // Send SMS
      await sendVerificationCode(phoneNumber, code);
      
      res.json({ message: "Verification code sent successfully" });
    } catch (error) {
      console.error("Request code error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { phoneNumber, code } = verifyCodeSchema.parse(req.body);
      
      // Verify the code
      const verificationCode = await storage.getVerificationCode(phoneNumber, code);
      if (!verificationCode) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      // Mark code as used
      await storage.markVerificationCodeUsed(verificationCode.id);
      
      // Find or create user
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        // For new users, we need the name from the original request
        // In a real app, you'd store this in session or require it again
        user = await storage.createUser({
          phoneNumber,
          name: `User ${phoneNumber.slice(-4)}` // Fallback name
        });
      }
      
      // Store user ID in session
      (req.session as any).userId = user.id;
      
      res.json({ 
        message: "Login successful", 
        user: { 
          id: user.id, 
          name: user.name, 
          phoneNumber: user.phoneNumber 
        } 
      });
    } catch (error) {
      console.error("Verify code error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req.session as any).userId = null;
    res.json({ message: "Logged out successfully" });
  });

  // Get current user (now uses session)
  app.get("/api/user", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user's canvases
  app.get("/api/canvases", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const canvases = await storage.getCanvasesByUserId(userId);
      res.json(canvases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get canvases" });
    }
  });

  // Get specific canvas
  app.get("/api/canvases/:id", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const canvas = await storage.getCanvas(id);
      
      if (!canvas) {
        return res.status(404).json({ message: "Canvas not found" });
      }
      
      // Check if canvas belongs to user
      if (canvas.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(canvas);
    } catch (error) {
      res.status(500).json({ message: "Failed to get canvas" });
    }
  });

  // Create new canvas
  app.post("/api/canvases", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validatedData = insertCanvasSchema.parse({
        ...req.body,
        userId
      });

      const canvas = await storage.createCanvas(validatedData);
      res.status(201).json(canvas);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid canvas data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create canvas" });
    }
  });

  // Update canvas
  app.patch("/api/canvases/:id", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      // Check if canvas exists and belongs to user
      const existingCanvas = await storage.getCanvas(id);
      if (!existingCanvas) {
        return res.status(404).json({ message: "Canvas not found" });
      }
      if (existingCanvas.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = updateCanvasSchema.parse(req.body);
      const canvas = await storage.updateCanvas(id, validatedData);

      res.json(canvas);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid canvas data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update canvas" });
    }
  });

  // Delete canvas
  app.delete("/api/canvases/:id", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      // Check if canvas exists and belongs to user
      const existingCanvas = await storage.getCanvas(id);
      if (!existingCanvas) {
        return res.status(404).json({ message: "Canvas not found" });
      }
      if (existingCanvas.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const deleted = await storage.deleteCanvas(id);

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete canvas" });
    }
  });

  // AI response endpoint
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const response = await generateAIResponse(prompt);
      res.json({ response });
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
