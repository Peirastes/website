import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Cell, Legend, ReferenceLine
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════════
// SPECTRUM v3 — Split-Panel Market Intelligence Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ASSET REGISTRY ──────────────────────────────────────────────────────────

const ASSETS = {
  // Tech Giants
  AAPL: { name: "Apple Inc.", sector: "Technology", type: "stock", color: "#a3a3a3", domain: "apple.com" },
  MSFT: { name: "Microsoft Corp.", sector: "Technology", type: "stock", color: "#38bdf8", domain: "microsoft.com" },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology", type: "stock", color: "#4ade80", domain: "google.com" },
  META: { name: "Meta Platforms", sector: "Technology", type: "stock", color: "#60a5fa", domain: "meta.com" },
  AMZN: { name: "Amazon.com Inc.", sector: "E-Commerce / Cloud", type: "stock", color: "#ff9900", domain: "amazon.com" },

  // AI & Semiconductors
  NVDA: { name: "NVIDIA Corp.", sector: "Semiconductors", type: "stock", color: "#84cc16", domain: "nvidia.com" },
  AMD: { name: "Advanced Micro Devices", sector: "Semiconductors", type: "stock", color: "#ed1c24", domain: "amd.com" },
  INTC: { name: "Intel Corp.", sector: "Semiconductors", type: "stock", color: "#0071c5", domain: "intel.com" },
  AVGO: { name: "Broadcom Inc.", sector: "Semiconductors", type: "stock", color: "#cc0000", domain: "broadcom.com" },
  TSM: { name: "Taiwan Semiconductor", sector: "Semiconductors", type: "stock", color: "#e03c31", domain: "tsmc.com" },
  MU: { name: "Micron Technology", sector: "Semiconductors", type: "stock", color: "#0077c8", domain: "micron.com" },
  MCHP: { name: "Microchip Technology", sector: "Semiconductors", type: "stock", color: "#cc2229", domain: "microchip.com" },
  ASML: { name: "ASML Holding", sector: "Semiconductors", type: "stock", color: "#0f238c", domain: "asml.com" },
  PLTR: { name: "Palantir Technologies", sector: "AI / Government Tech", type: "stock", color: "#1ae5a1", domain: "palantir.com" },
  SMCI: { name: "Super Micro Computer", sector: "AI Infrastructure", type: "stock", color: "#ef4444", domain: "supermicro.com" },
  CRWV: { name: "CoreWeave", sector: "AI Cloud / GPU", type: "stock", color: "#22d3ee", domain: "coreweave.com" },

  // Quantum Computing
  RGTI: { name: "Rigetti Computing", sector: "Quantum Computing", type: "stock", color: "#818cf8", domain: "rigetti.com" },
  QBTS: { name: "D-Wave Quantum", sector: "Quantum Computing", type: "stock", color: "#2dd4bf", domain: "dwavesys.com" },
  IONQ: { name: "IonQ Inc.", sector: "Quantum Computing", type: "stock", color: "#6366f1", domain: "ionq.com" },

  // Space & Aerospace & Defense
  RKLB: { name: "Rocket Lab USA", sector: "Aerospace / Launch", type: "stock", color: "#a78bfa", domain: "rocketlabusa.com" },
  ASTS: { name: "AST SpaceMobile", sector: "Satellite / Telecom", type: "stock", color: "#fb923c", domain: "ast-science.com" },
  LUNR: { name: "Intuitive Machines", sector: "Lunar / Space", type: "stock", color: "#c4b5fd", domain: "intuitivemachines.com" },
  RDW: { name: "Redwire Corp.", sector: "Space Infrastructure", type: "stock", color: "#f472b6", domain: "redwirespace.com" },
  KTOS: { name: "Kratos Defense & Security", sector: "Defense / Drones", type: "stock", color: "#1e3a5f", domain: "kratosdefense.com" },
  LMT: { name: "Lockheed Martin", sector: "Defense / Aerospace", type: "stock", color: "#003366", domain: "lockheedmartin.com" },
  GE: { name: "GE Aerospace", sector: "Aerospace / Industrial", type: "stock", color: "#3d5a80", domain: "geaerospace.com" },

  // EV & Energy
  TSLA: { name: "Tesla Inc.", sector: "EV / Energy", type: "stock", color: "#e11d48", domain: "tesla.com" },
  RIVN: { name: "Rivian Automotive", sector: "EV", type: "stock", color: "#fbbf24", domain: "rivian.com" },
  LCID: { name: "Lucid Group", sector: "EV", type: "stock", color: "#7dd3fc", domain: "lucidmotors.com" },
  QS: { name: "QuantumScape", sector: "EV Battery Tech", type: "stock", color: "#06b6d4", domain: "quantumscape.com" },
  ARRY: { name: "Array Technologies", sector: "Clean Energy", type: "stock", color: "#f59e0b", domain: "arraytechinc.com" },
  ENPH: { name: "Enphase Energy", sector: "Solar", type: "stock", color: "#f97316", domain: "enphase.com" },

  // Fintech & Finance
  SQ: { name: "Block Inc.", sector: "Fintech", type: "stock", color: "#00d632", domain: "block.xyz" },
  COIN: { name: "Coinbase Global", sector: "Crypto Exchange", type: "stock", color: "#0052ff", domain: "coinbase.com" },
  HOOD: { name: "Robinhood Markets", sector: "Fintech", type: "stock", color: "#00c805", domain: "robinhood.com" },
  SOFI: { name: "SoFi Technologies", sector: "Fintech", type: "stock", color: "#00d4aa", domain: "sofi.com" },

  // Biotech & Healthcare
  MRNA: { name: "Moderna Inc.", sector: "Biotech", type: "stock", color: "#00a1e0", domain: "modernatx.com" },
  CRSP: { name: "CRISPR Therapeutics", sector: "Gene Editing", type: "stock", color: "#10b981", domain: "crisprtx.com" },

  // Other Growth
  NET: { name: "Cloudflare Inc.", sector: "Cybersecurity / CDN", type: "stock", color: "#f48120", domain: "cloudflare.com" },
  SNOW: { name: "Snowflake Inc.", sector: "Cloud Data", type: "stock", color: "#29b5e8", domain: "snowflake.com" },
  DDOG: { name: "Datadog Inc.", sector: "Cloud Monitoring", type: "stock", color: "#632ca6", domain: "datadoghq.com" },

  // Entertainment & Consumer
  DIS: { name: "Walt Disney Co.", sector: "Entertainment", type: "stock", color: "#006e99", domain: "disney.com" },
  SPOT: { name: "Spotify Technology", sector: "Streaming / Music", type: "stock", color: "#1db954", domain: "spotify.com" },
  CHWY: { name: "Chewy Inc.", sector: "E-Commerce / Pets", type: "stock", color: "#0b72b9", domain: "chewy.com" },
  AMC: { name: "AMC Entertainment", sector: "Entertainment / Cinema", type: "stock", color: "#ff0000", domain: "amctheatres.com" },
  DJT: { name: "Trump Media & Technology", sector: "Social Media", type: "stock", color: "#c41e3a", domain: "tmtgcorp.com" },

  // Retail & Restaurants
  AEO: { name: "American Eagle Outfitters", sector: "Retail / Apparel", type: "stock", color: "#1c3f6e", domain: "ae.com" },
  GME: { name: "GameStop Corp.", sector: "Retail / Gaming", type: "stock", color: "#e01e26", domain: "gamestop.com" },
  CBRL: { name: "Cracker Barrel", sector: "Restaurant", type: "stock", color: "#6b4226", domain: "crackerbarrel.com" },
  CAVA: { name: "Cava Group", sector: "Restaurant", type: "stock", color: "#00a499", domain: "cava.com" },
  TSCO: { name: "Tractor Supply Co.", sector: "Retail", type: "stock", color: "#e31837", domain: "tractorsupply.com" },
  LULU: { name: "Lululemon Athletica", sector: "Retail / Apparel", type: "stock", color: "#d31334", domain: "lululemon.com" },

  // Real Estate & Industrial
  MPW: { name: "Medical Properties Trust", sector: "REIT / Healthcare", type: "stock", color: "#0066b2", domain: "medicalpropertiestrust.com" },
  COMP: { name: "Compass Inc.", sector: "Real Estate Tech", type: "stock", color: "#000000", domain: "compass.com" },
  LEG: { name: "Leggett & Platt", sector: "Manufacturing", type: "stock", color: "#004c97", domain: "leggett.com" },

  // Cryptocurrency
  BTC: { name: "Bitcoin", sector: "Cryptocurrency", type: "crypto", color: "#f7931a", domain: "bitcoin.org" },
  ETH: { name: "Ethereum", sector: "Cryptocurrency", type: "crypto", color: "#627eea", domain: "ethereum.org" },
  SOL: { name: "Solana", sector: "Cryptocurrency", type: "crypto", color: "#9945ff", domain: "solana.com" },
  XRP: { name: "Ripple", sector: "Cryptocurrency", type: "crypto", color: "#23292f", domain: "ripple.com" },
  ADA: { name: "Cardano", sector: "Cryptocurrency", type: "crypto", color: "#0033ad", domain: "cardano.org" },
  DOGE: { name: "Dogecoin", sector: "Cryptocurrency", type: "crypto", color: "#c2a633", domain: "dogecoin.com" },
  AVAX: { name: "Avalanche", sector: "Cryptocurrency", type: "crypto", color: "#e84142", domain: "avax.network" },
  LINK: { name: "Chainlink", sector: "Cryptocurrency", type: "crypto", color: "#375bd2", domain: "chain.link" },
};

// ─── INTEL BRIEFS ───────────────────────────────────────────────────────────
// Per-ticker qualitative analysis: thesis, recent catalyst, key risk, what to watch

