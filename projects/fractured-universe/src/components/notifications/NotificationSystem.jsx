import React, { useState, useEffect } from 'react'
import { HoloPanel } from '../ui/index'

// ============================================
// NOTIFICATION SYSTEM
// ============================================

/**
 * NotificationSystem - Toast notification component
 *
 * Props:
 * - notifications: Array of notification objects
 *   - id: unique identifier (typically timestamp)
 *   - message: string message to display
 *   - type: 'info' | 'success' | 'warning' | 'error'
 *   - duration: optional, milliseconds before auto-dismiss (default: 3000)
 * - onRemove: Callback function(notificationId) to remove a notification
 */
export default function NotificationSystem({ notifications = [], onRemove = () => {} }) {
  // Notification type to color mapping
  const notificationColors = {
    info: '#3b9fff',
    success: '#00ff9f',
    warning: '#ffc93b',
    error: '#ff3b3b',
  }

  // Notification type to icon mapping
  const notificationIcons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto',
      }}
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          color={notificationColors[notification.type] || notificationColors.info}
          icon={notificationIcons[notification.type] || notificationIcons.info}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// ============================================
// TOAST COMPONENT
// ============================================
function Toast({ notification, color, icon, onRemove }) {
  const [isExiting, setIsExiting] = useState(false)
  const duration = notification.duration || 3000

  // Auto-dismiss timeout
  useEffect(() => {
    if (duration <= 0) return

    const timeout = setTimeout(() => {
      setIsExiting(true)
      // Allow animation to complete before removing
      setTimeout(() => {
        onRemove(notification.id)
      }, 300)
    }, duration)

    return () => clearTimeout(timeout)
  }, [notification.id, duration, onRemove])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(notification.id)
    }, 300)
  }

  return (
    <div
      style={{
        animation: isExiting
          ? 'toastExit 0.3s ease-in forwards'
          : 'toastEnter 0.3s ease-out forwards',
        transformOrigin: 'right center',
      }}
    >
      <style>{`
        @keyframes toastEnter {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toastExit {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(20px);
          }
        }
      `}</style>

      <HoloPanel
        glow={color}
        style={{
          minWidth: '300px',
          maxWidth: '380px',
          padding: '15px',
          display: 'flex',
          flexDirection: 'row',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        {/* Message Content */}
        <div
          style={{
            flex: 1,
            fontSize: '14px',
            color: '#ffffff',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            textShadow: `0 0 10px ${color}40`,
          }}
        >
          <span style={{ marginRight: '8px' }}>{icon}</span>
          {notification.message}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: color,
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '0',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'opacity 0.2s ease',
            textShadow: `0 0 10px ${color}40`,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '0.7'
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1'
          }}
          title="Close notification"
        >
          ×
        </button>
      </HoloPanel>
    </div>
  )
}
