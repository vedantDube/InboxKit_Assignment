import { useState, useRef, useEffect } from 'react';
import './Grid.css';

function Grid({ grid, gridSize, onBlockClick, getUserInfo, userId, cooldown }) {
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Handle zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Handle pan
  const handleMouseDown = (e) => {
    if (e.button === 1 || e.ctrlKey) { // Middle mouse or Ctrl+click
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleBlockClickInternal = (index) => {
    if (!isDragging && cooldown === 0) {
      onBlockClick(index);
    }
  };

  const getBlockColor = (ownerId) => {
    if (!ownerId) return '#f0f0f0';
    const user = getUserInfo(ownerId);
    return user?.color || '#999';
  };

  const isMyBlock = (ownerId) => ownerId === userId;

  return (
    <div className="grid-container" ref={containerRef}>
      <div className="grid-controls">
        <button onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}>
          Zoom In
        </button>
        <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}>
          Zoom Out
        </button>
        <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}>
          Reset View
        </button>
      </div>

      <div
        className="grid-wrapper"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {grid.map((ownerId, index) => {
            const owner = ownerId ? getUserInfo(ownerId) : null;
            const isMine = isMyBlock(ownerId);
            const isHovered = hoveredBlock === index;

            return (
              <div
                key={index}
                className={`grid-block ${isMine ? 'my-block' : ''} ${ownerId ? 'captured' : 'uncaptured'} ${isHovered ? 'hovered' : ''}`}
                style={{
                  backgroundColor: getBlockColor(ownerId),
                }}
                onClick={() => handleBlockClickInternal(index)}
                onMouseEnter={() => setHoveredBlock(index)}
                onMouseLeave={() => setHoveredBlock(null)}
                title={owner ? owner.username : 'Unclaimed'}
              >
                {isMine && <span className="my-marker">★</span>}
              </div>
            );
          })}
        </div>
      </div>

      {hoveredBlock !== null && (
        <div className="block-tooltip">
          {(() => {
            const owner = grid[hoveredBlock] ? getUserInfo(grid[hoveredBlock]) : null;
            return owner ? (
              <>
                <span style={{ color: owner.color }}>●</span> {owner.username}
              </>
            ) : (
              'Click to capture!'
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default Grid;
