import "./Sidebar.css";

function Sidebar({ leaderboard, userId, userColor }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h2 className="sidebar-title">
          <span className="trophy-icon">🏆</span>
          Leaderboard
        </h2>

        <div className="leaderboard">
          {leaderboard.length === 0 ? (
            <p className="empty-state">Capture blocks to appear here!</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`leaderboard-entry ${entry.userId === userId ? "current-user" : ""}`}
              >
                <div className="entry-rank">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && `#${index + 1}`}
                </div>

                <div
                  className="entry-color"
                  style={{ backgroundColor: entry.color }}
                ></div>

                <div className="entry-info">
                  <div className="entry-username">{entry.username}</div>
                  <div className="entry-blocks">{entry.blocks} blocks</div>
                </div>

                {entry.userId === userId && (
                  <span className="you-badge">You</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="info-title">How to Play</h3>
        <ul className="info-list">
          <li>Click any block to capture it</li>
          <li>Your blocks are marked with ★</li>
          <li>Steal blocks from others!</li>
          <li>Use Ctrl+Scroll to zoom</li>
          <li>Ctrl+Drag to pan around</li>
        </ul>
      </div>

      <div className="sidebar-section stats-section">
        <h3 className="info-title">Your Stats</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: userColor }}>
              {leaderboard.find((e) => e.userId === userId)?.blocks || 0}
            </div>
            <div className="stat-label">Blocks Owned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {leaderboard.findIndex((e) => e.userId === userId) + 1 || "-"}
            </div>
            <div className="stat-label">Your Rank</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
