/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChemicalComponent, CaseStudy } from '../types';

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'ethanol_distillation',
    name: 'تجزئة الإيثانول والماء بريادي (Ethanol-Water Separation)',
    description: 'Fractionating complex Ethanol and Water mixture with Feed pump P-101 and column D-101.',
    state: {
      pump: { flowRate: 45, suctionPressure: 1.0, efficiency: 75, liquidDensity: 820, vaporPressure: 0.35, suctionStaticHead: 4.5 },
      reactor: { volume: 800, activationEnergy: 65, preExponential: 2e8, heatOfReaction: -85, feedTemp: 35, feedConcA: 1.5, fluidCp: 3.5, jacketTemp: 20 },
      compressor: { suctionPressure: 1.2, dischargePressure: 12.0, gasMw: 28.9, polytropicEfficiency: 78 },
      column: { relativeVolatility: 2.8, totalTrays: 20, feedCompositionXF: 0.5, refluxRatio: 2.8, targetXD: 0.85, targetXB: 0.02 },
      exchanger: { overallU: 850, area: 35, coldInletTemp: 20, hotInletTemp: 120 }
    }
  },
  {
    id: 'cstr_synthesis',
    name: 'المفاعل البتروكيماوي الإكزوثيرميك (Catalytic CSTR Synthesis)',
    description: 'Steady state exothermic liquid polymerization in dynamic CSTR.',
    state: {
      pump: { flowRate: 50, suctionPressure: 1.2, efficiency: 80, liquidDensity: 850, vaporPressure: 0.15, suctionStaticHead: 4.0 },
      reactor: { volume: 1500, activationEnergy: 58, preExponential: 5e7, heatOfReaction: -92, feedTemp: 30, feedConcA: 2.5, fluidCp: 4.2, jacketTemp: 20 },
      compressor: { suctionPressure: 1.0, dischargePressure: 10.0, gasMw: 25.0, polytropicEfficiency: 75 },
      column: { relativeVolatility: 3.0, totalTrays: 25, feedCompositionXF: 0.4, refluxRatio: 3.2, targetXD: 0.90, targetXB: 0.01 },
      exchanger: { overallU: 920, area: 45, coldInletTemp: 18, hotInletTemp: 140 }
    }
  },
  {
    id: 'gas_boosting',
    name: 'منظومة كبس وتنقية الغاز (Gas Boosting Loop)',
    description: 'Compression loop featuring polytropic centrifugal turbine and recirc valve.',
    state: {
      pump: { flowRate: 20, suctionPressure: 0.8, efficiency: 70, liquidDensity: 780, vaporPressure: 0.40, suctionStaticHead: 3.5 },
      reactor: { volume: 500, activationEnergy: 75, preExponential: 1e8, heatOfReaction: -60, feedTemp: 25, feedConcA: 1.0, fluidCp: 3.0, jacketTemp: 15 },
      compressor: { suctionPressure: 1.5, dischargePressure: 14.5, gasMw: 18.2, polytropicEfficiency: 82 },
      column: { relativeVolatility: 2.5, totalTrays: 15, feedCompositionXF: 0.6, refluxRatio: 2.2, targetXD: 0.80, targetXB: 0.03 },
      exchanger: { overallU: 750, area: 25, coldInletTemp: 25, hotInletTemp: 160 }
    }
  }
];

export const CHEMICAL_REFS = [
  {
    title: "Perry's Chemical Engineers' Handbook",
    authors: "Don W. Green, Marylee Z. Southard",
    edition: "9th Edition, McGraw-Hill",
    useCase: "Physical properties, heat capacities, Antoine parameters, shell & tube heat exchanger configurations, and centrifugal pump performance rules."
  },
  {
    title: "Unit Operations of Chemical Engineering",
    authors: "Warren L. McCabe, Julian C. Smith, Peter Harriott",
    edition: "7th Edition, McGraw-Hill",
    useCase: "Distillation column McCabe-Thiele tray-by-tray equilibrium solver, bubble point calculations, and fluid transport head losses."
  },
  {
    title: "Chemical Reaction Engineering",
    authors: "Octave Levenspiel",
    edition: "3rd Edition, John Wiley & Sons",
    useCase: "Reactor kinetics modeling, Arrhenius activation energies, steady-state adiabatic & cooled CSTR/PFR energy and mass balances."
  },
  {
    title: "Introduction to Chemical Engineering Thermodynamics",
    authors: "J.M. Smith, H.C. Van Ness, M.M. Abbott",
    edition: "8th Edition, McGraw-Hill",
    useCase: "Polytropic gas compression equations, specific heat ratios (gamma), and vapor-liquid equilibria calculations."
  }
];

