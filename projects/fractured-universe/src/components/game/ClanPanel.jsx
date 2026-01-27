import React, { useState } from 'react'
import { HoloPanel, Button } from '../ui/index.jsx'
import { FACTIONS } from '../../data/gameData.js'

export default function ClanPanel({ player, updatePlayer, addNotification }) {
  // ============================================
  // STATE
  // ============================================
  const [showLeaveClanModal, setShowLeaveClanModal] = useState(false)

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getFactionData = (factionId) => {
    return Object.values(FACTIONS).find(f => f.id === factionId) || null
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
             ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateString
    }
  }

  const handleLeaveClan = () => {
    updatePlayer({ clan: null })
    addNotification('Left clan')
    setShowLeaveClanModal(false)
  }

  // ============================================
  // RENDER: EMPTY STATE
  // ============================================

  const renderEmptyState = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px' }}>👥</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8899aa' }}>
          NO CLAN
        </div>
        <div style={{ fontSize: '14px', color: '#8899aa' }}>
          You are not a member of a clan
        </div>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
          <Button
            variant="primary"
            onClick={() => addNotification('Clan creation coming soon')}
          >
            CREATE CLAN
          </Button>
          <Button
            variant="secondary"
            onClick={() => addNotification('Clan search coming soon')}
          >
            JOIN CLAN
          </Button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: CLAN HEADER CARD
  // ============================================

  const renderClanHeader = () => {
    if (!player.clan) return null

    const clan = player.clan
    const factionData = getFactionData(clan.faction)
    const factionColor = factionData?.color || '#8899aa'
    const factionIcon = {
      crimson: '⚔️',
      azure: '📡',
      golden: '💰',
    }[clan.faction] || '🏴'

    return (
      <HoloPanel
        glow="#00ff9f"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        {/* Clan Tag and Name */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: factionColor }}>
            [{clan.tag}]
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff9f' }}>
            {clan.name}
          </div>
        </div>

        {/* Leader Info */}
        <div style={{ fontSize: '14px', color: '#8899aa' }}>
          Led by <span style={{ color: '#00ff9f', fontWeight: 'bold' }}>{clan.leader}</span>
        </div>

        {/* Faction Info */}
        <div style={{ fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '18px' }}>{factionIcon}</span>
          <span style={{ color: factionColor, fontWeight: 'bold' }}>
            {factionData?.name || clan.faction}
          </span>
        </div>

        {/* Created Date */}
        <div style={{ fontSize: '12px', color: '#8899aa' }}>
          Established: {formatDate(clan.createdDate)}
        </div>
      </HoloPanel>
    )
  }

  // ============================================
  // RENDER: CLAN STATS ROW
  // ============================================

  const renderClanStats = () => {
    if (!player.clan) return null

    const clan = player.clan
    return (
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
        {/* Members */}
        <HoloPanel
          glow="#00ff9f"
          style={{
            flex: 1,
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Members
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff9f' }}>
            {clan.memberCount || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#8899aa' }}>
            members in clan
          </div>
        </HoloPanel>

        {/* Wars */}
        <HoloPanel
          glow="#00ff9f"
          style={{
            flex: 1,
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Wars Won
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff9f' }}>
            {clan.warsWon || 0} / {clan.warsTotal || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#8899aa' }}>
            wars won
          </div>
        </HoloPanel>

        {/* Treasury */}
        <HoloPanel
          glow="#00ff9f"
          style={{
            flex: 1,
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Treasury
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff9f' }}>
            {clan.treasury || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#8899aa' }}>
            CR credits
          </div>
        </HoloPanel>
      </div>
    )
  }

  // ============================================
  // RENDER: MEMBERS LIST
  // ============================================

  const renderMembersSection = () => {
    if (!player.clan) return null

    const clan = player.clan
    const members = clan.members || []

    const getRankIcon = (rank) => {
      switch (rank) {
        case 'leader':
          return '⭐'
        case 'officer':
          return '🎖️'
        default:
          return '🎖️'
      }
    }

    const getRankColor = (rank) => {
      switch (rank) {
        case 'leader':
          return '#ffff00'
        case 'officer':
          return '#ffc93b'
        default:
          return '#8899aa'
      }
    }

    const getFactionColor = (factionId) => {
      const faction = getFactionData(factionId)
      return faction?.color || '#8899aa'
    }

    const getFactionIcon = (factionId) => {
      return {
        crimson: '⚔️',
        azure: '📡',
        golden: '💰',
      }[factionId] || '🏴'
    }

    const isCurrentPlayer = (member) => {
      return member.name === player.name
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff9f', textTransform: 'uppercase', letterSpacing: '1px' }}>
          CLAN MEMBERS
        </div>
        <HoloPanel
          glow="#00ff9f"
          style={{
            padding: '15px',
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {members.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#8899aa' }}>
              No members to display
            </div>
          ) : (
            <>
              {members.map((member, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px',
                    background: isCurrentPlayer(member)
                      ? getFactionData(member.faction)?.bgColor || 'rgba(0, 255, 159, 0.1)'
                      : 'transparent',
                    border: isCurrentPlayer(member)
                      ? `1px solid ${getFactionColor(member.faction)}40`
                      : 'none',
                    borderRadius: '2px',
                    display: 'grid',
                    gridTemplateColumns: '30px 1fr 60px 30px 100px',
                    gap: '15px',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}
                >
                  {/* Rank Icon */}
                  <div style={{ textAlign: 'center', fontSize: '16px' }}>
                    {getRankIcon(member.rank)}
                  </div>

                  {/* Name */}
                  <div style={{ color: getRankColor(member.rank), fontWeight: 'bold' }}>
                    {member.name}
                    {isCurrentPlayer(member) && (
                      <span style={{ color: '#8899aa', fontWeight: 'normal', marginLeft: '8px' }}>
                        (YOU)
                      </span>
                    )}
                  </div>

                  {/* Level */}
                  <div style={{ color: '#8899aa', textAlign: 'center' }}>
                    Lv. {member.level}
                  </div>

                  {/* Faction Icon */}
                  <div style={{ textAlign: 'center', fontSize: '14px' }}>
                    {getFactionIcon(member.faction)}
                  </div>

                  {/* Join Date */}
                  <div style={{ color: '#8899aa', fontSize: '11px' }}>
                    {formatDate(member.joinedDate)}
                  </div>
                </div>
              ))}
            </>
          )}
        </HoloPanel>
        <div style={{ fontSize: '11px', color: '#8899aa', textAlign: 'right' }}>
          Total: {members.length} members
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: RECENT WARS SECTION
  // ============================================

  const renderRecentWarsSection = () => {
    if (!player.clan) return null

    const clan = player.clan
    const wars = clan.recentWars || []

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff9f', textTransform: 'uppercase', letterSpacing: '1px' }}>
          RECENT WARS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
          {wars.length === 0 ? (
            <HoloPanel
              glow="#00ff9f"
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#8899aa',
              }}
            >
              No wars in history
            </HoloPanel>
          ) : (
            wars.slice(0, 5).map((war, index) => (
              <HoloPanel
                key={index}
                glow="#00ff9f"
                style={{
                  padding: '12px 15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '15px',
                }}
              >
                {/* Enemy Clan */}
                <div style={{ flex: 1, fontSize: '12px', color: '#00ff9f' }}>
                  {war.enemyClan}
                </div>

                {/* Date */}
                <div style={{ fontSize: '11px', color: '#8899aa' }}>
                  {formatDateTime(war.date)}
                </div>

                {/* Result */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: war.result === 'won' ? '#00ff9f' : '#ff3b3b',
                    textTransform: 'uppercase',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}
                >
                  {war.result === 'won' ? 'WON' : 'LOST'}
                </div>

                {/* XP Reward */}
                {war.result === 'won' && (
                  <div style={{ fontSize: '11px', color: '#00ff9f', minWidth: '80px', textAlign: 'right' }}>
                    +{war.xpReward || 0} XP
                  </div>
                )}
              </HoloPanel>
            ))
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: TREASURY SECTION
  // ============================================

  const renderTreasurySection = () => {
    if (!player.clan) return null

    const clan = player.clan
    const weeklyIncome = 500
    const maintenanceCost = 300
    const netIncome = weeklyIncome - maintenanceCost

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff9f', textTransform: 'uppercase', letterSpacing: '1px' }}>
          TREASURY
        </div>
        <HoloPanel
          glow="#00ff9f"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}
        >
          {/* Total Credits */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#8899aa' }}>
              Total Credits
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ff9f' }}>
              {clan.treasury || 0} CR
            </div>
          </div>

          {/* Weekly Income */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#8899aa' }}>
              Weekly Income
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff9f' }}>
              +{weeklyIncome} CR
            </div>
          </div>

          {/* Maintenance Cost */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#8899aa' }}>
              Maintenance Cost
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff3b3b' }}>
              -{maintenanceCost} CR
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(0, 255, 159, 0.2)' }} />

          {/* Net Income */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00ff9f' }}>
              Net Income Per Week
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: netIncome >= 0 ? '#00ff9f' : '#ff3b3b',
              }}
            >
              {netIncome >= 0 ? '+' : ''}{netIncome} CR
            </div>
          </div>
        </HoloPanel>
      </div>
    )
  }

  // ============================================
  // RENDER: ACTION BUTTONS
  // ============================================

  const renderActionButtons = () => {
    if (!player.clan) return null

    const clan = player.clan
    const isLeader = player.name === clan.leader

    return (
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <Button
          variant="primary"
          onClick={() => addNotification('Treasury contribution coming soon')}
        >
          CONTRIBUTE CREDITS
        </Button>
        <Button
          variant="secondary"
          onClick={() => addNotification('Detailed wars page coming soon')}
        >
          VIEW WARS
        </Button>
        {!isLeader && (
          <Button
            variant="danger"
            onClick={() => setShowLeaveClanModal(true)}
          >
            LEAVE CLAN
          </Button>
        )}
      </div>
    )
  }

  // ============================================
  // RENDER: LEAVE CLAN MODAL
  // ============================================

  const renderLeaveClanModal = () => {
    if (!showLeaveClanModal) return null

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
        onClick={() => setShowLeaveClanModal(false)}
      >
        <HoloPanel
          glow="#ff3b3b"
          style={{
            padding: '30px',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff3b3b' }}>
            LEAVE CLAN
          </div>
          <div style={{ fontSize: '14px', color: '#8899aa' }}>
            Are you sure you want to leave the clan? This action cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Button
              variant="secondary"
              onClick={() => setShowLeaveClanModal(false)}
              style={{ flex: 1 }}
            >
              CANCEL
            </Button>
            <Button
              variant="danger"
              onClick={handleLeaveClan}
              style={{ flex: 1 }}
            >
              LEAVE
            </Button>
          </div>
        </HoloPanel>
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
        overflow: 'auto',
      }}
    >
      {!player.clan ? (
        renderEmptyState()
      ) : (
        <>
          {renderClanHeader()}
          {renderClanStats()}
          {renderMembersSection()}
          {renderRecentWarsSection()}
          {renderTreasurySection()}
          {renderActionButtons()}
        </>
      )}

      {renderLeaveClanModal()}
    </HoloPanel>
  )
}
