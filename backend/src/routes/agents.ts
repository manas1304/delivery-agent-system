import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import redisClient, { invalidateAgentCaches } from "../lib/redis";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { agentSchema } from "../schemas/agentSchemas";

const router = Router();

// 1. GET ALL AGENTS (With Redis Caching, Pagination, Search & Filter)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";

    const cacheKey = `agents:list:page=${page}:limit=${limit}:search=${search}:status=${status}`;

    // Try Redis Cache
    if (redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        res.json({ source: "cache", ...JSON.parse(cachedData) });
        return;
      }
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { serviceArea: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.agent.count({ where }),
    ]);

    const result = {
      agents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Store in Redis with 10-minute expiry
    if (redisClient.isOpen) {
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 600 });
    }

    res.json({ source: "database", ...result });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch agents." });
  }
});

// 2. GET SINGLE AGENT BY ID (With Redis Caching)
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const cacheKey = `agent:${id}`;

    if (redisClient.isOpen) {
      const cachedAgent = await redisClient.get(cacheKey);
      if (cachedAgent) {
        res.json({ source: "cache", agent: JSON.parse(cachedAgent) });
        return;
      }
    }

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      res.status(404).json({ error: "Delivery agent not found." });
      return;
    }

    if (redisClient.isOpen) {
      await redisClient.set(cacheKey, JSON.stringify(agent), { EX: 600 });
    }

    res.json({ source: "database", agent });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch agent details." });
  }
});

// 3. CREATE NEW AGENT (Protected)
router.post(
  "/",
  authMiddleware,
  validate(agentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, phoneNumber, email, serviceArea, status } = req.body;

      if (!fullName || !phoneNumber || !email || !serviceArea) {
        res.status(400).json({ error: "Missing required agent fields." });
        return;
      }

      const newAgent = await prisma.agent.create({
        data: {
          fullName,
          phoneNumber,
          email,
          serviceArea,
          status: status || "active",
        },
      });

      await invalidateAgentCaches();

      res.status(201).json(newAgent);
    } catch (error: any) {
      if (error.code === "P2002") {
        res
          .status(400)
          .json({ error: "An agent with this email already exists." });
        return;
      }
      res.status(500).json({ error: "Failed to create agent." });
    }
  },
);

// 4. UPDATE AGENT (Protected)
router.put(
  "/:id",
  authMiddleware,
  validate(agentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { fullName, phoneNumber, email, serviceArea, status } = req.body;

      const existingAgent = await prisma.agent.findUnique({ where: { id } });
      if (!existingAgent) {
        res.status(404).json({ error: "Delivery agent not found." });
        return;
      }

      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: { fullName, phoneNumber, email, serviceArea, status },
      });

      await invalidateAgentCaches(id);

      res.json(updatedAgent);
    } catch (error: any) {
      if (error.code === "P2002") {
        res
          .status(400)
          .json({ error: "Email or phone number already exists." });
        return;
      }
      res.status(500).json({ error: "Failed to update agent." });
    }
  },
);

// 5. DELETE AGENT (Protected)
router.delete(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      const existingAgent = await prisma.agent.findUnique({ where: { id } });
      if (!existingAgent) {
        res.status(404).json({ error: "Delivery agent not found." });
        return;
      }

      await prisma.agent.delete({ where: { id } });

      await invalidateAgentCaches(id);

      res.json({ message: "Agent deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete agent." });
    }
  },
);

export default router;
