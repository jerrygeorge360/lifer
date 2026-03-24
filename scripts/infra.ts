import { execSync } from "child_process";
import net from "net";

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function main() {
  const postgresAvailable = await isPortAvailable(5432);
  const redisAvailable = await isPortAvailable(6379);

  if (postgresAvailable && redisAvailable) {
    console.log("Starting all services via Docker...");
    execSync("docker compose up -d", { stdio: "inherit" });
  } else if (!postgresAvailable && !redisAvailable) {
    console.log("Both PostgreSQL (5432) and Redis (6379) are already running on the host.");
    console.log("Skipping Docker infrastructure setup.");
  } else {
    if (postgresAvailable) {
      console.log("Starting PostgreSQL via Docker...");
      execSync("docker compose up -d db", { stdio: "inherit" });
    } else {
      console.log("PostgreSQL is already running on the host (5432). Skipping Docker DB.");
    }

    if (redisAvailable) {
      console.log("Starting Redis via Docker...");
      execSync("docker compose up -d redis", { stdio: "inherit" });
    } else {
      console.log("Redis is already running on the host (6379). Skipping Docker Redis.");
    }
  }
}

main().catch((err) => {
  console.error("Infrastructure setup failed:", err);
  process.exit(1);
});
