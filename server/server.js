import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "🟢 Server is running",
    message: "WebSocket server for Grid Capture game",
    connections: users.size,
    gridSize: GRID_SIZE,
    instructions: "Open http://localhost:5173 to play the game"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const httpServer = createServer(app);

// Allow both local development and production origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      "http://localhost:5173", 
      "http://127.0.0.1:5173",
      "https://inboxkit-assignment.onrender.com",
      "https://inboxkit-assignment.vercel.app",
      "https://inboxkit-assignment.netlify.app"
    ];

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Game configuration
const GRID_SIZE = 30; // 30x30 = 900 blocks
const COOLDOWN_MS = 500; // 500ms cooldown between captures
const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B739",
  "#52B788",
  "#E63946",
  "#06FFA5",
  "#FFD60A",
  "#118AB2",
  "#FF4365",
];

// Game state
const grid = Array(GRID_SIZE * GRID_SIZE).fill(null);
const users = new Map(); // socketId -> user data
const lastCapture = new Map(); // socketId -> timestamp

// Generate random username
function generateUsername() {
  const adjectives = [
    "Swift",
    "Bold",
    "Clever",
    "Epic",
    "Mighty",
    "Cosmic",
    "Stellar",
    "Blazing",
    "Thunder",
    "Shadow",
  ];
  const nouns = [
    "Tiger",
    "Eagle",
    "Dragon",
    "Phoenix",
    "Wolf",
    "Falcon",
    "Panda",
    "Shark",
    "Ninja",
    "Knight",
  ];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 99)}`;
}

// Get leaderboard
function getLeaderboard() {
  const scores = new Map();

  grid.forEach((owner) => {
    if (owner) {
      scores.set(owner, (scores.get(owner) || 0) + 1);
    }
  });

  return Array.from(scores.entries())
    .map(([userId, count]) => {
      const user = users.get(userId);
      return {
        userId,
        username: user?.username || "Unknown",
        color: user?.color || "#999",
        blocks: count,
      };
    })
    .sort((a, b) => b.blocks - a.blocks)
    .slice(0, 10);
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Initialize user
  const username = generateUsername();
  const color = COLORS[users.size % COLORS.length];
  users.set(socket.id, { username, color, blocks: 0 });

  // Send initial state to new user
  socket.emit("init", {
    userId: socket.id,
    username,
    color,
    grid,
    gridSize: GRID_SIZE,
    users: Array.from(users.entries()).map(([id, data]) => ({
      id,
      ...data,
    })),
    leaderboard: getLeaderboard(),
  });

  // Notify others of new user
  socket.broadcast.emit("user-joined", {
    id: socket.id,
    username,
    color,
  });

  // Handle block capture
  socket.on("capture-block", (blockIndex) => {
    // Validate block index
    if (blockIndex < 0 || blockIndex >= grid.length) {
      return;
    }

    // Check cooldown
    const now = Date.now();
    const lastTime = lastCapture.get(socket.id) || 0;
    if (now - lastTime < COOLDOWN_MS) {
      socket.emit("cooldown", { remaining: COOLDOWN_MS - (now - lastTime) });
      return;
    }

    // Check if block is already owned by this user
    if (grid[blockIndex] === socket.id) {
      return;
    }

    // Capture the block
    const previousOwner = grid[blockIndex];
    grid[blockIndex] = socket.id;
    lastCapture.set(socket.id, now);

    // Update user block count
    const user = users.get(socket.id);
    if (user) {
      user.blocks = grid.filter((owner) => owner === socket.id).length;
    }

    // Update previous owner's count
    if (previousOwner && users.has(previousOwner)) {
      const prevUser = users.get(previousOwner);
      prevUser.blocks = grid.filter((owner) => owner === previousOwner).length;
    }

    // Broadcast the capture to all clients
    io.emit("block-captured", {
      blockIndex,
      userId: socket.id,
      username: user?.username,
      color: user?.color,
      previousOwner,
    });

    // Send updated leaderboard
    io.emit("leaderboard-update", getLeaderboard());
  });

  // Handle username change
  socket.on("change-username", (newUsername) => {
    if (!newUsername || newUsername.length === 0 || newUsername.length > 20) {
      return;
    }

    const user = users.get(socket.id);
    if (user) {
      user.username = newUsername;
      io.emit("username-changed", {
        userId: socket.id,
        username: newUsername,
      });
      io.emit("leaderboard-update", getLeaderboard());
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    users.delete(socket.id);
    lastCapture.delete(socket.id);

    // Notify others
    io.emit("user-left", socket.id);
    io.emit("leaderboard-update", getLeaderboard());
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✨ Server running on http://localhost:${PORT}`);
});
