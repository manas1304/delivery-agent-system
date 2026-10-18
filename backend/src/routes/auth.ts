import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = Router();

// Register Admin
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { username } });
    if (existingAdmin) {
      res.status(400).json({ error: "Admin username already exists." });
      return;
    }

    const admin = await prisma.admin.create({
      data: { username, password },
    });

    res.status(201).json({ message: "Admin registered successfully", adminId: admin.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to register admin." });
  }
});

// Login Admin
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin || admin.password !== password) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.json({ token, username: admin.username });
  } catch (error) {
    res.status(500).json({ error: "Failed to log in." });
  }
});

export default router;

