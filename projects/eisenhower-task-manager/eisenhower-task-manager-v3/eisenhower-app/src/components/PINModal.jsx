import React, { useState, useEffect } from 'react';

/**
 * PIN Protection Modal — CRT Terminal Login
 * Electronic warfare station aesthetic
 */
export const PINModal = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [bootPhase, setBootPhase] = useState(0);
  const [showInput, setShowInput] = useState(false);

  const CORRECT_PIN = '2401';
  const MAX_ATTEMPTS = 5;
  const [unlocking, setUnlocking] = useState(false);

  // Boot sequence animation (fast)
  useEffect(() => {
    const timers = [
      setTimeout(() => setBootPhase(1), 150),
      setTimeout(() => setBootPhase(2), 350),
      setTimeout(() => setBootPhase(3), 600),
      setTimeout(() => setBootPhase(4), 850),
      setTimeout(() => { setBootPhase(5); setShowInput(true); }, 1100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem('eisenhower-unlocked', 'true');
      setError('');
      setUnlocking(true);
      // Wait for vault door animation to finish before unlocking
      setTimeout(() => onUnlock(), 1800);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('ACCESS DENIED');
      setPin('');
      if (newAttempts >= MAX_ATTEMPTS) {
        setError('LOCKED — MAXIMUM ATTEMPTS EXCEEDED');
      }
    }
  };

  const bootLines = [
    'PEIRASTES SYSTEMS v2.4.01',
    'INITIALIZING EISENHOWER TACTICAL MATRIX...',
    'ETM SUBSYSTEM ONLINE — 4 QUADRANTS LOADED',
    'TASK ENGINE READY — AWAITING AUTHORIZATION',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{
      background: 'linear-gradient(180deg, #020806, #031208 30%, #020e06 70%, #020806)',
      fontFamily: "'Courier New', monospace"
    }}>
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,.7) 1px, rgba(0,0,0,.7) 2px)',
        backgroundSize: '100% 3px',
        opacity: 0.06
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,.7) 100%)'
      }} />

      {/* Content — hidden during vault door animation */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 gap-6" style={{
        opacity: unlocking ? 0 : 1,
        transition: 'opacity 0.3s ease-out'
      }}>

        {/* System designation */}
        <div style={{
          fontSize: '9px', fontWeight: 700, color: '#007888',
          letterSpacing: '4px', textTransform: 'uppercase'
        }}>
          Peirastes Command
        </div>

        {/* Title with phosphor glow */}
        <div style={{
          fontSize: '18px', fontWeight: 700, color: '#e86030',
          textTransform: 'uppercase', letterSpacing: '6px', textAlign: 'center',
          textShadow: '0 0 20px rgba(232,96,48,.5), 0 0 40px rgba(232,96,48,.2)'
        }}>
          Eisenhower Matrix
        </div>

        {/* CRT Screen */}
        <div style={{
          width: '100%', maxWidth: '360px',
          background: '#060a08',
          border: '3px solid #0c1014',
          borderRadius: '6px',
          boxShadow: 'inset 0 3px 15px rgba(0,0,0,.8), inset 0 0 30px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.6)',
          padding: '20px 16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Inner scanlines on screen */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,.5) 1px, rgba(0,0,0,.5) 2px)',
            backgroundSize: '100% 3px',
            opacity: 0.03
          }} />

          {/* Boot sequence */}
          <div style={{ minHeight: '80px', marginBottom: '12px' }}>
            {bootLines.map((line, i) => (
              <div key={i} style={{
                fontSize: '10px',
                fontWeight: 700,
                color: i < bootPhase ? '#33cc44' : 'transparent',
                textShadow: i < bootPhase ? '0 0 4px rgba(51,204,68,.3)' : 'none',
                lineHeight: '1.8',
                letterSpacing: '.5px',
                transition: 'color .3s',
              }}>
                {`> ${line}`}
              </div>
            ))}
            {bootPhase >= 4 && !showInput && (
              <div style={{
                fontSize: '10px', fontWeight: 700, color: '#ffaa33',
                textShadow: '0 0 4px rgba(255,170,51,.3)',
                lineHeight: '1.8', letterSpacing: '.5px',
                animation: 'blink 1s step-end infinite'
              }}>
                {'> _'}
              </div>
            )}
          </div>

          {/* PIN input area */}
          {showInput && (
            <form onSubmit={handleSubmit}>
              <div style={{
                fontSize: '10px', fontWeight: 700, color: '#ffaa33',
                textShadow: '0 0 4px rgba(255,170,51,.3)',
                letterSpacing: '.5px', marginBottom: '10px',
                textTransform: 'uppercase'
              }}>
                Enter Authorization Code:
              </div>

              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                autoFocus
                disabled={attempts >= MAX_ATTEMPTS}
                maxLength="4"
                style={{
                  width: '100%',
                  background: '#040806',
                  border: '2px solid #0c1014',
                  borderRadius: '3px',
                  color: '#ffaa33',
                  padding: '10px 14px',
                  fontSize: '20px',
                  fontFamily: "'Courier New', monospace",
                  textAlign: 'center',
                  letterSpacing: '8px',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,.7)',
                  textShadow: '0 0 6px rgba(255,170,51,.4)',
                  outline: 'none'
                }}
                placeholder="- - - -"
              />

              {error && (
                <div style={{
                  fontSize: '10px', fontWeight: 700, color: '#ff3344',
                  textShadow: '0 0 6px rgba(255,51,68,.3)',
                  marginTop: '10px', textAlign: 'center',
                  letterSpacing: '1px', textTransform: 'uppercase'
                }}>
                  {error}
                </div>
              )}

              {attempts > 0 && attempts < MAX_ATTEMPTS && (
                <div style={{
                  fontSize: '9px', color: '#5a6258',
                  marginTop: '6px', textAlign: 'center'
                }}>
                  ATTEMPT {attempts} OF {MAX_ATTEMPTS}
                </div>
              )}

              <button
                type="submit"
                disabled={attempts >= MAX_ATTEMPTS || pin.length !== 4}
                style={{
                  width: '100%',
                  marginTop: '14px',
                  background: 'linear-gradient(180deg, #2e3234, #1e2224 40%, #141618)',
                  border: '2px solid #0c1014',
                  borderRadius: '4px',
                  color: pin.length === 4 ? '#e86030' : '#5a6258',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Courier New', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  cursor: pin.length === 4 ? 'pointer' : 'default',
                  boxShadow: '0 3px 8px rgba(0,0,0,.5), inset 0 1px 1px rgba(255,255,255,.03)',
                  textShadow: pin.length === 4 ? '0 0 6px rgba(232,96,48,.3)' : 'none',
                  opacity: (attempts >= MAX_ATTEMPTS || pin.length !== 4) ? 0.4 : 1,
                }}
              >
                {attempts >= MAX_ATTEMPTS ? 'System Locked' : 'Authenticate'}
              </button>
            </form>
          )}
        </div>

        {/* Nameplate */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '3px 20px',
            borderRadius: '2px',
            background: 'linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.15))',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.03)',
            border: '1px solid rgba(0,0,0,.12)'
          }}>
            <div style={{
              fontSize: '7px', fontWeight: 700, color: '#8a9094',
              letterSpacing: '.25em', textTransform: 'uppercase',
              textShadow: '0 1px 0 rgba(255,255,255,.08), 0 -1px 1px rgba(0,0,0,.5)'
            }}>
              Peirastes Mk-II
            </div>
          </div>
        </div>
      </div>

      {/* Vault doors — appear and split on successful auth */}
      {unlocking && (
        <>
          {/* Top door */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: '50%',
            zIndex: 100,
            background: 'linear-gradient(180deg, #2e3438 0%, #3c4246 40%, #4a5458 80%, #586064 100%)',
            borderBottom: '3px solid #0c1014',
            boxShadow: '0 4px 20px rgba(0,0,0,.8), inset 0 -1px 0 rgba(255,255,255,.06)',
            animation: 'vaultTopOpen 1.6s cubic-bezier(0.25, 0, 0.3, 1) forwards',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {/* Metal texture */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '300px'
            }} />
            {/* Hazard stripe along seam */}
            <div style={{
              width: '100%', height: '6px',
              backgroundImage: 'repeating-linear-gradient(90deg, #ffaa33 0px, #ffaa33 12px, #1e2428 12px, #1e2428 24px)',
              opacity: 0.6
            }} />
          </div>
          {/* Bottom door */}
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: '50%',
            zIndex: 100,
            background: 'linear-gradient(0deg, #2e3438 0%, #3c4246 40%, #4a5458 80%, #586064 100%)',
            borderTop: '3px solid #0c1014',
            boxShadow: '0 -4px 20px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.06)',
            animation: 'vaultBottomOpen 1.6s cubic-bezier(0.25, 0, 0.3, 1) forwards',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {/* Metal texture */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '300px'
            }} />
            {/* Hazard stripe along seam */}
            <div style={{
              width: '100%', height: '6px',
              backgroundImage: 'repeating-linear-gradient(90deg, #ffaa33 0px, #ffaa33 12px, #1e2428 12px, #1e2428 24px)',
              opacity: 0.6
            }} />
          </div>
          {/* Steam / hydraulic smoke from the seam */}
          <div style={{
            position: 'fixed', left: 0, right: 0,
            top: 'calc(50% - 60px)', height: '120px',
            zIndex: 101, pointerEvents: 'none', overflow: 'visible'
          }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="steam-puff" style={{
                position: 'absolute',
                left: `${8 + (i * 7.5) % 90}%`,
                bottom: '50%',
                width: `${30 + (i % 3) * 20}px`,
                height: `${30 + (i % 3) * 20}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(${140 + i * 5},${150 + i * 3},${160 + i * 2},${0.15 + (i % 3) * 0.05}), transparent 70%)`,
                filter: 'blur(8px)',
                animation: `steamRise${i % 3} ${1.5 + (i % 4) * 0.3}s ease-out ${0.1 + i * 0.08}s forwards`,
                opacity: 0
              }} />
            ))}
          </div>

          {/* ACCESS GRANTED flash */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 102,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'grantedFade 1.6s ease-out forwards'
          }}>
            <div style={{
              fontSize: '14px', fontWeight: 700, color: '#33cc44',
              letterSpacing: '6px', textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(51,204,68,.5), 0 0 40px rgba(51,204,68,.2)',
              fontFamily: "'Courier New', monospace"
            }}>
              Access Granted
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes steamRise0 {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          15% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-120px) translateX(15px) scale(2.5); }
        }
        @keyframes steamRise1 {
          0% { opacity: 0; transform: translateY(0) scale(0.6); }
          15% { opacity: 0.35; }
          100% { opacity: 0; transform: translateY(-100px) translateX(-20px) scale(2.8); }
        }
        @keyframes steamRise2 {
          0% { opacity: 0; transform: translateY(0) scale(0.4); }
          20% { opacity: 0.45; }
          100% { opacity: 0; transform: translateY(-140px) translateX(10px) scale(2.2); }
        }
        @keyframes vaultTopOpen {
          0% { transform: translateY(0); }
          15% { transform: translateY(2px); }
          100% { transform: translateY(-105%); }
        }
        @keyframes vaultBottomOpen {
          0% { transform: translateY(0); }
          15% { transform: translateY(-2px); }
          100% { transform: translateY(105%); }
        }
        @keyframes grantedFade {
          0% { opacity: 0; }
          20% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
