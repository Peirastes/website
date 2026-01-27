import React, { useState, useEffect } from 'react';
import { HoloPanel, Button, ProgressBar } from '../ui/index.jsx';
import useBattle from '../../hooks/useBattle.js';
import { FACTIONS } from '../../data/gameData.js';
import BattleViewport from './BattleViewport.jsx';

export default function BattleSimulator({
  sector,
  loadout,
  player,
  onBattleEnd,
  onReturnToMap,
  addNotification,
}) {
  const {
    battle,
    initializeBattle,
    startBattle,
    assaultPoC,
    retreat,
    calculateRewards,
    formatTime,
    updateUnitPosition,
    updateCamera,
    moveUnitsTowardTargets,
    updatePoCCapture,
    updateEnemyAI,
    executeCombat,
  } = useBattle();

  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showDefeatModal, setShowDefeatModal] = useState(false);
  const [rewards, setRewards] = useState(null);

  // Initialize battle on component mount
  useEffect(() => {
    if (sector && loadout) {
      initializeBattle(sector, loadout);
    }
  }, [sector, loadout, initializeBattle]);

  // Monitor battle status for victory/defeat
  useEffect(() => {
    if (!battle) return;

    if (battle.status === 'victory' && !showVictoryModal) {
      const battleRewards = calculateRewards(sector, battle);
      setRewards(battleRewards);
      setShowVictoryModal(true);
      addNotification('VICTORY! Sector captured!', 'success');
    } else if (battle.status === 'defeat' && !showDefeatModal) {
      const battleRewards = calculateRewards(sector, battle);
      setRewards(battleRewards);
      setShowDefeatModal(true);
      addNotification('DEFEAT! Battle lost!', 'error');
    }
  }, [battle, sector, calculateRewards, addNotification, showVictoryModal, showDefeatModal]);

  if (!battle) {
    return (
      <HoloPanel
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          glow: player?.faction?.color || '#00ff9f',
        }}
      >
        <div style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          Initializing Battle...
        </div>
      </HoloPanel>
    );
  }

  const playerFactionColor = player?.faction?.color || '#00ff9f';
  const maxSquadHP = battle.maxSquadHP;
  const currentSquadHP = battle.playerSquadHP;
  const squadHealthPercent = (currentSquadHP / maxSquadHP) * 100;

  const handleAssaultPoC = (pocId) => {
    assaultPoC(pocId);
    addNotification(`PoC ${pocId} assaulted!`, 'info');
  };

  const handleRetreat = () => {
    const confirm = window.confirm('Are you sure you want to retreat? This will result in defeat.');
    if (confirm) {
      retreat();
      addNotification('Retreat ordered!', 'warning');
      setTimeout(() => {
        onReturnToMap();
      }, 1000);
    }
  };

  const handleBeginBattle = () => {
    startBattle();
    addNotification('Battle engaged!', 'success');
  };

  const handleReturnToMap = () => {
    onBattleEnd({
      victory: battle.status === 'victory',
      rewards: rewards,
    });
    onReturnToMap();
  };

  const handleUnitCommand = (command, ...args) => {
    switch (command) {
      case 'updatePosition':
        // args: (unitId, x, y)
        updateUnitPosition(args[0], args[1], args[2]);
        break;
      case 'updateCamera':
        // args: (x, y, zoom)
        updateCamera(args[0], args[1], args[2]);
        break;
      default:
        console.warn('Unknown unit command:', command);
    }
  };

  // Get morale color based on health percentage
  const getMoraleColor = () => {
    if (squadHealthPercent > 75) return '#00ff9f';
    if (squadHealthPercent > 50) return '#ffc93b';
    if (squadHealthPercent > 25) return '#ff9f3b';
    return '#ff3b3b';
  };

  const getMoraleText = () => {
    if (squadHealthPercent > 75) return 'Excellent';
    if (squadHealthPercent > 50) return 'Good';
    if (squadHealthPercent > 25) return 'Shaken';
    return 'Critical';
  };

  // Grid layout for PoCs
  const pocGridCols = battle.pocs.length <= 3 ? '1fr' : 'repeat(2, 1fr)';

  // Deploying State
  if (battle.status === 'deploying') {
    return (
      <HoloPanel
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          glow: playerFactionColor,
        }}
      >
        {/* Header */}
        <div
          style={{
            height: '100px',
            borderBottom: `1px solid ${playerFactionColor}40`,
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: playerFactionColor,
                fontFamily: 'Orbitron',
              }}
            >
              {sector.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Sector {sector.id}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                fontSize: '16px',
                color: '#00ff9f',
                fontFamily: 'Orbitron',
                letterSpacing: '2px',
              }}
            >
              AWAITING DEPLOYMENT
            </div>
          </div>
          <div style={{ flex: 1 }}></div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '30px',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '30px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h3
              style={{
                fontSize: '20px',
                color: playerFactionColor,
                fontFamily: 'Orbitron',
                marginBottom: '20px',
              }}
            >
              SQUAD READY FOR DEPLOYMENT
            </h3>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {loadout.length} units ready
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {loadout.map((unit, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${playerFactionColor}60`,
                    borderRadius: '2px',
                    fontSize: '12px',
                    color: playerFactionColor,
                  }}
                >
                  {unit.icon} {unit.name}
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleBeginBattle} variant="primary" style={{ padding: '15px 30px' }}>
            BEGIN BATTLE
          </Button>
        </div>

        {/* Footer */}
        <div
          style={{
            height: '60px',
            borderTop: `1px solid ${playerFactionColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Orbitron' }}>
            Ready to engage enemy forces
          </div>
        </div>
      </HoloPanel>
    );
  }

  // Active or Victory/Defeat State - Main Battle UI
  return (
    <HoloPanel
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        glow: playerFactionColor,
      }}
    >
      {/* Header Section */}
      <div
        style={{
          height: '100px',
          borderBottom: `1px solid ${playerFactionColor}40`,
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Sector Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: playerFactionColor,
              fontFamily: 'Orbitron',
            }}
          >
            {sector.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Sector {sector.id}
          </div>
        </div>

        {/* Center: Battle Status and Score */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontSize: '16px',
              color: '#00ff9f',
              fontFamily: 'Orbitron',
              letterSpacing: '2px',
              marginBottom: '8px',
            }}
          >
            BATTLE IN PROGRESS
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'Orbitron',
            }}
          >
            <span style={{ color: playerFactionColor }}>YOUR PoCs: {battle.score.player}</span>
            {' | '}
            <span style={{ color: '#ff3b3b' }}>ENEMY PoCs: {battle.score.enemy}</span>
          </div>
        </div>

        {/* Right: Timer */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Orbitron' }}>
            BATTLE TIMER
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: battle.timer < 60 ? '#ff3b3b' : '#00ff9f',
              animation: battle.timer < 30 ? 'pulse 1s infinite' : 'none',
              textShadow: battle.timer < 60 ? '0 0 10px #ff3b3b' : '0 0 10px #00ff9f',
            }}
          >
            {formatTime(battle.timer)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {battle.timer} seconds remaining
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '20px',
          padding: '20px',
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
        {/* Left: 2D Battlefield Viewport */}
        <div style={{ flex: 2.5, display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: playerFactionColor,
              fontFamily: 'Orbitron',
              letterSpacing: '1px',
            }}
          >
            2D BATTLEFIELD VIEW
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative', border: `1px solid ${playerFactionColor}40` }}>
            <BattleViewport
              battle={battle}
              loadout={loadout}
              player={player}
              onUnitCommand={handleUnitCommand}
              onReturnToMap={onReturnToMap}
              addNotification={addNotification}
              moveUnitsTowardTargets={moveUnitsTowardTargets}
              updatePoCCapture={updatePoCCapture}
              updateEnemyAI={updateEnemyAI}
              executeCombat={executeCombat}
            />
          </div>
        </div>

        {/* Right: Squad Status Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#00ff9f',
              fontFamily: 'Orbitron',
              letterSpacing: '1px',
            }}
          >
            YOUR SQUAD
          </div>
          <HoloPanel
            glow="#00ff9f"
            style={{
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              flex: 1,
              overflow: 'auto',
            }}
          >
            {/* Squad Health Bar */}
            <div>
              <ProgressBar
                value={currentSquadHP}
                max={maxSquadHP}
                color="#00ff9f"
                height={20}
                label="SQUAD HEALTH"
              />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                {currentSquadHP} / {maxSquadHP} HP
              </div>
            </div>

            {/* Unit List */}
            <div style={{ borderTop: '1px solid #00ff9f40', paddingTop: '10px' }}>
              {battle.playerUnitPositions && battle.playerUnitPositions.length > 0 ? (
                battle.playerUnitPositions.map((unitPos, idx) => {
                  const unitData = loadout[idx];
                  if (!unitData) return null;
                  const maxHp = unitData.hp;
                  const healthPercent = Math.max(0, unitPos.hp / maxHp);
                  return (
                    <div
                      key={idx}
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '10px',
                        paddingBottom: '8px',
                        borderBottom: idx < battle.playerUnitPositions.length - 1 ? '1px solid #8899aa40' : 'none',
                        opacity: unitPos.hp > 0 ? 1 : 0.5,
                      }}
                    >
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ color: healthPercent <= 0 ? '#999' : '#00ff9f' }}>
                          {unitData.icon} {unitData.name}
                        </span>
                        <span style={{ float: 'right', color: healthPercent <= 0 ? '#999' : '#00ff9f' }}>
                          HP: {Math.max(0, Math.round(unitPos.hp))} / {maxHp}
                        </span>
                      </div>
                      <ProgressBar
                        value={Math.max(0, unitPos.hp)}
                        max={maxHp}
                        color={healthPercent > 0.5 ? '#00ff9f' : healthPercent > 0.25 ? '#ffc93b' : '#ff3b3b'}
                        height={8}
                      />
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '12px', color: '#ff3b3b', textAlign: 'center', padding: '10px' }}>
                  No units remaining
                </div>
              )}
            </div>

            {/* Morale Indicator */}
            <div
              style={{
                borderTop: '1px solid #00ff9f40',
                paddingTop: '10px',
                fontSize: '12px',
                color: getMoraleColor(),
                fontFamily: 'Orbitron',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              MORALE: {getMoraleText()}
            </div>
          </HoloPanel>
        </div>
      </div>

      {/* Combat Log Section */}
      <div
        style={{
          maxHeight: '150px',
          borderTop: `1px solid ${playerFactionColor}40`,
          padding: '15px',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: playerFactionColor,
            fontFamily: 'Orbitron',
            letterSpacing: '1px',
            marginBottom: '10px',
          }}
        >
          COMBAT LOG
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {battle.combatLog.map((entry, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'var(--text-secondary)',
                opacity: 0.5 + (idx / battle.combatLog.length) * 0.5,
              }}
            >
              {entry}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div
        style={{
          height: '60px',
          borderTop: `1px solid ${playerFactionColor}40`,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <div></div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Orbitron' }}>
          Battle Clock: {formatTime(Math.floor((Date.now() - (battle.startTime || Date.now())) / 1000))}
        </div>
        <Button
          onClick={handleRetreat}
          variant="danger"
          disabled={battle.status !== 'active'}
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          RETREAT
        </Button>
      </div>

      {/* Victory Modal */}
      {battle.status === 'victory' && showVictoryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <HoloPanel
            glow="#00ff9f"
            style={{
              padding: '40px',
              textAlign: 'center',
              maxWidth: '400px',
              boxShadow: '0 0 40px #00ff9f80',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#00ff9f',
                fontFamily: 'Orbitron',
                marginBottom: '20px',
                letterSpacing: '2px',
                textShadow: '0 0 20px #00ff9f',
              }}
            >
              VICTORY!
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
              Sector {battle.sector.name} captured by your faction
            </div>

            <div style={{
              background: 'rgba(0, 255, 159, 0.05)',
              border: '1px solid #00ff9f40',
              borderRadius: '2px',
              padding: '20px',
              marginBottom: '25px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>
                BATTLE SUMMARY
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Final Score: <span style={{ color: '#00ff9f' }}>{battle.score.player}</span> vs <span style={{ color: '#ff3b3b' }}>{battle.score.enemy}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                Units Remaining: <span style={{ color: '#00ff9f' }}>{battle.playerUnitPositions?.length || 0}</span>
              </div>

              {rewards && (
                <>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', borderTop: '1px solid #00ff9f40', paddingTop: '10px' }}>
                    REWARDS EARNED
                  </div>
                  <div style={{ fontSize: '14px', color: '#00ff9f', marginBottom: '8px', fontWeight: 'bold' }}>
                    XP: +{rewards.xp}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffc93b', fontWeight: 'bold' }}>
                    Credits: +{rewards.credits}
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleReturnToMap}
              variant="primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
              }}
            >
              RETURN TO WAR MAP
            </Button>
          </HoloPanel>
        </div>
      )}

      {/* Defeat Modal */}
      {battle.status === 'defeat' && showDefeatModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <HoloPanel
            glow="#ff3b3b"
            style={{
              padding: '40px',
              textAlign: 'center',
              maxWidth: '400px',
              boxShadow: '0 0 40px #ff3b3b80',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ff3b3b',
                fontFamily: 'Orbitron',
                marginBottom: '20px',
                letterSpacing: '2px',
                textShadow: '0 0 20px #ff3b3b',
              }}
            >
              DEFEAT
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
              Sector remains under enemy control
            </div>

            <div style={{
              background: 'rgba(255, 59, 59, 0.05)',
              border: '1px solid #ff3b3b40',
              borderRadius: '2px',
              padding: '20px',
              marginBottom: '25px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>
                BATTLE SUMMARY
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Final Score: <span style={{ color: '#ff3b3b' }}>{battle.score.enemy}</span> vs <span style={{ color: '#00ff9f' }}>{battle.score.player}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                Units Lost: <span style={{ color: '#ff3b3b' }}>{(loadout?.length || 0) - (battle.playerUnitPositions?.length || 0)}</span>
              </div>

              {rewards && (
                <>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', borderTop: '1px solid #ff3b3b40', paddingTop: '10px' }}>
                    REDUCED REWARDS
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffc93b', fontWeight: 'bold' }}>
                    XP: +{rewards.xp}
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleReturnToMap}
              variant="secondary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
              }}
            >
              RETURN TO WAR MAP
            </Button>
          </HoloPanel>
        </div>
      )}
    </HoloPanel>
  );
}
