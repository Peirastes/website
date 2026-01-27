import React, { useState } from 'react'
import { HoloPanel, Button, ProgressBar } from '../components/ui/index.jsx'
import WarMap from '../components/game/WarMap.jsx'
import SectorDetails from '../components/game/SectorDetails.jsx'
import ArmyLoadout from '../components/game/ArmyLoadout'
import CharacterStats from '../components/game/CharacterStats'
import BattleSimulator from '../components/game/BattleSimulator'
import ClanPanel from '../components/game/ClanPanel'
import { UNIT_CHASSIS } from '../data/gameData.js'

export function MainGame({
  player,
  updatePlayer,
  sectors,
  addNotification,
}) {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedSector, setSelectedSector] = useState(null)
  const [activeBattle, setActiveBattle] = useState(null)
  const [battleActive, setBattleActive] = useState(false)

  // Handler for selecting a sector from the map
  const handleSelectSector = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId)
    setSelectedSector(sector || null)
  }

  // Handler for joining battle
  const handleJoinBattle = () => {
    if (!selectedSector || !player) {
      addNotification('Unable to join battle')
      return
    }

    // Get player's active loadout
    const loadout = player.loadouts?.[player.activeLoadout]
    if (!loadout || !loadout.units || loadout.units.length === 0) {
      addNotification('No active loadout. Please configure your army.')
      return
    }

    // Resolve unit IDs to full unit objects
    const unitObjects = loadout.units.map(unitId => {
      return Object.values(UNIT_CHASSIS).find(u => u.id === unitId)
    }).filter(u => u !== undefined)

    // Set battle state
    setActiveBattle({
      sector: selectedSector,
      loadout: unitObjects,
      active: true,
    })
    setBattleActive(true)
    addNotification('Entering battle...')
  }

  // Handler for battle end
  const handleBattleEnd = (victory, rewards) => {
    if (victory && rewards) {
      // Victory: add XP and credits
      const newXP = (player.xp || 0) + rewards.xp
      const newCredits = (player.credits || 0) + rewards.credits

      // Calculate level ups
      const baseXPPerLevel = player.xpToNext || 1000
      const newLevel = Math.floor(newXP / baseXPPerLevel) + 1
      const levelUps = newLevel - (player.level || 1)

      updatePlayer({
        xp: newXP,
        credits: newCredits,
        level: newLevel,
      })

      addNotification(`Victory! Earned ${rewards.xp} XP and ${rewards.credits} credits`)
    } else {
      // Defeat: add minimal XP (100 XP)
      const newXP = (player.xp || 0) + 100
      updatePlayer({
        xp: newXP,
      })
      addNotification('Battle lost. Earned 100 XP')
    }

    // Reset battle state
    setBattleActive(false)
    setActiveBattle(null)
    setActiveTab(0) // Stay on War Map tab
  }

  // Handler for returning to map
  const handleReturnToMap = () => {
    setBattleActive(false)
    setActiveBattle(null)
    setActiveTab(0) // War Map tab
  }

  const tabs = ['WAR MAP', 'ARMY', 'STATS', 'CLAN']

  // Get faction color dynamically
  const factionColor = player?.faction?.color || '#00ff9f'

  // Portrait emoji options
  const portraitOptions = ['🎖️', '👨‍💼', '👩‍💼', '🤖', '🧑‍🚀', '👨‍✈️', '👩‍✈️', '🕵️']
  const portraitEmoji = portraitOptions[player?.appearance?.portraitIndex || 0]

  return (
    <div style={styles.mainContainer}>
      {/* ============================================
          PLAYER STATUS BAR (TOP SECTION)
          ============================================ */}
      <div style={{
        ...styles.playerStatusBar,
        backgroundColor: 'var(--bg-medium)',
      }}>
        {/* Left side: Portrait and player info */}
        <div style={styles.playerInfoLeft}>
          <div style={styles.portraitEmoji}>
            {portraitEmoji}
          </div>
          <div style={styles.playerDetails}>
            <div style={{
              ...styles.playerName,
              color: factionColor,
            }}>
              {player?.name || 'COMMANDER'}
            </div>
            <div style={{
              ...styles.playerFaction,
              color: factionColor,
            }}>
              {player?.faction?.name || 'UNASSIGNED'}
            </div>
            <div style={styles.playerLevel}>
              LEVEL {player?.level || 1}
            </div>
          </div>
        </div>

        {/* Middle section: Experience */}
        <div style={styles.experienceSection}>
          <ProgressBar
            value={player?.xp || 0}
            max={player?.xpToNext || 1000}
            color={factionColor}
            height={16}
            label="EXPERIENCE"
          />
        </div>

        {/* Right side: Resources and stats */}
        <div style={styles.resourcesRight}>
          <div style={styles.resourceItem}>
            <span style={{ color: '#ffc93b' }}>
              CREDITS: {player?.credits || 0} ¢
            </span>
          </div>
          <div style={styles.resourceItem}>
            <span style={{ color: '#00ff9f' }}>
              RESOURCES: {player?.resources || 0}
            </span>
          </div>
          <div style={{
            ...styles.resourceItem,
            color: (player?.statPoints || 0) > 0 ? '#ff3b3b' : '#3b9fff',
          }}>
            <span>
              STAT POINTS: {player?.statPoints || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================
          TAB NAVIGATION BAR
          ============================================ */}
      <div style={{
        ...styles.tabNavigation,
        borderBottomColor: `${factionColor}40`,
      }}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            onClick={() => {
              // Only allow switching to War Map tab during battle
              if (battleActive && index !== 0) {
                return
              }
              setActiveTab(index)
            }}
            style={{
              ...styles.tab,
              borderBottomColor: activeTab === index ? factionColor : 'transparent',
              color: activeTab === index ? factionColor : 'var(--text-secondary)',
              opacity: battleActive && index !== 0 ? 0.5 : 1,
              cursor: battleActive && index !== 0 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== index && !(battleActive && index !== 0)) {
                e.target.style.color = factionColor
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== index) {
                e.target.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* ============================================
          MAIN CONTENT AREA
          ============================================ */}
      <div style={styles.mainContent}>
        {/* BATTLE SIMULATOR - REPLACES ALL CONTENT DURING BATTLE */}
        {battleActive && activeBattle && (
          <BattleSimulator
            sector={activeBattle.sector}
            loadout={activeBattle.loadout}
            player={player}
            onBattleEnd={handleBattleEnd}
            onReturnToMap={handleReturnToMap}
            addNotification={addNotification}
          />
        )}

        {/* NORMAL GAME INTERFACE - SHOWN WHEN NOT IN BATTLE */}
        {!battleActive && (
          <>
            {/* WAR MAP TAB */}
            {activeTab === 0 && (
          <div style={styles.warMapContainer}>
            {/* Left side: War Map */}
            <div style={styles.warMapLeft}>
              <WarMap
                sectors={sectors}
                selectedSector={selectedSector}
                onSelectSector={handleSelectSector}
                playerFaction={player?.faction}
              />
            </div>

            {/* Divider */}
            <div style={{
              ...styles.warMapDivider,
              borderColor: `${factionColor}40`,
            }} />

            {/* Right side: Sector Details */}
            <div style={styles.warMapRight}>
              <SectorDetails
                sector={selectedSector}
                player={player}
                onJoinBattle={handleJoinBattle}
              />
            </div>
          </div>
        )}

        {/* ARMY TAB */}
        {activeTab === 1 && (
          <ArmyLoadout
            player={player}
            updatePlayer={updatePlayer}
            addNotification={addNotification}
          />
        )}

        {/* STATS TAB */}
        {activeTab === 2 && (
          <CharacterStats
            player={player}
            updatePlayer={updatePlayer}
            addNotification={addNotification}
          />
        )}

            {/* CLAN TAB */}
            {activeTab === 3 && (
              <ClanPanel
                player={player}
                updatePlayer={updatePlayer}
                addNotification={addNotification}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// STYLES
// ============================================
const styles = {
  mainContainer: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-dark)',
    fontFamily: "'Orbitron', monospace",
    overflow: 'hidden',
  },

  playerStatusBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '20px',
    height: 'auto',
    minHeight: '100px',
    gap: '30px',
  },

  playerInfoLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '15px',
    flex: '0 0 auto',
  },

  portraitEmoji: {
    fontSize: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50px',
    height: '50px',
    textShadow: '0 0 10px rgba(0, 255, 159, 0.3)',
  },

  playerDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  playerName: {
    fontSize: '16px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    textShadow: '0 0 10px rgba(0, 255, 159, 0.2)',
  },

  playerFaction: {
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '1px',
  },

  playerLevel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    letterSpacing: '1px',
    fontWeight: '500',
  },

  experienceSection: {
    flex: '1 0 auto',
    minWidth: '200px',
    maxWidth: '400px',
  },

  resourcesRight: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '20px',
    flex: '0 0 auto',
    flexWrap: 'wrap',
  },

  resourceItem: {
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
    textShadow: '0 0 8px rgba(0, 255, 159, 0.2)',
  },

  tabNavigation: {
    backgroundColor: 'var(--bg-dark)',
    display: 'flex',
    flexDirection: 'row',
    padding: '0 20px',
    borderBottom: '1px solid',
    height: '50px',
    alignItems: 'stretch',
    gap: '0',
  },

  tab: {
    padding: '15px 20px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontSize: '12px',
    fontFamily: "'Orbitron', monospace",
    fontWeight: 'bold',
    cursor: 'pointer',
    borderBottom: '2px solid',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
  },

  mainContent: {
    flex: '1',
    padding: '20px',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  warMapContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    height: '100%',
    width: '100%',
  },

  warMapLeft: {
    flex: '2',
    minWidth: '0',
    display: 'flex',
    flexDirection: 'column',
  },

  warMapRight: {
    flex: '1',
    minWidth: '0',
    display: 'flex',
    flexDirection: 'column',
  },

  warMapDivider: {
    width: '1px',
    backgroundColor: 'transparent',
    borderLeft: '1px solid',
  },
}
