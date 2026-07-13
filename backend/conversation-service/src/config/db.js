import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { redis } from "./redis.connect.js";
import crypto from "crypto";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const readOperations = ["findUnique", "findFirst", "findMany"];
        if (!readOperations.includes(operation)) {
          // Invalidate cache for this model on any write operation
          try {
            const keys = await redis.keys(`prisma_cache:${model}:*`);
            if (keys.length > 0) {
              await redis.del(...keys);
            }
          } catch (err) {
            console.error("Redis Cache Invalidation Error:", err);
          }
          return query(args);
        }

        const argsString = JSON.stringify(args || {});
        const hash = crypto
          .createHash("sha256")
          .update(argsString)
          .digest("hex");
        const cacheKey = `prisma_cache:${model}:${operation}:${hash}`;

        try {
          const cachedResult = await redis.get(cacheKey);
          if (cachedResult) {
            return JSON.parse(cachedResult, (key, value) => {
              if (
                typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
              ) {
                return new Date(value);
              }
              return value;
            });
          }
        } catch (err) {
          console.error("Redis Cache GET Error:", err);
        }
        const result = await query(args);
        try {
          if (result) {
            await redis.setex(cacheKey, 60, JSON.stringify(result));
          }
        } catch (err) {
          console.error("Redis Cache SET Error:", err);
        }

        return result;
      },
    },
  },
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("the database connected.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log("the database disconnected.");
    process.exit(1);
  } catch (error) {
    console.error(error);
  }
};
