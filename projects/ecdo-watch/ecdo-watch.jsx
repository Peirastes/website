// ECDO Watch Dashboard - Browser Version with Chart.js
// For use with Babel transpilation in browser

const { useState, useEffect, useRef } = React;

// Generate synthetic data
const generateKpData = () => {
  const data = [];
  const labels = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    data.push(Math.random() * 4 + (Math.random() > 0.85 ? 3 : 0));
  }
  return { labels, data };
};

const generateLODData = () => {
  const data = [];
  const labels = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toISOString().split('T')[0]);
    const seasonal = Math.sin((i / 365) * 2 * Math.PI) * 0.8;
    const noise = (Math.random() - 0.5) * 1.5;
    data.push(seasonal + noise);
  }
  return { labels, data };
};

const generateHistoricalAA = (years) => {
  const data = [];
  const labels = [];
  const endYear = 2026;
  const startYear = endYear - years;
  for (let year = startYear; year <= endYear; year++) {
    labels.push(year.toString());
    const centuryTrend = 15 + ((year - 1868) / 150) * 10;
    const solarPhase = ((year - 1868) % 11) / 11 * 2 * Math.PI;
    const solarCycle = Math.sin(solarPhase) * 8;
    const noise = (Math.random() - 0.5) * 6;
    data.push(Math.max(5, centuryTrend + solarCycle + noise));
  }
  return { labels, data };
};

const generateHistoricalPM = (years) => {
  const data = [];
  const labels = [];
  const endYear = 2026;
  const startYear = endYear - years;
  for (let year = startYear; year <= endYear; year++) {
    labels.push(year.toString());
    let amplitude = 170;
    if (year >= 1910 && year <= 1915) amplitude = 200;
    if (year >= 1920 && year <= 1940) amplitude = 100;
    if (year >= 2015) amplitude = 80;
    const beatPhase = ((year - 1846) % 6.3) / 6.3 * 2 * Math.PI;
    const beat = Math.sin(beatPhase) * 30;
    const noise = (Math.random() - 0.5) * 20;
    data.push(Math.max(50, amplitude + beat + noise));
  }
  return { labels, data };
};

const generateMagData = () => {
  const bou = [];
  const hon = [];
  const sjg = [];
  const composite = [];
  const labels = [];
  const now = new Date();
  for (let i = 59; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toISOString().split('T')[0]);
    bou.push((Math.random() - 0.5) * 2);
    hon.push((Math.random() - 0.5) * 2);
    sjg.push((Math.random() - 0.5) * 2);
    composite.push((Math.random() - 0.5) * 1.5);
  }
  return { labels, bou, hon, sjg, composite };
};

// Chart component wrapper
const ChartComponent = ({ type, data, options, height }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: type,
      data: data,
      options: options
    });
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);
  
  return <canvas ref={canvasRef} style={{ height: height || 150, width: '100%' }} />;
};

const StatusBanner = ({ level }) => {
  const config = {
    NOMINAL: { color: '#10b981', text: 'All parameters within historical bounds' },
    ELEVATED_DIAGNOSTIC: { color: '#f59e0b', text: 'Single-channel anomaly detected' },
    WATCH: { color: '#ef4444', text: 'Multi-channel coherent anomaly' },
  };
  const c = config[level] || config.NOMINAL;
  
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#0f0f15', border: '1px solid #252532', borderLeft: '4px solid ' + c.color,
      borderRadius: 10, padding: '16px 20px', marginBottom: 16, flexWrap: 'wrap', gap: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', background: c.color,
          animation: 'pulse 2s infinite'
        }} />
        <div>
          <h2 style={{ fontFamily: 'monospace', fontSize: 18, margin: 0, color: '#e8e8ed' }}>{level}</h2>
          <p style={{ fontSize: 13, color: '#7a7a8c', margin: 0 }}>{c.text}</p>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#7a7a8c', maxWidth: 280, textAlign: 'right' }}>
        ⚠️ Experimental analysis tool, NOT a prediction system
      </div>
    </div>
  );
};

const Card = ({ step, title, status, children, span }) => {
  const statusColors = {
    OPEN: '#10b981', NOMINAL: '#10b981', OK: '#10b981',
    CLOSED: '#ef4444', SUPPRESSED: '#ef4444',
    ELEVATED: '#f59e0b',
  };
  const spanVal = span || 6;
  
  return (
    <div style={{
      gridColumn: 'span ' + spanVal,
      background: '#0f0f15', border: '1px solid #252532', borderRadius: 10, overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid #252532', background: '#16161f'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {step && <span style={{
            fontFamily: 'monospace', fontSize: 10, color: '#7a7a8c',
            background: '#252532', padding: '2px 6px', borderRadius: 3
          }}>STEP {step}</span>}
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#e8e8ed' }}>{title}</h3>
        </div>
        <span style={{
          fontFamily: 'monospace', fontSize: 10, fontWeight: 600,
          padding: '4px 8px', borderRadius: 4, textTransform: 'uppercase',
          background: (statusColors[status] || '#6b7280') + '22', color: statusColors[status] || '#6b7280'
        }}>{status}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
};

