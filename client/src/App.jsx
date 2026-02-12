import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import Grid from "./components/Grid";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./App.css";

// For local testing: http://localhost:3000
// For production: set VITE_SOCKET_URL environment variable or replace with your deployed URL
const SOCKET_URL =
  "https://inboxkit-assignment.onrender.com" || "http://localhost:3000";

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [userColor, setUserColor] = useState("#999");
  const [grid, setGrid] = useState([]);
  const [gridSize, setGridSize] = useState(0);
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [notification, setNotification] = useState("");

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("init", (data) => {
      setUserId(data.userId);
      setUsername(data.username);
      setUserColor(data.color);
      setGrid(data.grid);
      setGridSize(data.gridSize);
      setUsers(data.users);
      setLeaderboard(data.leaderboard);
    });

    newSocket.on("block-captured", (data) => {
      setGrid((prev) => {
        const newGrid = [...prev];
        newGrid[data.blockIndex] = data.userId;
        return newGrid;
      });

      // Show notification for other users' captures
      if (data.userId !== userId && data.userId) {
        showNotification(`${data.username} captured a block!`);
      }
    });

    newSocket.on("user-joined", (user) => {
      setUsers((prev) => [...prev, user]);
      showNotification(`${user.username} joined the game!`);
    });

    newSocket.on("user-left", (leftUserId) => {
      setUsers((prev) => prev.filter((u) => u.id !== leftUserId));
    });

    newSocket.on("username-changed", (data) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, username: data.username } : u,
        ),
      );
      if (data.userId === userId) {
        setUsername(data.username);
      }
    });

    newSocket.on("leaderboard-update", (data) => {
      setLeaderboard(data);
    });

    newSocket.on("cooldown", (data) => {
      setCooldown(data.remaining);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(Math.max(0, cooldown - 100));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleBlockClick = useCallback(
    (blockIndex) => {
      if (socket && connected && cooldown === 0) {
        socket.emit("capture-block", blockIndex);
        setCooldown(500); // Local cooldown
      }
    },
    [socket, connected, cooldown],
  );

  const handleUsernameChange = useCallback(
    (newUsername) => {
      if (socket && connected) {
        socket.emit("change-username", newUsername);
      }
    },
    [socket, connected],
  );

  const getUserInfo = useCallback(
    (ownerId) => {
      if (!ownerId) return null;
      return users.find((u) => u.id === ownerId);
    },
    [users],
  );

  if (!connected) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Connecting to game server...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        username={username}
        userColor={userColor}
        onUsernameChange={handleUsernameChange}
        onlineUsers={users.length}
      />

      <div className="main-content">
        <Sidebar
          leaderboard={leaderboard}
          userId={userId}
          userColor={userColor}
        />

        <div className="game-area">
          <Grid
            grid={grid}
            gridSize={gridSize}
            onBlockClick={handleBlockClick}
            getUserInfo={getUserInfo}
            userId={userId}
            cooldown={cooldown}
          />

          {notification && <div className="notification">{notification}</div>}

          {cooldown > 0 && (
            <div className="cooldown-indicator">
              Cooldown: {Math.ceil(cooldown / 100) / 10}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
