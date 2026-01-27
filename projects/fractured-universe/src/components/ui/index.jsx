import React, { useState, useEffect } from 'react'

// ============================================
// HOLO PANEL
// ============================================
export function HoloPanel({ children, style, glow = '#00ff9f' }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(10,15,20,0.95), rgba(5,8,12,0.98))',
        border: `1px solid ${glow}40`,
        borderRadius: '2px',
        boxShadow: `0 0 20px ${glow}40, inset 0 0 20px ${glow}10`,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${glow}, transparent)`,
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  )
}

// ============================================
// BUTTON
// ============================================
export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  style,
  ...props
}) {
  const variantStyles = {
    primary: {
      background: '#00ff9f',
      color: '#050810',
      boxShadow: '0 0 15px rgba(0, 255, 159, 0.5)',
      border: '1px solid #00ff9f',
    },
    danger: {
      background: '#ff3b3b',
      color: '#ffffff',
      boxShadow: '0 0 15px rgba(255, 59, 59, 0.5)',
      border: '1px solid #ff3b3b',
    },
    secondary: {
      background: '#3b9fff',
      color: '#ffffff',
      boxShadow: '0 0 15px rgba(59, 159, 255, 0.5)',
      border: '1px solid #3b9fff',
    },
    warning: {
      background: '#ffc93b',
      color: '#050810',
      boxShadow: '0 0 15px rgba(255, 201, 59, 0.5)',
      border: '1px solid #ffc93b',
    },
  }

  const disabledStyle = disabled ? {
    background: '#556677',
    color: '#8899aa',
    boxShadow: 'none',
    border: '1px solid #556677',
    cursor: 'not-allowed',
    opacity: 0.6,
  } : {}

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        fontSize: '14px',
        fontFamily: 'Orbitron',
        fontWeight: '700',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...variantStyles[variant],
        ...disabledStyle,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.opacity = '0.8'
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.opacity = '1'
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ============================================
// PROGRESS BAR
// ============================================
export function ProgressBar({
  value,
  max,
  color = '#00ff9f',
  height = 20,
  label,
}) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div style={{ marginBottom: '10px' }}>
      {label && (
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '4px',
          letterSpacing: '1px',
        }}>
          {label}
        </div>
      )}
      <div
        style={{
          background: 'var(--bg-medium)',
          border: `1px solid ${color}40`,
          borderRadius: '1px',
          height: `${height}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            height: '100%',
            width: `${percentage}%`,
            boxShadow: `0 0 10px ${color}`,
            transition: 'width 0.3s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 'bold',
            textShadow: `0 0 5px ${color}`,
            pointerEvents: 'none',
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  )
}

// ============================================
// GLITCH TEXT
// ============================================
export function GlitchText({ children, style }) {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 100)
    }, 3000 + Math.random() * 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <span
      style={{
        display: 'inline-block',
        textShadow: isGlitching
          ? `-2px 0 #ff3b3b, 2px 0 #3b9fff, 0 0 10px rgba(0, 255, 159, 0.5)`
          : 'none',
        transform: isGlitching ? 'skewX(-5deg)' : 'skewX(0deg)',
        transition: isGlitching ? 'none' : 'all 0.1s ease',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// ============================================
// CRT OVERLAY
// ============================================
export function CRTOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        )`,
        backgroundSize: '100% 2px',
        animation: 'scanlines 8s linear infinite',
      }}
    >
      <style>{`
        @keyframes scanlines {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 100px;
          }
        }
      `}</style>
    </div>
  )
}

// ============================================
// UNIT SPRITE
// ============================================
export function UnitSprite({ unit, size = 48, showLabel = false, style }) {
  const [imageError, setImageError] = useState(false)

  const spriteUrl = unit?.sprite
  const hasSpriteAsset = spriteUrl && !imageError

  if (hasSpriteAsset) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', ...style }}>
        <img
          src={spriteUrl}
          alt={unit?.name}
          style={{
            width: size,
            height: size,
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 159, 0.3))',
            borderRadius: '2px',
          }}
          onError={() => setImageError(true)}
        />
        {showLabel && (
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'Orbitron',
              color: '#8899aa',
              textAlign: 'center',
              maxWidth: size + 20,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {unit?.name}
          </span>
        )}
      </div>
    )
  }

  // Fallback to icon if sprite fails to load
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', ...style }}>
      <div
        style={{
          fontSize: size * 0.8,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 0 8px rgba(0, 255, 159, 0.3))',
        }}
      >
        {unit?.icon}
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: '12px',
            fontFamily: 'Orbitron',
            color: '#8899aa',
            textAlign: 'center',
            maxWidth: size + 20,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {unit?.name}
        </span>
      )}
    </div>
  )
}
