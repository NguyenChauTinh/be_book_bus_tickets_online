import env from "./env.js";
import redis from "redis";

const redisClient = redis.createClient({
    url: env.REDIS_URL,
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
    await redisClient.connect();
    console.log("Redis client connected");
})();
export default redisClient;

