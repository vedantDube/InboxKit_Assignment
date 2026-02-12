import { useState } from "react";
import "./Header.css";

function Header({ username, userColor, onUsernameChange, onlineUsers }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newUsername.trim() && newUsername !== username) {
      onUsernameChange(newUsername.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">🎯</span>
          <h1>Grid Capture</h1>
        </div>

        <div className="user-info">
          <div className="online-indicator">
            <span className="pulse-dot"></span>
            <span>{onlineUsers} online</span>
          </div>

          <div className="username-display">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="username-form">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  onBlur={handleSubmit}
                  maxLength={20}
                  autoFocus
                  className="username-input"
                />
              </form>
            ) : (
              <div
                className="username-badge"
                onClick={() => setIsEditing(true)}
              >
                <span
                  className="user-color-dot"
                  style={{ backgroundColor: userColor }}
                ></span>
                <span className="username-text">{username}</span>
                <span className="edit-hint">✏️</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