const INTEL = {
  // Tech Giants
  AAPL: {
    thesis: "Record Q1 revenue $143.8B (16% YoY) with iPhone $85.3B all-time high and Services $30B. Privacy-first AI approach via Apple Intelligence, but monetization slower than peers.",
    recent: "Q1 FY2026 EPS $2.84 (19% YoY); iPhone revenue $85.3B (+23% YoY); Services $30B (+14% YoY).",
    risk: "iPhone upgrade cycle potentially peaking; Apple Intelligence adoption slower than expected; regulatory pressure on App Store.",
    watch: "Siri integration with next-gen foundation models; Apple Intelligence feature rollout; Services revenue sustainability.",
  },
  MSFT: {
    thesis: "$625B commercial backlog (45% OpenAI-tied) with Azure growth 39%. Capex surged 66% to $37.5B in Q2 FY2026 — investors demanding near-term ROI proof.",
    recent: "Q2 FY2026 revenue $81.27B; Azure growth 39%; capex increased 66% for AI infrastructure. Stock down 14.4% post-earnings.",
    risk: "ROI timeline on massive AI capex uncertain; concentrated backlog with OpenAI creates execution risk.",
    watch: "Azure AI revenue acceleration; capex efficiency and data center utilization; Copilot adoption and pricing power.",
  },
  GOOGL: {
    thesis: "Cloud $17.7B (48% YoY) with backlog doubled to $240B. Gemini 750M MAUs with serving costs down 78% in 2025. But $175-185B capex guidance for 2026 rattled investors.",
    recent: "Q4 2025 revenue +18% YoY; Cloud revenue $17.7B (48% YoY); Gemini 750M MAUs; stock fell 3% despite revenue beat.",
    risk: "Massive capex increase with uncertain ROI; search facing AI-driven disruption; antitrust regulatory overhang.",
    watch: "Cloud revenue momentum and AI workload mix; Gemini monetization progress; capex efficiency vs. MSFT and AMZN.",
  },
  META: {
    thesis: "FY2025 revenue $200.97B (22% YoY). Delivering operating income growth despite $115-135B 2026 capex. Reality Labs lost $20B in 2025 with no clear path to profitability.",
    recent: "Q4 $22.77B net income (9% YoY); 2026 capex guidance $115-135B (up from $72B in 2025).",
    risk: "AI capex ROI unclear; ad efficiency gains may hit ceiling; Reality Labs continues $20B+ annual burn.",
    watch: "Llama 4.5 launch H1 2026; WhatsApp monetization ramp; AI-driven ad performance vs. capex spend.",
  },
  AMZN: {
    thesis: "AWS backlog $244B (40% YoY). $200B capex plan for 2026 unlocks capacity-constrained AI workloads. AWS growth 19% YoY amid constraints — should accelerate H2.",
    recent: "Q4 2024 revenue $187.8B (10% YoY); AWS $28.8B (19% YoY); operating income up 48%.",
    risk: "ROI on $200B capex uncertain; retail margin pressure; AWS growth deceleration if capacity doesn't unlock revenue.",
    watch: "H2 2026 AWS acceleration as new data centers come online; AI workload monetization vs. non-AI growth.",
  },

  // AI & Semiconductors
  NVDA: {
    thesis: "Blackwell ramp fastest in history — 70% of Q4 data center revenue. $500B+ purchase commitments through 2026. But China revenue fell $4B due to export controls.",
    recent: "Data center revenue up 73% YoY; B300 mid-cycle refresh on track for H2 2026.",
    risk: "Hyperscaler capex moderation or export restrictions could derail growth.",
    watch: "B300 (Blackwell Ultra) launch H2 2026; sustained hyperscaler capex above $3-4T annual AI infrastructure.",
  },
  AMD: {
    thesis: "MI300 series delivered $5B+ data center AI revenue in 2024 (94% YoY growth). But Q4 data center $3.86B missed by $280M — raising GPU competitiveness concerns vs. NVIDIA.",
    recent: "Q4 2024 revenue $7.7B; data center up 69% YoY to $3.9B but missed expectations.",
    risk: "Continued competitive pressure from NVIDIA; potential margin compression from aggressive pricing.",
    watch: "MI350 ramp in H2 2026; data center revenue growth vs. NVIDIA's Blackwell adoption.",
  },
  INTC: {
    thesis: "18A yields improving 7%/month hitting 65-75% range. Apple joined as first major external customer for entry-level chips. Still losing share in core PC/server to AMD.",
    recent: "18A in high-volume manufacturing with Panther Lake ramping; external customer commitments delayed to H2 2026.",
    risk: "Execution risk on 18A yields; TSMC N2 and Samsung 2nm could limit foundry share.",
    watch: "External foundry customer announcements H2 2026; Apple chip volume ramp vs. TSMC N2.",
  },
  AVGO: {
    thesis: "AI revenue doubled to $8.2B in Q1 FY2026 from custom AI accelerators and Ethernet switches. Diversified across semiconductors and software (47% YoY growth).",
    recent: "Q1 FY2025 revenue $14.92B (25% YoY); AI revenue $4.1B (77% YoY); software sales up 47%.",
    risk: "Concentration risk in top hyperscaler customers; AI infrastructure spending slowdown could pressure margins.",
    watch: "AI revenue trajectory toward full-year target; customer diversification beyond top 3 hyperscalers.",
  },
  TSM: {
    thesis: "Monopoly on advanced node manufacturing (3nm/2nm). AI chip demand driving record capacity utilization. $40B+ Arizona fab investment for geopolitical hedging.",
    recent: "Record revenue driven by AI chip demand; 3nm yields above expectations; Arizona fab on track.",
    risk: "Geopolitical Taiwan risk; customer concentration (AAPL + NVDA = ~35% revenue); cyclical demand risk.",
    watch: "2nm ramp timeline; Arizona fab production start; China export control impact on utilization.",
  },
  MU: {
    thesis: "HBM TAM growing 40% CAGR to $100B by 2028 — entire 2026 supply sold out. Industry-leading HBM4 ramping Q2 2026. Elevated $20B FY2026 capex.",
    recent: "Q1 FY2026 revenue $13.64B (57% YoY) with 37% gross margin; Q2 guidance $18.7B revenue and 68% gross margin.",
    risk: "HBM supply-demand imbalance could emerge in 2027+ if competitors ramp capacity faster.",
    watch: "HBM4 production yields at major AI chip customers; gross margin trajectory toward 68%.",
  },
  MCHP: {
    thesis: "Inventory normalization complete with exceptionally strong backlog and bookings. 15-20% organic revenue growth guided for FY2026. Still unprofitable on GAAP basis.",
    recent: "Q3 FY2026 revenue $1.19B (15.6% YoY); EPS $0.44 beat by $0.02; backlog $1.41B.",
    risk: "Cyclical automotive and industrial exposure; margin pressure from capacity expansion.",
    watch: "Turbojet engine production contracts Q2-Q3 2026; backlog conversion rate.",
  },
  ASML: {
    thesis: "EUV monopoly with $7.1B Q4 bookings ($3B EUV). Raised FY2026 guidance to \u20AC34-39B revenue with 51-53% gross margin. Announced \u20AC12B buyback.",
    recent: "FY2025 revenue \u20AC32B with EUV sales up 39% to \u20AC11.6B.",
    risk: "Export controls to China; semiconductor oversupply if AI capex slows.",
    watch: "High-NA EUV adoption timeline; sub-3nm node delivery schedules in 2026-27.",
  },
  PLTR: {
    thesis: "AIP platform drove U.S. commercial revenue up 64% YoY to $214M. Nearly 5x customer count vs. 3 years ago. But 40x+ sales valuation demands perfection.",
    recent: "Q4 2024 revenue $827.5M (36% YoY); U.S. commercial up 64%; gross margin 78.9%.",
    risk: "Valuation at 40x+ sales; slowdown in commercial adds or government budget cuts pressure growth.",
    watch: "AIP adoption metrics and bootcamp-to-paid conversion rates; international expansion progress.",
  },
  SMCI: {
    thesis: "Q2 FY2026 revenue $12.68B (100%+ YoY) smashed estimates. Raised full-year guidance to $40B+. But margins declining and customer concentration risk remains.",
    recent: "Q2 FY2026 revenue $12.68B beat consensus $10.43B; Q3 guidance $12.3B revenue.",
    risk: "Margin compression from pricing competition; high customer concentration in AI infrastructure.",
    watch: "Liquid cooling adoption trajectory; market share defense as Dell/HPE ramp AI servers.",
  },
  CRWV: {
    thesis: "Contracted revenue backlog exceeds $55B (vs. market cap). 90%+ YoY growth targeting $10B+ revenue in 2026. Aggressive capex doubling burns cash before profitability.",
    recent: "Revenue backlog exceeded $55B as of Sept 2025; next earnings Feb 18, 2026.",
    risk: "Cash burn and need for additional capital raises; customer concentration; reliance on AI compute demand.",
    watch: "Execution on doubling capex in 2026; backlog-to-revenue conversion; GPU supply chain constraints.",
  },

  // Quantum Computing
  QBTS: {
    thesis: "Only company building both annealing and gate-model quantum. Cash $836M provides runway. But revenue only $3.7M/quarter — profitability years away.",
    recent: "Q3 2025 revenue $3.7M (100% YoY); YTD 9-month revenue $21.8M (235% YoY).",
    risk: "Commercial viability timeline uncertain; cash burn could require dilution before revenue scales.",
    watch: "Commercial customer conversion from pilots to production; gate-model competitive positioning.",
  },
  RGTI: {
    thesis: "Secured $8.4M India order for 108-qubit system. Roadmap targets 1,000+ qubits by 2027. Q3 revenue $1.9M (-18% YoY) with $20.5M operating loss.",
    recent: "Q3 2025 revenue $1.9M (-18% YoY); $5.7M in new Novera orders for H1 2026 delivery.",
    risk: "Execution risk on qubit roadmap; $8.4B valuation requires flawless execution; profitability 4-5 years away.",
    watch: "100+ qubit chiplet delivery and 150+ qubit system by end-2026; fidelity improvements to 99.7%.",
  },
  IONQ: {
    thesis: "Q3 revenue $39.9M (222% YoY); raised FY2025 to $106-110M. Achieved 99.99% two-qubit gate fidelity. But P/S >150x with operating costs 7x revenue.",
    recent: "Q3 2025 revenue $39.9M (222% YoY); raised guidance; AQ 64 fidelity milestone.",
    risk: "Valuation priced for perfection; profitability years away; cash burn with operating costs 7x revenue.",
    watch: "256-qubit system integration (Oxford Ionics architecture); government/defense contract wins.",
  },

  // Space & Defense
  RKLB: {
    thesis: "Q3 revenue $155M (48% YoY) with record 37% gross margin and 49 launches on backlog. Neutron critical tank rupture threatens mid-2026 launch timeline.",
    recent: "Q3 2025 revenue $155M (48% YoY); Q4 guidance $170-180M with 37-39% margins.",
    risk: "Neutron launch delays beyond Q2 2026 could erode confidence; Electron capacity constraints.",
    watch: "Neutron tank testing results and revised launch timeline; Electron cadence ramp.",
  },
  ASTS: {
    thesis: "BlueBird 6 (2,400 sq ft, 10x capacity) launched Dec 2025 at 120 Mbps. Targeting 45-60 satellites by end-2026. Cash burn significant before commercial service.",
    recent: "BlueBird 6 successfully launched Dec 2025; 10x capacity vs. prior satellites.",
    risk: "Satellite deployment delays or technical failures; capital requirements for full constellation.",
    watch: "Launch cadence of 1-2 satellites/month through 2026; commercial service activation timeline.",
  },
  LUNR: {
    thesis: "Leading lunar lander company with NASA CLPS contracts. IM-2 mission scheduled for 2026 with multiple payloads. Revenue lumpy and mission-dependent.",
    recent: "IM-2 mission preparations underway; multiple NASA and commercial payload contracts secured.",
    risk: "Mission failure risk; lumpy revenue tied to launch cadence; competitive pressure from SpaceX and others.",
    watch: "IM-2 mission success; follow-on CLPS contract awards; commercial payload pipeline.",
  },
  RDW: {
    thesis: "Space infrastructure provider with growing on-orbit servicing capabilities. Revenue growing but profitability remains elusive with heavy R&D investment.",
    recent: "Multiple on-orbit assembly and manufacturing contracts; expanding capabilities in space infrastructure.",
    risk: "Small revenue base; execution risk on complex space hardware; government budget dependency.",
    watch: "On-orbit demonstration missions; contract win rate; path to positive EBITDA.",
  },
  KTOS: {
    thesis: "Valkyrie drone became Marines program of record. Backlog $1.41B with 15-20% organic growth guided for FY2026-27. Trades at 800x trailing earnings.",
    recent: "Q3 2025 revenue $347.6M; backlog $1.41B; guided 15-20% FY2026 and 18-23% FY2027 growth.",
    risk: "Profitability timeline uncertain; cash burn from facility expansion; high valuation vs. earnings.",
    watch: "Turbojet engine production contracts Q2-Q3 2026; backlog conversion and EBITDA margin expansion ~100bps.",
  },
  LMT: {
    thesis: "Record $194B backlog; 25%+ YoY operating profit growth expected in 2026. Delivered 191 F-35s and 120 PAC-3 interceptors (both records).",
    recent: "Guided ~5% revenue growth in 2026 with $6.5-6.8B FCF; 35% YoY capex increase.",
    risk: "Government budget cuts or slowdown in international orders; supply chain and labor constraints.",
    watch: "F-35 production ramp and international orders; missile defense expansion across 5 states.",
  },
  GE: {
    thesis: "LEAP and GEnx engines sold out through end of decade. Targeting ~2,000 LEAP deliveries in 2026 with 27% revenue growth.",
    recent: "Q3 2025 revenue $11.3B (26% YoY); EPS $1.66 (14% beat); raised FY EPS to $6.00-6.20.",
    risk: "Supply chain constraints limiting engine deliveries; cyclical exposure to air travel demand.",
    watch: "LEAP delivery ramp toward 2,000 units; Commercial Engines & Services growth vs. Defense segment.",
  },

  // EV & Energy
  TSLA: {
    thesis: "FSD unsupervised launching Austin June 2025. $2B xAI investment signals AI leadership. But first annual delivery decline (1.8M units) with margin at 6.2%.",
    recent: "Q4 deliveries 495K; FY 1.8M (first annual decline); FSD unsupervised service launching Austin June 2025.",
    risk: "FSD regulatory approval delays; EV demand slowdown; intensifying competition from BYD and legacy OEMs.",
    watch: "Austin FSD launch success and regulatory expansion; operating margin trajectory; 2026 delivery guidance.",
  },
  RIVN: {
    thesis: "R2 SUV targets mass market at $45K starting 2026. VW joint venture provides $5.8B in funding. But burning $1.5B+ cash/quarter with negative margins.",
    recent: "R2 production preparations at Normal, IL factory; VW partnership delivering software synergies.",
    risk: "Cash burn rate; R2 production ramp execution; competitive EV pricing pressure.",
    watch: "R2 production start and reservation-to-order conversion; gross margin trajectory toward breakeven.",
  },
  LCID: {
    thesis: "Gravity SUV launched late 2025 at $79,900. PIF backing provides capital runway. Technology leadership (500+ mile range) but minimal deliveries.",
    recent: "Gravity SUV deliveries began; expanding production capacity at Arizona factory.",
    risk: "Low production volumes; heavy cash burn; luxury EV market saturation.",
    watch: "Gravity delivery ramp; production efficiency improvements; path to positive gross margin.",
  },
  QS: {
    thesis: "Eagle Line pilot facility inaugurating Feb 2026. QSE-5 enables 500+ mile range with 15-min charging. But 2026 revenue only $4M — profitability years away.",
    recent: "Eagle Line facility launching Feb 2026; cash $797.5M; PowerCo expanded collaboration with $131M milestones.",
    risk: "Manufacturing scale-up execution; Toyota 2027-28 solid-state timeline and BYD cost advantages.",
    watch: "Eagle Line pilot yields and production metrics; commercial battery shipments; competitor timelines.",
  },
  ARRY: {
    thesis: "Raised FY2025 guidance to $1.25-1.28B revenue with $185-195M EBITDA. $1.9B backlog mostly domestic. ITC expiration end-2025 creates 2026 demand cliff.",
    recent: "Q3 revenue and volume up 70% and 56% YoY; backlog $1.9B; raised full-year guidance.",
    risk: "Solar ITC expiration creates 2026 headwind; trade policy uncertainty; project execution risks.",
    watch: "Q4 FY2025 earnings Feb 25 with 2026 guidance; ITC extensions; EPC contract wins or cancellations.",
  },
  ENPH: {
    thesis: "Micro-inverter market leader facing severe demand downturn. IQ8 transition and battery attach rates key. Residential solar install rates recovering slowly.",
    recent: "Revenue declining amid solar installation slowdown; inventory normalization ongoing.",
    risk: "Prolonged residential solar downturn; market share loss to cheaper string inverters; policy uncertainty.",
    watch: "Quarterly install rate recovery; IQ8 adoption; battery storage attach rate trends.",
  },

  // Fintech
  SQ: {
    thesis: "Block (Cash App + Square) ecosystem serving 57M+ monthly transacting actives. Profitable but growth decelerating. Bitcoin holdings add volatility.",
    recent: "Cash App ecosystem growing; Square GPV recovering; Bitcoin strategy ongoing.",
    risk: "Fintech competition from PayPal, Apple Pay; consumer spending slowdown; Bitcoin exposure.",
    watch: "Cash App monetization per user; Square seller growth; gross profit growth acceleration.",
  },
  COIN: {
    thesis: "Leading U.S. crypto exchange positioned for institutional adoption. Spot Bitcoin ETFs drove record volumes. Revenue highly correlated to crypto prices.",
    recent: "Benefiting from spot BTC and ETH ETF launches; regulatory environment improving.",
    risk: "Crypto bear market decimates volumes; regulatory uncertainty; competition from Robinhood and traditional brokers.",
    watch: "Institutional adoption metrics; crypto ETF volume sustainability; staking and other services.",
  },
  HOOD: {
    thesis: "Robinhood expanding beyond trading into wealth management and crypto. 24M funded accounts with growing ARPU. Crypto revenue volatile but meaningful.",
    recent: "Record revenue and profitability; crypto trading surging; launching new financial products.",
    risk: "Revenue concentration in volatile crypto trading; regulatory risk; competition from established brokers.",
    watch: "ARPU growth trajectory; wealth management product adoption; crypto revenue durability.",
  },
  SOFI: {
    thesis: "Full-stack digital bank with lending, investing, and banking products. 10M+ members growing. Path to sustained profitability through cross-selling.",
    recent: "Member growth accelerating; lending volumes recovering; banking deposits growing.",
    risk: "Credit quality deterioration if economy weakens; student loan policy changes; interest rate sensitivity.",
    watch: "Member growth and cross-sell metrics; credit performance; net interest margin trajectory.",
  },

  // Biotech
  MRNA: {
    thesis: "mRNA platform beyond COVID: RSV vaccine approved, cancer vaccines in Phase 3. $9B+ cash. But COVID revenue collapsed and pipeline execution is critical.",
    recent: "RSV vaccine Mresvia gaining market share; cancer vaccine mRNA-4157 in pivotal trials.",
    risk: "Pipeline failure risk; COVID revenue continued decline; competition from Pfizer and GSK.",
    watch: "Cancer vaccine Phase 3 readouts; RSV market share vs. GSK/Pfizer; pipeline milestones.",
  },
  CRSP: {
    thesis: "Casgevy (gene therapy for SCD/beta-thal) approved and launching. First CRISPR-based therapy on market. Revenue ramp is key question.",
    recent: "Casgevy treatment centers expanding; first commercial patients treated.",
    risk: "Slow patient enrollment; high treatment costs limiting adoption; competition from bluebird bio.",
    watch: "Casgevy patient starts and treatment center expansion; pipeline advancement; revenue ramp.",
  },

  // Cloud & Cyber
  NET: {
    thesis: "Cloudflare expanding from CDN to full cloud platform. 35%+ revenue growth with improving margins. Developer-first approach gaining enterprise traction.",
    recent: "Revenue growth ~30% YoY; enterprise customer adds accelerating; AI workload opportunities emerging.",
    risk: "Competition from AWS/Azure/GCP; enterprise sales cycle elongation; valuation premium.",
    watch: "Enterprise customer growth rate; AI-related product adoption; operating margin expansion.",
  },
  SNOW: {
    thesis: "Data cloud platform with growing AI/ML workloads. Product revenue growth ~25% but decelerating. Cortex AI features driving new use cases.",
    recent: "Product revenue growth stabilizing; Cortex AI and Snowpark driving engagement.",
    risk: "Growth deceleration; competition from Databricks; consumption model sensitivity to macro.",
    watch: "Product revenue growth reacceleration; Cortex AI adoption; net revenue retention rate.",
  },
  DDOG: {
    thesis: "Observability platform expanding into security and AI monitoring. 30%+ revenue growth with best-in-class retention. AI workload monitoring is emerging catalyst.",
    recent: "Strong enterprise adoption; AI monitoring products gaining traction; expanding product portfolio.",
    risk: "Competitive pressure from Splunk (Cisco), New Relic; enterprise spending rationalization.",
    watch: "AI monitoring product adoption; enterprise deal sizes; operating margin expansion.",
  },

  // Entertainment & Consumer
  DIS: {
    thesis: "Streaming profitable at $450M Q1 operating income (72% YoY). ESPN/NFL partnership with 10% equity stake unlocks monetization. Linear TV decline continues.",
    recent: "Q1 2026 sports revenue $4.91B but operating income -23% YoY due to YouTube TV dispute.",
    risk: "Linear TV deteriorating; streaming competition; sports rights costs escalating faster than revenue.",
    watch: "ESPN Unlimited subscriber adoption; streaming margin toward 10% FY2026 target.",
  },
  SPOT: {
    thesis: "281M subscribers (12% YoY), 713M MAUs. Operating income $582M with 31.6% gross margin. Shifting to margin expansion focus.",
    recent: "Q3 2025 revenue \u20AC4.3B (12% cc); Q4 guidance 289M subscribers and \u20AC4.5B revenue.",
    risk: "Music licensing cost inflation; competition from Apple Music and YouTube Music.",
    watch: "Q4 2025 earnings Feb 10; audiobook/podcast monetization; margin expansion trajectory.",
  },
  CHWY: {
    thesis: "One-third online pet supply share (matching Amazon). $600 annual revenue per loyal customer. Forward P/E only 22x. But net margin compressed to 1.6%.",
    recent: "Q3 FY2026 revenue $3.1B (8.3% YoY); $59.2M net income ($0.14 EPS).",
    risk: "Margin compression from Amazon/Walmart competition; pet spending slowdown.",
    watch: "Net margin trajectory back toward 3-4%; customer retention; competitive pricing dynamics.",
  },
  AMC: {
    thesis: "Refinanced $223M 2026 debt and converted $337M to equity. No annual profit since 2018. Box office still 29% below 2019 levels.",
    recent: "Refinancing completed; Q4 FY2025 earnings scheduled Feb 24, 2026.",
    risk: "Structural decline in theatrical attendance; streaming competition; sustained unprofitability.",
    watch: "Feb 24 earnings; full-year 2025 profitability; box office recovery vs. 2019 baseline.",
  },
  DJT: {
    thesis: "Diversifying beyond Truth Social into investment products, crypto tokens, and $6B+ TAE merger. Limited revenue with ongoing losses.",
    recent: "Launched Truth Social-branded SMAs and digital token airdrop (Feb 2 record date); $6B+ all-stock TAE merger signed.",
    risk: "Revenue generation unproven; TAE merger execution risk; political event risk.",
    watch: "TAE merger closing mid-2026; Truth Predict platform traction; token engagement metrics.",
  },

  // Retail & Restaurants
  AEO: {
    thesis: "Q3 record revenue $1.36B (6% YoY) with EPS $0.53 beating by $0.10. 2.2% dividend yield. But facing $50M tariff headwind in Q4.",
    recent: "Q3 2025 revenue $1.36B (6% YoY); $20M tariff impact Q3, expecting $50M Q4.",
    risk: "Tariff costs escalating faster than pricing power; gross margin compression.",
    watch: "Q4 earnings and guidance; tariff cost pass-through ability; market share vs. fast fashion.",
  },
  GME: {
    thesis: "$9B cash and securities plus $519M Bitcoin. Collectibles revenue up 54.6% YoY. But core hardware -31.7% and software -26.7%. Wall Street consensus 'Sell' at $13.50.",
    recent: "Q3 2025 EPS $0.24 (beat 33%); cash $9B (up from $4.6B YoY); YTD FCF $410M.",
    risk: "Core gaming sales declining; reliance on volatile crypto holdings; turnaround strategy unclear.",
    watch: "Collectibles segment momentum; Bitcoin holdings management; core gaming stabilization.",
  },
  CBRL: {
    thesis: "Implementing $20-25M G&A cuts and $12-16M advertising cuts. EBITDA guidance slashed to $70-110M from $150-190M. Traffic down 8-10% expected FY2026.",
    recent: "Q1 FY2026 revenue $797.2M (-5.7% YoY); adjusted EBITDA $7.2M (0.9% margin).",
    risk: "Structural traffic decline in casual dining; cost cuts could degrade guest experience.",
    watch: "March 3 earnings; traffic trends vs. -8 to -10% guidance; cost reduction effectiveness.",
  },
  CAVA: {
    thesis: "16%+ unit growth guided for 2026 with low-to-mid single-digit SSS. Restaurant-level profit margin 24.6%. Nearly 5x customer count growth.",
    recent: "Q3 2025 adjusted EBITDA $40M (13.7% margin, up 19.6% YoY); restaurant-level margin 24.6%.",
    risk: "Unit growth execution; tariff-driven food cost inflation; competitive Mediterranean fast-casual.",
    watch: "Feb 24 Q4 earnings with 2026 guidance; restaurant-level margin trajectory; menu pricing power.",
  },
  TSCO: {
    thesis: "Guided 4-6% revenue growth for 2026 with 1-3% comps. Operating margin 9.3-9.6%. Tariffs and transportation crimped margins; inventory up 5%/store.",
    recent: "FY2025 sales $15.52B; FY2026 guidance $16.1-16.5B revenue with EPS $2.13-2.23.",
    risk: "Tariff-related cost inflation; rural consumer spending sensitivity; inventory challenges.",
    watch: "Quarterly comp trends; gross margin expansion H2 2026; new store openings.",
  },
  LULU: {
    thesis: "Trading at 12x forward earnings despite global brand awareness in single-digits outside NA. China expansion opportunity. Q4 guidance disappointed (-14% stock decline).",
    recent: "Updated guidance at ICR Conference Jan 2026; JPMorgan raised Q4 EPS but guidance underwhelmed.",
    risk: "U.S. consumer pushback on pricing; athleisure competition; tariff margin pressure.",
    watch: "March 25 earnings with full-year guidance; China expansion progress; gross margin under tariffs.",
  },

  // Real Estate & Industrial
  MPW: {
    thesis: "Raised quarterly dividend 12% to $0.09/share. Targeting $1B+ annualized cash rent by end-2026. But forward yield 6.45% signals market skepticism.",
    recent: "Dividend raised 12%; rebranding to MPT with ticker change effective Feb 2, 2026.",
    risk: "Healthcare tenant bankruptcies; elevated leverage and refinancing risk.",
    watch: "Progress toward $1B+ rent target; tenant health and occupancy; balance sheet deleveraging.",
  },
  COMP: {
    thesis: "Real estate tech platform with agent-centric model. Revenue tied to housing transaction volume. Rate cuts could catalyze recovery.",
    recent: "Housing market showing early signs of recovery; agent count stabilizing.",
    risk: "Housing market sensitivity to mortgage rates; competition from traditional brokerages; profitability elusive.",
    watch: "Housing transaction volume recovery; agent productivity metrics; path to profitability.",
  },
  LEG: {
    thesis: "Restructuring plan nearly complete with improved margins and reduced SG&A. 36.81% 90-day return. DCF suggests fair value ~$10.48.",
    recent: "Share price $12.19 with strong recent return; Q4 FY2025 earnings Feb 11-12, 2026.",
    risk: "Declining bedding and furniture markets; restructuring benefits may already be priced in.",
    watch: "Feb 11-12 earnings for margin trajectory; normalized volume recovery; incremental earnings.",
  },

  // Crypto
  BTC: {
    thesis: "Institutional ETFs and corporate treasuries absorbing supply. Fed dovish expectations support store-of-value narrative. Some targets $150-225K, but near-term technically bearish.",
    recent: "Trading $70-95K range in Feb 2026; bearish near-term technicals.",
    risk: "Fed hawkishness; ETF outflows if risk assets normalize; regulatory crackdowns.",
    watch: "Quarterly ETF inflows (target $10B+); Fed rate decisions; exchange balance declines as supply tightens.",
  },
  ETH: {
    thesis: "Standard Chartered raised target to $7,500. Institutional ETF flows and staking reducing liquid supply. But underperforming Bitcoin in current cycle.",
    recent: "Trading $2,000-2,500; ETFs acquired ~3.8% of all ETH since June.",
    risk: "Layer-2 solutions cannibalizing L1 fees; competitive smart contract platforms; staking regulation.",
    watch: "ETF inflows vs. BTC ETFs; network upgrades and DeFi TVL trends; corporate treasury adoption.",
  },
  SOL: {
    thesis: "Bitwise ETF absorbed 78% of net SOL ETF inflows. Low gas fees enable micropayments. Standard Chartered cut target to $250 from $310.",
    recent: "Forecasts range $92-192 for Feb 2026; high volatility expected.",
    risk: "Network outage history; competitive pressure from Ethereum L2s; retail sentiment extremely bearish.",
    watch: "ETF inflow sustainability; network uptime; stablecoin payment adoption on Solana.",
  },
  XRP: {
    thesis: "Regulatory clarity post-SEC settlement. $1.37B flowed into XRP ETFs since Nov 2025 launch. Standard Chartered targets $8 by end-2026 (300%+ upside).",
    recent: "Trading $1.50-1.80; consensus average forecast $3.90.",
    risk: "Primarily a trading asset rather than payment utility; Ripple's ODL adoption slower than expected.",
    watch: "ETF inflow momentum; Ripple institutional partnerships and ODL volumes; SWIFT integration.",
  },
  ADA: {
    thesis: "CME futures launch Feb 9, 2026 signals institutional validation. Energy-efficient PoS with scientific peer-review approach. DeFi/RWA roadmap for 2026.",
    recent: "Feb 2026 forecasts $0.26-0.28 near-term; optimistic targets $0.49-0.55.",
    risk: "Development pace slower than competitors; DeFi ecosystem smaller than ETH/SOL; weak retail sentiment.",
    watch: "CME futures volume; DeFi TVL growth and RWA tokenization; network upgrade timelines.",
  },
  DOGE: {
    thesis: "REX-Osprey DOGE ETF launched Sept 2025. Experienced largest January inflows. Payment integration potential — but no fundamental utility.",
    recent: "Trading $0.09-0.12; full-year forecasts $0.15-1.25 depending on meme cycle.",
    risk: "No fundamental utility; entirely sentiment-driven; newer meme coins stealing attention.",
    watch: "ETF inflow trends; social media sentiment; payment adoption (Tesla accepting DOGE).",
  },
  AVAX: {
    thesis: "RWA tokenization TVL $1.3B (68.6% growth Q4 2025) with BlackRock and FIS. VanEck ETF launched Jan 27 with early inflows. 4,500+ TPS throughput.",
    recent: "VanEck AVAX ETF launched Jan 27 with $1.24M net inflows by Jan 31.",
    risk: "RWA market could consolidate on fewer chains; Ethereum L2 competition; regulatory uncertainty.",
    watch: "ETF inflow growth; institutional RWA project announcements; subnet deployment metrics.",
  },
  LINK: {
    thesis: "$27.4T total value secured. CCIP revolutionizing cross-chain interoperability. Neutral positioning benefits from multi-chain RWA adoption.",
    recent: "Total value secured near $27.4T; CCIP enabling cross-chain value/data exchange.",
    risk: "Competition from native bridge solutions; unclear token economics and value capture.",
    watch: "CCIP adoption metrics and transaction volumes; new blockchain integrations; RWA project wins.",
  },
};