export const COMPONENTS: ChemicalComponent[] = [
  {
    name: 'Water',
    formula: 'H2O',
    mw: 18.015,
    tb: 373.15, // K
    tc: 647.1, // K
    pc: 220.6, // bar
    antoine: { A: 5.11564, B: 1687.537, C: -42.98 }, // Log10(P_bar) = A - B/(T_C + C)
    cp: 75.3, // J/mol·K
    viscosity: 0.00089 // Pa.s
  },
  {
    name: 'Ethanol',
    formula: 'C2H5OH',
    mw: 46.07,
    tb: 351.4,
    tc: 513.9,
    pc: 61.4,
    antoine: { A: 5.24677, B: 1598.673, C: -46.42 },
    cp: 112.4,
    viscosity: 0.00107
  },
  {
    name: 'Methanol',
    formula: 'CH3OH',
    mw: 32.04,
    tb: 337.8,
    tc: 512.6,
    pc: 80.9,
    antoine: { A: 5.20409, B: 1581.341, C: -33.5 },
    cp: 81.1,
    viscosity: 0.00054
  },
  {
    name: 'Benzene',
    formula: 'C6H6',
    mw: 78.11,
    tb: 353.2,
    tc: 562.2,
    pc: 48.9,
    antoine: { A: 4.01814, B: 1203.831, C: -53.22 },
    cp: 136.1,
    viscosity: 0.00060
  },
  {
    name: 'Acetone',
    formula: 'C3H6O',
    mw: 58.08,
    tb: 329.4,
    tc: 508.1,
    pc: 47.0,
    antoine: { A: 4.21840, B: 1197.010, C: -45.11 },
    cp: 125.0,
    viscosity: 0.00032
  },
  {
    name: 'Toluene',
    formula: 'C7H8',
    mw: 92.14,
    tb: 383.8,
    tc: 591.8,
    pc: 41.0,
    antoine: { A: 4.07827, B: 1343.943, C: -52.67 },
    cp: 157.3,
    viscosity: 0.00059
  }
];

// Initial preloaded flowsheet projects
export const DEFAULT_PROJECTS = [
  {
    id: 'basra_ethanol_purification',
    name: 'وحدة استخلاص الإيثانول بالبصرة (Ethanol Rectification)',
    description: 'A complete Ethanol-Water fractionating plant featuring feed pumping, pre-heating, and distillation in a 20-tray sieve column.',
    createdAt: '2026-05-29T00:00:00Z',
    nodes: [
      {
        id: 'node_feed',
        type: 'TANK',
        label: 'V-101 (Feed Tank)',
        x: 60,
        y: 110,
        params: { volume: 5000, level: 60, suctionPressure: 1.0 }
      },
      {
        id: 'node_pump',
        type: 'PUMP',
        label: 'P-101 (Cold Feed Pump)',
        x: 180,
        y: 110,
        params: { efficiency: 75, suctionPressure: 1.0, flowRate: 45, liquidDensity: 820, vaporPressure: 0.15, suctionStaticHead: 4.0 }
      },
      {
        id: 'node_exchanger',
        type: 'EXCHANGER',
        label: 'E-101 (Preheater)',
        x: 320,
        y: 110,
        params: { area: 35.0, overallU: 850.0, hotInletTemp: 120.0, hotFlowRate: 15000.0, hotCp: 2.1, coldCp: 3.5 }
      },
      {
        id: 'node_column',
        type: 'COLUMN',
        label: 'D-101 (Fractionator Column)',
        x: 520,
        y: 70,
        params: { totalTrays: 20, feedTray: 10, refluxRatio: 2.8, targetXD: 0.85, targetXB: 0.02, relativeVolatility: 3.2, quality: 1.0 }
      },
      {
        id: 'node_separator',
        type: 'SEPARATOR',
        label: 'V-102 (Flash Vessel)',
        x: 700,
        y: 120,
        params: { volume: 1500, feedTemp: 78.0 }
      }
    ],
    streams: [
      {
        id: 'str_1',
        name: 'S-01 (Raw Spirit Feed)',
        fromNode: 'node_feed',
        toNode: 'node_pump',
        temperature: 25.0,
        pressure: 1.0,
        flowRate: 3500.0,
        composition: { Water: 0.60, Ethanol: 0.40, Methanol: 0.0, Benzene: 0.0, Acetone: 0.0, Toluene: 0.0 },
        vaporFraction: 0.0,
        enthalpy: 0.0
      },
      {
        id: 'str_2',
        name: 'S-02 (Pressurized Flow)',
        fromNode: 'node_pump',
        toNode: 'node_exchanger',
        temperature: 26.5,
        pressure: 5.4,
        flowRate: 3500.0,
        composition: { Water: 0.60, Ethanol: 0.40, Methanol: 0.0, Benzene: 0.0, Acetone: 0.0, Toluene: 0.0 },
        vaporFraction: 0.0,
        enthalpy: 0.0
      },
      {
        id: 'str_3',
        name: 'S-03 (Saturated Column Feed)',
        fromNode: 'node_exchanger',
        toNode: 'node_column',
        temperature: 75.0,
        pressure: 5.0,
        flowRate: 3500.0,
        composition: { Water: 0.60, Ethanol: 0.40, Methanol: 0.0, Benzene: 0.0, Acetone: 0.0, Toluene: 0.0 },
        vaporFraction: 0.05,
        enthalpy: 0.0
      },
      {
        id: 'str_4',
        name: 'S-04 (Distillate Product)',
        fromNode: 'node_column',
        toNode: 'node_separator',
        temperature: 78.2,
        pressure: 1.1,
        flowRate: 1400.0,
        composition: { Water: 0.15, Ethanol: 0.85, Methanol: 0.0, Benzene: 0.0, Acetone: 0.0, Toluene: 0.0 },
        vaporFraction: 0.0,
        enthalpy: 0.0
      }
    ]
  }
];
