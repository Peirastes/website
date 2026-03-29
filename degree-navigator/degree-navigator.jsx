import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// SHARED COURSE CATALOG — single source of truth for all programs
// ══════════════════════════════════════════════════════════════════════════════

const COURSE_CATALOG = {
  // ── MATH ──
  MATH2313: { name: "MATH 2313", title: "Calculus 1", hrs: 3, cc: ["CC/Quant"],
    desc: "First course of a four-semester calculus sequence. Covers limits, continuity, derivatives, Riemann integration, u-substitution, and the fundamental theorem of calculus." },
  MATH2323: { name: "MATH 2323", title: "Calculus 2", hrs: 3, cc: [],
    desc: "Techniques and applications of integration, transcendental functions and their inverses, and introduction to differential equations." },
  MATH2333: { name: "MATH 2333", title: "Calculus 3", hrs: 3, cc: [],
    desc: "Sequences, infinite series, conic sections, parameterized curves, polar coordinates, vectors, analytic geometry in space, vector-valued functions, and curvature." },
  MATH2343: { name: "MATH 2343", title: "Calculus 4", hrs: 3, cc: [],
    desc: "Calculus of functions of several real variables including partial derivatives, multiple integrals, Green's theorem, Stokes' theorem, and the divergence theorem." },
  MATH3103: { name: "MATH 3103", title: "Differential Equations", hrs: 3, cc: [],
    desc: "Theory of ODEs and applications: linear first/second order equations, undetermined coefficients, variation of parameters, series solutions, Laplace transforms, numerical solutions, linear systems." },
  // ── PHYSICS ──
  PHY2014: { name: "PHY 2014", title: "PSE I & Lab", hrs: 4, cc: ["CC/Quant"],
    desc: "Calculus-based mechanics: kinematics, Newton's laws, work-energy, momentum, rotational motion, and oscillations with laboratory." },
  PHY2114: { name: "PHY 2114", title: "PSE II & Lab", hrs: 4, cc: [],
    desc: "Calculus-based E&M: electric fields, Gauss's law, circuits, magnetic fields, Faraday's law, and electromagnetic waves with laboratory." },
  PHY3103: { name: "PHY 3103", title: "Modern Physics", hrs: 3, cc: [],
    desc: "Post-1900 physics: special relativity, quantum mechanics, physics of atoms, molecules, solids, and nuclei." },
  PHY3883: { name: "PHY 3883", title: "Mathematical Physics I", hrs: 3, cc: [],
    desc: "Higher-level math for physics/engineering: vector analysis, multivariable calculus, matrix algebra, complex numbers, Fourier series, ODEs." },
  PHY4003: { name: "PHY 4003", title: "Mathematical Physics II", hrs: 3, cc: [],
    desc: "Curvilinear coordinates, Fourier analysis/transforms, PDEs, Green's functions, tensor analysis, group theory." },
  PHY4163: { name: "PHY 4163", title: "Analytical Mechanics", hrs: 3, cc: [],
    desc: "Particle dynamics in 1-3 dimensions. Analytic/numerical techniques for time/velocity-dependent forces, harmonic oscillators, central forces." },
  PHY4173: { name: "PHY 4173", title: "Classical Mechanics", hrs: 3, cc: [],
    desc: "Lagrangian and Hamiltonian methods. Small oscillations, normal modes, rigid body rotation, non-inertial frames, Kepler problem." },
  PHY4203: { name: "PHY 4203", title: "Quantum Mechanics", hrs: 3, cc: [],
    desc: "Rigorous QM: Schrödinger equation for harmonic oscillator, hydrogen atom, quantum well, and other potentials." },
  PHY4403: { name: "PHY 4403", title: "Solid State Physics", hrs: 3, cc: [],
    desc: "Crystal lattices, elastic scattering, bonding, atomic vibrations, electron states, dielectric/optical properties, semiconductors." },
  // ── ENGINEERING ──
  ENGR1111: { name: "ENGR 1111", title: "Intro. to Engineering", hrs: 1, cc: [],
    desc: "Orientation to the engineering profession: disciplines, study skills, career pathways." },
  ENGR1112: { name: "ENGR 1112", title: "Intro. to Robotics", hrs: 1, cc: [],
    desc: "Hands-on robotics: sensors, actuators, and basic control through project-based learning." },
  ENGR1121: { name: "ENGR 1121", title: "Intro. to Robotics", hrs: 1, cc: [],
    desc: "Hands-on robotics: sensors, actuators, and basic control through project-based learning." },
  ENGR1213: { name: "ENGR 1213", title: "Engr. Computing & Lab", hrs: 3, cc: [],
    desc: "Engineering computing: MATLAB programming, data analysis, numerical problem-solving with laboratory." },
  ENGR2033: { name: "ENGR 2033", title: "Statics", hrs: 3, cc: [],
    desc: "Engineering mechanics: equilibrium, distributed forces, trusses, frames, friction, centroids, moments of inertia." },
  ENGR2043: { name: "ENGR 2043", title: "Dynamics", hrs: 3, cc: [],
    desc: "Dynamics of particles and rigid bodies: Newton's second law, work-energy, impulse-momentum." },
  ENGR2143: { name: "ENGR 2143", title: "Strength of Materials", hrs: 3, cc: [],
    desc: "Solid mechanics: stress, strain, mechanical behavior, analysis of load-bearing members." },
  ENGR2151: { name: "ENGR 2151", title: "Str. of Materials Lab", hrs: 1, cc: [],
    desc: "Measuring and reporting mechanical characteristics of elastic and brittle materials; FEA experience." },
  ENGR2203: { name: "ENGR 2203", title: "Thermodynamics", hrs: 3, cc: [],
    desc: "Laws of thermodynamics applied to control masses/volumes. Analysis of standard devices and cycles." },
  ENGR2303: { name: "ENGR 2303", title: "Electrical Science", hrs: 3, cc: ["CC/Life"],
    desc: "Circuit analysis: resistors, capacitors, inductors, DC/AC analysis, transients, phasors, frequency response, power." },
  ENGR2311: { name: "ENGR 2311", title: "Electrical Science Lab", hrs: 1, cc: [],
    desc: "Lab companion: circuit construction, measurement instruments, verification of analysis techniques." },
  ENGR3153: { name: "ENGR 3153", title: "Machine Dynamics", hrs: 3, cc: [],
    desc: "Kinematic and dynamic analysis of mechanisms and machines." },
  ENGR3183: { name: "ENGR 3183", title: "EM Fields I", hrs: 3, cc: [],
    desc: "Electrostatic/magnetostatic fields, boundary value problems, Maxwell's equations with engineering applications." },
  ENGR3211: { name: "ENGR 3211", title: "Thermal Engr. Lab", hrs: 1, cc: [],
    desc: "Hands-on thermal engineering: thermodynamics and heat transfer in engines, devices, and cycles." },
  ENGR3223: { name: "ENGR 3223", title: "Digital Logic Design & Lab", hrs: 3, cc: [],
    desc: "Combinational and sequential digital logic circuits with integrated laboratory." },
  ENGR3303: { name: "ENGR 3303", title: "Engr. Prob. & Statistics", hrs: 3, cc: [],
    desc: "Probability/statistics for engineers: random variables, distributions, hypothesis testing, regression, experimental design." },
  ENGR3323: { name: "ENGR 3323", title: "Signals & Systems", hrs: 3, cc: [],
    desc: "Signal representation, system design: continuous/discrete-time linear systems, Fourier, Laplace, z transforms." },
  ENGR3331: { name: "ENGR 3331", title: "Signals & Sys. Lab", hrs: 1, cc: [],
    desc: "Lab: design/build linear systems using time/frequency-domain analyses." },
  ENGR3363: { name: "ENGR 3363", title: "Mech. Engr. Design", hrs: 3, cc: [],
    desc: "Engineering fundamentals for machine component design; material selection for various applications." },
  ENGR3403: { name: "ENGR 3403", title: "Analog Electronics", hrs: 3, cc: [],
    desc: "Analog circuits: op-amps, diodes, BJTs, FETs, amplifier design, frequency response, feedback." },
  ENGR3413: { name: "ENGR 3413", title: "Materials Science", hrs: 3, cc: [],
    desc: "Structure, properties, processing of engineering materials: metals, ceramics, polymers, composites." },
  ENGR3421: { name: "ENGR 3421", title: "Analog Electronics Lab", hrs: 1, cc: [],
    desc: "Design and testing of analog circuits: amplifiers, filters, oscillators." },
  ENGR3443: { name: "ENGR 3443", title: "Fluid Mechanics", hrs: 3, cc: [],
    desc: "Fluid dynamics fundamentals: mass/momentum/energy equations, dimensional analysis, internal/external flows." },
  ENGR3451: { name: "ENGR 3451", title: "Fluid Mechanics Lab", hrs: 1, cc: [],
    desc: "Fluid experiments: Bernoulli's theorem, orifices, energy losses, cavitation." },
  ENGR3613: { name: "ENGR 3613", title: "Microprocessors & Lab", hrs: 3, cc: [],
    desc: "Microprocessor architecture, programming, I/O, interrupts, DMA." },
  ENGR3703: { name: "ENGR 3703", title: "Comp. Methods in Engr.", hrs: 3, cc: [],
    desc: "Numerical methods: error analysis, equation solving, curve fitting, differentiation, integration, ODEs. Uses MATLAB." },
  ENGR3803: { name: "ENGR 3803", title: "Elect. Power Systems", hrs: 3, cc: [],
    desc: "Power engineering concepts, system design/operation, socio-economic aspects, new technologies." },
  ENGR4103: { name: "ENGR 4103", title: "Finite Element Analysis", hrs: 3, cc: [],
    desc: "FEM: RITZ method, isoparametric elements, bending, applications with commercial FEA software." },
  ENGR4123: { name: "ENGR 4123", title: "Heat Transfer", hrs: 3, cc: [],
    desc: "Conduction, convection, radiation: mathematical analysis in steady/time-dependent systems." },
  ENGR4141: { name: "ENGR 4141", title: "Heat Transfer Lab", hrs: 1, cc: [],
    desc: "Heat transfer experiments: conduction, convection, thermal radiation, heat exchange." },
  ENGR4143: { name: "ENGR 4143", title: "Vibration", hrs: 3, cc: [],
    desc: "Free/forced vibrations of single/multi-DOF systems; continuous systems." },
  ENGR4183: { name: "ENGR 4183", title: "EM Fields II", hrs: 3, cc: [],
    desc: "Time-varying EM fields, waves, radiation, diffraction, EM theory of light, antenna design." },
  ENGR4203: { name: "ENGR 4203", title: "Refrig. & Air Cond.", hrs: 3, cc: [],
    desc: "Advanced thermo-fluid principles for refrigeration and AC systems." },
  ENGR4243: { name: "ENGR 4243", title: "IoT Systems & Lab", hrs: 3, cc: [],
    desc: "IoT system design: sensor networks, protocols, cloud integration, analytics." },
  ENGR4253: { name: "ENGR 4253", title: "Cybersecurity for IoT", hrs: 3, cc: [],
    desc: "IoT security: threat modeling, encryption, authentication, secure firmware." },
  ENGR4263: { name: "ENGR 4263", title: "Engineering Optics", hrs: 3, cc: [],
    desc: "Geometrical/physical optics: Gaussian beams, resonators, lasers, electro-optic modulation." },
  ENGR4273: { name: "ENGR 4273", title: "CAD/CAM", hrs: 3, cc: [],
    desc: "Computer-aided design and manufacturing: modeling, simulation, process planning." },
  ENGR4303: { name: "ENGR 4303", title: "Control Systems", hrs: 3, cc: [],
    desc: "Automatic control: feedback, robustness, stability, classical/modern theories." },
  ENGR4313: { name: "ENGR 4313", title: "Fluid Dynamics", hrs: 3, cc: [],
    desc: "Navier-Stokes, potential flow, compressible/incompressible/viscous flows, boundary layer, turbulence." },
  ENGR4323: { name: "ENGR 4323", title: "Digital & Analog Comm.", hrs: 3, cc: [],
    desc: "Communications: AM, FM, PCM, multiplexing, channel characteristics, noise." },
  ENGR4333: { name: "ENGR 4333", title: "Dig. Signal Processing", hrs: 3, cc: [],
    desc: "Discrete signals, z-transform, DFT, fast algorithms, IIR/FIR filter design." },
  ENGR4351: { name: "ENGR 4351", title: "DSP Lab", hrs: 1, cc: [],
    desc: "DSP algorithms and applications on digital signal processors." },
  ENGR4403: { name: "ENGR 4403", title: "Adv. Control Sys. & Lab", hrs: 3, cc: [],
    desc: "Advanced control system analysis and design with lab implementation." },
  ENGR4533: { name: "ENGR 4533", title: "Thermal Systems Design", hrs: 3, cc: [],
    desc: "System design, energy analysis, optimization for thermal-fluid systems." },
  ENGR4613: { name: "ENGR 4613", title: "Photonics", hrs: 3, cc: [],
    desc: "Wave optics, interference, guided wave/fiber optics, polarization, diffraction, image formation." },
  ENGR4633: { name: "ENGR 4633", title: "Solid State Devices", hrs: 3, cc: [],
    desc: "P-N junctions, BJTs, MOS capacitors, FETs, electro-optical devices." },
  ENGR4803: { name: "ENGR 4803", title: "Mechatronics & Lab", hrs: 3, cc: [],
    desc: "Electromechanical/mechatronic systems: dynamic modeling, electric machines, power electronics, sensors." },
  BME4343: { name: "BME 4343", title: "Biomechanics", hrs: 3, cc: [],
    desc: "Mechanical engineering principles applied to biological systems." },
  // ── SENIOR DESIGN ──
  ENGR4852: { name: "ENGR 4852", title: "EP Senior Design I", hrs: 2, cc: [], desc: "EP capstone I: problem definition, literature review, specifications, preliminary design." },
  ENGR4862: { name: "ENGR 4862", title: "ME Senior Design I", hrs: 2, cc: [], desc: "ME capstone I: problem definition, literature review, specifications, preliminary design." },
  ENGR4872: { name: "ENGR 4872", title: "EE Senior Design I", hrs: 2, cc: [], desc: "EE capstone I: problem definition, literature review, specifications, preliminary design." },
  ENGR4842: { name: "ENGR 4842", title: "CE Senior Design I", hrs: 2, cc: [], desc: "CE capstone I: problem definition, literature review, specifications, preliminary design." },
  ENGR4892: { name: "ENGR 4892", title: "Senior Design II", hrs: 2, cc: [], desc: "Capstone II: implement, test, refine. Final presentation and written report." },
  // ── COMPUTER SCIENCE ──
  CMSC1613: { name: "CMSC 1613", title: "Programming in C++", hrs: 3, cc: [],
    desc: "Basic C++ constructs: scalar/aggregate data types, expressions, assignment, selection, iteration, subprograms." },
  CMSC1621: { name: "CMSC 1621", title: "Prog. in C++ Lab", hrs: 1, cc: [],
    desc: "Laboratory companion for Programming in C++." },
  CMSC2613: { name: "CMSC 2613", title: "Fund. Data Structures", hrs: 3, cc: [],
    desc: "Study of data structures for storing and retrieving information: linked lists, stacks, queues, trees, hashing." },
  CMSC2621: { name: "CMSC 2621", title: "Fund. Data Struct. Lab", hrs: 1, cc: [],
    desc: "Laboratory for Fundamental Data Structures." },
  CMSC2833: { name: "CMSC 2833", title: "Computer Org. 1", hrs: 3, cc: [],
    desc: "Computer organization and architecture: digital logic, data representation, instruction sets, memory, I/O." },
  CMSC2123: { name: "CMSC 2123", title: "Discrete Structures", hrs: 3, cc: [],
    desc: "Mathematical foundations for computing: logic, sets, relations, functions, combinatorics, graph theory, proof techniques." },
  CMSC3833: { name: "CMSC 3833", title: "Computer Org. 2", hrs: 3, cc: [],
    desc: "Memory system architecture, interfacing, functional organization, multiprocessing, alternate architectures, performance." },
  CMSC3613: { name: "CMSC 3613", title: "Algo. & Adv. Data Struct.", hrs: 3, cc: [],
    desc: "Efficient algorithms for storing/retrieving information. Graph theory and applications. Time/space complexity analysis." },
  CMSC3621: { name: "CMSC 3621", title: "Algo. & Adv. DS Lab", hrs: 1, cc: [],
    desc: "Laboratory for Algorithms and Advanced Data Structures." },
  CMSC4133: { name: "CMSC 4133", title: "Concepts of AI", hrs: 3, cc: [],
    desc: "Foundations of artificial intelligence: search, knowledge representation, learning, natural language processing." },
  CMSC4193: { name: "CMSC 4193", title: "Intro to Robotics", hrs: 3, cc: [],
    desc: "Robotics fundamentals: kinematics, dynamics, control, sensing, and planning." },
  CMSC4303: { name: "CMSC 4303", title: "Mobile App Programming", hrs: 3, cc: [],
    desc: "Mobile computing platforms, user interfaces, animation, graphics, media frameworks, telephony APIs." },
  CMSC4313: { name: "CMSC 4313", title: "Internet of Things", hrs: 3, cc: [],
    desc: "IoT concepts, architectures, protocols, and applications." },
  CMSC4083: { name: "CMSC 4083", title: "Cybersecurity", hrs: 3, cc: [],
    desc: "Principles of computer and network security." },
  SE3103: { name: "SE 3103", title: "OO Design & Patterns", hrs: 3, cc: [],
    desc: "Object-oriented design principles, design patterns, and software architecture." },
  // ── BIOMEDICAL ENGINEERING ──
  BME1311: { name: "BME 1311", title: "Intro. to BME", hrs: 1, cc: [],
    desc: "Introduction to biomedical engineering: overview of the field, career paths, and current research areas." },
  BME3043: { name: "BME 3043", title: "Biomaterials", hrs: 3, cc: [],
    desc: "Properties and applications of materials used in medical devices and implants; biocompatibility, degradation, and tissue interactions." },
  BME3113: { name: "BME 3113", title: "Principles of BME", hrs: 3, cc: [],
    desc: "Fundamental principles of biomedical engineering spanning instrumentation, biomechanics, biomaterials, and biosystems." },
  BME4233: { name: "BME 4233", title: "Biomedical Instrumentation", hrs: 3, cc: [],
    desc: "Design and analysis of instrumentation for biomedical measurements: sensors, signal conditioning, and data acquisition." },
  BME4132: { name: "BME 4132", title: "BME Lab", hrs: 2, cc: [],
    desc: "Laboratory experience in biomedical engineering measurements, instrumentation, and experimental design." },
  BME4223: { name: "BME 4223", title: "Biomedical Imaging", hrs: 3, cc: [],
    desc: "Principles of medical imaging: X-ray, CT, MRI, ultrasound, and nuclear medicine imaging systems." },
  BME4343: { name: "BME 4343", title: "Biomechanics", hrs: 3, cc: [],
    desc: "Application of mechanical engineering principles to biological systems: tissue mechanics, musculoskeletal modeling, gait analysis." },
  BME4882: { name: "BME 4882", title: "BME Senior Design I", hrs: 2, cc: [],
    desc: "BME capstone I: problem definition, literature review, design specifications, preliminary biomedical device/system design." },
  BME4243: { name: "BME 4243", title: "Modeling & Analysis of BME Systems", hrs: 3, cc: [],
    desc: "Mathematical modeling and computational analysis of biomedical engineering systems." },
  BIO1204: { name: "BIO 1204", title: "Biology I for Majors", hrs: 4, cc: ["CC/Quant"],
    desc: "Introductory biology for science majors: cell structure, molecular biology, genetics, evolution with laboratory." },
  BIO3203: { name: "BIO 3203", title: "Cell Biology", hrs: 3, cc: [],
    desc: "Structure and function of cells: membranes, organelles, cell signaling, cell cycle, gene expression." },
  BIO2604: { name: "BIO 2604", title: "Human Phys. & Lab", hrs: 4, cc: [],
    desc: "Human physiology: organ systems, homeostasis, and regulatory mechanisms with laboratory." },
  CHEM1103: { name: "CHEM 1103", title: "General Chem. I", hrs: 3, cc: [],
    desc: "General chemistry: atomic structure, bonding, stoichiometry, states of matter, solutions." },
  CHEM1112: { name: "CHEM 1112", title: "Gen. Chem. I Lab", hrs: 2, cc: [],
    desc: "Laboratory companion for General Chemistry I." },
  CHEM1223: { name: "CHEM 1223", title: "General Chem. II", hrs: 3, cc: [],
    desc: "Continuation: kinetics, equilibrium, acids/bases, thermodynamics, electrochemistry." },
  CHEM1232: { name: "CHEM 1232", title: "Gen. Chem. II Lab", hrs: 2, cc: [],
    desc: "Laboratory companion for General Chemistry II." },
  CHEM3303: { name: "CHEM 3303", title: "Organic Chem. I", hrs: 3, cc: [],
    desc: "Structure, bonding, nomenclature, stereochemistry, and reactions of carbon compounds." },
  PHIL2000: { name: "PHIL 2000", title: "Engineering Ethics", hrs: 3, cc: ["CC/Crit"],
    desc: "Ethical issues in engineering practice (BME section)." },
  // ── GENERAL ED ──
  PHIL2313: { name: "PHIL 2313", title: "Engineering Ethics", hrs: 3, cc: ["CC/Crit"], desc: "Ethical issues in engineering: professional codes, safety, societal impact." },
  ENG1113: { name: "ENG 1113", title: "English Composition", hrs: 3, cc: ["CC/Comm"], desc: "Expository/argumentative essays, critical reading, revision." },
  ENG1213: { name: "ENG 1213", title: "English Compos. & Research", hrs: 3, cc: ["CC/Comm"], desc: "Research methods, source evaluation, argument-driven research writing." },
  MCOM1113: { name: "MCOM 1113", title: "Fund. of Speech", hrs: 3, cc: ["CC/Comm"], desc: "Informative and persuasive presentation skills." },
  BIO1114: { name: "BIO 1114", title: "General Biology", hrs: 4, cc: [], desc: "Cell biology, genetics, evolution, ecology with lab." },
  HLTH1112: { name: "HLTH 1112", title: "Healthy Life Skills", hrs: 2, cc: ["CC/Life"], desc: "Nutrition, fitness, stress management, well-being." },
  CHEM1315: { name: "CHEM 1315", title: "Chem. for Engr.", hrs: 5, cc: [], desc: "Chemistry for engineers: atomic structure, bonding, stoichiometry, thermochemistry with lab." },
  ECON1103: { name: "ECON 1103", title: "Intro. to Economics", hrs: 3, cc: ["CC/Soc"], desc: "Supply/demand, market structures, macroeconomics, fiscal/monetary policy." },
  HIST1483: { name: "HIST 1483/1493", title: "History of US", hrs: 3, cc: ["CC/Hist"], desc: "United States history survey." },
  FMKT2323: { name: "FMKT 2323", title: "Global Div. or Foreign Lang.", hrs: 3, cc: ["CC/Cult"], desc: "Cultural/language analysis elective (CC/Cult)." },
  HUM2113: { name: "HUM 2113/2223", title: "Humanities", hrs: 3, cc: ["CC/Crit"], desc: "Human culture, thought, creative expression." },
  POL1113: { name: "POL 1113", title: "Am. Nat. Government", hrs: 3, cc: ["CC/Hist"], desc: "Constitution, federalism, civil liberties, political institutions." },
};