// ─── SEEDED RNG + SYNTHETIC FALLBACK ─────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateAssetData(ticker) {
  const rng = seededRandom(ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + Math.floor(Date.now() / 86400000));
  const r = () => rng();
  const asset = ASSETS[ticker];
  const isCrypto = asset?.type === "crypto";

  const basePrice = isCrypto
    ? (ticker === "BTC" ? 85000 + r() * 25000 : ticker === "ETH" ? 2500 + r() * 1500 : 100 + r() * 200)
    : 5 + r() * 400;
  const changePercent = (r() - 0.42) * 10;
  const price = basePrice * (1 + changePercent / 100);

  const dims = {
    fundamentals: { profitMargin: 50, revenueGrowth: 50, debtToEquity: 50, returnOnEquity: 50, earningsGrowth: 50, freeCashFlow: 50 },
    technicals: { rsi: 50, macdSignal: 50, bollingerPos: 50, volumeTrend: 50, smaAlignment: 50, trendStrength: 50 },
    valuation: { peRatio: 50, priceToBook: 50, dividendYield: 50, fiftyTwoWeekPos: 50, targetUpside: 50, pegRatio: 50 },
    momentum: { return1W: 50, return1M: 50, return3M: 50, return6M: 50, return1Y: 50, trendConsistency: 50 },
    analyst: { consensus: 50, targetUpside: 50, analystCoverage: 50, shortInterest: 50, institutionalOwnership: 50 },
  };

  const priceHistory = [];
  let p = price * 0.4;
  for (let i = 1825; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    p *= 1 + (r() - 0.47) * 0.025;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    priceHistory.push({ date: `${yyyy}-${mm}-${dd}`, price: +p.toFixed(2), volume: Math.floor(5e5 + r() * 8e7) });
  }

  const avg = (obj) => { const vals = Object.values(obj).filter(v => v != null); return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 50; };

  const radarData = [
    { dimension: "Fundamentals", value: avg(dims.fundamentals), fullMark: 100 },
    { dimension: "Technicals", value: avg(dims.technicals), fullMark: 100 },
    { dimension: "Valuation", value: avg(dims.valuation), fullMark: 100 },
    { dimension: "Momentum", value: avg(dims.momentum), fullMark: 100 },
    { dimension: "Analyst", value: avg(dims.analyst), fullMark: 100 },
  ];

  return {
    ticker, ...asset, price: +price.toFixed(2), changePercent: +changePercent.toFixed(2),
    marketCap: `$${(price * (5e7 + r() * 3e10) / 1e9).toFixed(1)}B`,
    volume24h: `${(0.5 + r() * 60).toFixed(1)}M`,
    ...dims, priceHistory, radarData,
    compositeScore: +avg(radarData.map(d => d.value)).toFixed(1),
    signal: "neutral",
    briefing: `${asset?.name} — Synthetic data. Run RUN_MARKET_UPDATE.bat for real scores.`,
    _synthetic: true,
  };
}

