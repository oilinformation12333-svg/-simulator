/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChemicalComponent {
  name: string;
  formula: string;
  mw: number; // Molecular weight (g/mol)
  tb: number; // Boiling point (K)
  tc: number; // Critical temp (K)
  pc: number; // Critical pressure (bar)
  antoine: { A: number; B: number; C: number }; // log10(P_bar) = A - B/(T_C + C)
  cp: number; // Low-temp Heat capacity (J/mol-K)
  viscosity: number; // Pa.s at 25C
}

// Interactive Flowsheet Node Definition
export type UnitType = 'PUMP' | 'VALVE' | 'EXCHANGER' | 'COLUMN' | 'REACTOR' | 'COMPRESSOR' | 'TANK' | 'MIXER' | 'SEPARATOR';

export interface FSNode {
  id: string;
  type: UnitType;
  label: string; // e.g. "P-101"
  x: number;
  y: number;
  params: any; // Unit specific calculations
}

// Flow stream connecting one node to another
export interface FSStream {
  id: string;
  name: string; // e.g. "S-01"
  fromNode: string | null; // Source unit ID
  toNode: string | null; // Target unit ID
  temperature: number; // °C
  pressure: number; // bar
  flowRate: number; // kg/hr
  composition: { [key: string]: number }; // e.g. { Water: 0.5, Ethanol: 0.5 }
  vaporFraction?: number; // computed balance
  enthalpy?: number; // computed kJ/hr
}

export interface Alarm {
  id: string;
  unit: string;
  parameter: string;
  value: number;
  limit: number;
  type: 'WARNING' | 'CRITICAL';
  msg: string;
}

export interface UserAccount {
  email: string;
  name?: string;
  trialStartedAt?: string; // ISO string
  subscriptionActive?: boolean;
  isAdmin?: boolean;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  subStartDate?: string;
  subExpiryDate?: string;
  trialUsed?: boolean;
}

export interface CourseFile {
  id: string;
  title: string;
  author?: string;
  duration?: string;
  description?: string;
  type?: string;
  fileUrl?: string;
  uploadedAt?: string;
  viewsCount?: number;
}

export interface PumpState {
  flowRate: number;
  suctionPressure: number;
  efficiency: number;
  liquidDensity: number;
  vaporPressure: number;
  suctionStaticHead: number;
}

export interface ReactorState {
  volume: number;
  activationEnergy: number;
  preExponential: number;
  heatOfReaction: number;
  feedTemp: number;
  feedConcA: number;
  fluidCp: number;
  jacketTemp: number;
}

export interface CompressorState {
  suctionPressure: number;
  dischargePressure: number;
  gasMw: number;
  polytropicEfficiency: number;
  suctionTemp?: number;
}

export interface ColumnState {
  relativeVolatility: number;
  totalTrays: number;
  feedCompositionXF: number;
  refluxRatio: number;
  targetXD: number;
  targetXB: number;
}

export interface ExchangerState {
  overallU: number;
  area: number;
  coldInletTemp: number;
  hotInletTemp: number;
  hotFlowRate?: number;
}

export interface SimulationState {
  pump: PumpState;
  reactor: ReactorState;
  compressor: CompressorState;
  column: ColumnState;
  exchanger: ExchangerState;
}

export interface CaseStudy {
  id: string;
  name: string;
  description: string;
  state: SimulationState;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  nodes: FSNode[];
  streams: FSStream[];
  createdAt: string;
}
