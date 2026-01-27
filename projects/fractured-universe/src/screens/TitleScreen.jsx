import React, { useState, useEffect } from 'react'
import { GlitchText, Button } from '../components/ui/index.jsx'

export function TitleScreen({ onStart }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // Generate 20 floating particles in faction colors
    const newParticles = Array.from({ length: 20 }, (_, i) => {
      const factionColors = ['#ff3b3b', '#3b9fff', '#ffc93b'] // crimson, azure, golden
      const randomColor = factionColors[i % 3]

      return {
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        color: randomColor,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 2,
      }
    })

    setParticles(newParticles)
  }, [])

  return (
    <div style={styles.container}>
      <style>{keyframeAnimations}</style>

      {/* Gradient background */}
      <div style={styles.gradientBackground} />

      {/* Animated grid background */}
      <div style={styles.gridBackground} />

      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            ...styles.particle,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            backgroundColor: particle.color,
            animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
          }}
        />
      ))}

      {/* Content container */}
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          TACTICAL COMMAND INTERFACE
        </div>

        {/* Title with GlitchText */}
        <div style={styles.titleContainer}>
          <GlitchText style={styles.title}>
            FRACTURED
          </GlitchText>
        </div>

        {/* Subtitle */}
        <div style={styles.subtitle}>
          UNIVERSE
        </div>

        {/* Description */}
        <p style={styles.description}>
          Three factions wage eternal war for control of fractured space.
          Command your forces, dominate the battlefield, and claim victory
          in this tactical command interface.
        </p>

        {/* Initialize button */}
        <Button
          onClick={onStart}
          variant="primary"
          style={styles.button}
        >
          INITIALIZE COMMAND
        </Button>
      </div>

      {/* Faction indicators at bottom */}
      <div style={styles.factionIndicators}>
        <div style={{
          ...styles.factionIndicator,
          borderTopColor: '#ff3b3b',
        }}>
          <div style={{ ...styles.factionDot, backgroundColor: '#ff3b3b' }} />
          <span>CRIMSON</span>
        </div>
        <div style={{
          ...styles.factionIndicator,
          borderTopColor: '#3b9fff',
        }}>
          <div style={{ ...styles.factionDot, backgroundColor: '#3b9fff' }} />
          <span>AZURE</span>
        </div>
        <div style={{
          ...styles.factionIndicator,
          borderTopColor: '#ffc93b',
        }}>
          <div style={{ ...styles.factionDot, backgroundColor: '#ffc93b' }} />
          <span>GOLDEN</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Orbitron', monospace",
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #050810 0%, #0a0f18 50%, #050810 100%)',
    zIndex: 0,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `
      linear-gradient(0deg, transparent 24%, rgba(0, 255, 159, 0.05) 25%, rgba(0, 255, 159, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 159, 0.05) 75%, rgba(0, 255, 159, 0.05) 76%, transparent 77%, transparent),
      linear-gradient(90deg, transparent 24%, rgba(0, 255, 159, 0.05) 25%, rgba(0, 255, 159, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 159, 0.05) 75%, rgba(0, 255, 159, 0.05) 76%, transparent 77%, transparent)
    `,
    backgroundSize: '50px 50px',
    animation: 'gridShift 20s linear infinite',
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    opacity: 0.6,
    filter: 'blur(1px)',
    zIndex: 2,
    boxShadow: '0 0 10px currentColor',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  header: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '3px',
    color: '#8899aa',
    textTransform: 'uppercase',
    textShadow: '0 0 10px rgba(0, 255, 159, 0.3)',
    marginBottom: '10px',
  },
  titleContainer: {
    position: 'relative',
  },
  title: {
    fontSize: '72px',
    fontWeight: '900',
    letterSpacing: '4px',
    color: '#ffffff',
    textTransform: 'uppercase',
    textShadow: `
      0 0 20px rgba(0, 255, 159, 0.5),
      0 0 40px rgba(59, 159, 255, 0.3)
    `,
  },
  subtitle: {
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#3b9fff',
    textTransform: 'uppercase',
    textShadow: '0 0 15px rgba(59, 159, 255, 0.6)',
    marginTop: '10px',
    marginBottom: '20px',
  },
  description: {
    fontSize: '14px',
    color: '#8899aa',
    letterSpacing: '1px',
    lineHeight: '1.6',
    maxWidth: '500px',
    marginBottom: '30px',
    fontWeight: '500',
  },
  button: {
    padding: '14px 40px',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '2px',
  },
  factionIndicators: {
    position: 'absolute',
    bottom: '30px',
    display: 'flex',
    gap: '40px',
    zIndex: 10,
  },
  factionIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#8899aa',
    textTransform: 'uppercase',
    borderTop: '2px solid',
    paddingTop: '8px',
    paddingLeft: '8px',
    paddingRight: '8px',
  },
  factionDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor',
  },
}

const keyframeAnimations = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) translateX(0px);
      opacity: 0.6;
    }
    25% {
      transform: translateY(-30px) translateX(15px);
      opacity: 0.8;
    }
    50% {
      transform: translateY(-50px) translateX(-20px);
      opacity: 0.4;
    }
    75% {
      transform: translateY(-30px) translateX(10px);
      opacity: 0.8;
    }
  }

  @keyframes gridShift {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 50px 50px;
    }
  }
`
