import React, { useState } from 'react'
import { HoloPanel, Button, ProgressBar } from '../ui/index.jsx'
import { UNIT_CHASSIS, DIVISIONS } from '../../data/gameData.js'

export default function ArmyLoadout({ player, updatePlayer, addNotification }) {
  const [viewMode, setViewMode] = useState('squad')
  const [activeFilter, setActiveFilter] = useState('infantry')

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const calculateMaxCapacity = () => {
    return Math.min(6 + Math.floor(player.stats.tactics / 2), 12)
  }

  const calculateCurrentCount = () => {
    return player.loadouts[player.activeLoadout].units.length
  }

  const calculateSquadStats = () => {
    const units = player.loadouts[player.activeLoadout].units
    if (units.length === 0) {
      return { totalHP: 0, totalDamage: 0, avgSpeed: 0 }
    }

    let totalHP = 0
    let totalDamage = 0
    let totalSpeed = 0

    units.forEach((unitId) => {
      const unit = getUnitById(unitId)
      if (unit) {
        totalHP += unit.hp
        totalDamage += unit.damage
        totalSpeed += unit.speed
      }
    })

    return {
      totalHP,
      totalDamage,
      avgSpeed: Math.round(totalSpeed / units.length),
    }
  }

  const getUnitById = (unitId) => {
    return Object.values(UNIT_CHASSIS).find(unit => unit.id === unitId)
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleTabClick = (index) => {
    updatePlayer({ activeLoadout: index })
  }

  const handleRemoveUnit = (unitId) => {
    const currentLoadout = player.loadouts[player.activeLoadout]
    const updatedUnits = currentLoadout.units.filter(id => id !== unitId)
    const updatedLoadouts = [...player.loadouts]
    updatedLoadouts[player.activeLoadout] = { ...currentLoadout, units: updatedUnits }
    updatePlayer({ loadouts: updatedLoadouts })
    addNotification('Unit removed', 'info')
  }

  const handleRecruit = (unitId, cost) => {
    const maxCapacity = calculateMaxCapacity()
    const currentCount = calculateCurrentCount()

    if (player.credits < cost) {
      addNotification('Insufficient credits', 'error')
      return
    }

    if (currentCount >= maxCapacity) {
      addNotification('Squad at capacity', 'error')
      return
    }

    const unit = getUnitById(unitId)
    const currentLoadout = player.loadouts[player.activeLoadout]
    const updatedUnits = [...currentLoadout.units, unitId]
    const updatedLoadouts = [...player.loadouts]
    updatedLoadouts[player.activeLoadout] = { ...currentLoadout, units: updatedUnits }

    updatePlayer({
      loadouts: updatedLoadouts,
      credits: player.credits - cost,
    })

    addNotification(`Recruited ${unit.name}`, 'success')
  }

  // ============================================
  // STYLES
  // ============================================

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid #00ff9f' : '2px solid transparent',
    color: isActive ? '#00ff9f' : '#8899aa',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Orbitron',
  })

  const inactiveTabStyle = {
    color: '#8899aa',
    borderBottom: '2px solid transparent',
  }

  // ============================================
  // RENDER: LOADOUT TABS
  // ============================================

  const renderLoadoutTabs = () => {
    const squadNames = ['ALPHA SQUAD', 'BETA SQUAD', 'GAMMA SQUAD']

    return (
      <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #00ff9f40' }}>
        {squadNames.map((name, index) => {
          const isActive = player.activeLoadout === index
          const unitCount = player.loadouts[index].units.length
          const maxCapacity = calculateMaxCapacity()

          return (
            <button
              key={index}
              onClick={() => handleTabClick(index)}
              style={tabStyle(isActive)}
            >
              <div>{name}</div>
              <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}>
                {unitCount} / {maxCapacity}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // ============================================
  // RENDER: VIEW TOGGLE
  // ============================================

  const renderViewToggle = () => {
    return (
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
          variant={viewMode === 'squad' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('squad')}
          style={{ flex: 1 }}
        >
          Squad View
        </Button>
        <Button
          variant={viewMode === 'shop' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('shop')}
          style={{ flex: 1 }}
        >
          Recruitment Shop
        </Button>
      </div>
    )
  }

  // ============================================
  // RENDER: UNIT LIST
  // ============================================

  const renderUnitList = () => {
    const units = player.loadouts[player.activeLoadout].units

    if (units.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#8899aa',
            fontSize: '14px',
            fontFamily: 'Orbitron',
          }}
        >
          <div style={{ marginBottom: '10px', fontSize: '24px' }}>⚠️</div>
          <div>No units recruited. Visit the RECRUITMENT SHOP to build your squad.</div>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {units.map((unitId) => {
          const unit = getUnitById(unitId)
          if (!unit) return null

          return (
            <div
              key={unitId + Math.random()}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr auto 1fr auto',
                gap: '15px',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(0, 255, 159, 0.05)',
                border: '1px solid #00ff9f30',
                borderRadius: '2px',
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: '40px', textAlign: 'center' }}>{unit.icon}</div>

              {/* Name and Level */}
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#00ff9f' }}>
                  {unit.name}
                </div>
                <div style={{ fontSize: '12px', color: '#8899aa' }}>LEVEL 1</div>
              </div>

              {/* Stats */}
              <div
                style={{
                  fontSize: '12px',
                  color: '#8899aa',
                  fontFamily: 'monospace',
                  textAlign: 'right',
                }}
              >
                HP: {unit.hp} | DMG: {unit.damage} | SPD: {unit.speed}
              </div>

              {/* Spacer */}
              <div />

              {/* Remove Button */}
              <Button
                variant="danger"
                onClick={() => handleRemoveUnit(unitId)}
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                Remove
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  // ============================================
  // RENDER: SQUAD SUMMARY CARD
  // ============================================

  const renderSquadSummary = () => {
    const stats = calculateSquadStats()
    const maxCapacity = calculateMaxCapacity()
    const currentCount = calculateCurrentCount()
    const capacityFull = currentCount >= maxCapacity

    const statCard = (title, value, description, isFull = false) => (
      <div
        style={{
          padding: '10px',
          border: '1px solid #00ff9f40',
          borderRadius: '2px',
          textAlign: 'center',
          background: 'rgba(0, 255, 159, 0.05)',
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: isFull ? '#ff3b3b' : '#00ff9f' }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: '#8899aa', marginTop: '4px' }}>
          {description}
        </div>
      </div>
    )

    return (
      <HoloPanel glow="#00ff9f" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '15px',
          }}
        >
          {statCard('Total HP', stats.totalHP, 'Combined health')}
          {statCard('Total Damage', stats.totalDamage, 'Combined damage output')}
          {statCard('Avg Speed', stats.avgSpeed, 'Average movement speed')}
          {statCard(
            'Unit Capacity',
            `${currentCount} / ${maxCapacity}`,
            'Squad size capacity',
            capacityFull
          )}
        </div>
      </HoloPanel>
    )
  }

  // ============================================
  // RENDER: DIVISION FILTER TABS
  // ============================================

  const renderDivisionFilters = () => {
    const divisions = Object.values(DIVISIONS)

    return (
      <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #00ff9f40' }}>
        {divisions.map((division) => {
          const isActive = activeFilter === division.id

          return (
            <button
              key={division.id}
              onClick={() => setActiveFilter(division.id)}
              style={tabStyle(isActive)}
            >
              {division.icon} {division.name}
            </button>
          )
        })}
      </div>
    )
  }

  // ============================================
  // RENDER: UNIT CARDS GRID
  // ============================================

  const renderUnitCards = () => {
    const maxCapacity = calculateMaxCapacity()
    const currentCount = calculateCurrentCount()

    const units = Object.values(UNIT_CHASSIS).filter(
      (unit) => unit.division === activeFilter
    )

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        {units.map((unit) => {
          const canRecruit =
            player.credits >= unit.cost && currentCount < maxCapacity
          const isAtCapacity = currentCount >= maxCapacity

          return (
            <HoloPanel
              key={unit.id}
              glow="#00ff9f"
              style={{
                flex: '1 1 calc(25% - 15px)',
                minWidth: '200px',
                maxWidth: '280px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '40px' }}>{unit.icon}</div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00ff9f' }}>
                  {unit.name}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  fontSize: '12px',
                  color: '#8899aa',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                }}
              >
                <div>HP: {unit.hp} | DMG: {unit.damage} | SPD: {unit.speed}</div>
                <div>TIER: {unit.tier} | COST: {unit.cost} CR</div>
              </div>

              {/* Recruit Button */}
              <Button
                variant="primary"
                onClick={() => handleRecruit(unit.id, unit.cost)}
                disabled={!canRecruit}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  opacity: !canRecruit ? 0.5 : 1,
                }}
              >
                Recruit
              </Button>

              {/* Status Messages */}
              {!canRecruit && (
                <div style={{ fontSize: '10px', color: '#ff3b3b', textAlign: 'center' }}>
                  {player.credits < unit.cost && 'Insufficient credits'}
                  {isAtCapacity && !( player.credits < unit.cost) && 'Squad at capacity'}
                </div>
              )}
            </HoloPanel>
          )
        })}
      </div>
    )
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <HoloPanel
      glow="#00ff9f"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px',
        gap: '20px',
      }}
    >
      {/* Loadout Tabs */}
      {renderLoadoutTabs()}

      {/* View Toggle */}
      {renderViewToggle()}

      {/* Squad View */}
      {viewMode === 'squad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {renderUnitList()}
          {renderSquadSummary()}
        </div>
      )}

      {/* Recruitment Shop */}
      {viewMode === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {renderDivisionFilters()}
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
            {renderUnitCards()}
          </div>
        </div>
      )}
    </HoloPanel>
  )
}
