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
  const webAvailable = await isPortAvailable(3000);

  const startFull = process.argv.includes("--all");

  if (startFull) {
    console.log("🚀 Starting Full Lifer Stack via Docker (Web + Workers + DB + Redis)...");
    execSync("docker compose up -d", { stdio: "inherit" });
    console.log("\n✅ Done. Visit http://localhost:3000");
  } else {
    console.log("🛠️ Starting Infrastructure only (DB + Redis)...");
    
    if (postgresAvailable) {
      console.log("Starting PostgreSQL via Docker...");
      execSync("docker compose up -d db", { stdio: "inherit" });
    } else {
      console.log("PostgreSQL is already running on the host (5432).");
    }

    if (redisAvailable) {
      console.log("Starting Redis via Docker...");
      execSync("docker compose up -d redis", { stdio: "inherit" });
    } else {
      console.log("Redis is already running on the host (6379).");
    }
    
    console.log("\n✅ Infrastructure ready. Run 'npm run dev' and 'npm run workers' locally if desired.");
    if (webAvailable) {
      console.log("💡 Tip: Use 'npm run infra -- --all' to start the application in Docker too.");
    }
  }
}

main().catch((err) => {
  console.error("Infrastructure setup failed:", err);
  process.exit(1);
});
