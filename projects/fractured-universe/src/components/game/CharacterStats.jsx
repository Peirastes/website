import React, { useState } from 'react'
import { HoloPanel, Button, ProgressBar } from '../ui/index.jsx'
import { STATS, DIVISIONS } from '../../data/gameData.js'

export default function CharacterStats({ player, updatePlayer, addNotification }) {
  // ============================================
  // HANDLERS
  // ============================================

  const handleIncrementStat = (statKey) => {
    if (player.statPoints <= 0) {
      addNotification('No stat points available', 'error')
      return
    }

    const newStats = { ...player.stats }
    newStats[statKey] = (newStats[statKey] || 5) + 1
    const newStatPoints = player.statPoints - 1

    updatePlayer({
      stats: newStats,
      statPoints: newStatPoints,
    })

    addNotification(`${STATS[Object.keys(STATS).find(k => STATS[k].id === statKey)].name} increased`, 'success')
  }

  const handleDecrementStat = (statKey) => {
    const currentValue = player.stats[statKey] || 5
    if (currentValue <= 5) {
      addNotification('Minimum stat value reached', 'error')
      return
    }

    const newStats = { ...player.stats }
    newStats[statKey] = currentValue - 1
    const newStatPoints = player.statPoints + 1

    updatePlayer({
      stats: newStats,
      statPoints: newStatPoints,
    })

    addNotification(`${STATS[Object.keys(STATS).find(k => STATS[k].id === statKey)].name} decreased`, 'success')
  }

  const handleIncreaseMastery = (divisionId) => {
    if (player.statPoints <= 0) {
      addNotification('No stat points available', 'error')
      return
    }

    const newDivisionLevels = { ...player.divisionLevels }
    newDivisionLevels[divisionId] = (newDivisionLevels[divisionId] || 1) + 1
    const newStatPoints = player.statPoints - 1

    updatePlayer({
      divisionLevels: newDivisionLevels,
      statPoints: newStatPoints,
    })

    const divisionName = Object.values(DIVISIONS).find(d => d.id === divisionId)?.name || divisionId
    addNotification(`${divisionName} mastery increased to level ${newDivisionLevels[divisionId]}`, 'success')
  }

  // ============================================
  // RENDER: STAT EFFECT BONUSES
  // ============================================

  const getStatBonuses = (statId, value) => {
    switch (statId) {
      case 'tactics':
        return `Unit Capacity: ${6 + Math.floor(value / 2)} / 12`
      case 'clout':
        return `Capture Effectiveness: +${value * 5}%`
      case 'education':
        return `Equipment Quality: +${value * 3}%`
      case 'mechApt':
        return `Weight Capacity: +${value * 10}%`
      default:
        return ''
    }
  }

  // ============================================
  // RENDER: STAT CARD
  // ============================================

  const renderStatCard = (statId) => {
    const stat = STATS[Object.keys(STATS).find(k => STATS[k].id === statId)]
    if (!stat) return null

    const currentValue = player.stats[statId] || 5
    const canDecrement = currentValue > 5
    const canIncrement = player.statPoints > 0

    return (
      <HoloPanel
        key={statId}
        glow="#00ff9f"
        style={{
          flex: '1 1 calc(50% - 10px)',
          minWidth: '250px',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontSize: '24px' }}>{stat.icon}</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00ff9f' }}>
            {stat.name}
          </div>
        </div>

        {/* Current Value */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ff9f' }}>
            {currentValue}
          </div>
          <div style={{ fontSize: '12px', color: '#8899aa', marginTop: '4px' }}>
            Current Level
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: '12px', color: '#8899aa', textAlign: 'center' }}>
          {stat.description}
        </div>

        {/* Progress Bar */}
        <ProgressBar
          value={currentValue - 5}
          max={20}
          color="#00ff9f"
          height={15}
        />

        {/* Control Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Button
            variant="danger"
            onClick={() => handleDecrementStat(statId)}
            disabled={!canDecrement}
            style={{
              width: '30px',
              padding: '8px',
              fontSize: '14px',
              opacity: !canDecrement ? 0.5 : 1,
            }}
          >
            -
          </Button>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ff9f', minWidth: '40px', textAlign: 'center' }}>
            {currentValue}
          </div>
          <Button
            variant="primary"
            onClick={() => handleIncrementStat(statId)}
            disabled={!canIncrement}
            style={{
              width: '30px',
              padding: '8px',
              fontSize: '14px',
              opacity: !canIncrement ? 0.5 : 1,
            }}
          >
            +
          </Button>
        </div>

        {/* Stat Effect Bonuses */}
        <div style={{ fontSize: '12px', color: '#8899aa', textAlign: 'center', marginTop: '8px' }}>
          {getStatBonuses(statId, currentValue)}
        </div>
      </HoloPanel>
    )
  }

  // ============================================
  // RENDER: DIVISION MASTERY CARD
  // ============================================

  const renderDivisionCard = (divisionId) => {
    const division = Object.values(DIVISIONS).find(d => d.id === divisionId)
    if (!division) return null

    const masteryLevel = player.divisionLevels[divisionId] || 1
    const canUpgrade = player.statPoints > 0

    return (
      <HoloPanel
        key={divisionId}
        glow="#3b9fff"
        style={{
          flex: '1 1 calc(25% - 10px)',
          minWidth: '180px',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: '32px', textAlign: 'center' }}>
          {division.icon}
        </div>

        {/* Division Name */}
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00ff9f', textAlign: 'center' }}>
          {division.name}
        </div>

        {/* Level Display */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ffff' }}>
            LEVEL {masteryLevel}
          </div>
          <div style={{ fontSize: '12px', color: '#8899aa', marginTop: '4px' }}>
            TIER {masteryLevel} UNITS AVAILABLE
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          value={masteryLevel}
          max={10}
          color="#3b9fff"
          height={12}
        />

        {/* Upgrade Button */}
        <Button
          variant="secondary"
          onClick={() => handleIncreaseMastery(divisionId)}
          disabled={!canUpgrade}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '12px',
            opacity: !canUpgrade ? 0.5 : 1,
          }}
        >
          Increase Mastery
        </Button>
      </HoloPanel>
    )
  }

  // ============================================
  // RENDER: ALLOCATION TIPS
  // ============================================

  const renderTipsPanel = () => {
    const tips = [
      'Tactics increases squad size capacity',
      'Clout improves capture effectiveness',
      'Education enhances unit equipment',
      'Mech Aptitude increases unit weight capacity',
      'Each division mastery level unlocks new unit tiers',
    ]

    return (
      <HoloPanel
        glow="#00ff9f"
        style={{
          padding: '15px',
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#00ff9f', marginBottom: '10px', letterSpacing: '1px' }}>
          ALLOCATION TIPS
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tips.map((tip, index) => (
            <li key={index} style={{ fontSize: '11px', color: '#8899aa', lineHeight: '1.4' }}>
              {tip}
            </li>
          ))}
        </ul>
      </HoloPanel>
    )
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  const statPointsColor = player.statPoints > 0 ? '#00ff9f' : '#8899aa'

  return (
    <HoloPanel
      glow="#3b9fff"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px',
        gap: '20px',
      }}
    >
      {/* Header Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ff9f', letterSpacing: '1px' }}>
          CHARACTER STATISTICS
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: statPointsColor, letterSpacing: '1px' }}>
          STAT POINTS AVAILABLE: {player.statPoints}
        </div>
        {player.statPoints === 0 && (
          <div style={{ fontSize: '12px', color: '#ffc93b', fontStyle: 'italic' }}>
            Allocate points to progress
          </div>
        )}
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {Object.keys(STATS).map((key) => renderStatCard(STATS[key].id))}
      </div>

      {/* Division Mastery Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff9f', letterSpacing: '1px', marginBottom: '4px' }}>
            DIVISION MASTERY
          </div>
          <div style={{ fontSize: '12px', color: '#8899aa' }}>
            Unlock higher tier units by increasing mastery levels
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {Object.values(DIVISIONS).map((division) => renderDivisionCard(division.id))}
        </div>
      </div>

      {/* Tips Panel */}
      {renderTipsPanel()}
    </HoloPanel>
  )
}
