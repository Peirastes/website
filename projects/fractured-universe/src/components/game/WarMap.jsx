import React, { useState } from 'react';
import { HoloPanel } from '../ui/index.jsx';
import { FACTIONS } from '../../data/gameData.js';
import { generateConnections, calculateFactionControl } from '../../utils/sectorGenerator.js';

export default function WarMap({
  sectors = [],
  selectedSector = null,
  onSelectSector = () => {},
  playerFaction = null,
}) {
  const [hoveredSector, setHoveredSector] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate faction control
  const factionControl = calculateFactionControl(sectors);

  // Generate connections
  const connections = generateConnections(sectors);

  // Helper function to lighten a color
  const lightenColor = (hexColor, opacity = 0.6) => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Lighten by blending with white
    const lightened = [
      Math.floor(r + (255 - r) * 0.3),
      Math.floor(g + (255 - g) * 0.3),
      Math.floor(b + (255 - b) * 0.3),
    ];

    return `rgba(${lightened[0]}, ${lightened[1]}, ${lightened[2]}, ${opacity})`;
  };

  // Helper function to get faction color
  const getFactionColor = (factionId) => {
    const faction = Object.values(FACTIONS).find(f => f.id === factionId);
    return faction ? faction.color : '#888888';
  };

  // Helper function to get faction name
  const getFactionName = (factionId) => {
    const faction = Object.values(FACTIONS).find(f => f.id === factionId);
    return faction ? faction.name : 'Unknown Faction';
  };

  // Handle tooltip position
  const handleSectorHover = (sector, event) => {
    const svgRect = event.currentTarget.closest('svg').getBoundingClientRect();
    setTooltipPos({
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top,
    });
    setHoveredSector(sector);
  };

  const playerFactionColor = playerFaction ? playerFaction.color : '#00ff9f';

  return (
    <HoloPanel
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
      glow={playerFactionColor}
    >
      {/* Header Section */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(0, 255, 159, 0.2)' }}>
        <h2
          style={{
            margin: '0 0 15px 0',
            color: playerFactionColor,
            fontSize: '18px',
            fontFamily: 'Orbitron',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textShadow: `0 0 10px ${playerFactionColor}80`,
          }}
        >
          FRACTURED UNIVERSE WAR MAP
        </h2>

        {/* Faction Control Legend */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            fontSize: '13px',
            fontFamily: 'Orbitron',
          }}
        >
          {Object.values(FACTIONS).map((faction) => (
            <div key={faction.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: faction.color,
                  boxShadow: `0 0 8px ${faction.color}`,
                  borderRadius: '2px',
                }}
              />
              <div>
                <div style={{ color: faction.color, fontWeight: 'bold' }}>{faction.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  {factionControl[faction.id] || 0} sectors
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Map Section */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', position: 'relative' }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {/* Connection Lines */}
          {connections.map((connection, idx) => {
            const fromSector = sectors.find(s => s.id === connection.from);
            const toSector = sectors.find(s => s.id === connection.to);

            if (!fromSector || !toSector) return null;

            const fromColor = getFactionColor(fromSector.controlledBy);
            const toColor = getFactionColor(toSector.controlledBy);

            // If same faction, use the faction color lightened; otherwise use gray
            const lineColor = fromSector.controlledBy === toSector.controlledBy
              ? lightenColor(fromColor, 0.4)
              : 'rgba(100, 100, 100, 0.4)';

            return (
              <line
                key={`connection-${idx}`}
                x1={fromSector.x}
                y1={fromSector.y}
                x2={toSector.x}
                y2={toSector.y}
                stroke={lineColor}
                strokeWidth="0.3"
                strokeDasharray="2,2"
                opacity="0.4"
                pointerEvents="none"
              />
            );
          })}

          {/* Sector Nodes */}
          {sectors.map((sector) => {
            const factionColor = getFactionColor(sector.controlledBy);
            const isSelected = selectedSector && selectedSector.id === sector.id;
            const isHovered = hoveredSector && hoveredSector.id === sector.id;

            return (
              <g
                key={`sector-${sector.id}`}
                onClick={() => onSelectSector(sector.id)}
                onMouseEnter={(e) => handleSectorHover(sector, e)}
                onMouseLeave={() => setHoveredSector(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Contested Pulse Ring */}
                {sector.contested && (
                  <circle
                    cx={sector.x}
                    cy={sector.y}
                    r="0.8"
                    fill="none"
                    stroke={factionColor}
                    strokeWidth="0.15"
                    opacity="0.6"
                    style={{
                      animation: 'pulse 2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Capitol Star Indicator */}
                {sector.isCapitol && (
                  <text
                    x={sector.x}
                    y={sector.y}
                    fontSize="1.5"
                    fill={factionColor}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      pointerEvents: 'none',
                      textShadow: `0 0 5px ${factionColor}`,
                      filter: `drop-shadow(0 0 3px ${factionColor})`,
                    }}
                  >
                    ★
                  </text>
                )}

                {/* Main Sector Circle */}
                <circle
                  cx={sector.x}
                  cy={sector.y}
                  r="0.6"
                  fill={`${factionColor}4D`} // 30% opacity
                  stroke={factionColor}
                  strokeWidth="0.15"
                  style={{
                    transition: 'all 0.2s ease',
                    opacity: isHovered ? 0.8 : 0.6,
                  }}
                />

                {/* Selected Rotating Ring */}
                {isSelected && (
                  <circle
                    cx={sector.x}
                    cy={sector.y}
                    r="1.2"
                    fill="none"
                    stroke={factionColor}
                    strokeWidth="0.15"
                    strokeDasharray="0.2,0.1"
                    style={{
                      animation: 'rotate 3s linear infinite',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Battle Indicator */}
                {sector.playersInBattle > 0 && (
                  <circle
                    cx={sector.x}
                    cy={sector.y}
                    r="0.25"
                    fill="#ff3b3b"
                    opacity="0.8"
                    style={{
                      animation: 'pulse 2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredSector && (
          <div
            style={{
              position: 'fixed',
              left: `${tooltipPos.x + 20}px`,
              top: `${tooltipPos.y - 10}px`,
              background: 'var(--bg-panel)',
              border: `1px solid ${getFactionColor(hoveredSector.controlledBy)}`,
              borderRadius: '2px',
              padding: '10px',
              maxWidth: '200px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'Orbitron',
              zIndex: 1000,
              boxShadow: `0 0 10px ${getFactionColor(hoveredSector.controlledBy)}40`,
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 'bold', color: getFactionColor(hoveredSector.controlledBy), marginBottom: '5px' }}>
              {hoveredSector.name}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Sector {hoveredSector.id}
            </div>
            <div style={{ marginBottom: '5px' }}>
              Controlled by <span style={{ color: getFactionColor(hoveredSector.controlledBy) }}>
                {getFactionName(hoveredSector.controlledBy)}
              </span>
            </div>
            {hoveredSector.playersInBattle > 0 && (
              <div style={{ color: '#ff3b3b', marginBottom: '5px' }}>
                Players in battle: {hoveredSector.playersInBattle}
              </div>
            )}
            {hoveredSector.contested && (
              <div style={{ color: '#ffc93b' }}>
                Contested
              </div>
            )}
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </HoloPanel>
  );
}