// ══════════════════════════════════════════════════════════════════════════════
// DEGREE PLANS
// ══════════════════════════════════════════════════════════════════════════════

const DEGREE_PLANS = {
  EP: {
    name: "Engineering Physics", abbr: "EP", color: "#E8C547",
    semHours: [15,16,17,16,16,13,14,17],
    courses: [
      { id:"MATH2313",sem:0,prereqs:[] },{ id:"PHIL2313",sem:0,prereqs:[] },{ id:"ENGR1111",sem:0,prereqs:[] },{ id:"ENGR1121",sem:0,prereqs:[] },{ id:"BIO1114",sem:0,prereqs:[] },{ id:"ENG1113",sem:0,prereqs:[] },
      { id:"MATH2323",sem:1,prereqs:["MATH2313"] },{ id:"PHY2014",sem:1,prereqs:["MATH2313"] },{ id:"ENGR1213",sem:1,prereqs:[] },{ id:"MCOM1113",sem:1,prereqs:[] },{ id:"ENG1213",sem:1,prereqs:["ENG1113"] },
      { id:"MATH2333",sem:2,prereqs:["MATH2323"] },{ id:"ENGR2033",sem:2,prereqs:["PHY2014"] },{ id:"PHY2114",sem:2,prereqs:["PHY2014","MATH2323"] },{ id:"HLTH1112",sem:2,prereqs:[] },{ id:"CHEM1315",sem:2,prereqs:[] },
      { id:"MATH2343",sem:3,prereqs:["MATH2333"] },{ id:"MATH3103",sem:3,prereqs:["MATH2343"],notes:"Concurrent OK + permission" },{ id:"ENGR2043",sem:3,prereqs:["ENGR2033","MATH2343"] },{ id:"ENGR2303",sem:3,prereqs:["PHY2014"] },{ id:"ENGR2311",sem:3,prereqs:["ENGR2303"],notes:"Concurrent w/ 2303" },{ id:"PHY3103",sem:3,prereqs:["PHY2114"],notes:"MATH 3103 concurrent" },
      { id:"PHY3883",sem:4,prereqs:["PHY2114","MATH2343"] },{ id:"ENGR2203",sem:4,prereqs:["ENGR2033","CHEM1315"],notes:"MATH 3103C, Jr standing" },{ id:"ENGR3703",sem:4,prereqs:["ENGR1213","MATH3103"] },{ id:"ENGR3303",sem:4,prereqs:["MATH2343"] },{ id:"ENGR3403",sem:4,prereqs:["ENGR2303","ENGR2311"] },
      { id:"ENGR3443",sem:5,prereqs:["ENGR2043","MATH3103","ENGR2203"] },{ id:"ENGR3183",sem:5,prereqs:["PHY3883"] },{ id:"ENGR3323",sem:5,prereqs:["ENGR2303","ENGR2311","MATH3103"] },{ id:"ENGR3331",sem:5,prereqs:["ENGR3323"] },{ id:"ENGR4263",sem:5,prereqs:["ENGR2043","PHY3883"] },{ id:"ENGR3421",sem:5,prereqs:["ENGR3403"] },
      { id:"ENGR4852",sem:6,prereqs:["ENGR3443","ENGR3183","ENGR3323"],notes:"Sr standing" },{ id:"ECON1103",sem:6,prereqs:[] },
      { id:"_EP_E1",sem:6,prereqs:[],isElective:true,name:"ENGR/PHY Elec.",title:"4000-lvl PHY/ENGR/BME",hrs:3 },
      { id:"_EP_E2",sem:6,prereqs:[],isElective:true,name:"PHY Elective",title:"3000/4000-lvl PHY",hrs:3 },
      { id:"_EP_E3",sem:6,prereqs:[],isElective:true,name:"ENGR Elective",title:"2000-4000 ENGR/BME",hrs:3 },
      { id:"ENGR4892",sem:7,prereqs:["ENGR4852"] },{ id:"HIST1483",sem:7,prereqs:[] },{ id:"FMKT2323",sem:7,prereqs:[] },{ id:"HUM2113",sem:7,prereqs:[] },{ id:"PHY4203",sem:7,prereqs:["PHY3103","PHY3883","MATH3103"] },{ id:"POL1113",sem:7,prereqs:[] },
    ],
    electiveGroups: [
      { name:"Physics Grad School",color:"#548235",courses:[
        {name:"PHY 4003",title:"Mathematical Physics II",prereqs:"PHY 3883, MATH 3103"},
        {name:"PHY 4163",title:"Analytical Mechanics",prereqs:"PHY 3883"},
        {name:"PHY 4173",title:"Classical Mechanics",prereqs:"PHY 4163"},
        {name:"PHY 4403",title:"Solid State Physics",prereqs:"PHY 3103, PHY 3883"},
      ]},
      { name:"Control Systems",color:"#2E75B6",courses:[
        {name:"ENGR 3223",title:"Digital Logic Design & Lab",prereqs:"ENGR 2303, 2311"},
        {name:"ENGR 3613",title:"Microprocessors & Lab",prereqs:"ENGR 2303, 2311, 3223"},
        {name:"ENGR 4303",title:"Control Systems",prereqs:"ENGR 3323"},
        {name:"ENGR 4403",title:"Adv. Control Sys. & Lab",prereqs:"ENGR 4303"},
        {name:"ENGR 4803",title:"Mechatronics & Lab",prereqs:"ENGR 3323, 3331"},
      ]},
      { name:"IoT",color:"#7030A0",courses:[
        {name:"ENGR 4243",title:"IoT Systems & Lab",prereqs:"ENGR 2303, 2311, 3223, 3613"},
        {name:"ENGR 4253",title:"Cybersecurity for IoT",prereqs:"ENGR 3223C"},
      ]},
      { name:"Computational & Materials",color:"#BF8F00",courses:[
        {name:"ENGR 2143",title:"Strength of Materials",prereqs:"ENGR 2033"},
        {name:"ENGR 2151",title:"Str. of Materials Lab",prereqs:"ENGR 2143C"},
        {name:"ENGR 3413",title:"Materials Science",prereqs:"PHY 2114, MATH 3103C, upper div."},
        {name:"ENGR 4103",title:"Finite Element Analysis",prereqs:"ENGR 2143, 3703, PHY 3883C"},
      ]},
      { name:"Photonics & Solid State",color:"#C00000",courses:[
        {name:"ENGR 4613",title:"Photonics",prereqs:"PHY 3103, ENGR 4263"},
        {name:"ENGR 4633",title:"Solid State Devices",prereqs:"PHY 3103, ENGR 3183, 3403"},
        {name:"ENGR 4183",title:"EM Fields II",prereqs:"ENGR 3183"},
      ]},
    ],
  },

  ME: {
    name: "Mechanical Engineering", abbr: "ME", color: "#4EA8DE",
    semHours: [15,16,17,16,17,17,15,14],
    courses: [
      { id:"MATH2313",sem:0,prereqs:[] },{ id:"PHIL2313",sem:0,prereqs:[] },{ id:"ENGR1111",sem:0,prereqs:[] },{ id:"ENGR1121",sem:0,prereqs:[] },{ id:"BIO1114",sem:0,prereqs:[] },{ id:"ENG1113",sem:0,prereqs:[] },
      { id:"MATH2323",sem:1,prereqs:["MATH2313"] },{ id:"PHY2014",sem:1,prereqs:["MATH2313"] },{ id:"ENGR1213",sem:1,prereqs:[] },{ id:"MCOM1113",sem:1,prereqs:[] },{ id:"ENG1213",sem:1,prereqs:["ENG1113"] },
      { id:"MATH2333",sem:2,prereqs:["MATH2323"] },{ id:"ENGR2033",sem:2,prereqs:["PHY2014"] },{ id:"PHY2114",sem:2,prereqs:["PHY2014","MATH2323"] },{ id:"HLTH1112",sem:2,prereqs:[] },{ id:"CHEM1315",sem:2,prereqs:[] },
      { id:"MATH2343",sem:3,prereqs:["MATH2333"] },{ id:"MATH3103",sem:3,prereqs:["MATH2343"],notes:"Concurrent OK" },{ id:"ENGR2043",sem:3,prereqs:["ENGR2033"] },{ id:"ENGR2203",sem:3,prereqs:["ENGR2033","CHEM1315"],notes:"MATH 3103C" },{ id:"ENGR2143",sem:3,prereqs:["ENGR2033"] },{ id:"ENGR2151",sem:3,prereqs:["ENGR2143"],notes:"Concurrent w/ 2143" },
      { id:"PHY3883",sem:4,prereqs:["PHY2114","MATH2343"] },{ id:"ENGR3443",sem:4,prereqs:["ENGR2043","MATH3103"] },{ id:"ENGR3451",sem:4,prereqs:["ENGR3443"],notes:"Concurrent w/ 3443" },{ id:"ENGR2303",sem:4,prereqs:["PHY2014"] },{ id:"ENGR2311",sem:4,prereqs:["ENGR2303"],notes:"Concurrent w/ 2303" },{ id:"ENGR3703",sem:4,prereqs:["ENGR1213","MATH3103"] },
      { id:"ENGR3363",sem:5,prereqs:["ENGR2043","ENGR2143"],notes:"MATH 3103C, upper div." },{ id:"ENGR4533",sem:5,prereqs:["ENGR2203","ENGR3443"] },{ id:"ENGR3303",sem:5,prereqs:["MATH2343"] },{ id:"ENGR3323",sem:5,prereqs:["ENGR2303","ENGR2311","MATH3103"] },{ id:"ENGR3331",sem:5,prereqs:["ENGR3323"] },{ id:"ENGR3413",sem:5,prereqs:["PHY2114"],notes:"MATH 3103C, upper div." },{ id:"HUM2113",sem:5,prereqs:[] },
      { id:"ENGR4862",sem:6,prereqs:["ENGR3363","ENGR3443","ENGR3323"],notes:"Sr standing" },{ id:"ENGR4123",sem:6,prereqs:["ENGR3443","MATH3103","ENGR3703"] },{ id:"ENGR4141",sem:6,prereqs:["ENGR4123"],notes:"Concurrent w/ 4123" },{ id:"ECON1103",sem:6,prereqs:[] },{ id:"ENGR4803",sem:6,prereqs:["ENGR3323","ENGR3331"] },
      { id:"_ME_EA",sem:6,prereqs:[],isElective:true,name:"Group A Elec.",title:"Dyn & Ctrl or Solid Mech",hrs:3 },
      { id:"ENGR4892",sem:7,prereqs:["ENGR4862"] },{ id:"HIST1483",sem:7,prereqs:[] },{ id:"FMKT2323",sem:7,prereqs:[] },{ id:"POL1113",sem:7,prereqs:[] },
      { id:"_ME_EB",sem:7,prereqs:[],isElective:true,name:"Group B Elec.",title:"ENGR/PHY/BME 4xx3",hrs:3 },
    ],
    electiveGroups: [
      { name:"Elective Group A (DC/SM/TF)",color:"#2E75B6",courses:[
        {name:"ENGR 3153",title:"Machine Dynamics (DC)",prereqs:"ENGR 2043"},
        {name:"ENGR 4143",title:"Vibration (DC)",prereqs:"ENGR 2043, MATH 3103, PHY 3883C"},
        {name:"ENGR 3223",title:"Digital Logic Design (DC)",prereqs:"ENGR 2303, 2311"},
        {name:"ENGR 4273",title:"CAD/CAM (SM)",prereqs:"ENGR 3363"},
        {name:"ENGR 4303",title:"Control Systems (DC)",prereqs:"ENGR 3323"},
        {name:"ENGR 4313",title:"Fluid Dynamics (TF)",prereqs:"ENGR 3443, MATH 3103"},
      ]},
      { name:"Elective Group B",color:"#BF8F00",courses:[
        {name:"ENGR 3803",title:"Elect. Power Systems (DC)",prereqs:"ENGR 2303, 2311, MATH 2343"},
        {name:"ENGR 4103",title:"Finite Element Analysis (SM)",prereqs:"ENGR 2143, 3703, PHY 3883C"},
        {name:"BME 4343",title:"Biomechanics (SM)",prereqs:"ENGR 2143"},
        {name:"PHY 4163",title:"Analytical Mechanics (SM)",prereqs:"PHY 3883"},
        {name:"ENGR 4203",title:"Refrig. & Air Cond. (TF)",prereqs:"ENGR 3443, 4123C"},
      ]},
    ],
  },

  EE: {
    name: "Electrical Engineering", abbr: "EE", color: "#7C6EF6",
    semHours: [15,16,17,16,16,16,15,14],
    courses: [
      { id:"MATH2313",sem:0,prereqs:[] },{ id:"PHIL2313",sem:0,prereqs:[] },{ id:"ENGR1111",sem:0,prereqs:[] },{ id:"ENGR1112",sem:0,prereqs:[] },{ id:"BIO1114",sem:0,prereqs:[] },{ id:"ENG1113",sem:0,prereqs:[] },
      { id:"MATH2323",sem:1,prereqs:["MATH2313"] },{ id:"PHY2014",sem:1,prereqs:["MATH2313"] },{ id:"ENGR1213",sem:1,prereqs:[] },{ id:"MCOM1113",sem:1,prereqs:[] },{ id:"ENG1213",sem:1,prereqs:["ENG1113"] },
      { id:"MATH2333",sem:2,prereqs:["MATH2323"] },{ id:"ENGR2033",sem:2,prereqs:["PHY2014"] },{ id:"PHY2114",sem:2,prereqs:["PHY2014","MATH2323"] },{ id:"HLTH1112",sem:2,prereqs:[] },{ id:"CHEM1315",sem:2,prereqs:[] },
      { id:"MATH2343",sem:3,prereqs:["MATH2333"] },{ id:"MATH3103",sem:3,prereqs:["MATH2343"] },{ id:"PHY3103",sem:3,prereqs:["PHY2114"],notes:"MATH 3103 concurrent" },{ id:"ENGR2303",sem:3,prereqs:["PHY2014"] },{ id:"ENGR2311",sem:3,prereqs:["ENGR2303"],notes:"Concurrent w/ 2303" },
      { id:"PHY3883",sem:4,prereqs:["PHY2114","MATH2343"] },{ id:"ENGR3403",sem:4,prereqs:["ENGR2303","ENGR2311"] },{ id:"ENGR3421",sem:4,prereqs:["ENGR3403"],notes:"Concurrent w/ 3403" },{ id:"ENGR3703",sem:4,prereqs:["ENGR1213","MATH3103"] },{ id:"ENGR3413",sem:4,prereqs:["PHY2114"],notes:"MATH 3103C, upper div." },
      { id:"ENGR3183",sem:5,prereqs:["PHY3883"] },{ id:"ENGR3323",sem:5,prereqs:["ENGR2303","ENGR2311","MATH3103"] },{ id:"ENGR3331",sem:5,prereqs:["ENGR3323"] },{ id:"ENGR3613",sem:5,prereqs:["ENGR2303","ENGR2311","ENGR3223"] },{ id:"ENGR3303",sem:5,prereqs:["MATH2343"] },{ id:"ENGR3223",sem:5,prereqs:["ENGR2303","ENGR2311"] },{ id:"HUM2113",sem:5,prereqs:[] },
      { id:"ENGR4872",sem:6,prereqs:["ENGR3183","ENGR3323"],notes:"Sr standing" },{ id:"ENGR4333",sem:6,prereqs:["ENGR3323"] },{ id:"ENGR4351",sem:6,prereqs:["ENGR3323","ENGR3331"],notes:"Concurrent w/ 4333" },{ id:"ENGR3803",sem:6,prereqs:["ENGR2303","ENGR2311","MATH2343"] },{ id:"ECON1103",sem:6,prereqs:[] },{ id:"ENGR4803",sem:6,prereqs:["ENGR3323","ENGR3331"] },
      { id:"ENGR4892",sem:7,prereqs:["ENGR4872"] },{ id:"HIST1483",sem:7,prereqs:[] },{ id:"FMKT2323",sem:7,prereqs:[] },{ id:"ENGR4323",sem:7,prereqs:["ENGR3323"] },{ id:"POL1113",sem:7,prereqs:[] },
      { id:"_EE_E1",sem:7,prereqs:[],isElective:true,name:"ENGR 4XX3 Elec.",title:"EE elective",hrs:3 },
    ],
    electiveGroups: [
      { name:"EE Elective Group",color:"#7C6EF6",courses:[
        {name:"ENGR 4263",title:"Engineering Optics",prereqs:"PHY 3103"},
        {name:"ENGR 4613",title:"Photonics",prereqs:"PHY 3103, ENGR 4263"},
        {name:"ENGR 4633",title:"Solid State Devices",prereqs:"PHY 3103, ENGR 3183, 3403"},
        {name:"ENGR 4183",title:"EM Fields II",prereqs:"ENGR 3183"},
        {name:"ENGR 4303",title:"Control Systems",prereqs:"ENGR 3323"},
      ]},
      { name:"Additional Approved",color:"#548235",courses:[
        {name:"ENGR 4403",title:"Adv. Control Sys. & Lab",prereqs:"ENGR 4303"},
        {name:"ENGR 4243",title:"IoT Systems & Lab",prereqs:"ENGR 3223, 3613"},
        {name:"ENGR 4253",title:"Cybersecurity for IoT",prereqs:"ENGR 3223"},
      ]},
    ],
  },

  CE: {
    name: "Computer Engineering", abbr: "CE", color: "#43AA8B",
    semHours: [15,16,16,17,16,17,15,14],
    courses: [
      // Y1 Fall
      { id:"MATH2313",sem:0,prereqs:[] },{ id:"PHIL2313",sem:0,prereqs:[] },{ id:"ENGR1111",sem:0,prereqs:[] },{ id:"ENGR1121",sem:0,prereqs:[] },{ id:"BIO1114",sem:0,prereqs:[] },{ id:"ENG1113",sem:0,prereqs:[] },
      // Y1 Spring
      { id:"MATH2323",sem:1,prereqs:["MATH2313"] },{ id:"PHY2014",sem:1,prereqs:["MATH2313"] },{ id:"ENGR1213",sem:1,prereqs:[] },{ id:"MCOM1113",sem:1,prereqs:[] },{ id:"ENG1213",sem:1,prereqs:["ENG1113"] },
      // Y2 Fall
      { id:"MATH2333",sem:2,prereqs:["MATH2323"] },{ id:"ENGR2033",sem:2,prereqs:["PHY2014"] },{ id:"PHY2114",sem:2,prereqs:["PHY2014","MATH2323"] },{ id:"CMSC1613",sem:2,prereqs:["ENGR1213"],notes:"MATH 1513/1533 + CMSC 1513 or ENGR 1213" },{ id:"CMSC1621",sem:2,prereqs:["CMSC1613"],notes:"Concurrent w/ 1613" },
      // Y2 Spring
      { id:"MATH2343",sem:3,prereqs:["MATH2333"] },{ id:"MATH3103",sem:3,prereqs:["MATH2343"],notes:"Concurrent OK" },
      { id:"CMSC2833",sem:3,prereqs:["CMSC1613"] },
      { id:"CMSC2613",sem:3,prereqs:["CMSC1613"],notes:"CMSC 1613 with min C" },
      { id:"CMSC2621",sem:3,prereqs:["CMSC2613"],notes:"Concurrent w/ 2613" },
      { id:"HLTH1112",sem:3,prereqs:[] },
      { id:"HUM2113",sem:3,prereqs:[] },
      // Y3 Fall
      { id:"ENGR3303",sem:4,prereqs:["MATH2343"],notes:"12C" },
      { id:"ENGR3403",sem:4,prereqs:["ENGR2303","ENGR2311"] },
      { id:"ENGR2303",sem:4,prereqs:["PHY2014"],notes:"MATH 3103C" },
      { id:"ENGR2311",sem:4,prereqs:["ENGR2303"],notes:"Concurrent w/ 2303" },
      { id:"ENGR3223",sem:4,prereqs:["ENGR2303","ENGR2311"],notes:"16, 17" },
      { id:"CMSC2123",sem:4,prereqs:["CMSC1613"],notes:"10, 1C" },
      { id:"ENGR3703",sem:4,prereqs:["ENGR1213","MATH3103"],notes:"6, 7, 14C" },
      // Y3 Spring
      { id:"SE3103",sem:5,prereqs:["CMSC2613"],notes:"CMSC 2613, MATH 2313" },
      { id:"ENGR3323",sem:5,prereqs:["ENGR2303","ENGR2311","MATH3103"] },
      { id:"ENGR3421",sem:5,prereqs:["ENGR3403"] },
      { id:"CMSC3833",sem:5,prereqs:["CMSC2833","CMSC2613"],notes:"CMSC 2833 and 2613 with min C" },
      { id:"ENGR3613",sem:5,prereqs:["ENGR2303","ENGR2311","ENGR3223"] },
      { id:"CMSC3613",sem:5,prereqs:["CMSC2123","CMSC2613","MATH2323"] },
      { id:"CMSC3621",sem:5,prereqs:["CMSC3613"],notes:"Concurrent w/ 3613" },
      { id:"ECON1103",sem:5,prereqs:[] },
      // Y4 Fall
      { id:"ENGR4842",sem:6,prereqs:["SE3103","ENGR3323","ENGR3613","CMSC3833"],notes:"Sr standing" },
      { id:"ENGR4333",sem:6,prereqs:["ENGR3323"] },
      { id:"ENGR4351",sem:6,prereqs:["ENGR3323","ENGR3331"],notes:"Concurrent w/ 4333" },
      { id:"ENGR3331",sem:6,prereqs:["ENGR3323"],notes:"Concurrent w/ 3323" },
      { id:"POL1113",sem:6,prereqs:[] },
      { id:"_CE_CONC1",sem:6,prereqs:[],isElective:true,name:"ENGR/CMSC Conc.",title:"Concentration Elective",hrs:3 },
      // Y4 Spring
      { id:"ENGR4892",sem:7,prereqs:["ENGR4842"] },
      { id:"HIST1483",sem:7,prereqs:[] },
      { id:"FMKT2323",sem:7,prereqs:[] },
      { id:"CMSC4133",sem:7,prereqs:["CMSC2613"],notes:"CMSC 2613" },
      { id:"_CE_CONC2",sem:7,prereqs:[],isElective:true,name:"ENGR/CMSC Conc.",title:"Concentration Elective",hrs:3 },
    ],
    electiveGroups: [
      { name:"Internet of Things Concentration",color:"#43AA8B",courses:[
        {name:"CMSC 4313",title:"Internet of Things (required)",prereqs:"CMSC 2613"},
        {name:"ENGR 4243",title:"IoT Systems & Lab (required)",prereqs:"ENGR 2303, 2311, 3223"},
        {name:"CMSC 4303",title:"Mobile App Programming",prereqs:"SE 3103"},
        {name:"ENGR 4803",title:"Mechatronics & Lab",prereqs:"ENGR 3323, 3331"},
      ]},
      { name:"Control Systems Concentration",color:"#2E75B6",courses:[
        {name:"CMSC 4193",title:"Intro to Robotics",prereqs:"CMSC 3833"},
        {name:"CMSC 4303",title:"Mobile App Programming",prereqs:"SE 3103"},
        {name:"ENGR 4803",title:"Mechatronics & Lab",prereqs:"ENGR 3323, 3331"},
        {name:"ENGR 4303",title:"Control Systems",prereqs:"ENGR 3323"},
        {name:"ENGR 4403",title:"Adv. Control Sys. & Lab",prereqs:"ENGR 4303"},
      ]},
      { name:"Cybersecurity Engineering Concentration",color:"#C00000",courses:[
        {name:"CMSC 4083",title:"Cybersecurity",prereqs:"MATH 3103, STAT 2103/2113/4113"},
        {name:"ENGR 4323",title:"Digital & Analog Comm.",prereqs:"ENGR 3323"},
        {name:"ENGR 4253",title:"Cybersecurity for IoT & Lab",prereqs:"ENGR 3223"},
      ]},
    ],
  },

  BMEA: {
    name: "BME — Pre-Medical", abbr: "BME-A", color: "#E05780",
    semHours: [15,17,17,18,17,16,13,14],
    courses: [
      { id:"MATH2313",sem:0,prereqs:[] },{ id:"PHIL2313",sem:0,prereqs:[] },{ id:"ENGR1111",sem:0,prereqs:[] },{ id:"ENGR1121",sem:0,prereqs:[] },{ id:"BIO1204",sem:0,prereqs:[] },{ id:"ENG1113",sem:0,prereqs:[] },
      { id:"MATH2323",sem:1,prereqs:["MATH2313"] },{ id:"PHY2014",sem:1,prereqs:["MATH2313"] },{ id:"ENGR1213",sem:1,prereqs:[] },{ id:"MCOM1113",sem:1,prereqs:[] },{ id:"ENG1213",sem:1,prereqs:["ENG1113"] },{ id:"BME1311",sem:1,prereqs:[] },
      { id:"MATH2333",sem:2,prereqs:["MATH2323"] },{ id:"ENGR2033",sem:2,prereqs:["PHY2014"] },{ id:"PHY2114",sem:2,prereqs:["PHY2014","MATH2323"] },{ id:"HLTH1112",sem:2,prereqs:[] },{ id:"CHEM1103",sem:2,prereqs:[] },{ id:"CHEM1112",sem:2,prereqs:["CHEM1103"],notes:"Concurrent w/ 1103" },
      { id:"MATH2343",sem:3,prereqs:["MATH2333"] },{ id:"MATH3103",sem:3,prereqs:["MATH2343"] },{ id:"BIO3203",sem:3,prereqs:["BIO1204"] },{ id:"ENGR2303",sem:3,prereqs:["PHY2014"],notes:"11, 18C" },{ id:"ENGR2311",sem:3,prereqs:["ENGR2303"],notes:"17C, concurrent" },{ id:"CHEM1223",sem:3,prereqs:["CHEM1103"] },{ id:"CHEM1232",sem:3,prereqs:["CHEM1223"],notes:"12, concurrent" },
      { id:"BME3043",sem:4,prereqs:["MATH2333","PHY2114","CHEM1223","MATH3103","BIO3203"],notes:"8,11,12,13,15C" },{ id:"ENGR3323",sem:4,prereqs:["ENGR2303","ENGR2311","MATH3103"] },{ id:"ENGR3331",sem:4,prereqs:["ENGR3323"],notes:"22C" },{ id:"CHEM3303",sem:4,prereqs:["CHEM1223"],notes:"11, 18C" },{ id:"BIO2604",sem:4,prereqs:["BIO1204","CHEM1223"],notes:"4, 12, 16" },{ id:"BME3113",sem:4,prereqs:["MATH2313","PHY2014","CHEM1103","CHEM1223","MATH3103","BIO3203"],notes:"8,10,12,13,15,25C" },
      { id:"ENGR3303",sem:5,prereqs:["MATH2343"],notes:"14C" },{ id:"BME4233",sem:5,prereqs:["ENGR3323","ENGR3331"] },{ id:"ENGR3403",sem:5,prereqs:["ENGR2303","ENGR2311"] },{ id:"ENGR3421",sem:5,prereqs:["ENGR3403"],notes:"29C" },{ id:"HUM2113",sem:5,prereqs:[] },{ id:"ECON1103",sem:5,prereqs:[] },
      { id:"BME4882",sem:6,prereqs:["BME4233","ENGR3323","ENGR3303"],notes:"22,26,27,28,S,P,A" },{ id:"ENGR3223",sem:6,prereqs:["ENGR2303","ENGR2311"] },{ id:"BME4223",sem:6,prereqs:["ENGR3323"],notes:"22, A" },{ id:"BME4132",sem:6,prereqs:["BME4233"],notes:"22, 28, A" },
      { id:"ENGR4892",sem:7,prereqs:["BME4882"] },{ id:"BME4343",sem:7,prereqs:["ENGR2033","PHY2114"],notes:"10, 15, A" },{ id:"HIST1483",sem:7,prereqs:[] },{ id:"POL1113",sem:7,prereqs:[] },{ id:"FMKT2323",sem:7,prereqs:[] },
      { id:"_BMEA_E1",sem:7,prereqs:[],isElective:true,name:"BME/PHY/CHEM Elec.",title:"3000/4000 BME/PHY/CHEM/ENGR",hrs:3 },
    ],
    electiveGroups: [
      { name:"BME/PHY/CHEM or ENGR Elective",color:"#E05780",courses:[
        {name:"Any 3000/4000",title:"BME, PHY, CHEM, or ENGR course",prereqs:"Varies (exceptions: PHY 3014, 3044, 3054, 3503)"},
      ]},
    ],
  },

  BMEB: {
    name: "BME — Instrumentation", abbr: "BME-B", color: "#E88D4F",
    semHours: [15,17,17,16,17,16,13,14],
    courses: [
      { id:"MATH2313",sem:0,prereqs:[] },{ id:"PHIL2313",sem:0,prereqs:[] },{ id:"ENGR1111",sem:0,prereqs:[] },{ id:"ENGR1121",sem:0,prereqs:[] },{ id:"BIO1204",sem:0,prereqs:[] },{ id:"ENG1113",sem:0,prereqs:[] },
      { id:"MATH2323",sem:1,prereqs:["MATH2313"] },{ id:"PHY2014",sem:1,prereqs:["MATH2313"] },{ id:"ENGR1213",sem:1,prereqs:[] },{ id:"MCOM1113",sem:1,prereqs:[] },{ id:"ENG1213",sem:1,prereqs:["ENG1113"] },{ id:"BME1311",sem:1,prereqs:[] },
      { id:"MATH2333",sem:2,prereqs:["MATH2323"] },{ id:"ENGR2033",sem:2,prereqs:["PHY2014"] },{ id:"PHY2114",sem:2,prereqs:["PHY2014","MATH2323"] },{ id:"HLTH1112",sem:2,prereqs:[] },{ id:"CHEM1103",sem:2,prereqs:[] },{ id:"CHEM1112",sem:2,prereqs:["CHEM1103"],notes:"Concurrent" },
      { id:"MATH2343",sem:3,prereqs:["MATH2333"] },{ id:"MATH3103",sem:3,prereqs:["MATH2343"] },{ id:"BIO3203",sem:3,prereqs:["BIO1204"] },{ id:"ENGR2303",sem:3,prereqs:["PHY2014"],notes:"11, 18C" },{ id:"ENGR2311",sem:3,prereqs:["ENGR2303"],notes:"17C" },{ id:"PHY3883",sem:3,prereqs:["PHY2114","MATH2343"],notes:"11, 14C" },
      { id:"BME3043",sem:4,prereqs:["MATH2333","PHY2114","MATH3103","BIO3203"],notes:"8,11,12,13,15C" },{ id:"ENGR3323",sem:4,prereqs:["ENGR2303","ENGR2311","MATH3103"] },{ id:"ENGR3331",sem:4,prereqs:["ENGR3323"] },{ id:"ENGR3403",sem:4,prereqs:["ENGR2303","ENGR2311"] },{ id:"ENGR3421",sem:4,prereqs:["ENGR3403"],notes:"22C" },{ id:"BME3113",sem:4,prereqs:["MATH2313","PHY2014","CHEM1103","MATH3103","BIO3203"],notes:"8,10,12,13,15,25C" },
      { id:"ENGR3303",sem:5,prereqs:["MATH2343"] },{ id:"BME4233",sem:5,prereqs:["ENGR3323","ENGR3331"] },{ id:"BIO2604",sem:5,prereqs:["BIO1204"],notes:"12, 16" },{ id:"HUM2113",sem:5,prereqs:[] },{ id:"ECON1103",sem:5,prereqs:[] },
      { id:"BME4882",sem:6,prereqs:["BME4233","ENGR3303"],notes:"S,P,A" },{ id:"ENGR3223",sem:6,prereqs:["ENGR2303","ENGR2311"] },{ id:"BME4223",sem:6,prereqs:["ENGR3323"],notes:"25, A" },{ id:"BME4132",sem:6,prereqs:["BME4233"],notes:"25, 28, A" },{ id:"POL1113",sem:6,prereqs:[] },
      { id:"ENGR4892",sem:7,prereqs:["BME4882"] },{ id:"BME4343",sem:7,prereqs:["ENGR2033","PHY2114"],notes:"10, 15, A" },{ id:"HIST1483",sem:7,prereqs:[] },{ id:"FMKT2323",sem:7,prereqs:[] },
      { id:"_BMEB_E1",sem:7,prereqs:[],isElective:true,name:"BME/ENGR/PHY Elec.",title:"BME/ENGR/PHY elective",hrs:3 },
      { id:"_BMEB_BIO",sem:5,prereqs:[],isElective:true,name:"BIO/BME/PHY/ENGR",title:"3000/4000 elective",hrs:3 },
    ],
    electiveGroups: [
      { name:"BME/ENGR/PHY Elective",color:"#E88D4F",courses:[
        {name:"BME 4243",title:"Modeling & Analysis of BME Systems*",prereqs:"Varies"},
        {name:"BME 4920",title:"Workshop in BME",prereqs:"Permission"},
        {name:"BME 4930",title:"Individual Study in BME",prereqs:"Permission"},
        {name:"BME 4940",title:"Field Study in BME",prereqs:"Permission"},
        {name:"BME 4950",title:"Internship in BME",prereqs:"Permission"},
        {name:"ENGR 3183",title:"EM Fields I",prereqs:"PHY 3883"},
        {name:"ENGR 3703",title:"Comp. Methods in Engr.",prereqs:"ENGR 1213, MATH 3103"},
        {name:"ENGR 3803",title:"Elect. Power Systems",prereqs:"ENGR 2303, 2311"},
        {name:"ENGR 4263",title:"Engineering Optics",prereqs:"PHY 3883"},
        {name:"ENGR 4333",title:"Dig. Signal Processing",prereqs:"ENGR 3323"},
        {name:"ENGR 4803",title:"Mechatronics & Lab",prereqs:"ENGR 3323, 3331"},
      ]},
    ],
  },

  BMEC: {
    name: "BME — Biomechanics", abbr: "BME-C", color: "#6BBF8A",
    semHours: [15,17,17,16,18,15,13,14],
    courses: [
      { id:"MATH2313",sem:0,prereqs:[] },{ id:"PHIL2313",sem:0,prereqs:[] },{ id:"ENGR1111",sem:0,prereqs:[] },{ id:"ENGR1121",sem:0,prereqs:[] },{ id:"BIO1204",sem:0,prereqs:[] },{ id:"ENG1113",sem:0,prereqs:[] },
      { id:"MATH2323",sem:1,prereqs:["MATH2313"] },{ id:"PHY2014",sem:1,prereqs:["MATH2313"] },{ id:"ENGR1213",sem:1,prereqs:[] },{ id:"MCOM1113",sem:1,prereqs:[] },{ id:"ENG1213",sem:1,prereqs:["ENG1113"] },{ id:"BME1311",sem:1,prereqs:[] },
      { id:"MATH2333",sem:2,prereqs:["MATH2323"] },{ id:"ENGR2033",sem:2,prereqs:["PHY2014"] },{ id:"PHY2114",sem:2,prereqs:["PHY2014","MATH2323"] },{ id:"HLTH1112",sem:2,prereqs:[] },{ id:"CHEM1103",sem:2,prereqs:[] },{ id:"CHEM1112",sem:2,prereqs:["CHEM1103"],notes:"Concurrent" },
      { id:"MATH2343",sem:3,prereqs:["MATH2333"] },{ id:"MATH3103",sem:3,prereqs:["MATH2343"] },{ id:"BIO3203",sem:3,prereqs:["BIO1204"] },{ id:"ENGR2303",sem:3,prereqs:["PHY2014"] },{ id:"ENGR2311",sem:3,prereqs:["ENGR2303"],notes:"Concurrent" },{ id:"ENGR2043",sem:3,prereqs:["ENGR2033"],notes:"10, 14C" },
      { id:"BME3043",sem:4,prereqs:["MATH2333","PHY2114","MATH3103","BIO3203"],notes:"8,11,12,13,15C" },{ id:"ENGR2143",sem:4,prereqs:["ENGR2033"] },{ id:"ENGR3323",sem:4,prereqs:["ENGR2303","ENGR2311","MATH3103"],notes:"15,17,18,A" },{ id:"ENGR3331",sem:4,prereqs:["ENGR3323"],notes:"Concurrent" },{ id:"ENGR2151",sem:4,prereqs:["ENGR2143"],notes:"21C" },{ id:"ENGR3443",sem:4,prereqs:["ENGR2043","MATH3103"],notes:"15, 19, A" },
      { id:"ENGR3303",sem:5,prereqs:["MATH2343"],notes:"17, 18" },{ id:"BME4233",sem:5,prereqs:["ENGR3323","ENGR3331"] },{ id:"BIO2604",sem:5,prereqs:["BIO1204"],notes:"12, 16" },{ id:"HUM2113",sem:5,prereqs:[] },{ id:"ECON1103",sem:5,prereqs:[] },{ id:"BME3113",sem:5,prereqs:["MATH2313","PHY2014","CHEM1103","MATH3103","BIO3203"],notes:"8,10,12,13,15,25C" },
      { id:"BME4882",sem:6,prereqs:["BME4233","ENGR3303"],notes:"23,26,27,28,S,P,A" },{ id:"ENGR3223",sem:6,prereqs:["ENGR2303","ENGR2311"] },{ id:"BME4223",sem:6,prereqs:["ENGR3323"],notes:"23, A" },{ id:"BME4132",sem:6,prereqs:["BME4233"],notes:"23, 31C, A" },{ id:"FMKT2323",sem:6,prereqs:[] },{ id:"POL1113",sem:6,prereqs:[] },
      { id:"ENGR4892",sem:7,prereqs:["BME4882"] },{ id:"BME4343",sem:7,prereqs:["ENGR2033","PHY2114"],notes:"10, 15, A" },{ id:"HIST1483",sem:7,prereqs:[] },
      { id:"_BMEC_E1",sem:6,prereqs:[],isElective:true,name:"BME/ENGR 4xx3",title:"Elective",hrs:3 },
      { id:"_BMEC_E2",sem:7,prereqs:[],isElective:true,name:"BME/ENGR 4xx3",title:"Elective",hrs:3 },
    ],
    electiveGroups: [
      { name:"BME/ENGR 4xx3 Elective",color:"#6BBF8A",courses:[
        {name:"BME 4243",title:"Modeling & Analysis of BME Systems*",prereqs:"Varies"},
        {name:"BME 4920",title:"Workshop in BME",prereqs:"Permission"},
        {name:"BME 4930",title:"Individual Study in BME",prereqs:"Permission"},
        {name:"BME 4940",title:"Field Study in BME",prereqs:"Permission"},
        {name:"BME 4950",title:"Internship in BME",prereqs:"Permission"},
        {name:"ENGR 4103",title:"Finite Element Analysis",prereqs:"ENGR 2143, 3703, PHY 3883C"},
        {name:"ENGR 4143",title:"Vibration",prereqs:"ENGR 2043, MATH 3103"},
        {name:"ENGR 4313",title:"Fluid Dynamics",prereqs:"ENGR 3443, MATH 3103"},
        {name:"ENGR 4803",title:"Mechatronics & Lab",prereqs:"ENGR 3323, 3331"},
      ]},
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const SEMESTERS = ["Year 1 Fall","Year 1 Spring","Year 2 Fall","Year 2 Spring","Year 3 Fall","Year 3 Spring","Year 4 Fall","Year 4 Spring"];
const CC_TAGS = {
  "CC/Comm":{label:"Written & Oral Communication",color:"#5B9BD5"},"CC/Crit":{label:"Critical Inquiry & Aesthetic Analysis",color:"#C00000"},"CC/Cult":{label:"Cultural & Language Analysis",color:"#7030A0"},"CC/Hist":{label:"Historical & Political Analysis",color:"#BF8F00"},"CC/Life":{label:"Life Skills",color:"#548235"},"CC/Quant":{label:"Quantitative Reasoning / Sci. Method",color:"#2E75B6"},"CC/Soc":{label:"Social & Behavioral Analysis",color:"#ED7D31"},
};

// Semester offering data: "F"=Fall only, "S"=Spring only, "FS"=both
// Based on flowchart color coding. Correct as needed.
var OFFERED = {
  // MATH — all offered both semesters
  MATH2313:"FS", MATH2323:"FS", MATH2333:"FS", MATH2343:"FS", MATH3103:"FS",
  // PHYSICS
  PHY2014:"FS", PHY2114:"FS", PHY3103:"FS", PHY3883:"F", PHY4003:"S", PHY4163:"F", PHY4173:"S", PHY4203:"S", PHY4403:"F",
  // ENGINEERING — from flowchart color coding
  ENGR1111:"F", ENGR1112:"F", ENGR1121:"F", ENGR1213:"FS",
  ENGR2033:"FS", ENGR2043:"FS", ENGR2143:"FS", ENGR2151:"FS", ENGR2203:"FS",
  ENGR2303:"FS", ENGR2311:"FS",
  ENGR3153:"F", ENGR3183:"S", ENGR3211:"F",
  ENGR3223:"F", ENGR3303:"FS", ENGR3323:"FS", ENGR3331:"FS",
  ENGR3363:"S", ENGR3403:"FS", ENGR3413:"FS", ENGR3421:"FS",
  ENGR3443:"FS", ENGR3451:"F", ENGR3613:"S", ENGR3703:"FS", ENGR3803:"F",
  ENGR4103:"S", ENGR4123:"F", ENGR4141:"F", ENGR4143:"S",
  ENGR4183:"S", ENGR4203:"S", ENGR4243:"S", ENGR4253:"F",
  ENGR4263:"S", ENGR4273:"S", ENGR4303:"F", ENGR4313:"S",
  ENGR4323:"S", ENGR4333:"F", ENGR4351:"F", ENGR4403:"S",
  ENGR4533:"S", ENGR4613:"S", ENGR4633:"S", ENGR4803:"F",
  // Senior Design
  ENGR4852:"F", ENGR4862:"F", ENGR4872:"F", ENGR4842:"F", ENGR4892:"S",
  // CMSC
  CMSC1613:"FS", CMSC1621:"FS", CMSC2613:"FS", CMSC2621:"FS",
  CMSC2833:"FS", CMSC2123:"FS", CMSC3833:"S", CMSC3613:"S", CMSC3621:"S",
  CMSC4133:"S", CMSC4193:"F", CMSC4303:"S", CMSC4313:"F", CMSC4083:"F",
  SE3103:"FS",
  // BME
  BME1311:"S", BME3043:"F", BME3113:"F", BME4233:"S", BME4132:"F",
  BME4223:"F", BME4343:"S", BME4882:"F", BME4243:"S",
  // BIO / CHEM
  BIO1204:"FS", BIO3203:"FS", BIO2604:"FS",
  CHEM1103:"FS", CHEM1112:"FS", CHEM1223:"FS", CHEM1232:"FS", CHEM3303:"F",
  CHEM1315:"FS",
  // GEN ED — all offered both
  PHIL2313:"FS", PHIL2000:"FS", ENG1113:"FS", ENG1213:"FS", MCOM1113:"FS",
  BIO1114:"FS", HLTH1112:"FS", ECON1103:"FS", HIST1483:"FS",
  FMKT2323:"FS", HUM2113:"FS", POL1113:"FS",
};

function resolve(pc) {
  var c = COURSE_CATALOG[pc.id] || {};
  var offered = OFFERED[pc.id] || "FS";
  return { ...c, ...pc, name: pc.name||c.name||pc.id, title: pc.title||c.title||"", hrs: pc.hrs||c.hrs||3, cc: c.cc||[], desc: c.desc||"", offered: offered };
}
function chain(id, cs, dir, v=new Set()) {
  if(v.has(id)) return v; v.add(id); const c=cs.find(x=>x.id===id); if(!c) return v;
  if(dir==="up") (c.prereqs||[]).forEach(p=>chain(p,cs,"up",v)); else cs.filter(x=>(x.prereqs||[]).includes(id)).forEach(x=>chain(x.id,cs,"down",v)); return v;
}
function edges(id, cs, dir, e=[]) {
  const c=cs.find(x=>x.id===id); if(!c) return e;
  if(dir==="up") { (c.prereqs||[]).forEach(p=>{ if(!e.find(x=>x[0]===p&&x[1]===id)){e.push([p,id]);edges(p,cs,"up",e);} }); }
  else { cs.filter(x=>(x.prereqs||[]).includes(id)).forEach(x=>{ if(!e.find(z=>z[0]===id&&z[1]===x.id)){e.push([id,x.id]);edges(x.id,cs,"down",e);} }); }
  return e;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function Card({course:c,hl,dim,sel,onClick,cardRef,accent,onDragStart,onDragEnd,hasWarning,onCritPath,status,onToggleStatus,semMismatch,whatIfTransfer}){
  var critStyle = onCritPath && !sel && !hl;
  var isCompleted = status === "completed";
  var isInProgress = status === "inprogress";
  var offered = c.offered || "FS";
  var offColor = offered==="F" ? "#C97B3A" : offered==="S" ? "#5B9BD5" : "rgba(255,255,255,0.2)";
  var offLabel = offered==="F" ? "F" : offered==="S" ? "S" : "F/S";
  var isLocked = c.isLocked;
  var isUnfilledElective = c.isElective && !isLocked;

  // Status-based border/background overrides
  var statusBorder = isCompleted ? (whatIfTransfer ? "rgba(100,181,246,0.5)" : "rgba(76,175,80,0.4)") : isInProgress ? "rgba(100,181,246,0.4)" : null;
  var statusBg = isCompleted ? (whatIfTransfer ? "rgba(100,181,246,0.08)" : "rgba(76,175,80,0.06)") : isInProgress ? "rgba(100,181,246,0.06)" : null;
  var lockedBorder = isLocked ? accent+"66" : null;
  var lockedBg = isLocked ? accent+"0A" : null;

  return(<div ref={cardRef}
    draggable
    onDragStart={function(e){e.dataTransfer.setData("text/plain",c.id);e.dataTransfer.effectAllowed="move";if(onDragStart)onDragStart(c.id);}}
    onDragEnd={function(){if(onDragEnd)onDragEnd();}}
    onClick={function(){onClick(c.id);}} className="cc" style={{
    opacity: dim && !onCritPath ? 0.15 : isCompleted ? 0.65 : 1,
    transform:sel?"scale(1.04)":hl?"scale(1.02)":onCritPath?"scale(1.01)":"scale(1)",
    borderColor:semMismatch?"#FFB74D":hasWarning?"#FF6B6B":sel?accent:hl?"#6CB4EE":critStyle?"#FF8C42":statusBorder?statusBorder:lockedBorder?lockedBorder:isUnfilledElective?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.06)",
    borderStyle:isUnfilledElective?"dashed":"solid",
    background:hasWarning?"rgba(255,107,107,0.08)":sel?("linear-gradient(135deg,"+accent+"26,"+accent+"0D)"):hl?"linear-gradient(135deg,rgba(108,180,238,0.12),rgba(108,180,238,0.04))":critStyle?"linear-gradient(135deg,rgba(255,140,66,0.1),rgba(255,140,66,0.03))":statusBg?statusBg:lockedBg?lockedBg:"rgba(255,255,255,0.03)",
    boxShadow:hasWarning?"0 2px 12px rgba(255,107,107,0.15)":sel?("0 4px 20px "+accent+"33"):hl?"0 2px 12px rgba(108,180,238,0.15)":critStyle?"0 2px 12px rgba(255,140,66,0.15)":isLocked?("0 2px 8px "+accent+"22"):"0 1px 3px rgba(0,0,0,0.3)",
    cursor:"grab",position:"relative",
  }}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        {isLocked&&<span style={{fontSize:9,opacity:0.6}} title="Elective locked in">&#128274;</span>}
        {whatIfTransfer&&<span style={{fontSize:8,color:"#64B5F6",fontWeight:700,border:"1px solid rgba(100,181,246,0.3)",borderRadius:3,padding:"0 3px",lineHeight:"14px"}} title="Transfers from other program">WI</span>}
        <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.03em",color:hasWarning?"#FF6B6B":sel?accent:hl?"#6CB4EE":critStyle?"#FF8C42":whatIfTransfer?"rgba(100,181,246,0.8)":isCompleted?"rgba(76,175,80,0.8)":isLocked?accent:"rgba(255,255,255,0.9)",fontFamily:"'JetBrains Mono',monospace",textDecoration:isCompleted&&!whatIfTransfer?"line-through":"none"}}>{c.name}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        {onCritPath&&<span style={{fontSize:8,color:"#FF8C42",fontWeight:700}}>CP</span>}
        {semMismatch&&<span title={"Only offered in "+(offered==="F"?"Fall":"Spring")} style={{fontSize:9,color:"#FFB74D",lineHeight:1}}>&#9888;</span>}
        {hasWarning&&<span title="Prerequisite not met in earlier semester" style={{fontSize:10,color:"#FF6B6B",lineHeight:1}}>&#9888;</span>}
        <span style={{fontSize:8,color:offColor,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.05em"}}>{offLabel}</span>
        <span style={{fontSize:9,color:"rgba(255,255,255,0.35)",fontFamily:"'JetBrains Mono',monospace"}}>{c.hrs}h</span>
      </div>
    </div>
    <div style={{fontSize:10,color:isCompleted?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.55)",lineHeight:1.3,marginBottom:(c.cc && c.cc.length) ? 4 : 0}}>{c.title}</div>
    {c.cc && c.cc.length>0&&<div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{c.cc.map(function(t){return <span key={t} style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:(CC_TAGS[t]?CC_TAGS[t].color:"#666")+"22",color:CC_TAGS[t]?CC_TAGS[t].color:"#666",fontWeight:600}}>{t}</span>;})}</div>}
    <span onClick={function(e){e.stopPropagation();onToggleStatus(c.id);}}
      style={{position:"absolute",bottom:4,right:4,width:14,height:14,borderRadius:3,
      border:isCompleted?"2px solid #4CAF50":isInProgress?"2px solid #64B5F6":"2px solid rgba(255,255,255,0.15)",
      background:isCompleted?"#4CAF50":isInProgress?"rgba(100,181,246,0.3)":"transparent",
      display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}>
      {isCompleted && <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M2 6l3 3 5-5"/></svg>}
      {isInProgress && <span style={{width:6,height:6,borderRadius:1,background:"#64B5F6"}}/>}
    </span>
  </div>);
}

function Detail({course:c,courses,onClose,accent,isElective,isLocked,selection,allOptions,onSelect,onClear,ddOpen,setDdOpen}){
  var up=(c.prereqs||[]).map(function(p){return courses.find(function(x){return x.id===p;});}).filter(Boolean);
  var dn=courses.filter(function(x){return (x.prereqs||[]).includes(c.id);});

  const opts = allOptions || [];

  return(<div className="dp" style={{borderTopColor:accent+"44"}}>
    <div className="dpi" style={{gridTemplateColumns: isElective ? "1fr 1.5fr 1fr" : "1fr 1.5fr 0.8fr 0.8fr"}}>
      <div className="dc dci">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:accent,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>{c.name}</div>
            <div style={{fontSize:17,fontWeight:300,color:"rgba(255,255,255,0.95)"}}>{c.title}</div>
            {isElective&&<div style={{marginTop:4,fontSize:10,color:"rgba(255,255,255,0.35)",fontStyle:"italic"}}>Elective slot</div>}
            {isLocked&&<div style={{marginTop:4,fontSize:10,color:accent,fontStyle:"italic"}}>&#128274; Locked elective</div>}
          </div>
          <button onClick={onClose} className="cb">&times;</button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <div className="di" style={{flex:1}}><span className="dl">Credits</span><span className="dv">{c.hrs}</span></div>
          <div className="di" style={{flex:1}}><span className="dl">Semester</span><span className="dv" style={{fontSize:12}}>{SEMESTERS[c.sem]}</span></div>
          <div className="di" style={{flex:1}}><span className="dl">Offered</span><span className="dv" style={{fontSize:12,color:c.offered==="F"?"#C97B3A":c.offered==="S"?"#5B9BD5":"rgba(255,255,255,0.7)"}}>{c.offered==="F"?"Fall Only":c.offered==="S"?"Spring Only":"Fall & Spring"}</span></div>
        </div>
        {isLocked&&<button onClick={onClear} style={{marginTop:8,width:"100%",padding:"5px 0",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.5)",fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>&#128275; Unlock &amp; Change Elective</button>}
        {c.cc&&c.cc.length>0&&<div style={{marginTop:10}}>{c.cc.map(function(t){return <div key={t} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{width:7,height:7,borderRadius:"50%",background:(CC_TAGS[t]||{}).color}}/><span style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{(CC_TAGS[t]||{}).label}</span></div>;})}</div>}
      </div>

      {isElective ? (
        <div className="dc">
          <div className="dl" style={{marginBottom:8}}>Select a Course for This Elective</div>
          {selection && (
            <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid " + accent + "33",borderRadius:6,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.9)",fontFamily:"'JetBrains Mono',monospace"}}>{selection.name}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2}}>{selection.title}</div>
                  {selection.prereqs&&<div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:3}}>Prereqs: {selection.prereqs}</div>}
                </div>
                <button onClick={onClear} style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:4,color:"#FF6B6B",fontSize:9,padding:"3px 8px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Clear</button>
              </div>
            </div>
          )}
          <div style={{position:"relative"}}>
            <button onClick={function(){setDdOpen(function(v){return !v;});}} style={{
              width:"100%",padding:"8px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,
              color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              display:"flex",justifyContent:"space-between",alignItems:"center",
            }}>
              <span>{selection ? "Change selection..." : "Choose from available electives..."}</span>
              <span style={{transform:ddOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",fontSize:10}}>&#9660;</span>
            </button>
            {ddOpen && (
              <div className="ep-dd" style={{position:"absolute",bottom:"100%",top:"auto",marginBottom:4,left:0,right:0}}>
                {opts.map(function(opt,oi){return(
                  <button key={oi} className="ep-opt" onClick={function(){onSelect(opt);setDdOpen(false);}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
                      <span style={{fontWeight:600,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{opt.name}</span>
                      <span style={{fontSize:8,color:opt.groupColor,fontWeight:600,flexShrink:0,marginLeft:8}}>{opt.groupName}</span>
                    </div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>{opt.title}</div>
                  </button>
                );})}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="dc">
          <div className="dl" style={{marginBottom:6}}>Catalog Description</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.55}}>{c.desc||"No description available."}</div>
          {c.notes&&<div style={{marginTop:10,padding:"6px 8px",background:accent+"11",borderRadius:4,border:"1px solid "+accent+"22"}}><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:accent,fontWeight:600,marginBottom:3}}>Notes</div><div style={{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.4}}>{c.notes}</div></div>}
        </div>
      )}

      {isElective ? (
        <div className="dc">
          <div className="dl" style={{marginBottom:6}}>Available Groups</div>
          {opts.reduce(function(acc,o){if(!acc.find(function(x){return x.name===o.groupName;}))acc.push({name:o.groupName,color:o.groupColor,count:opts.filter(function(x){return x.groupName===o.groupName;}).length});return acc;},[]).map(function(g,gi){return(
            <div key={gi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:g.color,flexShrink:0}}/>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{g.name}</span>
              <span style={{fontSize:9,color:"rgba(255,255,255,0.25)"}}>({g.count})</span>
            </div>
          );})}
        </div>
      ) : null}

      {!isElective ? (
        <div className="dc">
          <div className="dl" style={{marginBottom:6}}><span style={{color:"#6CB4EE"}}>&#8593;</span> Prerequisites</div>
          {up.length?up.map(function(x){return <div key={x.id} className="pc"><span style={{fontWeight:600,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{x.name}</span><span style={{color:"rgba(255,255,255,0.4)",fontSize:11}}>{x.title}</span></div>;}):(<div style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>None</div>)}
        </div>
      ) : null}

      {!isElective ? (
        <div className="dc">
          <div className="dl" style={{marginBottom:6}}><span style={{color:accent}}>&#8595;</span> Leads To</div>
          {dn.length?dn.map(function(x){return <div key={x.id} className="pc"><span style={{fontWeight:600,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{x.name}</span><span style={{color:"rgba(255,255,255,0.4)",fontSize:11}}>{x.title}</span></div>;}):(<div style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>Terminal course</div>)}
        </div>
      ) : null}
    </div>
  </div>);
}

function Electives({groups,isOpen,onToggle,onCourseClick}){
  return(<div className="ep">
    <button onClick={onToggle} className="et">
      <span style={{display:"flex",alignItems:"center",gap:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Elective Groups ({groups.length})
      </span>
      <span style={{transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.3s",fontSize:12}}>&#9660;</span>
    </button>
    <div style={{maxHeight:isOpen?800:0,overflow:"hidden",transition:"max-height 0.4s cubic-bezier(0.4,0,0.2,1)"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat("+groups.length+",1fr)",gap:0,padding:"0 0 12px",overflowX:"auto"}}>
        {groups.map(function(g,i){return(
          <div key={i} style={{borderRight:i<groups.length-1?"1px solid rgba(255,255,255,0.04)":"none",padding:"8px 10px"}}>
            <div style={{fontSize:10,fontWeight:700,color:g.color,letterSpacing:"0.04em",marginBottom:8,paddingBottom:6,borderBottom:"2px solid "+g.color+"33"}}>{g.name}</div>
            {g.courses.map(function(c,j){return(
              <div key={j} draggable
                onDragStart={function(e){e.dataTransfer.setData("text/plain","elective:"+i+":"+j);e.dataTransfer.effectAllowed="move";}}
                onClick={function(){if(onCourseClick)onCourseClick(c,g);}}
                style={{padding:"6px 8px",marginBottom:4,borderRadius:4,border:"1px solid rgba(255,255,255,0.04)",background:"rgba(255,255,255,0.02)",cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={function(e){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}
                onMouseLeave={function(e){e.currentTarget.style.background="rgba(255,255,255,0.02)";e.currentTarget.style.borderColor="rgba(255,255,255,0.04)";}}>
                <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.85)",fontFamily:"'JetBrains Mono',monospace"}}>{c.name}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:2}}>{c.title}</div>
                {c.prereqs&&<div style={{fontSize:8,color:g.color,marginTop:3,opacity:0.6}}>Prereqs: {c.prereqs}</div>}
              </div>
            );})}
          </div>
        );})}
      </div>
    </div>
  </div>);
}

function Lines({edg,courses,refs,cref,color}){
  var lineColor = color || "#6CB4EE";
  var lines = [];
  if(cref.current && edg.length) {
    var cr=cref.current.getBoundingClientRect();
    var sl=cref.current.scrollLeft, st=cref.current.scrollTop;
    for(var i=0;i<edg.length;i++){
      var f=edg[i][0], t=edg[i][1];
      var fe=refs.current[f], te=refs.current[t];
      if(!fe||!te) continue;
      var fr=fe.getBoundingClientRect(), tr=te.getBoundingClientRect();
      lines.push({x1:fr.right-cr.left+sl,y1:fr.top+fr.height/2-cr.top+st,x2:tr.left-cr.left+sl,y2:tr.top+tr.height/2-cr.top+st,k:f+"-"+t});
    }
  }
  if(!lines.length) return null;
  return(<svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:5}}>
    <defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={lineColor} opacity="0.7"/></marker></defs>
    {lines.map(function(l){var cp=Math.min(Math.abs(l.x2-l.x1)*0.35,60);return <path key={l.k} d={"M"+l.x1+" "+l.y1+"C"+(l.x1+cp)+" "+l.y1+","+(l.x2-cp)+" "+l.y2+","+l.x2+" "+l.y2} fill="none" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.45" markerEnd="url(#ah)"/>;})}
  </svg>);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const BME_KEYS = ["BMEA","BMEB","BMEC"];
  const BME_LABELS = {BMEA:"A: Pre-Medical",BMEB:"B: Instrumentation",BMEC:"C: Biomechanics"};
  const TOP_TABS = [
    {key:"EP",label:"EP — Engineering Physics"},
    {key:"ME",label:"ME — Mechanical Engineering"},
    {key:"EE",label:"EE — Electrical Engineering"},
    {key:"CE",label:"CE — Computer Engineering"},
    {key:"BME",label:"BME — Biomedical Engineering",children:BME_KEYS},
  ];

  const [mk,setMk]=useState("EP");
  const [sel,setSel]=useState(null);
  const [eo,setEo]=useState(false);
  const [overrides,setOverrides]=useState({});
  const [electiveSelections,setElectiveSelections]=useState({});
  const [dragOver,setDragOver]=useState(null);
  const [dragging,setDragging]=useState(null);
  const [ddOpen,setDdOpen]=useState(false);
  const [showCritPath,setShowCritPath]=useState(false);
  const [courseStatus,setCourseStatus]=useState({});
  const [savedPlans,setSavedPlans]=useState([]);
  const [showSaveDialog,setShowSaveDialog]=useState(false);
  const [showLoadMenu,setShowLoadMenu]=useState(false);
  const [saveName,setSaveName]=useState("");
  const [saveMsg,setSaveMsg]=useState(null);
  const [showHelp,setShowHelp]=useState(false);
  const [electiveDetail,setElectiveDetail]=useState(null);
  const [builderMode,setBuilderMode]=useState(false);
  const [builderCourses,setBuilderCourses]=useState([]); // [{id,sem,prereqs,...}]
  const [builderName,setBuilderName]=useState("New Degree Program");
  const [builderDragOver,setBuilderDragOver]=useState(null);
  const [builderSel,setBuilderSel]=useState(null);
  const [builderEdits,setBuilderEdits]=useState({}); // {courseId: {name,title,hrs,desc,offered,prereqs}}
  const [builderEditing,setBuilderEditing]=useState(null); // courseId currently being edited
  const [newCourseDialog,setNewCourseDialog]=useState(false);
  const [newCourseId,setNewCourseId]=useState("");
  const [newCourseTitle,setNewCourseTitle]=useState("");
  const [builderSearch,setBuilderSearch]=useState("");
  const [dragHistory,setDragHistory]=useState([]); // [{type,data}] for undo
  const [whatIfSource,setWhatIfSource]=useState(null); // program key to compare from
  const refs=useRef({}), cref=useRef(null);
  var loadedOnce = useRef(false);

  // Load saved plans list on mount
  useEffect(function(){
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    if (typeof window === "undefined" || !window.storage || typeof window.storage.list !== "function") return;
    var doLoad = function(){
      window.storage.list("plan:").then(function(result){
        if (!result || !result.keys || !result.keys.length) return;
        var promises = result.keys.map(function(k){
          return window.storage.get(k).catch(function(){return null;});
        });
        Promise.all(promises).then(function(results){
          var plans = [];
          for(var i=0;i<results.length;i++){
            if(!results[i]||!results[i].value) continue;
            try { plans.push(JSON.parse(results[i].value)); } catch(e){}
          }
          plans.sort(function(a,b){ return (b.savedAt||0)-(a.savedAt||0); });
          setSavedPlans(plans);
        }).catch(function(){});
      }).catch(function(){});
    };
    try { doLoad(); } catch(e){}
  },[]);

  // Save plan handler
  var handleSave = useCallback(function(){
    if (!saveName.trim()) return;
    if (typeof window === "undefined" || !window.storage || typeof window.storage.set !== "function") {
      setSaveMsg("Storage unavailable");
      setTimeout(function(){setSaveMsg(null);},2000);
      return;
    }
    var planData = {
      id: "plan:" + Date.now(),
      name: saveName.trim(),
      major: mk,
      overrides: overrides[mk] || {},
      electiveSelections: electiveSelections[mk] || {},
      courseStatus: courseStatus[mk] || {},
      savedAt: Date.now()
    };
    window.storage.set(planData.id, JSON.stringify(planData)).then(function(){
      setSavedPlans(function(prev){ return [planData].concat(prev); });
      setSaveName("");
      setShowSaveDialog(false);
      setSaveMsg("Saved!");
      setTimeout(function(){setSaveMsg(null);},2000);
    }).catch(function(){
      setSaveMsg("Save failed");
      setTimeout(function(){setSaveMsg(null);},2000);
    });
  },[mk, overrides, electiveSelections, courseStatus, saveName]);

  // Load plan handler
  var handleLoad = useCallback(function(planData){
    if(planData.isBuilder){
      setBuilderMode(true);
      setBuilderName(planData.name||"Loaded Plan");
      setBuilderCourses(planData.courses||[]);
      setBuilderEdits(planData.edits||{});
      setShowLoadMenu(false);
      setSaveMsg("Loaded!");
      setTimeout(function(){setSaveMsg(null);},2000);
      return;
    }
    setBuilderMode(false);
    setMk(planData.major);
    setOverrides(function(prev){
      var n = Object.assign({}, prev);
      n[planData.major] = planData.overrides || {};
      return n;
    });
    setElectiveSelections(function(prev){
      var n = Object.assign({}, prev);
      n[planData.major] = planData.electiveSelections || {};
      return n;
    });
    setCourseStatus(function(prev){
      var n = Object.assign({}, prev);
      n[planData.major] = planData.courseStatus || {};
      return n;
    });
    setShowLoadMenu(false);
    setSaveMsg("Loaded!");
    setTimeout(function(){setSaveMsg(null);},2000);
  },[]);

  // Delete plan handler
  var handleDeletePlan = useCallback(function(planData){
    if (typeof window === "undefined" || !window.storage || typeof window.storage.delete !== "function") return;
    window.storage.delete(planData.id).then(function(){
      setSavedPlans(function(prev){ return prev.filter(function(p){return p.id!==planData.id;}); });
    }).catch(function(){});
  },[]);

  const isBME = BME_KEYS.includes(mk);
  const activeTopKey = isBME ? "BME" : mk;

  const plan=DEGREE_PLANS[mk];
  const myOverrides = overrides[mk] || {};
  const mySelections = electiveSelections[mk] || {};
  const myStatus = courseStatus[mk] || {};
  const isModified = Object.keys(myOverrides).length > 0 || Object.keys(mySelections).length > 0 || Object.keys(myStatus).length > 0;

  // Flatten all elective group courses for this plan (for dropdown + drag)
  const allElectiveOptions = useMemo(()=>{
    const opts = [];
    (plan.electiveGroups||[]).forEach(g => {
      g.courses.forEach(c => {
        opts.push({...c, groupName: g.name, groupColor: g.color});
      });
    });
    return opts;
  },[mk]);

  // Apply overrides and elective selections to build resolved courses
  const rc=useMemo(function(){
    return plan.courses.map(function(pc) {
      var sem = myOverrides[pc.id] !== undefined ? myOverrides[pc.id] : pc.sem;
      var selected = mySelections[pc.id];
      if (pc.isElective && selected) {
        // Parse prereq string into course IDs where possible
        var parsedPrereqs = [];
        if (selected.prereqs) {
          var parts = selected.prereqs.split(/[,&]+/).map(function(s){return s.trim();});
          parts.forEach(function(part) {
            // Try to match "ENGR 3323" style to "ENGR3323" ID
            var match = part.match(/^([A-Z]{2,4})\s*(\d{4})/);
            if (match) {
              var candidateId = match[1] + match[2];
              // Check if this course exists in our plan
              var found = plan.courses.find(function(c){return c.id === candidateId;});
              if (found) parsedPrereqs.push(candidateId);
            }
          });
        }
        var catalogId = selected.name.replace(/\s+/g,"");
        var catEntry = COURSE_CATALOG[catalogId] || {};
        return resolve({...pc, sem, name: selected.name, title: selected.title, hrs: selected.hrs || pc.hrs || 3, isLocked: true, isElective: true, prereqs: parsedPrereqs, desc: catEntry.desc || selected.title});
      }
      return resolve({...pc, sem});
    });
  },[mk, myOverrides, mySelections]);

  const sc=useMemo(()=>rc.find(c=>c.id===sel),[sel,rc]);
  const {hl,ae}=useMemo(()=>{
    if(!sel) return {hl:new Set(),ae:[]};
    return {hl:new Set([...chain(sel,rc,"up"),...chain(sel,rc,"down")]),ae:[...edges(sel,rc,"up"),...edges(sel,rc,"down")]};
  },[sel,rc]);
  const click=useCallback(function(id){setSel(function(p){return p===id?null:id;});setDdOpen(false);setElectiveDetail(null);},[]);
  const sm=useMemo(()=>{const m={};SEMESTERS.forEach((_,i)=>{m[i]=rc.filter(c=>c.sem===i);});return m;},[rc]);

  // Compute dynamic semester hours
  const dynHours = useMemo(()=>{
    const h = Array(8).fill(0);
    rc.forEach(c => { h[c.sem] += (c.hrs || 0); });
    return h;
  },[rc]);

  // Prereq violation detection — only flag if prereq is in a LATER semester (same semester = concurrent OK)
  const warnings = useMemo(()=>{
    const w = new Set();
    rc.forEach(c => {
      if (!c.prereqs || !c.prereqs.length) return;
      c.prereqs.forEach(pid => {
        const prereqCourse = rc.find(x => x.id === pid);
        if (prereqCourse && prereqCourse.sem > c.sem) {
          w.add(c.id);
        }
      });
    });
    return w;
  },[rc]);

  const warningCount = warnings.size;

  // Critical path computation — longest prereq chain through the graph
  var criticalPath = useMemo(function(){
    // Build adjacency: for each course, what courses depend on it
    var courseMap = {};
    rc.forEach(function(c){ courseMap[c.id] = c; });

    // Memoized longest-path-to computation using dynamic programming
    var memo = {};
    function longestPathFrom(id) {
      if (memo[id] !== undefined) return memo[id];
      var c = courseMap[id];
      if (!c) { memo[id] = { length: 0, path: [] }; return memo[id]; }
      var deps = (c.prereqs || []).filter(function(p){ return courseMap[p]; });
      if (deps.length === 0) {
        memo[id] = { length: 1, path: [id] };
        return memo[id];
      }
      var best = { length: 0, path: [] };
      deps.forEach(function(pid) {
        var sub = longestPathFrom(pid);
        if (sub.length > best.length) {
          best = sub;
        }
      });
      memo[id] = { length: best.length + 1, path: best.path.concat([id]) };
      return memo[id];
    }

    // Find the longest path ending at any course
    // On ties, prefer path ending at Senior Design II (ENGR4892), then latest semester
    var longest = { length: 0, path: [], endSem: -1, endsAtCapstone: false };
    rc.forEach(function(c) {
      var result = longestPathFrom(c.id);
      var endsAtCapstone = c.id === "ENGR4892";
      var dominated = false;
      if (result.length > longest.length) {
        dominated = true;
      } else if (result.length === longest.length) {
        // Tie-break: prefer capstone
        if (endsAtCapstone && !longest.endsAtCapstone) {
          dominated = true;
        } else if (endsAtCapstone === longest.endsAtCapstone && c.sem > longest.endSem) {
          dominated = true;
        }
      }
      if (dominated) {
        longest = { length: result.length, path: result.path, endSem: c.sem, endsAtCapstone: endsAtCapstone };
      }
    });

    return {
      ids: new Set(longest.path),
      path: longest.path,
      length: longest.length,
      // Also compute edges along the critical path
      edges: longest.path.reduce(function(acc, id, i) {
        if (i === 0) return acc;
        acc.push([longest.path[i-1], id]);
        return acc;
      }, [])
    };
  }, [rc]);

  // Course status toggle: unchecked -> inprogress -> completed -> unchecked
  var toggleStatus = useCallback(function(courseId) {
    setCourseStatus(function(prev) {
      var planStatuses = prev[mk] || {};
      var current = planStatuses[courseId];
      var next;
      if (!current) next = "inprogress";
      else if (current === "inprogress") next = "completed";
      else next = null;
      var updated = Object.assign({}, planStatuses);
      if (next) { updated[courseId] = next; } else { delete updated[courseId]; }
      return Object.assign({}, prev, (function(){var o={};o[mk]=updated;return o;})());
    });
  }, [mk]);

  // Credit hour progress
  var progress = useMemo(function() {
    var total = 0, completed = 0, inprogress = 0;
    rc.forEach(function(c) {
      var hrs = c.hrs || 0;
      total += hrs;
      var st = myStatus[c.id];
      if (st === "completed") completed += hrs;
      else if (st === "inprogress") inprogress += hrs;
    });
    return { total: total, completed: completed, inprogress: inprogress, remaining: total - completed - inprogress };
  }, [rc, myStatus]);

  // What-if major change analysis
  var whatIfData = useMemo(function(){
    if(!whatIfSource || whatIfSource === mk) return null;
    var sourceStatuses = courseStatus[whatIfSource] || {};
    // Get all completed/inprogress course IDs from source program
    var sourceDone = {};
    Object.keys(sourceStatuses).forEach(function(cid){
      if(sourceStatuses[cid]==="completed"||sourceStatuses[cid]==="inprogress"){
        sourceDone[cid]=sourceStatuses[cid];
      }
    });
    if(Object.keys(sourceDone).length===0) return null;

    var sourcePlan = DEGREE_PLANS[whatIfSource];
    var targetPlan = DEGREE_PLANS[mk];
    var targetCourseIds = {};
    targetPlan.courses.forEach(function(c){targetCourseIds[c.id]=true;});

    var transfers = []; // courses completed in source that exist in target
    var orphans = [];   // courses completed in source that DON'T exist in target
    var newReqs = [];    // courses in target that aren't completed
    var transferHrs = 0, orphanHrs = 0, newHrs = 0;

    Object.keys(sourceDone).forEach(function(cid){
      var cat = COURSE_CATALOG[cid] || {};
      var hrs = cat.hrs || 3;
      if(targetCourseIds[cid]){
        transfers.push({id:cid,name:cat.name||cid,title:cat.title||"",hrs:hrs,status:sourceDone[cid]});
        transferHrs += hrs;
      } else {
        orphans.push({id:cid,name:cat.name||cid,title:cat.title||"",hrs:hrs});
        orphanHrs += hrs;
      }
    });

    targetPlan.courses.forEach(function(pc){
      if(!sourceDone[pc.id]){
        var cat = COURSE_CATALOG[pc.id] || {};
        newReqs.push({id:pc.id,name:cat.name||pc.id,title:cat.title||"",hrs:cat.hrs||3});
        newHrs += (cat.hrs||3);
      }
    });

    return {
      sourceLabel: sourcePlan.abbr || whatIfSource,
      targetLabel: targetPlan.abbr || mk,
      transfers: transfers, transferHrs: transferHrs,
      orphans: orphans, orphanHrs: orphanHrs,
      newReqs: newReqs, newHrs: newHrs,
      sourceDone: sourceDone
    };
  },[whatIfSource, mk, courseStatus]);

  // Drag handlers — supports both rearranging and dropping electives from panel
  const handleDrop = useCallback((targetSem, e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    // Record undo state before making changes
    setDragHistory(function(prev){
      var entry = {type:"nav",overrides:JSON.parse(JSON.stringify(overrides)),electiveSelections:JSON.parse(JSON.stringify(electiveSelections)),mk:mk};
      var next = prev.concat([entry]);
      if(next.length>20) next=next.slice(next.length-20);
      return next;
    });

    // Check if it's an elective from the panel (format: "elective:groupIdx:courseIdx")
    if (raw.startsWith("elective:")) {
      const [,gi,ci] = raw.split(":");
      const group = plan.electiveGroups[parseInt(gi)];
      const course = group?.courses[parseInt(ci)];
      if (!course) return;
      const emptySlot = plan.courses.find(pc => pc.isElective && !mySelections[pc.id]);
      if (emptySlot) {
        setElectiveSelections(prev => ({
          ...prev,
          [mk]: { ...(prev[mk]||{}), [emptySlot.id]: {name: course.name, title: course.title, hrs: 3, prereqs: course.prereqs} }
        }));
        setOverrides(prev => ({
          ...prev,
          [mk]: { ...(prev[mk]||{}), [emptySlot.id]: targetSem }
        }));
      }
    } else {
      setOverrides(prev => ({
        ...prev,
        [mk]: { ...(prev[mk]||{}), [raw]: targetSem }
      }));
    }
    setDragOver(null);
    setDragging(null);
  },[mk, plan, mySelections, overrides, electiveSelections]);

  // Elective slot selection from dropdown
  const selectElective = useCallback((slotId, course) => {
    setElectiveSelections(prev => ({
      ...prev,
      [mk]: { ...(prev[mk]||{}), [slotId]: {name: course.name, title: course.title, hrs: 3, prereqs: course.prereqs} }
    }));
    setElectivePicker(null);
  },[mk]);

  const clearElective = useCallback((slotId) => {
    setElectiveSelections(prev => {
      const n = {...prev, [mk]: {...(prev[mk]||{})}};
      delete n[mk][slotId];
      return n;
    });
    setElectivePicker(null);
  },[mk]);

  var handleReset = useCallback(function(){
    setOverrides(function(prev) { var n=Object.assign({},prev); delete n[mk]; return n; });
    setElectiveSelections(function(prev) { var n=Object.assign({},prev); delete n[mk]; return n; });
    setCourseStatus(function(prev) { var n=Object.assign({},prev); delete n[mk]; return n; });
    setSel(null);
  },[mk]);

  var handleUndo = useCallback(function(){
    setDragHistory(function(prev){
      if(!prev.length) return prev;
      var last = prev[prev.length-1];
      var next = prev.slice(0,prev.length-1);
      if(last.type==="nav"){
        setOverrides(last.overrides);
        setElectiveSelections(last.electiveSelections);
      } else if(last.type==="builder"){
        setBuilderCourses(last.courses);
      }
      return next;
    });
  },[]);

  useEffect(function(){setSel(null);setEo(false);setDdOpen(false);setShowCritPath(false);setShowSaveDialog(false);setShowLoadMenu(false);if(whatIfSource===mk)setWhatIfSource(null);refs.current={};},[mk]);

  return(<div className="nr"><style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    .nr{font-family:'DM Sans',-apple-system,sans-serif;background:#0D1117;color:rgba(255,255,255,0.9);min-height:100vh}
    .nh{padding:20px 32px 12px;border-bottom:1px solid rgba(255,255,255,0.06)}
    .nh h1{font-size:20px;font-weight:300;margin:0;color:rgba(255,255,255,0.95)} .nh h1 strong{font-weight:700}
    .ns{font-size:12px;color:rgba(255,255,255,0.35);margin:4px 0 0}
    .mt{display:flex;gap:4px;padding:10px 32px 0;flex-wrap:wrap}
    .mb{padding:6px 14px;border-radius:6px 6px 0 0;border:1px solid rgba(255,255,255,0.06);border-bottom:none;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.4);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif}
    .mb:hover{color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.04)}
    .mb.a{background:#0D1117;color:rgba(255,255,255,0.95);border-color:rgba(255,255,255,0.1)}
    .st{display:flex;gap:0;padding:0 32px;border-bottom:1px solid rgba(255,255,255,0.06)}
    .sb{padding:6px 16px;background:none;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,0.35);font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;letter-spacing:0.02em}
    .sb:hover{color:rgba(255,255,255,0.6)}
    .sb.sa{color:rgba(255,255,255,0.9)}
    .sg{display:grid;grid-template-columns:repeat(8,minmax(155px,1fr));gap:0;overflow-x:auto;position:relative;padding-bottom:16px}
    .sc{padding:0 6px 12px;min-width:155px;border-right:1px solid rgba(255,255,255,0.04)}.sc:last-child{border-right:none}
    .sh{padding:10px 8px 6px;position:sticky;top:0;z-index:10;background:#0D1117}
    .sl{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;font-weight:600;margin-bottom:2px}
    .sl.f{color:#C97B3A}.sl.s{color:#5B9BD5}
    .sy{font-size:11px;color:rgba(255,255,255,0.3)}.shr{font-size:9px;color:rgba(255,255,255,0.2);font-family:'JetBrains Mono',monospace;margin-top:2px}
    .cc{padding:8px 10px;border-radius:6px;border-width:1px;margin-bottom:5px;cursor:pointer;transition:all 0.2s cubic-bezier(0.4,0,0.2,1);position:relative;z-index:6}
    .cc:hover{border-color:rgba(255,255,255,0.15)!important;background:rgba(255,255,255,0.06)!important}
    .dp{border-top:1px solid rgba(255,255,255,0.1);background:linear-gradient(180deg,rgba(255,255,255,0.03),#0D1117 40%);animation:su 0.25s cubic-bezier(0.4,0,0.2,1)}
    .dpi{display:grid;grid-template-columns:1fr 1.5fr 0.8fr 0.8fr;gap:20px;padding:16px 24px 20px}
    .dc{min-width:0}.dci{border-right:1px solid rgba(255,255,255,0.06);padding-right:20px}
    @keyframes su{from{max-height:0;opacity:0}to{max-height:400px;opacity:1}}
    .cb{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}.cb:hover{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8)}
    .di{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px 10px}
    .dl{font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.35);font-weight:600}
    .dv{display:block;font-size:14px;font-weight:500;color:rgba(255,255,255,0.9);margin-top:2px}
    .pc{display:flex;gap:8px;align-items:center;padding:5px 8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:5px;margin-bottom:3px}
    .ep{border-top:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.01)}
    .et{width:100%;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:none;border:none;color:rgba(255,255,255,0.6);font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}.et:hover{color:rgba(255,255,255,0.85)}
    .hb{display:flex;align-items:center;gap:16px;padding:8px 32px;font-size:11px;color:rgba(255,255,255,0.25);border-bottom:1px solid rgba(255,255,255,0.04);flex-wrap:wrap}
    .hd{width:6px;height:6px;border-radius:50%;flex-shrink:0}
    .rb{padding:4px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.5);font-size:10px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s}
    .rb:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);border-color:rgba(255,255,255,0.2)}
    .sc-over{background:rgba(108,180,238,0.04);outline:1px dashed rgba(108,180,238,0.3);outline-offset:-2px;border-radius:4px}
    .dz{padding:8px;margin:4px 0;border:1px dashed rgba(108,180,238,0.4);border-radius:6px;text-align:center;font-size:10px;color:rgba(108,180,238,0.6);font-weight:500;background:rgba(108,180,238,0.04)}
    .cc[draggable]{cursor:grab}.cc[draggable]:active{cursor:grabbing;opacity:0.6}
    .ep-dd{position:absolute;top:100%;left:0;right:0;z-index:50;background:#1C2129;border:1px solid rgba(255,255,255,0.1);border-radius:6px;box-shadow:0 8px 32px rgba(0,0,0,0.5);max-height:240px;overflow-y:auto;margin-top:2px}
    .ep-opt{display:block;width:100%;text-align:left;padding:6px 10px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(255,255,255,0.7);font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.1s}
    .ep-opt:hover{background:rgba(255,255,255,0.06)}
    .ep-opt:last-child{border-bottom:none}
    .ep-clear{display:flex;gap:6px;align-items:center}
    .ep-dd::-webkit-scrollbar{width:4px}.ep-dd::-webkit-scrollbar-track{background:transparent}.ep-dd::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}

    @media print {
      @page { size: landscape; margin: 0.4in; }
      body, .nr { background: #fff !important; color: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .nh { padding: 10px 0 6px; border-bottom: 2px solid #111; }
      .nh h1 { font-size: 16px; color: #111 !important; }
      .nh h1 strong { color: #111 !important; }
      .ns { color: #666 !important; font-size: 10px; }
      .mt, .st, .hb, .dp, .ep, .dz, .rb, .cb { display: none !important; }
      .sg { overflow: visible !important; padding-bottom: 0; }
      .sc { border-right: 1px solid #ddd !important; page-break-inside: avoid; }
      .sh { background: #fff !important; position: static !important; }
      .sl { color: #333 !important; font-size: 8px; }
      .sl.f { color: #B8600A !important; }
      .sl.s { color: #2E6DA4 !important; }
      .sy { color: #666 !important; font-size: 9px; }
      .shr { color: #888 !important; font-size: 8px; }
      .cc { border: 1px solid #ccc !important; background: #fafafa !important; box-shadow: none !important; cursor: default !important; opacity: 1 !important; transform: none !important; margin-bottom: 3px; padding: 5px 7px; page-break-inside: avoid; }
      .cc span { color: #222 !important; }
      .cc div { color: #555 !important; }
      svg { display: none !important; }
      .print-header { display: block !important; }
      .print-progress { display: flex !important; }
    }
    .print-header { display: none; }
    .print-progress { display: none; }
  `}</style>

    <div className="nh">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <h1><strong style={{color:plan.color}}>UCO School of Engineering</strong> &mdash; Degree Plan Navigator</h1>
          <p className="ns">2025–2026 Catalog &middot; Click any course to explore prerequisites and pathways</p>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>
          <button onClick={function(){setBuilderMode(!builderMode);}} style={{
            padding:"4px 12px",borderRadius:14,border:"1px solid "+(builderMode?"rgba(168,130,255,0.4)":"rgba(255,255,255,0.15)"),
            background:builderMode?"rgba(168,130,255,0.15)":"rgba(255,255,255,0.04)",
            color:builderMode?"#A882FF":"rgba(255,255,255,0.5)",fontSize:11,fontWeight:600,
            cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",whiteSpace:"nowrap"
          }}>{builderMode?"\u25A0 Exit Builder":"\u2692 Degree Builder"}</button>
          <button onClick={function(){setShowHelp(true);}} style={{
            width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.15)",
            background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",fontSize:14,fontWeight:700,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"
          }}>?</button>
        </div>
      </div>
    </div>

    {!builderMode && (<div>

    <div className="mt">
      {TOP_TABS.map(tab=>(
        <button key={tab.key}
          className={"mb "+(activeTopKey===tab.key?"a":"")}
          onClick={function(){setMk(tab.children?tab.children[0]:tab.key);}}
          style={activeTopKey===tab.key?{borderColor:plan.color+"66",color:plan.color}:{}}>
          {tab.label}
        </button>
      ))}
    </div>

    {isBME && (
      <div className="st">
        {BME_KEYS.map(k=>(
          <button key={k} className={`sb ${mk===k?"sa":""}`} onClick={()=>setMk(k)}
            style={mk===k?{color:DEGREE_PLANS[k].color,borderBottomColor:DEGREE_PLANS[k].color}:{}}>
            {BME_LABELS[k]}
          </button>
        ))}
      </div>
    )}

    <div className="hb">
      <span style={{display:"flex",alignItems:"center",gap:6}}><span className="hd" style={{background:"#6CB4EE"}}/>Prereq chain</span>
      <span style={{display:"flex",alignItems:"center",gap:6}}><span className="hd" style={{background:plan.color}}/>Selected</span>
      <span style={{display:"flex",alignItems:"center",gap:6}}><span className="hd" style={{border:"1px dashed rgba(255,255,255,0.3)",boxSizing:"border-box"}}/>Elective</span>
      <span style={{display:"flex",alignItems:"center",gap:6,marginLeft:4}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"><path d="M5 9l4 4L19 3"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>Drag to rearrange</span>
      {warningCount > 0 && <span style={{display:"flex",alignItems:"center",gap:4,color:"#FF6B6B",marginLeft:4}}><span style={{fontSize:12}}>&#9888;</span>{warningCount} prereq warning{warningCount>1?"s":""}</span>}
      <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
        {(progress.completed > 0 || progress.inprogress > 0) && (
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:80,height:6,borderRadius:3,background:"rgba(255,255,255,0.06)",overflow:"hidden",display:"flex"}}>
              <div style={{width:(progress.completed/progress.total*100)+"%",height:"100%",background:"#4CAF50",transition:"width 0.3s"}}/>
              <div style={{width:(progress.inprogress/progress.total*100)+"%",height:"100%",background:"#64B5F6",transition:"width 0.3s"}}/>
            </div>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
              {progress.completed}h
              <span style={{color:"#4CAF50"}}> &#10003;</span>
              {progress.inprogress > 0 && (
                <span> {progress.inprogress}h<span style={{color:"#64B5F6"}}> ~</span></span>
              )}
              <span style={{color:"rgba(255,255,255,0.2)"}}> / {progress.total}h</span>
            </span>
          </div>
        )}
        <button onClick={function(){setShowCritPath(function(v){return !v;});if(!showCritPath)setSel(null);}}
          className="rb" style={showCritPath?{background:"rgba(255,140,66,0.15)",borderColor:"rgba(255,140,66,0.3)",color:"#FF8C42"}:{}}>
          {showCritPath ? "\u25A0 " : "\u25B6 "}Critical Path{showCritPath ? (" (" + criticalPath.length + " courses)") : ""}
        </button>
        <div style={{position:"relative"}}>
          <button onClick={function(){
            if(whatIfSource){setWhatIfSource(null);}
            else{
              // Find any program with completed courses to use as source
              var candidates=Object.keys(courseStatus).filter(function(k){return k!==mk&&Object.keys(courseStatus[k]||{}).length>0;});
              if(candidates.length>0)setWhatIfSource(candidates[0]);
            }
          }} className="rb" style={whatIfSource?{background:"rgba(100,181,246,0.15)",borderColor:"rgba(100,181,246,0.3)",color:"#64B5F6"}:{}}>
            {whatIfSource?"\u25A0 ":"\u25B6 "}What-If
          </button>
        </div>
        {dragHistory.length>0&&dragHistory[dragHistory.length-1].type==="nav"&&<button onClick={handleUndo} className="rb" title="Undo last drag">{"\u21A9"} Undo</button>}
        {isModified && <button onClick={handleReset} className="rb">Reset to Default</button>}
        <button onClick={function(){window.print();}} className="rb">&#128438; Export PDF</button>
        <div style={{position:"relative"}}>
          <button onClick={function(){setShowSaveDialog(!showSaveDialog);setShowLoadMenu(false);}} className="rb" style={{background:"rgba(76,175,80,0.1)",borderColor:"rgba(76,175,80,0.25)",color:"#4CAF50"}}>&#128190; Save</button>
          {showSaveDialog && (
            <div style={{position:"absolute",top:"100%",right:0,marginTop:4,background:"#1C2129",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:10,zIndex:60,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",width:220}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",fontWeight:600,marginBottom:6}}>Save Current Plan</div>
              <input type="text" value={saveName}
                onChange={function(e){setSaveName(e.target.value);}}
                onKeyDown={function(e){if(e.key==="Enter")handleSave();}}
                placeholder={"My "+plan.abbr+" Plan..."}
                style={{width:"100%",padding:"6px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:11,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={handleSave} style={{flex:1,padding:"5px 0",background:"#4CAF50",border:"none",borderRadius:4,color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Save</button>
                <button onClick={function(){setShowSaveDialog(false);}} style={{padding:"5px 10px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.5)",fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <div style={{position:"relative"}}>
          <button onClick={function(){setShowLoadMenu(!showLoadMenu);setShowSaveDialog(false);}} className="rb">
            &#128194; Load{savedPlans.length > 0 ? (" ("+savedPlans.length+")") : ""}
          </button>
          {showLoadMenu && (
            <div style={{position:"absolute",top:"100%",right:0,marginTop:4,background:"#1C2129",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:4,zIndex:60,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",width:260,maxHeight:300,overflowY:"auto"}}>
              <div style={{padding:"6px 8px",fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",fontWeight:600}}>Saved Plans</div>
              {savedPlans.length === 0 && (
                <div style={{padding:"12px 8px",fontSize:11,color:"rgba(255,255,255,0.3)",textAlign:"center",fontStyle:"italic"}}>No saved plans yet</div>
              )}
              {savedPlans.map(function(p,pi){
                var planDef = DEGREE_PLANS[p.major];
                var dateStr = new Date(p.savedAt).toLocaleDateString();
                return(
                  <div key={pi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <div onClick={function(){handleLoad(p);}} style={{cursor:"pointer",flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.85)"}}>{p.name}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{planDef ? planDef.abbr : p.major} &middot; {dateStr}</div>
                    </div>
                    <button onClick={function(e){e.stopPropagation();handleDeletePlan(p);}}
                      style={{background:"none",border:"none",color:"rgba(255,107,107,0.5)",fontSize:12,cursor:"pointer",padding:"2px 4px"}}>&#10005;</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {saveMsg && <span style={{fontSize:10,color:"#4CAF50",fontWeight:600}}>{saveMsg}</span>}
      </div>
    </div>

    <div className="print-progress" style={{justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #ddd",marginBottom:4,fontSize:10,color:"#555"}}>
      <span style={{fontWeight:600}}>{plan.name} — Degree Plan</span>
      <span>Completed: {progress.completed}h &middot; In Progress: {progress.inprogress}h &middot; Remaining: {progress.remaining}h &middot; Total: {progress.total}h</span>
    </div>

    {showCritPath && (
      <div style={{margin:"0 32px 8px",padding:"10px 14px",background:"rgba(255,140,66,0.06)",border:"1px solid rgba(255,140,66,0.15)",borderRadius:6}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:"#FF8C42",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>Critical Path — {criticalPath.length} courses spanning {(function(){var sems=new Set();criticalPath.path.forEach(function(id){var c=rc.find(function(x){return x.id===id;});if(c)sems.add(c.sem);});return sems.size;})()}&nbsp;semesters</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.5,marginBottom:6}}>
              This is the longest chain of prerequisite-dependent courses in your plan. A delay or failure in any of these courses will push back your graduation. All other courses have scheduling flexibility.
            </div>
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:4}}>
              {criticalPath.path.map(function(id,idx){
                var c = rc.find(function(x){return x.id===id;});
                var cname = c ? c.name : id;
                return(
                  <span key={id} style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#FF8C42",fontFamily:"'JetBrains Mono',monospace",padding:"2px 6px",background:"rgba(255,140,66,0.1)",borderRadius:3,cursor:"pointer"}}
                      onClick={function(){click(id);setShowCritPath(false);}}>{cname}</span>
                    {idx < criticalPath.path.length - 1 && <span style={{color:"rgba(255,140,66,0.4)",fontSize:10}}>&#8594;</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    )}

    {whatIfData && (
      <div style={{margin:"0 32px 8px",padding:"10px 14px",background:"rgba(100,181,246,0.06)",border:"1px solid rgba(100,181,246,0.15)",borderRadius:6}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:700,color:"#64B5F6",letterSpacing:"0.05em",textTransform:"uppercase"}}>What-If Analysis</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Comparing progress from <strong style={{color:"#64B5F6"}}>{whatIfData.sourceLabel}</strong> to <strong style={{color:plan.color}}>{whatIfData.targetLabel}</strong></span>
              <select value={whatIfSource||""} onChange={function(e){setWhatIfSource(e.target.value||null);}}
                style={{marginLeft:8,padding:"2px 6px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:3,color:"rgba(255,255,255,0.7)",fontSize:9,outline:"none"}}>
                {Object.keys(courseStatus).filter(function(k){return k!==mk&&Object.keys(courseStatus[k]||{}).length>0;}).map(function(k){
                  var p=DEGREE_PLANS[k];
                  return <option key={k} value={k}>{p?p.abbr:k}</option>;
                })}
              </select>
            </div>
            <div style={{display:"flex",gap:16,fontSize:10}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:"#4CAF50",fontWeight:700}}>{whatIfData.transfers.length}</span>
                <span style={{color:"rgba(255,255,255,0.4)"}}>courses transfer ({whatIfData.transferHrs}h)</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:"#FF6B6B",fontWeight:700}}>{whatIfData.orphans.length}</span>
                <span style={{color:"rgba(255,255,255,0.4)"}}>won't apply ({whatIfData.orphanHrs}h)</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:"#FFB74D",fontWeight:700}}>{whatIfData.newReqs.length}</span>
                <span style={{color:"rgba(255,255,255,0.4)"}}>new requirements ({whatIfData.newHrs}h)</span>
              </div>
            </div>
            {whatIfData.orphans.length>0&&(
              <div style={{marginTop:6,fontSize:9,color:"rgba(255,255,255,0.3)"}}>
                Courses that won't apply: {whatIfData.orphans.map(function(o){return o.name;}).join(", ")}
              </div>
            )}
          </div>
          <button onClick={function(){setWhatIfSource(null);}} className="cb" style={{width:22,height:22,fontSize:12}}>{"\u00D7"}</button>
        </div>
      </div>
    )}

    <div className="sg" ref={cref}>
      <Lines edg={showCritPath ? criticalPath.edges : ae} courses={rc} refs={refs} cref={cref} color={showCritPath ? "#FF8C42" : "#6CB4EE"}/>
      {SEMESTERS.map((s,i)=>{const [y,sp]=[s.split(" ")[1],s.split(" ")[2]];const isOver=dragOver===i;return(
        <div className={"sc"+(isOver?" sc-over":"")} key={i}
          onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setDragOver(i);}}
          onDragLeave={function(){setDragOver(null);}}
          onDrop={function(e){handleDrop(i,e);}}>
          <div className="sh">
            <div className={"sl "+(sp==="Fall"?"f":"s")}>{sp}</div>
            <div className="sy">Year {y}</div>
            <div className="shr" style={dynHours[i]!==plan.semHours[i]?{color:"#E8C547"}:{}}>{dynHours[i]} credit hours{dynHours[i]!==plan.semHours[i]?(" (was "+plan.semHours[i]+")"):""}</div>
          </div>
        {sm[i]&&sm[i].map(function(c){
          var isFallSem = i % 2 === 0;
          var off = c.offered || "FS";
          var mismatch = (off==="F" && !isFallSem) || (off==="S" && isFallSem);
          // What-if: if source program had this course completed, show it as completed here
          var effectiveStatus = myStatus[c.id] || null;
          var whatIfTransfer = false;
          if(whatIfData && whatIfData.sourceDone[c.id] && !effectiveStatus){
            effectiveStatus = whatIfData.sourceDone[c.id];
            whatIfTransfer = true;
          }
          return(
          <Card key={c.id} course={c}
            hl={hl.has(c.id)&&c.id!==sel}
            dim={showCritPath ? !criticalPath.ids.has(c.id) : (sel&&!hl.has(c.id))}
            sel={c.id===sel}
            onClick={click}
            cardRef={function(el){refs.current[c.id]=el;}} accent={plan.color}
            onDragStart={setDragging} onDragEnd={function(){setDragging(null);setDragOver(null);}}
            hasWarning={warnings.has(c.id)}
            onCritPath={showCritPath && criticalPath.ids.has(c.id)}
            status={effectiveStatus}
            onToggleStatus={toggleStatus}
            semMismatch={mismatch}
            whatIfTransfer={whatIfTransfer}/>
        );})}
        {isOver && <div className="dz">Drop here</div>}
        </div>);})}
    </div>

    {sc&&<Detail course={sc} courses={rc} onClose={function(){setSel(null);setDdOpen(false);}} accent={plan.color}
      isElective={!!sc.isElective && !sc.isLocked}
      isLocked={!!sc.isLocked}
      selection={mySelections[sc.id]||null}
      allOptions={allElectiveOptions}
      onSelect={function(opt){selectElective(sc.id,opt);setDdOpen(false);}}
      onClear={function(){clearElective(sc.id);}}
      ddOpen={ddOpen}
      setDdOpen={setDdOpen}
    />}
    {!sc && electiveDetail && (
      <div className="dp" style={{borderTopColor:electiveDetail.groupColor+"44"}}>
        <div className="dpi" style={{gridTemplateColumns:"1fr 2fr 1fr"}}>
          <div className="dc dci">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:electiveDetail.groupColor,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>{electiveDetail.name}</div>
                <div style={{fontSize:17,fontWeight:300,color:"rgba(255,255,255,0.95)"}}>{electiveDetail.title}</div>
              </div>
              <button onClick={function(){setElectiveDetail(null);}} className="cb">&times;</button>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <div className="di" style={{flex:1}}><span className="dl">Group</span><span className="dv" style={{fontSize:11,color:electiveDetail.groupColor}}>{electiveDetail.groupName}</span></div>
              <div className="di" style={{flex:1}}><span className="dl">Credits</span><span className="dv">3</span></div>
            </div>
          </div>
          <div className="dc">
            <div className="dl" style={{marginBottom:6}}>Catalog Description</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.55}}>{(COURSE_CATALOG[electiveDetail.catalogId]||{}).desc || "Description available in the UCO Course Catalog."}</div>
            {electiveDetail.prereqs && (
              <div style={{marginTop:10,padding:"6px 8px",background:electiveDetail.groupColor+"11",borderRadius:4,border:"1px solid "+electiveDetail.groupColor+"22"}}>
                <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:electiveDetail.groupColor,fontWeight:600,marginBottom:3}}>Prerequisites</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.4}}>{electiveDetail.prereqs}</div>
              </div>
            )}
          </div>
          <div className="dc">
            <div className="dl" style={{marginBottom:6}}>Usage</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>This course can be used to fill an elective slot. Drag it from the elective group into a semester column, or click an elective slot in the grid and select it from the dropdown.</div>
          </div>
        </div>
      </div>
    )}
    <Electives groups={plan.electiveGroups} isOpen={eo} onToggle={function(){setEo(!eo);}}
      onCourseClick={function(course,group){
        setSel(null);
        var catalogId = course.name.replace(/\s+/g,"");
        setElectiveDetail({name:course.name,title:course.title,prereqs:course.prereqs,groupName:group.name,groupColor:group.color,catalogId:catalogId});
      }}
    />

    </div>)}

    {builderMode && (<div>
      <div style={{padding:"10px 32px",borderBottom:"1px solid rgba(168,130,255,0.15)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <span style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:"#A882FF",fontWeight:700}}>Degree Builder</span>
        <input type="text" value={builderName} onChange={function(e){setBuilderName(e.target.value);}}
          style={{flex:1,maxWidth:300,padding:"5px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:13,fontWeight:300,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{builderCourses.length} courses &middot; {builderCourses.reduce(function(s,c){var cat=COURSE_CATALOG[c.id]||builderEdits[c.id]||{};return s+(cat.hrs||3);},0)} credit hours</span>
        <div style={{position:"relative"}}>
          <button onClick={function(){setNewCourseDialog(!newCourseDialog);}} className="rb" style={{background:"rgba(168,130,255,0.1)",borderColor:"rgba(168,130,255,0.25)",color:"#A882FF"}}>+ New Course</button>
          {newCourseDialog && (
            <div style={{position:"absolute",top:"100%",right:0,marginTop:4,background:"#1C2129",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:10,zIndex:60,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",width:250}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",fontWeight:600,marginBottom:6}}>Create New Course</div>
              <input type="text" value={newCourseId} onChange={function(e){setNewCourseId(e.target.value.toUpperCase());}}
                placeholder="Course ID (e.g. ENGR 3993)"
                style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:11,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box",marginBottom:4}}/>
              <input type="text" value={newCourseTitle} onChange={function(e){setNewCourseTitle(e.target.value);}}
                placeholder="Course Title"
                style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:11,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:6}}/>
              <div style={{display:"flex",gap:6}}>
                <button onClick={function(){
                  var cid = newCourseId.replace(/\s+/g,"");
                  if(!cid||!newCourseTitle.trim()) return;
                  if(COURSE_CATALOG[cid]||builderEdits[cid]) return;
                  setBuilderEdits(function(prev){
                    var n=Object.assign({},prev);
                    n[cid]={name:newCourseId.trim(),title:newCourseTitle.trim(),hrs:3,desc:"",offered:"FS",prereqs:"",isNew:true};
                    return n;
                  });
                  setNewCourseId("");setNewCourseTitle("");setNewCourseDialog(false);
                }} style={{flex:1,padding:"5px 0",background:"#A882FF",border:"none",borderRadius:4,color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Create</button>
                <button onClick={function(){setNewCourseDialog(false);}} style={{padding:"5px 10px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.5)",fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        {dragHistory.length>0&&dragHistory[dragHistory.length-1].type==="builder"&&<button onClick={handleUndo} className="rb" title="Undo last action">{"\u21A9"} Undo</button>}
        {builderCourses.length > 0 && <button onClick={function(){setBuilderCourses([]);}} className="rb">Clear All</button>}
        <button onClick={function(){
          if(typeof window==="undefined"||!window.storage||typeof window.storage.set!=="function"){return;}
          var data={id:"builder:"+Date.now(),name:builderName,courses:builderCourses,edits:builderEdits,savedAt:Date.now(),isBuilder:true};
          window.storage.set(data.id,JSON.stringify(data)).then(function(){
            setSavedPlans(function(prev){return [data].concat(prev);});
            setSaveMsg("Builder saved!");setTimeout(function(){setSaveMsg(null);},2000);
          }).catch(function(){});
        }} className="rb" style={{background:"rgba(76,175,80,0.1)",borderColor:"rgba(76,175,80,0.25)",color:"#4CAF50"}}>&#128190; Save Builder</button>
        {saveMsg && <span style={{fontSize:10,color:"#4CAF50",fontWeight:600}}>{saveMsg}</span>}
      </div>
      <div style={{padding:"6px 32px",fontSize:10,color:"rgba(255,255,255,0.25)",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
        Drag courses from the catalog below into semester columns to build your degree plan
      </div>

      {(function(){
        var bids = {};
        builderCourses.forEach(function(c){bids[c.id]=true;});
        var reqs = [
          {name:"University Core",color:"#BF8F00",items:[
            {label:"English Comp",courses:["ENG1113","ENG1213"],need:2},
            {label:"Speech",courses:["MCOM1113"],need:1},
            {label:"Math (CC/Quant)",courses:["MATH2313"],need:1},
            {label:"Life Science",courses:["BIO1114","BIO1204","BIO2604"],need:1},
            {label:"Physical Science",courses:["CHEM1103","CHEM1112","PHY2014"],need:1},
            {label:"Humanities",courses:["HUM2113"],need:1},
            {label:"Philosophy",courses:["PHIL2313","PHIL2000"],need:1},
            {label:"Am. Government",courses:["POL1113"],need:1},
            {label:"Am. History",courses:["HIST1483"],need:1},
            {label:"Life Skills",courses:["HLTH1112","ECON1103"],need:1},
            {label:"Social/Behavioral",courses:["FMKT2323","ECON1103"],need:1},
          ]},
          {name:"Math Foundation",color:"#5B9BD5",items:[
            {label:"Calc 1-4",courses:["MATH2313","MATH2323","MATH2333","MATH2343"],need:4},
            {label:"Diff Eq",courses:["MATH3103"],need:1},
          ]},
          {name:"Physics",color:"#C97B3A",items:[
            {label:"Physics I & II",courses:["PHY2014","PHY2114"],need:2},
          ]},
          {name:"Engineering Core",color:"#4EA8DE",items:[
            {label:"Intro to Engr",courses:["ENGR1111","ENGR1112","ENGR1121"],need:1},
            {label:"Engr Computing",courses:["ENGR1213"],need:1},
            {label:"Statics",courses:["ENGR2033"],need:1},
            {label:"Elec. Science",courses:["ENGR2303","ENGR2311"],need:2},
            {label:"Prob & Stats",courses:["ENGR3303"],need:1},
            {label:"Sr Design I+II",courses:["ENGR4852","ENGR4862","ENGR4872","ENGR4842","BME4882","ENGR4892"],need:2},
          ]},
          {name:"Chemistry",color:"#6BBF8A",items:[
            {label:"Gen Chem",courses:["CHEM1103","CHEM1112","CHEM1315","CHEM1223","CHEM1232"],need:1},
          ]},
        ];
        var totalMet=0, totalReqs=0;
        reqs.forEach(function(cat){cat.items.forEach(function(item){
          totalReqs++;
          var count=0;
          item.courses.forEach(function(cid){if(bids[cid])count++;});
          if(count>=item.need)totalMet++;
        });});
        return(
          <div style={{padding:"8px 32px",display:"flex",gap:12,alignItems:"flex-start",borderBottom:"1px solid rgba(255,255,255,0.04)",flexWrap:"wrap"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontWeight:600,minWidth:70,paddingTop:2}}>
              Requirements<br/><span style={{fontSize:12,color:totalMet===totalReqs?"#4CAF50":"rgba(255,255,255,0.6)"}}>{totalMet}/{totalReqs}</span>
            </div>
            {reqs.map(function(cat,ci){return(
              <div key={ci} style={{flex:1,minWidth:120}}>
                <div style={{fontSize:8,fontWeight:700,color:cat.color,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>{cat.name}</div>
                {cat.items.map(function(item,ii){
                  var count=0;
                  item.courses.forEach(function(cid){if(bids[cid])count++;});
                  var met=count>=item.need;
                  return(
                    <div key={ii} style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}>
                      <span style={{fontSize:10,color:met?"#4CAF50":"rgba(255,255,255,0.2)"}}>{met?"\u2713":"\u25CB"}</span>
                      <span style={{fontSize:9,color:met?"rgba(76,175,80,0.7)":"rgba(255,255,255,0.35)",textDecoration:met?"line-through":"none"}}>{item.label}</span>
                      {!met&&count>0&&<span style={{fontSize:8,color:"#FFB74D"}}>({count}/{item.need})</span>}
                    </div>
                  );
                })}
              </div>
            );})}
          </div>
        );
      })()}

      <div className="sg">
        {SEMESTERS.map(function(s,i){
          var y=s.split(" ")[1], sp=s.split(" ")[2];
          var semCrs = builderCourses.filter(function(c){return c.sem===i;});
          var semHrs = semCrs.reduce(function(t,c){var cat=COURSE_CATALOG[c.id];return t+(cat?cat.hrs||3:3);},0);
          var isOvr = builderDragOver===i;
          return(
          <div className={"sc"+(isOvr?" sc-over":"")} key={i}
            onDragOver={function(e){e.preventDefault();e.dataTransfer.dropEffect="move";setBuilderDragOver(i);}}
            onDragLeave={function(){setBuilderDragOver(null);}}
            onDrop={function(e){
              e.preventDefault();
              var raw=e.dataTransfer.getData("text/plain");
              if(!raw){setBuilderDragOver(null);return;}
              // Record undo state
              setDragHistory(function(prev){
                var entry={type:"builder",courses:JSON.parse(JSON.stringify(builderCourses))};
                var next=prev.concat([entry]);
                if(next.length>20)next=next.slice(next.length-20);
                return next;
              });
              if(raw.startsWith("builder-cat:")){
                var cid=raw.replace("builder-cat:","");
                if(!builderCourses.find(function(x){return x.id===cid;})){
                  setBuilderCourses(function(prev){return prev.concat([{id:cid,sem:i,prereqs:[]}]);});
                }
              } else if(raw.startsWith("builder-move:")){
                var mid=raw.replace("builder-move:","");
                setBuilderCourses(function(prev){return prev.map(function(c){return c.id===mid?Object.assign({},c,{sem:i}):c;});});
              }
              setBuilderDragOver(null);
            }}>
            <div className="sh">
              <div className={"sl "+(sp==="Fall"?"f":"s")}>{sp}</div>
              <div className="sy">Year {y}</div>
              <div className="shr">{semHrs} credit hours</div>
            </div>
            {semCrs.map(function(bc){
              var edited=builderEdits[bc.id];
              var base=COURSE_CATALOG[bc.id]||{};
              var cat=edited?Object.assign({},base,edited):base;
              var off=edited&&edited.offered?edited.offered:(OFFERED[bc.id]||"FS");
              // Determine if this course is affected by the course being edited
              var isAffected = false;
              if(builderEditing){
                // Check if this course has the editing course as a prereq
                var bp = bc.prereqs || [];
                if(bp.indexOf && bp.indexOf(builderEditing)>=0) isAffected=true;
                // Also check catalog prereqs that reference the editing course
                if(!isAffected && base.prereqs){
                  // prereqs in catalog are stored per degree plan, not catalog. Check builderCourses prereqs
                }
                // Check all plan courses that reference the editing course
                if(!isAffected){
                  // Scan all courses in plan looking for any whose prereqs include the editing course
                  // We need to check DEGREE_PLANS prereqs too... but for builder, prereqs come from builderCourses[].prereqs
                  // For now: scan the COURSE_CATALOG for any course that lists builderEditing as a prereq
                  var allPlans = Object.keys(DEGREE_PLANS);
                  for(var pi=0;pi<allPlans.length;pi++){
                    var planCrs = DEGREE_PLANS[allPlans[pi]].courses;
                    for(var ci=0;ci<planCrs.length;ci++){
                      if(planCrs[ci].id===bc.id && planCrs[ci].prereqs && planCrs[ci].prereqs.indexOf(builderEditing)>=0){
                        isAffected=true;break;
                      }
                    }
                    if(isAffected) break;
                  }
                }
              }
              var isBeingEdited = builderEditing===bc.id;
              return(<div key={bc.id} draggable
                onDragStart={function(e){e.dataTransfer.setData("text/plain","builder-move:"+bc.id);}}
                onClick={function(){setBuilderSel(builderSel===bc.id?null:bc.id);setBuilderEditing(null);}}
                className="cc" style={{
                  borderColor:isBeingEdited?"#FF8C42":isAffected?"#FFB74D":builderSel===bc.id?"#A882FF":edited?"rgba(168,130,255,0.3)":"rgba(255,255,255,0.06)",
                  borderStyle:"solid",borderWidth:isAffected||isBeingEdited?"2px":"1px",
                  background:isBeingEdited?"rgba(255,140,66,0.1)":isAffected?"rgba(255,183,77,0.06)":builderSel===bc.id?"rgba(168,130,255,0.08)":"rgba(255,255,255,0.03)",
                  cursor:"grab",position:"relative",
                }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    {edited&&<span style={{fontSize:8,color:"#A882FF"}} title="Edited">{"\u270E"}</span>}
                    {isAffected&&<span style={{fontSize:9,color:"#FFB74D"}} title="Affected by edit">{"\u26A0"}</span>}
                    <span style={{fontSize:11,fontWeight:700,color:isBeingEdited?"#FF8C42":isAffected?"#FFB74D":builderSel===bc.id?"#A882FF":"rgba(255,255,255,0.9)",fontFamily:"'JetBrains Mono',monospace"}}>{cat.name||bc.id}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:8,color:off==="F"?"#C97B3A":off==="S"?"#5B9BD5":"rgba(255,255,255,0.2)",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{off==="F"?"F":off==="S"?"S":"F/S"}</span>
                    <span style={{fontSize:9,color:"rgba(255,255,255,0.35)",fontFamily:"'JetBrains Mono',monospace"}}>{cat.hrs||3}h</span>
                  </div>
                </div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",lineHeight:1.3}}>{cat.title||""}</div>
                <span onClick={function(e){e.stopPropagation();setBuilderCourses(function(prev){return prev.filter(function(x){return x.id!==bc.id;});});if(builderSel===bc.id)setBuilderSel(null);}}
                  style={{position:"absolute",top:3,right:4,fontSize:10,color:"rgba(255,107,107,0.5)",cursor:"pointer",lineHeight:1}} title="Remove">{"\u00D7"}</span>
              </div>);
            })}
            {isOvr && <div className="dz">Drop here</div>}
          </div>);
        })}
      </div>

      {builderSel && (function(){
        var edited=builderEdits[builderSel];
        var base=COURSE_CATALOG[builderSel]||{};
        var cat=edited?Object.assign({},base,edited):base;
        var inPlan=builderCourses.find(function(x){return x.id===builderSel;});
        var isEditing=builderEditing===builderSel;
        var off=edited&&edited.offered?edited.offered:(OFFERED[builderSel]||"FS");

        // Count affected courses in all degree plans
        var affected=[];
        var allPlans=Object.keys(DEGREE_PLANS);
        for(var pi=0;pi<allPlans.length;pi++){
          var pcs=DEGREE_PLANS[allPlans[pi]].courses;
          for(var ci=0;ci<pcs.length;ci++){
            if(pcs[ci].prereqs&&pcs[ci].prereqs.indexOf(builderSel)>=0){
              var ac=COURSE_CATALOG[pcs[ci].id]||{};
              affected.push({id:pcs[ci].id,name:ac.name||pcs[ci].id,plan:DEGREE_PLANS[allPlans[pi]].abbr||allPlans[pi]});
            }
          }
        }
        // Deduplicate
        var seen={};affected=affected.filter(function(a){if(seen[a.id+a.plan])return false;seen[a.id+a.plan]=true;return true;});

        if(isEditing){
          var ed=edited||{name:base.name||builderSel,title:base.title||"",hrs:base.hrs||3,desc:base.desc||"",offered:off,prereqs:""};
          return(
            <div className="dp" style={{borderTopColor:"rgba(255,140,66,0.4)"}}>
              <div style={{padding:"12px 24px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#FF8C42",letterSpacing:"0.06em",textTransform:"uppercase"}}>
                    {"\u270E"} Editing: {cat.name||builderSel}
                    {edited&&edited.isNew&&<span style={{marginLeft:8,color:"#A882FF",fontWeight:600}}>(New Course)</span>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={function(){setBuilderEditing(null);}} className="rb" style={{background:"rgba(76,175,80,0.1)",borderColor:"rgba(76,175,80,0.25)",color:"#4CAF50"}}>Done</button>
                    {edited&&<button onClick={function(){setBuilderEdits(function(prev){var n=Object.assign({},prev);delete n[builderSel];return n;});setBuilderEditing(null);}} className="rb">Revert</button>}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:12}}>
                  <div>
                    <div className="dl" style={{marginBottom:4}}>Course Name</div>
                    <input type="text" value={ed.name||""} onChange={function(e){setBuilderEdits(function(prev){var n=Object.assign({},prev);n[builderSel]=Object.assign({},ed,{name:e.target.value});return n;});}}
                      style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:12,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box"}}/>
                    <div className="dl" style={{marginBottom:4,marginTop:8}}>Title</div>
                    <input type="text" value={ed.title||""} onChange={function(e){setBuilderEdits(function(prev){var n=Object.assign({},prev);n[builderSel]=Object.assign({},ed,{title:e.target.value});return n;});}}
                      style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:11,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <div style={{flex:1}}>
                        <div className="dl" style={{marginBottom:4}}>Credits</div>
                        <input type="number" value={ed.hrs||3} min={1} max={6} onChange={function(e){setBuilderEdits(function(prev){var n=Object.assign({},prev);n[builderSel]=Object.assign({},ed,{hrs:parseInt(e.target.value)||3});return n;});}}
                          style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                      </div>
                      <div style={{flex:1}}>
                        <div className="dl" style={{marginBottom:4}}>Offered</div>
                        <select value={ed.offered||"FS"} onChange={function(e){setBuilderEdits(function(prev){var n=Object.assign({},prev);n[builderSel]=Object.assign({},ed,{offered:e.target.value});return n;});}}
                          style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.9)",fontSize:11,outline:"none",boxSizing:"border-box"}}>
                          <option value="FS">Fall & Spring</option>
                          <option value="F">Fall Only</option>
                          <option value="S">Spring Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="dl" style={{marginBottom:4}}>Description</div>
                    <textarea value={ed.desc||""} onChange={function(e){setBuilderEdits(function(prev){var n=Object.assign({},prev);n[builderSel]=Object.assign({},ed,{desc:e.target.value});return n;});}}
                      rows={6} style={{width:"100%",padding:"6px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.7)",fontSize:11,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.5}}/>
                  </div>
                  <div>
                    <div className="dl" style={{marginBottom:4}}>{"\u26A0"} Downstream Impact ({affected.length} courses)</div>
                    {affected.length===0&&<div style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>No other courses list this as a prerequisite</div>}
                    <div style={{maxHeight:140,overflowY:"auto"}}>
                      {affected.map(function(a,ai){return(
                        <div key={ai} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,padding:"3px 6px",background:"rgba(255,183,77,0.06)",borderRadius:3,border:"1px solid rgba(255,183,77,0.12)"}}>
                          <span style={{fontSize:9,fontWeight:600,color:"#FFB74D",fontFamily:"'JetBrains Mono',monospace"}}>{a.name}</span>
                          <span style={{fontSize:8,color:"rgba(255,255,255,0.25)"}}>{a.plan}</span>
                        </div>
                      );})}
                    </div>
                    {affected.length>0&&<div style={{marginTop:6,fontSize:9,color:"rgba(255,183,77,0.5)",lineHeight:1.4}}>These courses require {cat.name||builderSel} as a prerequisite. Changes may affect their sequencing or content dependencies.</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return(
          <div className="dp" style={{borderTopColor:"rgba(168,130,255,0.3)"}}>
            <div className="dpi" style={{gridTemplateColumns:"1fr 1.5fr 1fr 0.8fr"}}>
              <div className="dc dci">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{fontSize:11,fontWeight:600,color:"#A882FF",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>{cat.name||builderSel}</div>
                      {edited&&<span style={{fontSize:8,color:"#A882FF",border:"1px solid rgba(168,130,255,0.3)",borderRadius:3,padding:"1px 4px"}}>{edited.isNew?"New":"Edited"}</span>}
                    </div>
                    <div style={{fontSize:17,fontWeight:300,color:"rgba(255,255,255,0.95)"}}>{cat.title||""}</div>
                  </div>
                  <button onClick={function(){setBuilderSel(null);setBuilderEditing(null);}} className="cb">{"\u00D7"}</button>
                </div>
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <div className="di" style={{flex:1}}><span className="dl">Credits</span><span className="dv">{cat.hrs||3}</span></div>
                  <div className="di" style={{flex:1}}><span className="dl">Offered</span><span className="dv" style={{fontSize:12,color:off==="F"?"#C97B3A":off==="S"?"#5B9BD5":"rgba(255,255,255,0.7)"}}>{off==="F"?"Fall Only":off==="S"?"Spring Only":"Fall & Spring"}</span></div>
                </div>
                <button onClick={function(){setBuilderEditing(builderSel);}} className="rb" style={{marginTop:8,width:"100%",background:"rgba(168,130,255,0.1)",borderColor:"rgba(168,130,255,0.25)",color:"#A882FF"}}>{"\u270E"} Edit Course</button>
              </div>
              <div className="dc">
                <div className="dl" style={{marginBottom:6}}>Catalog Description</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.55}}>{cat.desc||"No description available."}</div>
              </div>
              <div className="dc">
                <div className="dl" style={{marginBottom:6}}>Downstream ({affected.length})</div>
                {affected.length===0&&<div style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>No dependents</div>}
                {affected.slice(0,8).map(function(a,ai){return(
                  <div key={ai} style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:2}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{a.name}</span> <span style={{color:"rgba(255,255,255,0.2)"}}>{a.plan}</span>
                  </div>
                );})}
                {affected.length>8&&<div style={{fontSize:9,color:"rgba(255,255,255,0.2)"}}>+{affected.length-8} more</div>}
              </div>
              <div className="dc">
                <div className="dl" style={{marginBottom:6}}>Status</div>
                {inPlan ? (
                  <div style={{fontSize:11,color:"rgba(76,175,80,0.7)"}}>&#10003; In plan &mdash; {SEMESTERS[inPlan.sem]}</div>
                ) : (
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",fontStyle:"italic"}}>Not in plan</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{borderTop:"1px solid rgba(168,130,255,0.1)"}}>
        <div style={{padding:"10px 16px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,fontWeight:700,color:"#A882FF",letterSpacing:"0.06em",textTransform:"uppercase"}}>Course Catalog</span>
          <input type="text" value={builderSearch} onChange={function(e){setBuilderSearch(e.target.value);}}
            placeholder="Search courses..."
            style={{width:200,padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.8)",fontSize:10,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <div style={{padding:"0 10px 12px",overflowX:"auto"}}>
          {(function(){
            var depts = [
              {name:"MATH",label:"Mathematics",color:"#5B9BD5",prefix:["MATH"]},
              {name:"PHY",label:"Physics",color:"#C97B3A",prefix:["PHY"]},
              {name:"ENGR",label:"Engineering",color:"#4EA8DE",prefix:["ENGR"]},
              {name:"CMSC/SE",label:"Comp Sci / SE",color:"#43AA8B",prefix:["CMSC","SE"]},
              {name:"BME",label:"Biomedical Engr.",color:"#E05780",prefix:["BME"]},
              {name:"SCI",label:"Science",color:"#6BBF8A",prefix:["BIO","CHEM"]},
              {name:"GEN",label:"General Education",color:"#BF8F00",prefix:["ENG","MCOM","PHIL","HLTH","ECON","HIST","FMKT","HUM","POL"]},
            ];
            var levels = [
              {label:"1000-level",min:1000,max:1999},
              {label:"2000-level",min:2000,max:2999},
              {label:"3000-level",min:3000,max:3999},
              {label:"4000-level",min:4000,max:4999},
            ];
            var added = {};
            builderCourses.forEach(function(c){added[c.id]=true;});

            // Merge new courses from builderEdits into a combined catalog
            var combinedCatalog = Object.assign({}, COURSE_CATALOG);
            Object.keys(builderEdits).forEach(function(k){
              if(builderEdits[k].isNew){
                combinedCatalog[k] = builderEdits[k];
              }
            });

            function getCourseNum(cid){
              var m = cid.match(/(\d+)/);
              return m ? parseInt(m[1]) : 0;
            }

            return(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"100px repeat(4,1fr)",gap:0}}>
                  <div style={{padding:"4px 8px"}}/>
                  {levels.map(function(lv,li){return(
                    <div key={li} style={{padding:"4px 8px",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      {lv.label}
                    </div>
                  );})}
                </div>
                {depts.map(function(dept,di){return(
                  <div key={di} style={{display:"grid",gridTemplateColumns:"100px repeat(4,1fr)",gap:0,borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <div style={{padding:"8px 8px",fontSize:9,fontWeight:700,color:dept.color,letterSpacing:"0.03em",borderRight:"1px solid rgba(255,255,255,0.04)",display:"flex",alignItems:"flex-start"}}>
                      {dept.label}
                    </div>
                    {levels.map(function(lv,li){
                      var cids = Object.keys(combinedCatalog).filter(function(k){
                        var num = getCourseNum(k);
                        var inDept = dept.prefix.some(function(p){
                          // Match prefix followed by a digit to avoid ENG matching ENGR
                          var rest = k.substring(p.length);
                          return k.startsWith(p) && rest.length > 0 && rest.charAt(0) >= "0" && rest.charAt(0) <= "9";
                        }) && num >= lv.min && num <= lv.max;
                        if(!inDept) return false;
                        if(!builderSearch.trim()) return true;
                        var q = builderSearch.trim().toLowerCase();
                        var cc = combinedCatalog[k];
                        return (cc.name||k).toLowerCase().indexOf(q)>=0 || (cc.title||"").toLowerCase().indexOf(q)>=0 || k.toLowerCase().indexOf(q)>=0;
                      }).sort(function(a,b){return getCourseNum(a)-getCourseNum(b);});
                      return(
                        <div key={li} style={{padding:"4px 6px",borderRight:li<3?"1px solid rgba(255,255,255,0.03)":"none",minHeight:30}}>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                            {cids.map(function(cid){
                              var cat=combinedCatalog[cid];
                              var isAdded=added[cid];
                              var isEdited=!!builderEdits[cid];
                              var isNew=builderEdits[cid]&&builderEdits[cid].isNew;
                              return(
                                <div key={cid} draggable={!isAdded}
                                  onDragStart={function(e){if(!isAdded){e.dataTransfer.setData("text/plain","builder-cat:"+cid);e.dataTransfer.effectAllowed="move";}}}
                                  onClick={function(){setBuilderSel(builderSel===cid?null:cid);}}
                                  style={{padding:"3px 6px",borderRadius:3,
                                    border:"1px solid "+(isAdded?"rgba(76,175,80,0.25)":builderSel===cid?"rgba(168,130,255,0.4)":"rgba(255,255,255,0.06)"),
                                    background:isAdded?"rgba(76,175,80,0.06)":builderSel===cid?"rgba(168,130,255,0.1)":"rgba(255,255,255,0.02)",
                                    cursor:isAdded?"default":"grab",opacity:isAdded?0.5:1,transition:"all 0.12s",
                                    display:"inline-block"}}
                                  onMouseEnter={function(e){if(!isAdded){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";}}}
                                  onMouseLeave={function(e){if(!isAdded){e.currentTarget.style.background=builderSel===cid?"rgba(168,130,255,0.1)":"rgba(255,255,255,0.02)";e.currentTarget.style.borderColor=builderSel===cid?"rgba(168,130,255,0.4)":"rgba(255,255,255,0.06)";}}}
                                  >
                                  <div style={{fontSize:9,fontWeight:600,color:isAdded?"rgba(76,175,80,0.7)":builderSel===cid?"#A882FF":isNew?"#A882FF":isEdited?"#FF8C42":"rgba(255,255,255,0.75)",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                                    {cat.name}{isAdded?" \u2713":""}{isNew?" \u2726":isEdited?" \u270E":""}
                                  </div>
                                  <div style={{fontSize:7,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:120}}>{cat.title}</div>
                                </div>
                              );
                            })}
                            {cids.length===0&&<div style={{fontSize:8,color:"rgba(255,255,255,0.1)",fontStyle:"italic",padding:"4px 0"}}>&mdash;</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );})}
              </div>
            );
          })()}
        </div>
      </div>
    </div>)}

    {showHelp && (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
        onClick={function(){setShowHelp(false);}}>
        <div style={{background:"#161B22",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,maxWidth:720,width:"100%",maxHeight:"85vh",overflowY:"auto",padding:"28px 32px",boxShadow:"0 16px 64px rgba(0,0,0,0.6)"}}
          onClick={function(e){e.stopPropagation();}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h2 style={{margin:0,fontSize:18,fontWeight:300,color:"rgba(255,255,255,0.95)"}}>How to Use the <strong>Degree Plan Navigator</strong></h2>
            <button onClick={function(){setShowHelp(false);}} className="cb">&times;</button>
          </div>

          <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)",fontWeight:700,marginBottom:8}}>Student Tools</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#6CB4EE",marginBottom:5,letterSpacing:"0.03em"}}>&#128065; Explore Courses</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Click any course card to view its description, prerequisites, and downstream dependencies. Connector lines show the prereq chain visually.</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#E8C547",marginBottom:5,letterSpacing:"0.03em"}}>&#128256; Drag & Drop</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Drag courses between semester columns to rearrange your plan. Red warnings flag prereq violations, orange flags semester offering mismatches. Use &#8617; Undo to revert the last drag.</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#4CAF50",marginBottom:5,letterSpacing:"0.03em"}}>&#9745; Track Progress</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Click the checkbox (bottom-right of each card) to cycle: unmarked &#8594; in-progress (blue) &#8594; completed (green). The stacked progress bar updates automatically in the toolbar.</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#FF8C42",marginBottom:5,letterSpacing:"0.03em"}}>&#9776; Critical Path</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Toggle to highlight the longest prereq chain constraining your graduation timeline. An info banner shows the full sequence. Click any course in the chain to inspect it.</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#7C6EF6",marginBottom:5,letterSpacing:"0.03em"}}>&#128218; Electives</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Dashed-border slots are elective placeholders. Click to choose from the dropdown, or drag from the columnar Elective Groups panel below. Lock in a selection to integrate its prereqs into the dependency graph. Click the &#128275; button to unlock.</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#5B9BD5",marginBottom:5,letterSpacing:"0.03em"}}>&#128197; Semester Offerings</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Each card shows F (Fall only), S (Spring only), or F/S (both). An orange &#9888; warning appears if a course is placed in a semester it is not typically offered.</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:5,letterSpacing:"0.03em"}}>&#128190; Save & Load</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Save your customized plan with a name. Load previously saved plans from the Load menu. All state persists across sessions: overrides, elective selections, course statuses. Reset to Default clears everything for the current program.</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:5,letterSpacing:"0.03em"}}>&#128438; Export PDF</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Generate a print-optimized landscape PDF of your plan with course statuses and a credit hour progress summary. Use your browser's "Save as PDF" option from the print dialog.</div>
            </div>
          </div>

          <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:"#A882FF",fontWeight:700,marginBottom:8}}>Faculty Tools &mdash; Degree Builder</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:"rgba(168,130,255,0.04)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(168,130,255,0.1)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#A882FF",marginBottom:5,letterSpacing:"0.03em"}}>&#9874; Builder Mode</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Toggle via the "&#9874; Degree Builder" button. Provides a blank 8-semester canvas. Drag courses from the full catalog (organized by department and level) into semester columns to prototype new programs.</div>
            </div>
            <div style={{background:"rgba(168,130,255,0.04)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(168,130,255,0.1)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#A882FF",marginBottom:5,letterSpacing:"0.03em"}}>&#128203; Requirements Tracker</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>A live checklist tracks mandatory categories: University Core, Math Foundation, Physics, Engineering Core, and Chemistry. Partially-met items show amber counts. The tracker updates as you add courses.</div>
            </div>
            <div style={{background:"rgba(168,130,255,0.04)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(168,130,255,0.1)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#FF8C42",marginBottom:5,letterSpacing:"0.03em"}}>&#9998; Edit & New Courses</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Click any course and hit "Edit" to modify its name, title, credits, offering, or description. While editing, downstream courses that depend on it are highlighted in amber. Use "+ New Course" to create custom entries.</div>
            </div>
            <div style={{background:"rgba(168,130,255,0.04)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(168,130,255,0.1)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:5,letterSpacing:"0.03em"}}>&#128269; Search & Persist</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>Use the search bar above the catalog to filter by course name or title. Save builder plans with "&#128190; Save Builder" — they appear alongside navigator saves in the Load menu and persist across sessions.</div>
            </div>
          </div>

          <div style={{padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:6,border:"1px solid rgba(255,255,255,0.04)"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>
              This tool is for planning purposes only and does not constitute official enrollment or degree audit. Always consult with your academic advisor and refer to the official UCO Course Catalog for current requirements. Course descriptions and prerequisite data are subject to correction.
            </div>
          </div>
        </div>
      </div>
    )}
  </div>);
}
