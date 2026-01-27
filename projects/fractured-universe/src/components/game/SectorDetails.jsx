import React from 'react'
import { HoloPanel, Button } from '../ui/index.jsx'
import { FACTIONS } from '../../data/gameData.js'

export default function SectorDetails({ sector, player, onJoinBattle }) {
  // Get faction details from FACTIONS object
  const getFactionData = (factionId) => {
    return Object.values(FACTIONS).find(f => f.id === factionId)
  }

  // Get faction icon emoji based on faction ID
  const getFactionIcon = (factionId) => {
    const iconMap = {
      'crimson': '⚔️',
      'azure': '🔬',
      'golden': '💎',
    }
    return iconMap[factionId] || '⚔️'
  }

  // Empty state when no sector selected
  if (!sector) {
    return (
      <HoloPanel glow="#00ff9f" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '10px' }}>
          SELECT A SECTOR
        </div>
        <div style={{ fontSize: '14px', color: '#8899aa' }}>
          Click on a sector on the war map to view details
        </div>
      </HoloPanel>
    )
  }

  const controllingFaction = getFactionData(sector.controlledBy)
  const glowColor = controllingFaction?.color || '#00ff9f'

  return (
    <HoloPanel glow={glowColor} style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Header Section */}
      <div style={{
        borderBottom: `1px solid ${glowColor}40`,
        paddingBottom: '20px',
        marginBottom: '20px',
      }}>
        {/* Sector Name */}
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: glowColor,
          marginBottom: '5px',
          textShadow: `0 0 10px ${glowColor}`,
        }}>
          {sector.name}
        </div>

        {/* Sector ID */}
        <div style={{ fontSize: '12px', color: '#8899aa', marginBottom: '15px' }}>
          SECTOR #{sector.id}
        </div>

        {/* Status Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {sector.isCapitol && (
            <div style={{
              background: '#ff3b3b',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              CAPITOL
            </div>
          )}
          {sector.contested && (
            <div style={{
              background: '#ffc93b',
              color: '#050810',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              CONTESTED
            </div>
          )}
          {sector.controlledBy === player?.faction?.id && (
            <div style={{
              background: '#00ff9f',
              color: '#050810',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              YOUR FACTION
            </div>
          )}
        </div>
      </div>

      {/* Control Information Card */}
      <div style={{ marginBottom: '20px' }}>
        <HoloPanel glow={glowColor} style={{ padding: '15px' }}>
          <div style={{
            fontSize: '12px',
            color: '#8899aa',
            marginBottom: '10px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            CONTROLLED BY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontSize: '20px',
                color: glowColor,
                fontWeight: 'bold',
                marginBottom: '10px',
              }}>
                {controllingFaction?.name || 'Unknown'}
              </div>
              {sector.controlledBy === player?.faction?.id && (
                <div style={{
                  background: '#00ff9f',
                  color: '#050810',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                }}>
                  YOUR FACTION
                </div>
              )}
            </div>
            <div style={{ fontSize: '2em' }}>
              {getFactionIcon(sector.controlledBy)}
            </div>
          </div>
        </HoloPanel>
      </div>

      {/* Stats Grid (2x2) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '20px',
      }}>
        {/* Card 1: Points of Contention */}
        <HoloPanel glow="#00ff9f" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#00ff9f',
            marginBottom: '5px',
            textShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
          }}>
            {sector.pocCount}
          </div>
          <div style={{ fontSize: '12px', color: '#8899aa' }}>
            PoC to capture
          </div>
        </HoloPanel>

        {/* Card 2: Players In Battle */}
        <HoloPanel glow="#00ff9f" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#00ff9f',
            marginBottom: '5px',
            textShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
          }}>
            {sector.playersInBattle}
          </div>
          <div style={{ fontSize: '12px', color: '#8899aa' }}>
            Active combatants
          </div>
        </HoloPanel>

        {/* Card 3: Resource Value */}
        <HoloPanel glow="#00ff9f" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#00ff9f',
            marginBottom: '5px',
            textShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
          }}>
            {sector.resources} CR
          </div>
          <div style={{ fontSize: '12px', color: '#8899aa' }}>
            Battle reward
          </div>
        </HoloPanel>

        {/* Card 4: Battle Timer */}
        <HoloPanel glow="#00ff9f" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#00ff9f',
            marginBottom: '5px',
            textShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
          }}>
            15:00
          </div>
          <div style={{ fontSize: '12px', color: '#8899aa' }}>
            Time remaining
          </div>
        </HoloPanel>
      </div>

      {/* Recent Activity Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#00ff9f',
          marginBottom: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontWeight: 'bold',
        }}>
          RECENT ACTIVITY
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{
            fontSize: '12px',
            color: '#8899aa',
            fontFamily: 'monospace',
            padding: '5px 0',
          }}>
            [14:52] Alpha Squad captured PoC-2
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8899aa',
            fontFamily: 'monospace',
            padding: '5px 0',
          }}>
            [14:48] Enemy reinforcements arrived
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8899aa',
            fontFamily: 'monospace',
            padding: '5px 0',
          }}>
            [14:45] Initial assault begins
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{
        borderTop: `1px solid ${glowColor}40`,
        paddingTop: '20px',
      }}>
        {sector.isCapitol ? (
          <div style={{
            color: '#8899aa',
            textAlign: 'center',
            fontSize: '14px',
          }}>
            Capitol sectors cannot be attacked
          </div>
        ) : (
          <Button
            onClick={onJoinBattle}
            variant={sector.controlledBy === player?.faction?.id ? 'warning' : 'danger'}
            style={{
              width: '100%',
              padding: '12px',
            }}
          >
            {sector.controlledBy === player?.faction?.id ? 'DEFEND SECTOR' : 'ATTACK SECTOR'}
          </Button>
        )}
      </div>
    </HoloPanel>
  )
}
