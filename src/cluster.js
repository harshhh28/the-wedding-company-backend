/**
 * Cluster Mode Entry Point
 * Forks worker processes to utilize multiple CPU cores
 */

const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`\n[Master] Process ${process.pid} is running`);
  console.log(`[Master] Forking ${numCPUs} workers...\n`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit and restart
  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `[Master] Worker ${worker.process.pid} died (${
        signal || code
      }). Restarting...`
    );
    cluster.fork();
  });

  // Log when workers come online
  cluster.on("online", (worker) => {
    console.log(`[Master] Worker ${worker.process.pid} is online`);
  });
} else {
  // Workers run the actual server
  require("./server");
}
