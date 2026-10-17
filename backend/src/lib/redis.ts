import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis successfully");
  } catch (err) {
    console.warn("Redis connection failed. Running without cache fallback.");
  }
})();

// Helper to clear all agent list caches on create/update/delete
export async function invalidateAgentCaches(agentId?: string) {
  try {
    if (!redisClient.isOpen) return;

    if (agentId) {
      await redisClient.del(`agent:${agentId}`);
    }

    // Clear list caches matching agents:list:*
    const keys = await redisClient.keys("agents:list:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Failed to invalidate Redis cache:", error);
  }
}

export default redisClient;