import { useState, useEffect } from 'react'
import { TitleScreen } from './screens/TitleScreen'
import { CharacterCreate } from './screens/CharacterCreate'
import { MainGame } from './screens/MainGame'
import { usePlayer } from './hooks/usePlayer'
import { generateSectors, FACTIONS, DIVISIONS } from './data/gameData'
import { CRTOverlay } from './components/ui/index.jsx'
import NotificationSystem from './components/notifications/NotificationSystem'

export default function App() {
  // Game state management
  const [gameState, setGameState] = useState('title')
  const { player, updatePlayer } = usePlayer()
  const [sectors, setSectors] = useState([])
  const [notifications, setNotifications] = useState([])

  // Initialize sectors on component mount
  useEffect(() => {
    const generatedSectors = generateSectors()
    setSectors(generatedSectors)
  }, [])

  // Navigation Functions
  const handleStartGame = () => {
    setGameState('characterCreate')
  }

  const handleCharacterCreate = (characterData) => {
    // Get the faction and division objects
    const faction = Object.values(FACTIONS).find(f => f.id === characterData.faction)
    const division = Object.values(DIVISIONS).find(d => d.id === characterData.division)

    // Update player with character data
    updatePlayer({
      name: characterData.callsign,
      faction: faction,
      division: division,
      appearance: {
        portraitIndex: characterData.portraitIndex,
      },
    })

    // Transition to main game
    setGameState('mainGame')
  }

  const handleCharacterCancel = () => {
    setGameState('title')
  }

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
    }
    setNotifications(prev => [...prev, notification])
    // Auto-remove after 3 seconds (Phase 6)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleScreen onStart={handleStartGame} />
      )}

      {/* Character Creation Screen */}
      {gameState === 'characterCreate' && (
        <CharacterCreate
          onComplete={handleCharacterCreate}
          onCancel={handleCharacterCancel}
        />
      )}

      {/* Main Game Screen */}
      {gameState === 'mainGame' && player && (
        <MainGame
          player={player}
          updatePlayer={updatePlayer}
          sectors={sectors}
          addNotification={addNotification}
        />
      )}

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />

      {/* CRT Overlay for scanline effect */}
      <CRTOverlay />
    </div>
  )
}
