const WebSocket = require("ws");

const PORT = 8765;
const RESPAWN_DELAY = 3000; // ms

const wss = new WebSocket.Server({ port: PORT });
let clients = new Set();

let enemyAlive = true;

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

function killEnemy() {
  if (!enemyAlive) return; // already dead, ignore duplicate shots
  enemyAlive = false;
  broadcast({ type: "enemy_died" });

  setTimeout(() => {
    enemyAlive = true;
    broadcast({ type: "enemy_respawned" });
  }, RESPAWN_DELAY);
}

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);

  // Tell the new client the current enemy state immediately
  ws.send(
    JSON.stringify({
      type: "enemy_state",
      alive: enemyAlive,
    }),
  );

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === "shoot_enemy") {
        killEnemy();
      }
    } catch (e) {
      console.error("Bad message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });
});

console.log(`Server running on ws://localhost:${PORT}`);
