import React, { useState } from 'react'
import { FACTIONS, DIVISIONS } from '../data/gameData.js'
import { HoloPanel, Button } from '../components/ui/index.jsx'

export function CharacterCreate({ onComplete, onCancel }) {
  const [step, setStep] = useState(1)
  const [characterData, setCharacterData] = useState({
    faction: null,
    division: null,
    callsign: '',
    portraitIndex: 0,
  })

  const portraitOptions = ['🎖️', '👨‍💼', '👩‍💼', '🤖', '🧑‍🚀', '👨‍✈️', '👩‍✈️', '🕵️']

  const handleFactionSelect = (factionKey) => {
    const faction = FACTIONS[factionKey]
    setCharacterData({ ...characterData, faction: faction.id })
  }

  const handleDivisionSelect = (divisionKey) => {
    const division = DIVISIONS[divisionKey]
    setCharacterData({ ...characterData, division: division.id })
  }

  const handleNextStep = () => {
    if (step === 1 && !characterData.faction) return
    if (step === 2 && !characterData.division) return
    if (step === 3) {
      onComplete({
        faction: characterData.faction,
        division: characterData.division,
        callsign: characterData.callsign,
        portraitIndex: characterData.portraitIndex,
      })
      return
    }
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const getSelectedFaction = () => {
    return Object.values(FACTIONS).find(f => f.id === characterData.faction)
  }

  const getSelectedDivision = () => {
    return Object.values(DIVISIONS).find(d => d.id === characterData.division)
  }

  const containerStyle = {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(10,15,20,0.95), rgba(5,8,12,0.98))',
  }

  const panelStyle = {
    padding: '40px',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  }

  const progressStyle = {
    fontSize: '12px',
    color: '#00ff9f',
    letterSpacing: '2px',
    marginBottom: '20px',
    textAlign: 'center',
    fontFamily: 'Orbitron',
  }

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00ff9f',
    textAlign: 'center',
    marginBottom: '40px',
    letterSpacing: '2px',
    fontFamily: 'Orbitron',
  }

  // ============================================
  // STEP 1: FACTION SELECTION
  // ============================================
  if (step === 1) {
    const factionArray = [
      { key: 'CRIMSON_DOMINION', faction: FACTIONS.CRIMSON_DOMINION },
      { key: 'AZURE_COALITION', faction: FACTIONS.AZURE_COALITION },
      { key: 'GOLDEN_SOVEREIGNTY', faction: FACTIONS.GOLDEN_SOVEREIGNTY },
    ]

    return (
      <div style={containerStyle}>
        <HoloPanel style={panelStyle} glow="#00ff9f">
          <div style={progressStyle}>STEP 1 OF 3</div>
          <div style={titleStyle}>CHOOSE YOUR FACTION</div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '30px',
            marginBottom: '40px',
          }}>
            {factionArray.map(({ key, faction }) => (
              <div
                key={key}
                onClick={() => handleFactionSelect(key)}
                style={{
                  padding: '20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: characterData.faction === faction.id
                    ? `2px solid ${faction.color}`
                    : '2px solid transparent',
                  background: characterData.faction === faction.id
                    ? faction.bgColor
                    : 'rgba(50, 60, 80, 0.3)',
                  boxShadow: characterData.faction === faction.id
                    ? `0 0 30px ${faction.color}80, inset 0 0 20px ${faction.color}20`
                    : 'none',
                  transform: characterData.faction === faction.id ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {/* Faction icon circle */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: faction.color,
                  margin: '0 auto 15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  boxShadow: `0 0 20px ${faction.color}60`,
                  opacity: 0.9,
                }}>
                  {faction.id === 'crimson' && '⚔️'}
                  {faction.id === 'azure' && '🔬'}
                  {faction.id === 'golden' && '💰'}
                </div>

                {/* Faction name */}
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginBottom: '10px',
                  fontFamily: 'Orbitron',
                  letterSpacing: '1px',
                }}>
                  {faction.name.toUpperCase()}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '13px',
                  color: '#aabbcc',
                  textAlign: 'center',
                  marginBottom: '15px',
                  lineHeight: '1.4',
                }}>
                  {faction.description}
                </div>

                {/* Bonus badge */}
                <div style={{
                  padding: '8px 12px',
                  background: `${faction.color}20`,
                  border: `1px solid ${faction.color}`,
                  borderRadius: '2px',
                  fontSize: '12px',
                  color: faction.color,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  fontFamily: 'Orbitron',
                }}>
                  {faction.bonus}
                </div>

                {/* Motto */}
                <div style={{
                  fontSize: '12px',
                  color: faction.color,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  "{faction.motto}"
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
          }}>
            <Button onClick={onCancel} variant="danger">
              CANCEL
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={!characterData.faction}
              variant="primary"
            >
              NEXT
            </Button>
          </div>
        </HoloPanel>
      </div>
    )
  }

  // ============================================
  // STEP 2: DIVISION SELECTION
  // ============================================
  if (step === 2) {
    const divisionArray = [
      { key: 'INFANTRY', division: DIVISIONS.INFANTRY },
      { key: 'MOBILE', division: DIVISIONS.MOBILE },
      { key: 'AVIATION', division: DIVISIONS.AVIATION },
      { key: 'ORGANIC', division: DIVISIONS.ORGANIC },
    ]

    const selectedFaction = getSelectedFaction()
    const factionColor = selectedFaction?.color || '#00ff9f'

    return (
      <div style={containerStyle}>
        <HoloPanel style={panelStyle} glow={factionColor}>
          <div style={progressStyle}>STEP 2 OF 3</div>
          <div style={titleStyle}>SELECT PRIMARY DIVISION</div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '25px',
            marginBottom: '40px',
          }}>
            {divisionArray.map(({ key, division }) => (
              <div
                key={key}
                onClick={() => handleDivisionSelect(key)}
                style={{
                  padding: '25px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: characterData.division === division.id
                    ? `2px solid ${factionColor}`
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  background: characterData.division === division.id
                    ? `${factionColor}15`
                    : 'rgba(50, 60, 80, 0.2)',
                  boxShadow: characterData.division === division.id
                    ? `0 0 25px ${factionColor}60, inset 0 0 15px ${factionColor}15`
                    : 'none',
                  transform: characterData.division === division.id ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {/* Division emoji icon */}
                <div style={{
                  fontSize: '40px',
                  textAlign: 'center',
                  marginBottom: '15px',
                }}>
                  {division.icon}
                </div>

                {/* Division name */}
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginBottom: '10px',
                  fontFamily: 'Orbitron',
                  letterSpacing: '1px',
                }}>
                  {division.name.toUpperCase()}
                </div>

                {/* Division description */}
                <div style={{
                  fontSize: '13px',
                  color: '#aabbcc',
                  textAlign: 'center',
                  lineHeight: '1.4',
                }}>
                  {division.description}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <Button onClick={handlePrevStep} variant="secondary">
              BACK
            </Button>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Button onClick={onCancel} variant="danger">
                CANCEL
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!characterData.division}
                variant="primary"
              >
                NEXT
              </Button>
            </div>
          </div>
        </HoloPanel>
      </div>
    )
  }

  // ============================================
  // STEP 3: IDENTITY CREATION
  // ============================================
  if (step === 3) {
    const selectedFaction = getSelectedFaction()
    const selectedDivision = getSelectedDivision()
    const factionColor = selectedFaction?.color || '#00ff9f'

    return (
      <div style={containerStyle}>
        <HoloPanel style={panelStyle} glow={factionColor}>
          <div style={progressStyle}>STEP 3 OF 3</div>
          <div style={titleStyle}>ESTABLISH COMMAND IDENTITY</div>

          {/* Callsign input section */}
          <div style={{
            marginBottom: '40px',
          }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: factionColor,
              marginBottom: '10px',
              fontFamily: 'Orbitron',
              letterSpacing: '1px',
              fontWeight: 'bold',
            }}>
              CALLSIGN
            </label>
            <div style={{
              position: 'relative',
              marginBottom: '8px',
            }}>
              <input
                type="text"
                value={characterData.callsign}
                onChange={(e) => setCharacterData({
                  ...characterData,
                  callsign: e.target.value.slice(0, 16),
                })}
                placeholder="Enter your callsign"
                maxLength={16}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '14px',
                  fontFamily: 'Orbitron',
                  background: 'rgba(20, 30, 40, 0.8)',
                  border: `1px solid ${factionColor}`,
                  borderRadius: '2px',
                  color: '#ffffff',
                  boxShadow: `0 0 10px ${factionColor}30`,
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 0 15px ${factionColor}60, inset 0 0 10px ${factionColor}20`
                  e.target.style.borderColor = factionColor
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = `0 0 10px ${factionColor}30`
                }}
              />
            </div>
            <div style={{
              fontSize: '12px',
              color: '#8899aa',
              textAlign: 'right',
            }}>
              {characterData.callsign.length}/16
            </div>
          </div>

          {/* Portrait selection section */}
          <div style={{
            marginBottom: '40px',
          }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: factionColor,
              marginBottom: '15px',
              fontFamily: 'Orbitron',
              letterSpacing: '1px',
              fontWeight: 'bold',
            }}>
              SELECT PORTRAIT
            </label>
            <div style={{
              display: 'flex',
              gap: '15px',
              flexWrap: 'wrap',
            }}>
              {portraitOptions.map((portrait, index) => (
                <div
                  key={index}
                  onClick={() => setCharacterData({ ...characterData, portraitIndex: index })}
                  style={{
                    fontSize: '48px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    border: characterData.portraitIndex === index
                      ? `3px solid ${factionColor}`
                      : '3px solid transparent',
                    background: characterData.portraitIndex === index
                      ? `${factionColor}20`
                      : 'transparent',
                    boxShadow: characterData.portraitIndex === index
                      ? `0 0 15px ${factionColor}60`
                      : 'none',
                    transform: characterData.portraitIndex === index ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {portrait}
                </div>
              ))}
            </div>
          </div>

          {/* Summary section */}
          <div style={{
            padding: '20px',
            background: 'rgba(20, 30, 40, 0.6)',
            border: `1px solid ${factionColor}40`,
            borderRadius: '2px',
            marginBottom: '40px',
          }}>
            <div style={{
              fontSize: '13px',
              color: '#aabbcc',
              marginBottom: '12px',
            }}>
              <strong style={{ color: '#ffffff' }}>FACTION: </strong>
              <span style={{ color: factionColor }}>
                {selectedFaction?.name.toUpperCase()}
              </span>
            </div>
            <div style={{
              fontSize: '13px',
              color: '#aabbcc',
              marginBottom: '12px',
            }}>
              <strong style={{ color: '#ffffff' }}>DIVISION: </strong>
              <span>
                {selectedDivision?.icon} {selectedDivision?.name.toUpperCase()}
              </span>
            </div>
            <div style={{
              fontSize: '13px',
              color: '#aabbcc',
            }}>
              <strong style={{ color: '#ffffff' }}>CALLSIGN: </strong>
              <span>{characterData.callsign || '(NOT SET)'}</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <Button onClick={handlePrevStep} variant="secondary">
              BACK
            </Button>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Button onClick={onCancel} variant="danger">
                CANCEL
              </Button>
              <Button
                onClick={handleNextStep}
                variant="primary"
              >
                DEPLOY TO FRACTURED UNIVERSE
              </Button>
            </div>
          </div>
        </HoloPanel>
      </div>
    )
  }
}