// ─── TECHNICAL INDICATORS ───────────────────────────────────────────────────

function computeEMA(prices, period) {
  const k = 2 / (period + 1);
  const ema = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function computeRSI(history, period = 14) {
  if (!history || history.length < period + 1) return null;
  const prices = history.map(h => h.price);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[prices.length - period - 1 + i] - prices[prices.length - period - 1 + i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeMACD(history) {
  if (!history || history.length < 35) return null;
  const prices = history.map(h => h.price);
  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = computeEMA(macdLine.slice(26), 9);
  const latest = macdLine.length - 1;
  const sigIdx = signalLine.length - 1;
  return {
    macdLine: macdLine[latest],
    signalLine: signalLine[sigIdx],
    histogram: macdLine[latest] - signalLine[sigIdx],
  };
}

function computeBollingerPosition(history, period = 20) {
  if (!history || history.length < period) return null;
  const prices = history.slice(-period).map(h => h.price);
  const mean = prices.reduce((s, v) => s + v, 0) / prices.length;
  const std = Math.sqrt(prices.reduce((s, v) => s + (v - mean) ** 2, 0) / prices.length);
  if (std === 0) return 50;
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const current = prices[prices.length - 1];
  return Math.max(0, Math.min(100, ((current - lower) / (upper - lower)) * 100));
}

function computeSMAAlignment(history) {
  if (!history || history.length < 200) return null;
  const prices = history.map(h => h.price);
  const sma = (arr, p) => arr.slice(-p).reduce((s, v) => s + v, 0) / p;
  const sma20 = sma(prices, 20);
  const sma50 = sma(prices, 50);
  const sma200 = sma(prices, 200);
  const current = prices[prices.length - 1];
  let score = 50;
  if (current > sma20) score += 12.5;
  if (sma20 > sma50) score += 12.5;
  if (sma50 > sma200) score += 12.5;
  if (current > sma200) score += 12.5;
  if (current < sma20) score -= 12.5;
  if (sma20 < sma50) score -= 12.5;
  if (sma50 < sma200) score -= 12.5;
  if (current < sma200) score -= 12.5;
  return Math.max(0, Math.min(100, score));
}

function computeVolumeTrend(history, window = 20) {
  if (!history || history.length < window * 2) return null;
  const recent = history.slice(-window);
  const prior = history.slice(-window * 2, -window);
  const avgRecent = recent.reduce((s, h) => s + (h.volume || 0), 0) / recent.length;
  const avgPrior = prior.reduce((s, h) => s + (h.volume || 0), 0) / prior.length;
  if (avgPrior === 0) return 50;
  return avgRecent / avgPrior;
}

function computeMomentumReturns(history) {
  if (!history || history.length < 2) return {};
  const current = history[history.length - 1].price;
  const getReturn = (days) => {
    const idx = Math.max(0, history.length - 1 - days);
    const past = history[idx].price;
    return past > 0 ? ((current - past) / past) * 100 : null;
  };
  return {
    return1W: getReturn(5),
    return1M: getReturn(21),
    return3M: getReturn(63),
    return6M: getReturn(126),
    return1Y: getReturn(252),
  };
}

function computeTrendConsistency(history, days = 90) {
  if (!history || history.length < days) return null;
  const slice = history.slice(-days);
  let upDays = 0;
  for (let i = 1; i < slice.length; i++) {
    if (slice[i].price > slice[i - 1].price) upDays++;
  }
  return (upDays / (slice.length - 1)) * 100;
}

// ─── NORMALIZATION & SCORING ────────────────────────────────────────────────

function normalizeMetric(value, min, max, invert = false) {
  if (value == null || isNaN(value)) return null;
  const clamped = Math.max(min, Math.min(max, value));
  const score = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - score : score;
}

function scoreRSI(rsi) {
  if (rsi == null) return null;
  // Ideal RSI is near 50; overbought (>70) and oversold (<30) are penalized
  const distance = Math.abs(rsi - 50);
  return Math.max(0, 100 - distance * 2);
}

function scoreMACD(macd) {
  if (!macd) return null;
  // Positive histogram = bullish, normalize roughly
  const hist = macd.histogram;
  if (hist > 0) return Math.min(100, 50 + hist * 10);
  return Math.max(0, 50 + hist * 10);
}

function scoreVolume(ratio) {
  if (ratio == null) return null;
  // ratio > 1 = increasing volume (bullish), < 1 = declining
  return Math.max(0, Math.min(100, ratio * 50));
}

function scoreTrend(history) {
  if (!history || history.length < 50) return null;
  const prices = history.map(h => h.price);
  const current = prices[prices.length - 1];
  const p50ago = prices[Math.max(0, prices.length - 50)];
  const trendPct = ((current - p50ago) / p50ago) * 100;
  return Math.max(0, Math.min(100, 50 + trendPct * 2));
}

function normalizeReturn(ret) {
  if (ret == null) return null;
  // Map -30% .. +50% to 0..100
  return Math.max(0, Math.min(100, ((ret + 30) / 80) * 100));
}

function scoreRecommendation(key) {
  if (!key) return null;
  const map = { strong_buy: 95, buy: 80, overweight: 70, hold: 50, underweight: 35, sell: 20, strong_sell: 5 };
  return map[key] ?? 50;
}

function normalizeUpside(data) {
  if (!data.targetMeanPrice || !data.price || data.price === 0) return null;
  const upside = ((data.targetMeanPrice - data.price) / data.price) * 100;
  // Map -50% .. +100% upside to 0..100
  return Math.max(0, Math.min(100, ((upside + 50) / 150) * 100));
}

function normalize52wk(data) {
  if (!data.fiftyTwoWeekHigh || !data.fiftyTwoWeekLow || data.fiftyTwoWeekHigh === data.fiftyTwoWeekLow) return null;
  // How far into the 52-week range we are (higher = closer to high)
  return ((data.price - data.fiftyTwoWeekLow) / (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow)) * 100;
}

// ─── RAW DISPLAY FORMATTERS ─────────────────────────────────────────────────

function fmtPct(v) { return v != null ? `${(v * 100).toFixed(1)}%` : "N/A"; }
function fmtRatio(v) { return v != null ? v.toFixed(1) + "x" : "N/A"; }
function fmtNum(v, dec = 1) { return v != null ? v.toFixed(dec) : "N/A"; }
function fmtDollar(v) {
  if (v == null) return "N/A";
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}
function fmtRetPct(v) { return v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : "N/A"; }

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function relativeTime(date, now) {
  if (!date) return "";
  const diff = Math.floor((now - date) / 1000);
  if (diff < 0) return "just now";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── THEME ───────────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#06080e",
  bgPanel: "#080b12",
  card: "#0b0f18",
  cardBorder: "#131a2b",
  cardHover: "#161e30",
  accent: "#00e5a0",
  accentDim: "#00e5a033",
  danger: "#ff4d6a",
  warn: "#ffb347",
  textPrimary: "#e8edf8",
  textSecondary: "#7a86a6",
  textDim: "#3d4663",
  gridLine: "#111827",
};

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

// ─── SCORE GRADE + INTEL TOOLTIP ─────────────────────────────────────────────

function getGradeInfo(score) {
  if (score > 80) return { grade: "A+", label: "Exceptional", color: COLORS.accent };
  if (score > 70) return { grade: "A", label: "Strong", color: COLORS.accent };
  if (score > 60) return { grade: "B+", label: "Above Avg", color: "#a3e635" };
  if (score > 50) return { grade: "B", label: "Average", color: COLORS.warn };
  if (score > 40) return { grade: "C", label: "Below Avg", color: COLORS.warn };
  return { grade: "D", label: "Weak", color: COLORS.danger };
}

function IntelSection({ icon, label, text, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: color || COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function ScoreTooltip({ data, anchor = "bottom", align = "right" }) {
  const { grade, label, color } = getGradeInfo(data.compositeScore);
  const intel = INTEL[data.ticker];
  const dims = (data.radarData || []).filter(d => d.value != null);

  const posStyle = {
    position: "absolute",
    [anchor === "bottom" ? "top" : "bottom"]: "calc(100% + 8px)",
    width: 320,
  };
  if (align === "center") { posStyle.left = "50%"; posStyle.transform = "translateX(-50%)"; }
  else { posStyle.right = 0; }

  return (
    <div style={{
      ...posStyle,
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 10,
      padding: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      zIndex: 1000,
      animation: "fadeIn 0.15s ease",
      maxHeight: 420,
      overflow: "auto",
    }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${color}18`, border: `2px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 16, color, fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0,
        }}>{grade}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{data.ticker} <span style={{ fontSize: 10, fontWeight: 500, color: COLORS.textSecondary }}>{label} ({data.compositeScore.toFixed(0)})</span></div>
          <div style={{ fontSize: 9, color: COLORS.textDim }}>{data.name} &middot; {data.sector}</div>
        </div>
      </div>

      {/* Intel brief */}
      {intel ? (
        <div style={{ marginBottom: 10 }}>
          <IntelSection icon="\u{1F3AF}" label="Thesis" text={intel.thesis} color={COLORS.textSecondary} />
          <IntelSection icon="\u{1F4C8}" label="Recent" text={intel.recent} color={COLORS.accent} />
          <IntelSection icon="\u{26A0}" label="Risk" text={intel.risk} color={COLORS.danger} />
          <IntelSection icon="\u{1F441}" label="Watch" text={intel.watch} color={COLORS.warn} />
        </div>
      ) : (
        <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 10, fontStyle: "italic" }}>No analyst brief available for this ticker.</div>
      )}

      {/* Dimension breakdown */}
      {dims.length > 0 && (
        <div style={{ borderTop: `1px solid ${COLORS.cardBorder}`, paddingTop: 8 }}>
          {dims.map((d) => {
            const dc = d.value > 70 ? COLORS.accent : d.value > 45 ? COLORS.warn : COLORS.danger;
            return (
              <div key={d.dimension} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: COLORS.textSecondary, width: 76, flexShrink: 0 }}>{d.dimension}</span>
                <div style={{ flex: 1, height: 3, background: COLORS.gridLine, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${d.value}%`, height: "100%", background: dc, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: dc, fontFamily: "'JetBrains Mono', monospace", width: 22, textAlign: "right" }}>{d.value.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricBar({ label, value, rawDisplay }) {
  const safeVal = value != null ? value : 50;
  const color = safeVal > 70 ? COLORS.accent : safeVal > 45 ? COLORS.warn : COLORS.danger;
  const displayText = rawDisplay || (value != null ? value.toFixed(0) : "N/A");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: COLORS.textSecondary, width: 110, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: COLORS.gridLine, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${safeVal}%`, height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 10, color: rawDisplay ? COLORS.textPrimary : color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", minWidth: 48, textAlign: "right", whiteSpace: "nowrap" }}>{displayText}</span>
    </div>
  );
}

function ScoreRing({ score, size = 100, data }) {
  const [hovered, setHovered] = useState(false);
  const radius = size / 2 - 10;
  const circ = 2 * Math.PI * radius;
  const off = circ * (1 - score / 100);
  const { grade, color } = getGradeInfo(score);
  return (
    <div
      style={{ position: "relative", width: size, height: size, cursor: "default" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={COLORS.gridLine} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "all 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{score.toFixed(0)}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: `${color}99`, marginTop: 2 }}>{grade}</div>
      </div>
      {hovered && data?.radarData && (
        <ScoreTooltip data={data} anchor="bottom" align="center" />
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  // Format YYYY-MM-DD dates nicely in tooltip
  const displayLabel = label?.includes?.("-")
    ? new Date(label + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : label;
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 6, padding: "6px 10px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 2 }}>{displayLabel}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 10, color: p.color || COLORS.textPrimary, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}

function TickerLogo({ ticker, color, size = 36 }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const asset = ASSETS[ticker];
  const domain = asset?.domain;

  // Fallback letters
  const letters = ticker.length <= 2 ? ticker : ticker.slice(0, 2);
  const fontSize = letters.length === 1 ? size * 0.45 : size * 0.38;

  // Logo URL from Google Favicon service (less likely to be blocked by ad blockers)
  // Request 128px for crisp display
  const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 8,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: `0 2px 8px ${color}30`,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Always show letters as base layer */}
      <span style={{
        fontSize,
        fontWeight: 900,
        color: "#fff",
        fontFamily: "'JetBrains Mono', monospace",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        letterSpacing: "-0.02em",
        position: "absolute",
        opacity: imgLoaded && !imgError ? 0 : 1,
        transition: "opacity 0.2s ease",
      }}>{letters}</span>

      {/* Logo overlay when loaded */}
      {logoUrl && !imgError && (
        <img
          src={logoUrl}
          alt={ticker}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            width: size * 0.65,
            height: size * 0.65,
            objectFit: "contain",
            position: "absolute",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.2s ease",
            borderRadius: 4,
            background: "#fff",
            padding: 2,
          }}
        />
      )}
    </div>
  );
}

// ─── TICKER ROW CARD ─────────────────────────────────────────────────────────

function TickerCard({ ticker, data, isSelected, isExpanded, isFavorite, compact, onSelect, onToggleExpand, onToggleFavorite }) {
  const asset = ASSETS[ticker];
  const changeColor = data?.changePercent >= 0 ? COLORS.accent : COLORS.danger;
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);

  // ── Compact mode: logo + ticker + price/change only ──
  if (compact) {
    return (
      <div
        onClick={onSelect}
        style={{
          background: isSelected ? `${asset?.color}10` : COLORS.card,
          border: `1px solid ${isSelected ? `${asset?.color}40` : COLORS.cardBorder}`,
          borderRadius: 8,
          marginBottom: 4,
          cursor: "pointer",
          transition: "all 0.2s ease",
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <TickerLogo ticker={ticker} color={asset?.color || COLORS.accent} size={28} />
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          color: COLORS.textPrimary,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{ticker}</span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.textPrimary,
          fontFamily: "'JetBrains Mono', monospace",
        }}>${data?.price != null ? (data.price >= 1000 ? `${(data.price / 1000).toFixed(1)}k` : data.price >= 100 ? data.price.toFixed(0) : data.price.toFixed(2)) : "—"}</span>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: changeColor,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {data?.changePercent >= 0 ? "+" : ""}{data?.changePercent?.toFixed(1) || "0.0"}%
        </span>
      </div>
    );
  }

  // ── Full mode ──
  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? `${asset?.color}08` : COLORS.card,
        border: `1px solid ${isSelected ? `${asset?.color}40` : COLORS.cardBorder}`,
        borderRadius: 8,
        marginBottom: 6,
        cursor: "pointer",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Main row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 14px",
        gap: 12,
      }}>
        {/* Ticker Logo */}
        <TickerLogo ticker={ticker} color={asset?.color || COLORS.accent} size={36} />

        {/* Ticker & Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 14,
              fontWeight: 800,
              color: COLORS.textPrimary,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{ticker}</span>
            <span style={{
              fontSize: 9,
              color: COLORS.textDim,
              background: COLORS.bgPanel,
              padding: "2px 6px",
              borderRadius: 3,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>{asset?.type}</span>
          </div>
          <div style={{
            fontSize: 10,
            color: COLORS.textSecondary,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>{asset?.name}</div>
        </div>

        {/* Price & Change */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontFamily: "'JetBrains Mono', monospace",
          }}>${data?.price?.toLocaleString() || "—"}</div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: changeColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {data?.changePercent >= 0 ? "+" : ""}{data?.changePercent?.toFixed(2) || "0.00"}%
          </div>
        </div>

        {/* Score indicator with hover tooltip */}
        <div
          style={{ position: "relative", flexShrink: 0 }}
          onMouseEnter={() => setShowScoreTooltip(true)}
          onMouseLeave={() => setShowScoreTooltip(false)}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: COLORS.bgPanel,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "default",
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              color: data?.compositeScore > 60 ? COLORS.accent : data?.compositeScore > 45 ? COLORS.warn : COLORS.danger,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{data?.compositeScore?.toFixed(0) || "—"}</span>
          </div>
          {showScoreTooltip && data?.radarData && (
            <ScoreTooltip data={data} anchor="bottom" />
          )}
        </div>

        {/* Favorite toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          style={{
            background: "none",
            border: "none",
            color: isFavorite ? "#f5c542" : COLORS.textDim,
            cursor: "pointer",
            fontSize: 14,
            padding: 4,
            transition: "color 0.15s ease",
            flexShrink: 0,
          }}
        >{isFavorite ? "\u2605" : "\u2606"}</button>

        {/* Expand toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          style={{
            background: "none",
            border: "none",
            color: COLORS.textDim,
            cursor: "pointer",
            fontSize: 12,
            padding: 4,
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >▼</button>
      </div>

      {/* Expanded briefing */}
      {isExpanded && data && (
        <div style={{
          padding: "0 14px 12px 30px",
          borderTop: `1px solid ${COLORS.cardBorder}`,
          marginTop: 0,
          paddingTop: 10,
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            fontSize: 10,
            color: COLORS.textSecondary,
            lineHeight: 1.6,
            marginBottom: 8,
          }}>{data.briefing}</div>
          <div style={{ display: "flex", gap: 12, fontSize: 9, color: COLORS.textDim }}>
            <span>Cap: {data.marketCap}</span>
            <span>Vol: {data.volume24h}</span>
            <span>Sector: {data.sector}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DETAIL PANEL ────────────────────────────────────────────────────────────

function DetailPanel({ data, tab, setTab, priceRange, setPriceRange }) {
  if (!data) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.textDim,
        fontSize: 13,
      }}>
        Select a ticker to view analytics
      </div>
    );
  }

  const isCrypto = data.type === "crypto";
  const allTabs = [
    { id: "overview", label: "Overview" },
    { id: "fundamentals", label: "Fundamentals" },
    { id: "technicals", label: "Technicals" },
    { id: "valuation", label: "Valuation" },
    { id: "momentum", label: "Momentum" },
    { id: "analyst", label: "Analyst" },
  ];
  // For crypto, only show tabs with available data
  const tabs = isCrypto
    ? allTabs.filter(t => ["overview", "technicals", "momentum"].includes(t.id))
    : allTabs;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Ticker header */}
      <div className="spectrum-detail-header" style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{
          width: 6,
          height: 40,
          borderRadius: 3,
          background: data.color,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
              {data.ticker}
            </span>
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{data.name}</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{data.sector}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
            ${data.price?.toLocaleString()}
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: data.changePercent >= 0 ? COLORS.accent : COLORS.danger,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {data.changePercent >= 0 ? "▲" : "▼"} {Math.abs(data.changePercent).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="spectrum-tab-bar" style={{
        display: "flex",
        gap: 4,
        padding: "10px 18px",
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        background: COLORS.bgPanel,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "6px 14px",
              background: tab === t.id ? COLORS.card : "transparent",
              border: `1px solid ${tab === t.id ? COLORS.cardBorder : "transparent"}`,
              borderRadius: 5,
              color: tab === t.id ? COLORS.textPrimary : COLORS.textSecondary,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="spectrum-detail-content" style={{ flex: 1, overflow: "auto", padding: 18 }}>
        {tab === "overview" && <OverviewTab data={data} priceRange={priceRange} setPriceRange={setPriceRange} />}
        {tab === "fundamentals" && data.fundamentals && <MetricsTab title="Fundamentals" metrics={data.fundamentals} color={COLORS.accent} />}
        {tab === "fundamentals" && !data.fundamentals && <div style={{ color: COLORS.textDim, fontSize: 12, padding: 20 }}>Fundamental data not available for {data.type === "crypto" ? "cryptocurrencies" : "this asset"}.</div>}
        {tab === "technicals" && <MetricsTab title="Technicals" metrics={data.technicals} color="#a78bfa" />}
        {tab === "valuation" && data.valuation && <MetricsTab title="Valuation" metrics={data.valuation} color="#f59e0b" />}
        {tab === "valuation" && !data.valuation && <div style={{ color: COLORS.textDim, fontSize: 12, padding: 20 }}>Valuation data not available for {data.type === "crypto" ? "cryptocurrencies" : "this asset"}.</div>}
        {tab === "momentum" && <MetricsTab title="Momentum" metrics={data.momentum} color="#38bdf8" />}
        {tab === "analyst" && data.analyst && <MetricsTab title="Analyst" metrics={data.analyst} color="#22d3ee" />}
        {tab === "analyst" && !data.analyst && <div style={{ color: COLORS.textDim, fontSize: 12, padding: 20 }}>Analyst data not available for {data.type === "crypto" ? "cryptocurrencies" : "this asset"}.</div>}
      </div>
    </div>
  );
}

const PRICE_RANGES = [
  { id: "1D", label: "1D", days: 1 },
  { id: "1W", label: "1W", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
  { id: "6M", label: "6M", days: 180 },
  { id: "1Y", label: "1Y", days: 365 },
  { id: "5Y", label: "5Y", days: 1825 },
  { id: "ALL", label: "ALL", days: Infinity },
];

function formatChartDate(dateStr, rangeId) {
  if (!dateStr) return "";
  // Handle both "YYYY-MM-DD" and "Mon DD" formats
  const d = dateStr.includes("-") ? new Date(dateStr + "T00:00:00") : null;
  if (!d || isNaN(d)) return dateStr;
  switch (rangeId) {
    case "1D":
    case "1W":
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "1M":
    case "3M":
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "6M":
    case "1Y":
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    default:
      return d.toLocaleDateString("en-US", { year: "numeric" });
  }
}

function OverviewTab({ data, priceRange, setPriceRange }) {
  const rangeConfig = PRICE_RANGES.find(r => r.id === priceRange) || PRICE_RANGES[2];
  const sliced = rangeConfig.days === Infinity
    ? data.priceHistory
    : data.priceHistory.slice(-rangeConfig.days);

  // Compute SMA20 on the sliced data
  const chartData = useMemo(() => {
    return sliced.map((pt, i, arr) => {
      const sma20 = i >= 19
        ? +(arr.slice(i - 19, i + 1).reduce((s, d) => s + d.price, 0) / 20).toFixed(2)
        : null;
      return { ...pt, sma20 };
    });
  }, [sliced]);
  return (
    <div className="spectrum-overview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Score + Radar */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 10,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Composite Score
        </div>
        <ScoreRing score={data.compositeScore} size={110} data={data} />
        <div style={{ width: "100%", marginTop: 16 }}>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={data.radarData}>
              <PolarGrid stroke={COLORS.gridLine} />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: COLORS.textSecondary, fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={data.color} fill={data.color} fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Price chart */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 10,
        padding: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Price History
          </div>
          <div style={{ display: "flex", gap: 2, background: COLORS.bgPanel, borderRadius: 5, padding: 2 }}>
            {PRICE_RANGES.map(r => (
              <button
                key={r.id}
                onClick={() => setPriceRange(r.id)}
                style={{
                  padding: "3px 10px",
                  background: priceRange === r.id ? COLORS.card : "transparent",
                  border: priceRange === r.id ? `1px solid ${COLORS.cardBorder}` : "1px solid transparent",
                  borderRadius: 4,
                  color: priceRange === r.id ? COLORS.textPrimary : COLORS.textDim,
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >{r.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={data.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={data.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
            <XAxis
              dataKey="date"
              tick={{ fill: COLORS.textDim, fontSize: 8 }}
              tickFormatter={(v) => formatChartDate(v, priceRange)}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
            />
            <YAxis domain={["auto", "auto"]} tick={{ fill: COLORS.textDim, fontSize: 9 }} tickFormatter={v => `$${v.toLocaleString()}`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="price" stroke={data.color} fill="url(#priceGrad)" strokeWidth={2} />
            <Line type="monotone" dataKey="sma20" stroke={COLORS.warn} strokeWidth={1} dot={false} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Key metrics */}
      <div style={{
        gridColumn: "1 / -1",
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 10,
        padding: 18,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
          Key Metrics
        </div>
        <div className="spectrum-key-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Market Cap", value: data.marketCap },
            { label: "24h Volume", value: data.volume24h },
            { label: "P/E Ratio", value: data._raw?.peRatio != null ? data._raw.peRatio.toFixed(1) : "N/A" },
            { label: "RSI (14)", value: data._raw?.rsi != null ? data._raw.rsi.toFixed(1) : "N/A" },
            { label: "Profit Margin", value: data._raw?.profitMargins != null ? `${(data._raw.profitMargins * 100).toFixed(1)}%` : "N/A" },
            { label: "Analyst Target", value: data._raw?.targetMeanPrice != null ? `$${data._raw.targetMeanPrice.toFixed(0)}` : "N/A" },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                {m.value}
              </div>
              <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 2, textTransform: "uppercase" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricsTab({ title, metrics, color }) {
  const formatLabel = (key) => key.replace(/([A-Z])/g, " $1").replace(/(\d+)([A-Z])/g, "$1 $2").replace(/^./, s => s.toUpperCase());

  // Metrics can be { key: { score, raw } } (new) or { key: number } (synthetic fallback)
  const entries = Object.entries(metrics).map(([key, val]) => {
    if (val != null && typeof val === "object" && "score" in val) {
      return { key, score: val.score ?? 50, raw: val.raw };
    }
    return { key, score: typeof val === "number" ? val : 50, raw: null };
  });

  const half = Math.ceil(entries.length / 2);

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 10,
      padding: 18,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 16 }}>
        {title}
      </div>
      <div className="spectrum-metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          {entries.slice(0, half).map(({ key, score, raw }) => (
            <MetricBar key={key} label={formatLabel(key)} value={score} rawDisplay={raw} />
          ))}
        </div>
        <div>
          {entries.slice(half).map(({ key, score, raw }) => (
            <MetricBar key={key} label={formatLabel(key)} value={score} rawDisplay={raw} />
          ))}
        </div>
      </div>

      {/* Radar for this dimension */}
      <div style={{ marginTop: 20 }}>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={entries.map(({ key, score }) => ({ metric: formatLabel(key), value: score, fullMark: 100 }))}>
            <PolarGrid stroke={COLORS.gridLine} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.textSecondary, fontSize: 8 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────

export default function SpectrumDashboard() {
  // Stakes = positions I own
  const [stakes] = useState([
    // Semiconductors
    "AVGO", "AMD", "MU", "MCHP", "NVDA", "INTC", "ASML",
    // AI & Tech
    "PLTR", "SMCI", "CRWV", "AMZN",
    // Quantum
    "QBTS", "RGTI",
    // Space & Defense
    "RKLB", "KTOS", "ASTS", "LMT", "GE",
    // EV & Energy
    "TSLA", "QS", "ARRY",
    // Entertainment & Consumer
    "SPOT", "CHWY", "DIS", "AMC", "DJT", "LULU",
    // Retail & Restaurant
    "AEO", "GME", "CBRL", "CAVA", "TSCO",
    // Real Estate & Industrial
    "MPW", "COMP", "LEG",
  ]);
  // Watchlist = tracking but don't own
  const [watchlist] = useState(["AAPL", "MSFT", "GOOGL", "META", "IONQ", "COIN", "BTC", "ETH", "SOL"]);
  const [selected, setSelected] = useState("PLTR");
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState("overview");
  const [cache, setCache] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [dataSource, setDataSource] = useState("loading"); // "live", "synthetic", "loading"
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("3M");
  const [now, setNow] = useState(Date.now());
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("spectrum-favorites")) || []; } catch { return []; }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const isCompact = windowWidth < 768;

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem("spectrum-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((ticker) => {
    setFavorites(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]);
  }, []);

  // Merge live data with asset metadata — real scoring
  const mergeWithAsset = useCallback((ticker, liveData) => {
    const asset = ASSETS[ticker];
    if (!asset) return null;
    const isCrypto = asset.type === "crypto";
    const history = liveData.priceHistory || [];

    // Compute technical indicators from price history
    const rsi = computeRSI(history);
    const macd = computeMACD(history);
    const bollingerPos = computeBollingerPosition(history);
    const smaAlign = computeSMAAlignment(history);
    const volTrend = computeVolumeTrend(history);
    const returns = computeMomentumReturns(history);
    const trendCon = computeTrendConsistency(history);

    // Build dimension scores with raw values for display
    const technicals = {
      rsi: { score: scoreRSI(rsi), raw: rsi != null ? fmtNum(rsi) : "N/A" },
      macdSignal: { score: scoreMACD(macd), raw: macd ? (macd.histogram > 0 ? "Bullish" : "Bearish") : "N/A" },
      bollingerPos: { score: bollingerPos, raw: bollingerPos != null ? fmtNum(bollingerPos) + "%" : "N/A" },
      volumeTrend: { score: scoreVolume(volTrend), raw: volTrend != null ? fmtNum(volTrend) + "x" : "N/A" },
      smaAlignment: { score: smaAlign, raw: smaAlign != null ? fmtNum(smaAlign) : "N/A" },
      trendStrength: { score: scoreTrend(history), raw: history.length > 50 ? (scoreTrend(history) > 60 ? "Up" : scoreTrend(history) < 40 ? "Down" : "Flat") : "N/A" },
    };

    const momentum = {
      return1W: { score: normalizeReturn(returns.return1W), raw: fmtRetPct(returns.return1W) },
      return1M: { score: normalizeReturn(returns.return1M), raw: fmtRetPct(returns.return1M) },
      return3M: { score: normalizeReturn(returns.return3M), raw: fmtRetPct(returns.return3M) },
      return6M: { score: normalizeReturn(returns.return6M), raw: fmtRetPct(returns.return6M) },
      return1Y: { score: normalizeReturn(returns.return1Y), raw: fmtRetPct(returns.return1Y) },
      trendConsistency: { score: trendCon, raw: trendCon != null ? fmtNum(trendCon) + "%" : "N/A" },
    };

    let fundamentals = null;
    let valuation = null;
    let analyst = null;

    if (!isCrypto) {
      fundamentals = {
        profitMargin: { score: normalizeMetric(liveData.profitMargins, -0.5, 0.5), raw: fmtPct(liveData.profitMargins) },
        revenueGrowth: { score: normalizeMetric(liveData.revenueGrowth, -0.3, 0.5), raw: fmtPct(liveData.revenueGrowth) },
        debtToEquity: { score: normalizeMetric(liveData.debtToEquity, 0, 300, true), raw: liveData.debtToEquity != null ? fmtNum(liveData.debtToEquity) : "N/A" },
        returnOnEquity: { score: normalizeMetric(liveData.returnOnEquity, -0.3, 0.5), raw: fmtPct(liveData.returnOnEquity) },
        earningsGrowth: { score: normalizeMetric(liveData.earningsGrowth, -0.5, 1.0), raw: fmtPct(liveData.earningsGrowth) },
        freeCashFlow: { score: normalizeMetric(liveData.freeCashflow, -5e9, 50e9), raw: fmtDollar(liveData.freeCashflow) },
      };

      valuation = {
        peRatio: { score: normalizeMetric(liveData.peRatio, 0, 60, true), raw: liveData.peRatio != null ? fmtNum(liveData.peRatio) : "N/A" },
        priceToBook: { score: normalizeMetric(liveData.priceToBook, 0, 20, true), raw: liveData.priceToBook != null ? fmtRatio(liveData.priceToBook) : "N/A" },
        dividendYield: { score: normalizeMetric(liveData.dividendYield, 0, 0.08), raw: liveData.dividendYield != null ? (liveData.dividendYield * 100).toFixed(2) + "%" : "N/A" },
        fiftyTwoWeekPos: { score: normalize52wk(liveData), raw: normalize52wk(liveData) != null ? fmtNum(normalize52wk(liveData)) + "%" : "N/A" },
        targetUpside: { score: normalizeUpside(liveData), raw: liveData.targetMeanPrice ? `$${fmtNum(liveData.targetMeanPrice, 0)}` : "N/A" },
        pegRatio: { score: normalizeMetric(liveData.pegRatio, 0, 5, true), raw: liveData.pegRatio != null ? fmtNum(liveData.pegRatio) : "N/A" },
      };

      analyst = {
        consensus: { score: scoreRecommendation(liveData.recommendationKey), raw: liveData.recommendationKey ? liveData.recommendationKey.replace(/_/g, " ") : "N/A" },
        targetUpside: { score: normalizeUpside(liveData), raw: liveData.targetMeanPrice && liveData.price ? `${(((liveData.targetMeanPrice - liveData.price) / liveData.price) * 100).toFixed(1)}%` : "N/A" },
        analystCoverage: { score: normalizeMetric(liveData.numberOfAnalystOpinions, 0, 40), raw: liveData.numberOfAnalystOpinions != null ? `${liveData.numberOfAnalystOpinions}` : "N/A" },
        shortInterest: { score: normalizeMetric(liveData.shortRatio, 0, 10, true), raw: liveData.shortRatio != null ? fmtNum(liveData.shortRatio) + " days" : "N/A" },
        institutionalOwnership: { score: normalizeMetric(liveData.heldPercentInstitutions, 0, 1), raw: liveData.heldPercentInstitutions != null ? (liveData.heldPercentInstitutions * 100).toFixed(1) + "%" : "N/A" },
      };
    }

    // Helper: average scores from a dimension object { key: { score, raw } }
    const dimAvg = (dim) => {
      if (!dim) return null;
      const scores = Object.values(dim).map(m => m.score).filter(v => v != null);
      return scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
    };

    const radarDims = [
      { dimension: "Fundamentals", value: dimAvg(fundamentals) },
      { dimension: "Technicals", value: dimAvg(technicals) },
      { dimension: "Valuation", value: dimAvg(valuation) },
      { dimension: "Momentum", value: dimAvg(momentum) },
      { dimension: "Analyst", value: dimAvg(analyst) },
    ];

    const radarData = radarDims
      .filter(d => d.value != null)
      .map(d => ({ ...d, value: +d.value.toFixed(1), fullMark: 100 }));

    const compositeScore = radarData.length > 0
      ? +(radarData.reduce((s, d) => s + d.value, 0) / radarData.length).toFixed(1)
      : 50;

    const signal = compositeScore > 65 ? "bullish" : compositeScore < 40 ? "bearish" : "neutral";

    // Data-driven briefing
    const parts = [`${asset.name} (${asset.sector})`];
    if (fundamentals && liveData.profitMargins != null) parts.push(`margin ${(liveData.profitMargins * 100).toFixed(0)}%`);
    if (rsi != null) parts.push(`RSI ${rsi.toFixed(0)} (${rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral"})`);
    if (liveData.targetMeanPrice && liveData.price) {
      const upside = ((liveData.targetMeanPrice - liveData.price) / liveData.price * 100).toFixed(0);
      parts.push(`analyst target $${liveData.targetMeanPrice.toFixed(0)} (${upside > 0 ? "+" : ""}${upside}%)`);
    }
    if (returns.return1M != null) parts.push(`1M return ${returns.return1M >= 0 ? "+" : ""}${returns.return1M.toFixed(1)}%`);
    const briefing = parts.join(" | ") + `. Signal: ${signal}.`;

    // Format market cap
    const formatMarketCap = (mc) => {
      if (!mc) return "N/A";
      if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
      if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`;
      if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`;
      return `$${mc.toLocaleString()}`;
    };

    const formatVolume = (vol) => {
      if (!vol) return "N/A";
      if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
      if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
      if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
      return vol.toLocaleString();
    };

    return {
      ticker,
      ...asset,
      price: liveData.price || 0,
      changePercent: liveData.changePercent || 0,
      previousClose: liveData.previousClose,
      open: liveData.open,
      dayHigh: liveData.dayHigh,
      dayLow: liveData.dayLow,
      marketCap: formatMarketCap(liveData.marketCap),
      volume24h: formatVolume(liveData.volume),
      priceHistory: history,
      fundamentals,
      technicals,
      valuation,
      momentum,
      analyst,
      radarData,
      compositeScore,
      signal,
      briefing,
      lastUpdated: liveData.lastUpdated,
      // Keep raw data for key metrics
      _raw: {
        peRatio: liveData.peRatio,
        rsi,
        profitMargins: liveData.profitMargins,
        targetMeanPrice: liveData.targetMeanPrice,
        dividendYield: liveData.dividendYield,
      },
    };
  }, []);

  // Load data from JSON file or fall back to synthetic
  useEffect(() => {
    const loadData = async () => {
      setDataSource("loading");

      try {
        // Try to fetch live data from assets (with cache bust)
        const cacheBust = Date.now();
        const response = await fetch(`./market_data.json?v=${cacheBust}`);
        console.log("Fetch response:", response.status, response.statusText);
        if (response.ok) {
          const data = await response.json();
          const newCache = {};

          // Process stocks
          if (data.stocks) {
            Object.entries(data.stocks).forEach(([ticker, stockData]) => {
              if (!stockData.error) {
                const merged = mergeWithAsset(ticker, stockData);
                if (merged) newCache[ticker] = merged;
              }
            });
          }

          // Process crypto
          if (data.crypto) {
            Object.entries(data.crypto).forEach(([ticker, cryptoData]) => {
              const merged = mergeWithAsset(ticker, cryptoData);
              if (merged) newCache[ticker] = merged;
            });
          }

          // Fill in any missing tickers with synthetic data
          [...stakes, ...watchlist].forEach(ticker => {
            if (!newCache[ticker]) {
              newCache[ticker] = generateAssetData(ticker);
            }
          });

          setCache(newCache);
          setLastUpdated(data.generated ? new Date(data.generated) : null);
          setDataSource("live");
          console.log(`Loaded live data for ${Object.keys(newCache).length} assets`);
          return;
        }
      } catch (err) {
        console.log("No live data available, using synthetic:", err.message);
      }

      // Fall back to synthetic data
      const newCache = {};
      [...stakes, ...watchlist].forEach(ticker => {
        newCache[ticker] = generateAssetData(ticker);
      });
      setCache(newCache);
      setDataSource("synthetic");
    };

    loadData();
  }, [stakes, watchlist, refreshKey, mergeWithAsset]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Track window width for responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep relative time display fresh (tick every 30s)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort ticker lists
  const filterAndSort = useCallback((tickers) => {
    let filtered = tickers;
    if (showFavoritesOnly) {
      filtered = filtered.filter(ticker => favorites.includes(ticker));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ticker => {
        const asset = ASSETS[ticker];
        return ticker.toLowerCase().includes(q) ||
          asset?.name?.toLowerCase().includes(q) ||
          asset?.sector?.toLowerCase().includes(q);
      });
    }
    if (sortBy !== "default") {
      filtered = [...filtered].sort((a, b) => {
        const da = cache[a], db = cache[b];
        switch (sortBy) {
          case "score": return (db?.compositeScore || 0) - (da?.compositeScore || 0);
          case "change": return (db?.changePercent || 0) - (da?.changePercent || 0);
          case "alpha": return a.localeCompare(b);
          case "price": return (db?.price || 0) - (da?.price || 0);
          default: return 0;
        }
      });
    }
    return filtered;
  }, [searchQuery, sortBy, cache, showFavoritesOnly, favorites]);

  const filteredStakes = useMemo(() => filterAndSort(stakes), [filterAndSort, stakes]);
  const filteredWatchlist = useMemo(() => filterAndSort(watchlist), [filterAndSort, watchlist]);

  const selectedData = cache[selected];

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: COLORS.bg,
      color: COLORS.textPrimary,
      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bgPanel}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.cardBorder}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.textDim}; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 767px) {
          .spectrum-header-title { display: none !important; }
          .spectrum-header-center { display: none !important; }
          .spectrum-overview-grid { grid-template-columns: 1fr !important; }
          .spectrum-metrics-grid { grid-template-columns: 1fr !important; }
          .spectrum-key-metrics-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .spectrum-tab-bar { overflow-x: auto; flex-wrap: nowrap; }
          .spectrum-tab-bar button { white-space: nowrap; font-size: 10px !important; padding: 5px 8px !important; }
          .spectrum-detail-header { padding: 10px 12px !important; }
          .spectrum-detail-content { padding: 12px !important; }
        }
      `}</style>

      {/* ═══ TOP HEADER PANEL ═══ */}
      <header style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: COLORS.bgPanel,
        flexShrink: 0,
      }}>
        {/* Logo & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.accent}, #00b4f7)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 16,
            color: COLORS.bg,
            fontFamily: "'JetBrains Mono', monospace",
          }}>S</div>
          <div className="spectrum-header-title">
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: COLORS.textPrimary,
              fontFamily: "'JetBrains Mono', monospace",
            }}>SPECTRUM</div>
            <div style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.15em",
              color: COLORS.textDim,
              textTransform: "uppercase",
            }}>Market Intelligence Dashboard</div>
          </div>
        </div>

        {/* Center: Data source indicator */}
        <div className="spectrum-header-center" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dataSource === "live" ? COLORS.accent : dataSource === "loading" ? COLORS.warn : COLORS.textDim,
              animation: dataSource === "loading" ? "pulse 1s ease infinite" : dataSource === "live" ? "pulse 2s ease infinite" : "none",
              boxShadow: dataSource === "live" ? `0 0 10px ${COLORS.accent}` : "none",
            }} />
            <span style={{
              fontSize: 10,
              color: dataSource === "live" ? COLORS.accent : dataSource === "loading" ? COLORS.warn : COLORS.textSecondary,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              {dataSource === "live" ? "Live Data" : dataSource === "loading" ? "Loading..." : "Simulated"}
            </span>
          </div>
          {lastUpdated && dataSource === "live" && (
            <span style={{
              fontSize: 9,
              color: COLORS.textDim,
              fontFamily: "'JetBrains Mono', monospace",
            }}
              title={lastUpdated.toLocaleString()}
            >
              Updated {relativeTime(lastUpdated, now)} &middot; auto-refresh 5m
            </span>
          )}
          {dataSource === "synthetic" && (
            <span style={{
              fontSize: 9,
              color: COLORS.warn,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Run RUN_MARKET_UPDATE.bat for real data
            </span>
          )}
        </div>

        {/* Right: Settings */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { setCache({}); setRefreshKey(k => k + 1); }}
            style={{
              padding: "6px 12px",
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 6,
              color: COLORS.textSecondary,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >↻ Reload</button>
          <div style={{
            fontSize: 10,
            color: COLORS.textDim,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{new Date().toLocaleDateString()}</div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT: LEFT/RIGHT SPLIT ═══ */}
      <div style={{
        flex: 1,
        display: "flex",
        minHeight: 0,
      }}>
        {/* LEFT PANEL: Ticker List */}
        <div style={{
          flex: isCompact ? "none" : 1,
          width: isCompact ? 140 : "auto",
          borderRight: `1px solid ${COLORS.cardBorder}`,
          background: COLORS.bgPanel,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* ─── SEARCH & SORT TOOLBAR ─── */}
          {!isCompact && <div style={{
            padding: "10px 10px 6px",
            borderBottom: `1px solid ${COLORS.cardBorder}`,
            background: COLORS.bgPanel,
            flexShrink: 0,
          }}>
            {/* Search input */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 12,
                color: COLORS.textDim,
                pointerEvents: "none",
              }}>&#x2315;</span>
              <input
                type="text"
                placeholder="Search ticker, name, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 28px",
                  background: COLORS.card,
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 6,
                  color: COLORS.textPrimary,
                  fontSize: 11,
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.accent + "66"}
                onBlur={(e) => e.target.style.borderColor = COLORS.cardBorder}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: COLORS.textDim,
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 2,
                    lineHeight: 1,
                  }}
                >&times;</button>
              )}
            </div>
            {/* Sort options */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {/* Favorites filter */}
              <button
                onClick={() => setShowFavoritesOnly(prev => !prev)}
                title={showFavoritesOnly ? "Show all tickers" : "Show favorites only"}
                style={{
                  padding: "5px 8px",
                  background: showFavoritesOnly ? "#f5c54218" : "transparent",
                  border: `1px solid ${showFavoritesOnly ? "#f5c54244" : COLORS.cardBorder}`,
                  borderRadius: 4,
                  color: showFavoritesOnly ? "#f5c542" : COLORS.textDim,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >{showFavoritesOnly ? "\u2605" : "\u2606"}</button>
              {[
                { id: "default", label: "Default" },
                { id: "score", label: "Score" },
                { id: "change", label: "Change%" },
                { id: "price", label: "Price" },
                { id: "alpha", label: "A-Z" },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(sortBy === opt.id ? "default" : opt.id)}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    background: sortBy === opt.id ? `${COLORS.accent}18` : "transparent",
                    border: `1px solid ${sortBy === opt.id ? COLORS.accent + "44" : COLORS.cardBorder}`,
                    borderRadius: 4,
                    color: sortBy === opt.id ? COLORS.accent : COLORS.textDim,
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>}

          <div style={{ flex: 1, overflow: "auto" }}>
            {/* STAKES SECTION */}
            <div
              onClick={() => toggleSection("stakes")}
              style={{
                padding: isCompact ? "8px 6px" : "12px 14px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: isCompact ? "center" : "space-between",
                cursor: "pointer",
                background: COLORS.card,
              }}
            >
              {isCompact ? (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: COLORS.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>Stakes</span>
              ) : (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>Stakes</span>
                <span style={{
                  fontSize: 9,
                  color: COLORS.textDim,
                  background: COLORS.bgPanel,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}>Owned</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: COLORS.textSecondary }}>
                  {filteredStakes.length !== stakes.length ? `${filteredStakes.length}/` : ""}{stakes.length}
                </span>
                <span style={{
                  color: COLORS.textDim,
                  fontSize: 10,
                  transform: collapsedSections.stakes ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}>▼</span>
              </div>
              </>)}
            </div>
            {!collapsedSections.stakes && (
              <div style={{ padding: isCompact ? "6px 4px" : "10px 10px" }}>
                {filteredStakes.map(ticker => (
                  <TickerCard
                    key={ticker}
                    ticker={ticker}
                    data={cache[ticker]}
                    isSelected={selected === ticker}
                    isExpanded={!isCompact && expanded === ticker}
                    isFavorite={favorites.includes(ticker)}
                    compact={isCompact}
                    onSelect={() => setSelected(ticker)}
                    onToggleExpand={() => setExpanded(expanded === ticker ? null : ticker)}
                    onToggleFavorite={() => toggleFavorite(ticker)}
                  />
                ))}
              </div>
            )}

            {/* WATCHLIST SECTION */}
            <div
              onClick={() => toggleSection("watchlist")}
              style={{
                padding: isCompact ? "8px 6px" : "12px 14px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: isCompact ? "center" : "space-between",
                cursor: "pointer",
                background: COLORS.card,
              }}
            >
              {isCompact ? (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>Watch</span>
              ) : (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>Watchlist</span>
                <span style={{
                  fontSize: 9,
                  color: COLORS.textDim,
                  background: COLORS.bgPanel,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}>Tracking</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: COLORS.textSecondary }}>
                  {filteredWatchlist.length !== watchlist.length ? `${filteredWatchlist.length}/` : ""}{watchlist.length}
                </span>
                <span style={{
                  color: COLORS.textDim,
                  fontSize: 10,
                  transform: collapsedSections.watchlist ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}>▼</span>
              </div>
              </>)}
            </div>
            {!collapsedSections.watchlist && (
              <div style={{ padding: isCompact ? "6px 4px" : "10px 10px" }}>
                {filteredWatchlist.map(ticker => (
                  <TickerCard
                    key={ticker}
                    ticker={ticker}
                    data={cache[ticker]}
                    isSelected={selected === ticker}
                    isExpanded={!isCompact && expanded === ticker}
                    isFavorite={favorites.includes(ticker)}
                    compact={isCompact}
                    onSelect={() => setSelected(ticker)}
                    onToggleExpand={() => setExpanded(expanded === ticker ? null : ticker)}
                    onToggleFavorite={() => toggleFavorite(ticker)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Detail View */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: COLORS.bg,
          minHeight: 0,
          minWidth: 0,
        }}>
          <DetailPanel
            data={selectedData}
            tab={tab}
            setTab={setTab}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: "8px 20px",
        borderTop: `1px solid ${COLORS.cardBorder}`,
        background: COLORS.bgPanel,
        fontSize: 9,
        color: COLORS.textDim,
        textAlign: "center",
        flexShrink: 0,
      }}>
        SPECTRUM v3 — {dataSource === "live"
          ? "Live data from Yahoo Finance & CoinGecko. Scores computed from real fundamentals, technicals & analyst data."
          : "Run RUN_MARKET_UPDATE.bat to fetch live market data. Currently showing simulated prices."}
      </footer>
    </div>
  );
}