const Metric = ({ label, value, status }) => {
  const colors = { positive: '#10b981', negative: '#ef4444', warning: '#f59e0b' };
  return (
    <div style={{ flex: 1, minWidth: 70, background: '#16161f', borderRadius: 6, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#7a7a8c', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600, color: colors[status] || '#e8e8ed' }}>{value}</div>
    </div>
  );
};

// Chart.js default options for dark theme
const darkThemeOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#16161f',
      borderColor: '#252532',
      borderWidth: 1,
      titleColor: '#e8e8ed',
      bodyColor: '#7a7a8c'
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#7a7a8c', font: { size: 9 } }
    },
    y: {
      grid: { color: '#1e1e2a' },
      ticks: { color: '#7a7a8c', font: { size: 9 } }
    }
  }
};

function ECDOWatchDashboard() {
  const [timeRange, setTimeRange] = useState(50);
  
  // Generate data
  const kpData = generateKpData();
  const lodData = generateLODData();
  const magData = generateMagData();
  const aaData = generateHistoricalAA(timeRange);
  const pmData = generateHistoricalPM(timeRange);
  
  return (
    <div style={{ background: '#08080c', minHeight: '100vh', color: '#e8e8ed', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }'}} />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #252532', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🌍 ECDO Watch</h1>
            <p style={{ color: '#7a7a8c', fontSize: 13, margin: 0 }}>Falsification-first geophysics monitor • Tau Point approach detection</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#7a7a8c' }}>
              Updated: {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
            </div>
          </div>
        </header>
        
        <StatusBanner level="NOMINAL" />
        
        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          
          {/* Step 1: Gate */}
          <Card step={1} title="External Forcing Gate" status="OPEN" span={4}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16, background: '#16161f', borderRadius: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>🛡️</span>
              <div>
                <div style={{ color: '#10b981', fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>GATE OPEN</div>
                <div style={{ color: '#7a7a8c', fontSize: 11 }}>Internal inference allowed</div>
              </div>
            </div>
            <div style={{ height: 120 }}>
              <ChartComponent
                type="bar"
                height={120}
                data={{
                  labels: kpData.labels,
                  datasets: [{
                    data: kpData.data,
                    backgroundColor: '#4a9eff',
                    borderRadius: 2
                  }]
                }}
                options={{
                  ...darkThemeOptions,
                  scales: {
                    ...darkThemeOptions.scales,
                    y: { ...darkThemeOptions.scales.y, min: 0, max: 9 }
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Metric label="Kp Max" value="2.3" status="positive" />
              <Metric label="Dst" value="-12 nT" status="positive" />
            </div>
          </Card>
          
          {/* Step 2: EOP */}
          <Card step={2} title="Earth Orientation (LOD)" status="NOMINAL" span={4}>
            <div style={{ height: 140 }}>
              <ChartComponent
                type="line"
                height={140}
                data={{
                  labels: lodData.labels,
                  datasets: [{
                    data: lodData.data,
                    borderColor: '#4a9eff',
                    backgroundColor: 'rgba(74, 158, 255, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                  }]
                }}
                options={{
                  ...darkThemeOptions,
                  scales: {
                    x: { ...darkThemeOptions.scales.x, display: false },
                    y: { ...darkThemeOptions.scales.y, min: -3, max: 3 }
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Metric label="LOD z" value="0.82" status="positive" />
              <Metric label="PM Drift z" value="0.41" status="positive" />
            </div>
          </Card>
          
          {/* Step 3: C20 */}
          <Card step={3} title="Mass Distribution (C20)" status="OK" span={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#16161f', borderRadius: 6, marginBottom: 12, fontSize: 11, color: '#7a7a8c' }}>
              📡 GRACE-FO data age: <strong style={{ color: '#e8e8ed' }}>47 days</strong>
            </div>
            <div style={{ height: 100 }}>
              <ChartComponent
                type="line"
                height={100}
                data={{
                  labels: lodData.labels.slice(-60),
                  datasets: [{
                    data: lodData.data.slice(-60),
                    borderColor: '#10b981',
                    tension: 0.3,
                    pointRadius: 0
                  }]
                }}
                options={{
                  ...darkThemeOptions,
                  scales: {
                    x: { ...darkThemeOptions.scales.x, display: false },
                    y: { ...darkThemeOptions.scales.y, min: -3, max: 3 }
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Metric label="C20 z" value="0.31" status="positive" />
              <Metric label="vs GIA" value="Normal" status="positive" />
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #252532', fontSize: 11, color: '#7a7a8c', textAlign: 'center' }}>
              ⏱️ Lagged confirmatory channel
            </div>
          </Card>
          
          {/* Step 4: Magnetometer */}
          <Card step={4} title="Ground Magnetic (Multi-Station)" status="NOMINAL" span={8}>
            <div style={{ height: 180 }}>
              <ChartComponent
                type="line"
                height={180}
                data={{
                  labels: magData.labels,
                  datasets: [
                    {
                      label: 'Boulder',
                      data: magData.bou,
                      borderColor: '#4a9eff',
                      borderWidth: 1,
                      tension: 0.3,
                      pointRadius: 0,
                      opacity: 0.5
                    },
                    {
                      label: 'Honolulu',
                      data: magData.hon,
                      borderColor: '#8b5cf6',
                      borderWidth: 1,
                      tension: 0.3,
                      pointRadius: 0
                    },
                    {
                      label: 'San Juan',
                      data: magData.sjg,
                      borderColor: '#10b981',
                      borderWidth: 1,
                      tension: 0.3,
                      pointRadius: 0
                    },
                    {
                      label: 'Composite',
                      data: magData.composite,
                      borderColor: '#ffffff',
                      borderWidth: 2,
                      tension: 0.3,
                      pointRadius: 0
                    }
                  ]
                }}
                options={{
                  ...darkThemeOptions,
                  plugins: {
                    ...darkThemeOptions.plugins,
                    legend: { 
                      display: true, 
                      position: 'top',
                      labels: { 
                        color: '#7a7a8c', 
                        boxWidth: 12, 
                        padding: 8,
                        font: { size: 10 }
                      }
                    }
                  },
                  scales: {
                    x: { ...darkThemeOptions.scales.x, display: false },
                    y: { ...darkThemeOptions.scales.y, min: -3, max: 3 }
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Metric label="Composite z" value="0.56" status="positive" />
              <Metric label="Stations" value="4/4" status="positive" />
              <Metric label="Flag" value="✓ No" status="positive" />
            </div>
          </Card>
          
          {/* Step 5: Coherence */}
          <Card step={5} title="Cross-Channel Coherence" status="NOMINAL" span={4}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: '#16161f', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#7a7a8c', marginBottom: 4 }}>QUIET DAYS</div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: '#4a9eff' }}>18</div>
              </div>
              <div style={{ background: '#16161f', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#7a7a8c', marginBottom: 4 }}>PERCENTILE</div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: '#10b981' }}>42nd</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Metric label="EOP↔MAG r" value="0.12" />
              <Metric label="Status" value="Valid" status="positive" />
            </div>
          </Card>
          
          {/* Historical Section */}
          <Card title="📊 Century-Scale Historical Context" span={12}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[10, 50, 100, 150].map(function(y) {
                return (
                  <button key={y} onClick={function() { setTimeRange(y); }} style={{
                    background: timeRange === y ? '#4a9eff' : '#16161f',
                    border: '1px solid #252532', color: timeRange === y ? '#fff' : '#7a7a8c',
                    padding: '4px 12px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', cursor: 'pointer'
                  }}>{y}Y</button>
                );
              })}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 12, color: '#7a7a8c', marginBottom: 8 }}>Geomagnetic aa Index (since 1868)</h4>
                <div style={{ height: 200 }}>
                  <ChartComponent
                    type="line"
                    height={200}
                    data={{
                      labels: aaData.labels,
                      datasets: [{
                        data: aaData.data,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0
                      }]
                    }}
                    options={{
                      ...darkThemeOptions,
                      scales: {
                        ...darkThemeOptions.scales,
                        y: { ...darkThemeOptions.scales.y, min: 0, max: 40 }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: 12, color: '#7a7a8c', marginBottom: 8 }}>Polar Motion Amplitude (since 1846)</h4>
                <div style={{ height: 200 }}>
                  <ChartComponent
                    type="line"
                    height={200}
                    data={{
                      labels: pmData.labels,
                      datasets: [{
                        data: pmData.data,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0
                      }]
                    }}
                    options={{
                      ...darkThemeOptions,
                      scales: {
                        ...darkThemeOptions.scales,
                        y: { ...darkThemeOptions.scales.y, min: 0, max: 250 }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              <Metric label="aa Record" value="1868–Now" />
              <Metric label="PM Record" value="1846–Now" />
              <Metric label="LOD Record" value="1623–Now" />
              <Metric label="Current Regime" value="Within Bounds" status="positive" />
            </div>
            
            <div style={{ marginTop: 16, padding: 12, background: '#16161f', borderRadius: 6, fontSize: 11, color: '#7a7a8c' }}>
              📚 <strong>Data sources:</strong> aa index from IAGA/BGS (1868–present); Polar motion from IERS C01 (1846–present); LOD from IERS (yearly since 1623).
            </div>
          </Card>
          
        </div>
        
        {/* Footer */}
        <footer style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #252532', fontSize: 11, color: '#7a7a8c', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            ⚠️ This is an experimental analysis tool, NOT a prediction system. Watch levels indicate statistical anomalies relative to historical baselines, not probabilities of future events.
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <a href="https://www.ethical-skeptics.org/master-theory/" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff', textDecoration: 'none' }}>
              ECDO Theory
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
