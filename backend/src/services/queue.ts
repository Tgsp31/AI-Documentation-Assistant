import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";

export const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const documentQueue = new Queue("document-processing", { connection: redis });
