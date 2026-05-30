/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UnitType, SimulationState, Alarm, FSNode, FSStream } from './types';
import { CASE_STUDIES } from './data/chemData';
import BrandingHeader from './components/BrandingHeader';
import ProcessFlowsheet from './components/ProcessFlowsheet';
import UnitDetails from './components/UnitDetails';
import StatusMonitor from './components/StatusMonitor';
import AdminPanel from './components/AdminPanel';
import AIChatCopilot from './components/AIChatCopilot';
import DesignCalculations from './components/DesignCalculations';
import ProjectHistory from './components/ProjectHistory';
import PWAInstallBanner from './components/PWAInstallBanner';
import { appendActivityLog } from './utils/activityLogger';
import {
  AlertCircle, Terminal, Info, Users, HelpCircle, Activity, LayoutGrid,
  Database, ArrowRightLeft, Sparkles, BookOpen, ShieldAlert, Check, X
} from 'lucide-react';

export default function App() {
  // Multi-Project system flowsheet hooks
  const [nodes, setNodes] = useState<FSNode[]>([
    { id: 'node_tank_1', type: 'TANK', label: 'T-101 (EtOH Feed Tank)', x: 100, y: 150, params: { volume: 5000, suctionPressure: 1.0 } },
    { id: 'node_pump_1', type: 'PUMP', label: 'P-101 (Centrifugal Booster)', x: 300, y: 150, params: { efficiency: 75, suctionPressure: 1.0, flowRate: 45, liquidDensity: 820, vaporPressure: 0.35, suctionStaticHead: 4.5 } },
    { id: 'node_col_1', type: 'COLUMN', label: 'D-101 (Distillation Tower)', x: 500, y: 100, params: { relativeVolatility: 2.8, totalTrays: 20, feedCompositionXF: 0.5, refluxRatio: 2.8, targetXD: 0.85, targetXB: 0.02 } }
  ]);

  const [streams, setStreams] = useState<FSStream[]>([
    { id: 'str_1', name: 'S-01', fromNode: 'node_tank_1', toNode: 'node_pump_1', temperature: 25.0, pressure: 1.0, flowRate: 3500.0, composition: { Water: 0.5, Ethanol: 0.5 } },
    { id: 'str_2', name: 'S-02', fromNode: 'node_pump_1', toNode: 'node_col_1', temperature: 29.5, pressure: 3.2, flowRate: 3500.0, composition: { Water: 0.5, Ethanol: 0.5 } }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_pump_1');

  // Undo/Redo tracking stacks
  const [undoStack, setUndoStack] = useState<{ nodes: FSNode[]; streams: FSStream[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: FSNode[]; streams: FSStream[] }[]>([]);

  // Presets selector
  const [currentCase, setCurrentCase] = useState(CASE_STUDIES[0]);

  // Administrator state variables
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Subscription, Trial periods and locks
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLockout, setIsLockout] = useState(false);
  const [trialTimeLeft, setTrialTimeLeft] = useState('');
  const [enteredEmail, setEnteredEmail] = useState('');
  const [authError, setAuthError] = useState('');

  // Setup options for PDF exports
  const [showPdfSetupModal, setShowPdfSetupModal] = useState(false);
  const [pdfProjectName, setPdfProjectName] = useState('دراسة موازنة وحسابات سريان التجزئة التبادلية');
  const [pdfCompanyName, setPdfCompanyName] = useState('شركة مصافي الجنوب بالبصرة - South Refineries Company');
  const [pdfLeadEngineer, setPdfLeadEngineer] = useState('Eng. Ali Saif Aldeen');
  const [pdfThermoModel, setPdfThermoModel] = useState('Peng-Robinson (PR) - HYSYS Core');

  // Active side tab selection state to keep the workspace clean and tidy
  const [activeSideTab, setActiveSideTab] = useState<'AI' | 'CALCULATIONS' | 'HISTORY' | 'ADMIN'>('CALCULATIONS');

  // Monitor licensing and subscription states
  useEffect(() => {
    // Determine first visit
    let firstVisit = localStorage.getItem('chemsim_first_visit');
    if (!firstVisit) {
      firstVisit = Date.now().toString();
      localStorage.setItem('chemsim_first_visit', firstVisit);
    }

    const firstVisitTime = parseInt(firstVisit);
    const trialDuration = 24 * 60 * 60 * 1000; // 24 hours trial
    const timePassed = Date.now() - firstVisitTime;

    // Record login visit once per session
    const activeUserMail = localStorage.getItem('chemsim_authorized_email') || '';
    if (!sessionStorage.getItem('chemsim_visit_logged')) {
      sessionStorage.setItem('chemsim_visit_logged', 'true');
      if (activeUserMail) {
        appendActivityLog(activeUserMail, 'LOGIN_SUCCESS', 'زيارة واجهة المحاكاة وتأكيد الجلسة النشطة');
      } else {
        appendActivityLog('زائر مجهول / تجريبي', 'LOGIN_FAIL', 'بدء جلسة تصفح وتجربة مجانية للمحاكاة (24 ساعة)');
      }
    }

    const checkAccessStatus = () => {
      // Direct license state bypass - keep completely free and open as requested
      setIsSubscribed(true);
      setIsLockout(false);
      setTrialTimeLeft('النسخة مفعلة مجاناً وبالكامل مدى الحياة ✓');
    };

    checkAccessStatus();
    const interval = setInterval(checkAccessStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handle direct client-side subscriber login verification
  const handleVerifySubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const target = enteredEmail.toLowerCase().trim();
    if (!target) return;

    const adminEmails = ['oilinformation12333@gmail.com', 'alisaifaldeen12@gmail.com'];
    let recognizedMatched = false;

    if (adminEmails.includes(target)) {
      recognizedMatched = true;
    } else {
      const usersDbStr = localStorage.getItem('chemsim_users_db');
      if (usersDbStr) {
        try {
          const uList = JSON.parse(usersDbStr);
          const findU = uList.find((u: any) => u.email.toLowerCase().trim() === target);
          if (findU && findU.status === 'ACTIVE') {
            recognizedMatched = true;
          }
        } catch(err) {}
      }
    }

    if (recognizedMatched) {
      localStorage.setItem('chemsim_authorized_email', target);
      appendActivityLog(target, 'LOGIN_SUCCESS', 'تم التحقق وتنشيط الدخول الهيدروليكي للمشترك بنجاح');
      setAuthError('');
      alert('تم التحقق وتنشيط الدخول الهيدروليكي بنجاح!');
      window.location.reload();
    } else {
      appendActivityLog(target, 'LOGIN_FAIL', 'محاولة تفعيل هيدروليكية فاشلة: البريد غير مفعل في قاعدة المشتركين');
      setAuthError('عذراً، هذا البريد غير مسجل كحساب مفعل. يُرجى تفعيل الدخول بمراسلتنا على الواتساب 07806053200 بنظام دفع شهري 17$');
    }
  };

  // Helper to deep clone current state for undo recording
  const saveStateForUndo = () => {
    setUndoStack(prev => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), streams: JSON.parse(JSON.stringify(streams)) }]);
    setRedoStack([]); // Clear redo
  };

  // Undo execution handler
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), streams: JSON.parse(JSON.stringify(streams)) }]);
    
    setNodes(previous.nodes);
    setStreams(previous.streams);
  };

  // Redo execution handler
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setUndoStack(prev => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), streams: JSON.parse(JSON.stringify(streams)) }]);
    
    setNodes(next.nodes);
    setStreams(next.streams);
  };

  // Flowsheet modifiers: Adding Nodes
  const handleAddNode = (type: UnitType) => {
    saveStateForUndo();
    
    // Choose sensible default params based on unit type
    let params: any = {};
    if (type === 'TANK') params = { volume: 5000, suctionPressure: 1.0 };
    else if (type === 'PUMP') params = { efficiency: 75, suctionPressure: 1.0, flowRate: 45, liquidDensity: 820, vaporPressure: 0.35, suctionStaticHead: 4.5 };
    else if (type === 'REACTOR') params = { volume: 800, activationEnergy: 65, preExponential: 2e8, heatOfReaction: -85, feedTemp: 35, feedConcA: 1.5, fluidCp: 3.5, jacketTemp: 20 };
    else if (type === 'COMPRESSOR') params = { suctionPressure: 1.2, dischargePressure: 12.0, gasMw: 28.9, polytropicEfficiency: 78 };
    else if (type === 'EXCHANGER') params = { overallU: 850, area: 35, coldInletTemp: 20, hotInletTemp: 120 };
    else if (type === 'COLUMN') params = { relativeVolatility: 2.8, totalTrays: 20, feedCompositionXF: 0.5, refluxRatio: 2.8, targetXD: 0.85, targetXB: 0.02 };
    else if (type === 'VALVE') params = { pressureDrop: 1.5 };
    else if (type === 'MIXER') params = {};
    else if (type === 'SEPARATOR') params = {};

    const count = nodes.filter(n => n.type === type).length + 1;
    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const newNode: FSNode = {
      id,
      type,
      label: `${type}-${count} Unit`,
      x: 150 + (nodes.length % 4) * 60,
      y: 120 + (nodes.length % 3) * 60,
      params
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteNode = (id: string) => {
    saveStateForUndo();
    setNodes(prev => prev.filter(n => n.id !== id));
    setStreams(prev => prev.filter(s => s.fromNode !== id && s.toNode !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleMoveNode = (id: string, dx: number, dy: number) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        // Snap-to-grid grid lock size: 24px
        const nextX = Math.round((n.x + dx) / 24) * 24;
        const nextY = Math.round((n.y + dy) / 24) * 24;
        return {
          ...n,
          x: Math.min(1000, Math.max(20, nextX)),
          y: Math.min(600, Math.max(20, nextY))
        };
      }
      return n;
    }));
  };

  // Flowsheading streams links modifiers
  const handleAddStream = (name: string, fromNode: string, toNode: string, temp: number, pres: number, flow: number, comps: Record<string, number>) => {
    saveStateForUndo();
    const id = `str_${Date.now()}`;
    const item: FSStream = {
      id, name, fromNode, toNode,
      temperature: temp,
      pressure: pres,
      flowRate: flow,
      composition: comps
    };
    setStreams(prev => [...prev, item]);
  };

  const handleDeleteStream = (id: string) => {
    saveStateForUndo();
    setStreams(prev => prev.filter(s => s.id !== id));
  };

  // Synchronize dynamic model case studies
  const handleSelectCase = (caseId: string) => {
    const found = CASE_STUDIES.find(cs => cs.id === caseId);
    if (found) {
      setCurrentCase(found);
      
      // Map case study simulation to coord nodes system
      if (caseId === 'ethanol_distillation') {
        const customNodes: FSNode[] = [
          { id: 'node_tank_1', type: 'TANK', label: 'T-101 (Water-EtOH Feed Tank)', x: 100, y: 150, params: { volume: 5000, suctionPressure: 1.0 } },
          { id: 'node_pump_1', type: 'PUMP', label: 'P-101 (Preheater Feed Pump)', x: 300, y: 150, params: { efficiency: 75, suctionPressure: 1.0, flowRate: 45, liquidDensity: 820, vaporPressure: 0.35, suctionStaticHead: 4.5 } },
          { id: 'node_col_1', type: 'COLUMN', label: 'D-101 (Fractionation Tower)', x: 500, y: 120, params: { relativeVolatility: 2.8, totalTrays: 20, feedCompositionXF: 0.5, refluxRatio: 2.8, targetXD: 0.85, targetXB: 0.02 } }
        ];
        const customStreams: FSStream[] = [
          { id: 'str_1', name: 'S-01', fromNode: 'node_tank_1', toNode: 'node_pump_1', temperature: 25.0, pressure: 1.0, flowRate: 3500.0, composition: { Water: 0.5, Ethanol: 0.5 } },
          { id: 'str_2', name: 'S-02', fromNode: 'node_pump_1', toNode: 'node_col_1', temperature: 29.5, pressure: 3.2, flowRate: 3500.0, composition: { Water: 0.5, Ethanol: 0.5 } }
        ];
        setNodes(customNodes);
        setStreams(customStreams);
        setSelectedNodeId('node_pump_1');
      } else if (caseId === 'cstr_synthesis') {
        const customNodes: FSNode[] = [
          { id: 'node_tank_r1', type: 'TANK', label: 'T-102 (Oxide Feed Storage)', x: 80, y: 140, params: { volume: 8000, suctionPressure: 1.2 } },
          { id: 'node_reactor_1', type: 'REACTOR', label: 'R-101 (Continuous Stirred Reactor)', x: 280, y: 140, params: { volume: 1500, activationEnergy: 58, preExponential: 5e7, heatOfReaction: -92, feedTemp: 30, feedConcA: 2.5, fluidCp: 4.2 } },
          { id: 'node_ex_1', type: 'EXCHANGER', label: 'E-101 (Effluent Cool Exchanger)', x: 520, y: 140, params: { overallU: 920, area: 45, coldInletTemp: 18, hotInletTemp: 140 } }
        ];
        const customStreams: FSStream[] = [
          { id: 'str_r1', name: 'S-01', fromNode: 'node_tank_r1', toNode: 'node_reactor_1', temperature: 25.0, pressure: 1.2, flowRate: 4000.0, composition: { Water: 0.1, Ethanol: 0.9 } },
          { id: 'str_r2', name: 'S-02', fromNode: 'node_reactor_1', toNode: 'node_ex_1', temperature: 84.0, pressure: 1.0, flowRate: 4000.0, composition: { Water: 0.45, Ethanol: 0.55 } }
        ];
        setNodes(customNodes);
        setStreams(customStreams);
        setSelectedNodeId('node_reactor_1');
      } else if (caseId === 'gas_boosting') {
        const customNodes: FSNode[] = [
          { id: 'node_sep_1', type: 'SEPARATOR', label: 'V-102 (Inlet Gas Scrubber)', x: 100, y: 160, params: {} },
          { id: 'node_compressor_1', type: 'COMPRESSOR', label: 'C-101 (Gas Reciprocating Compressor)', x: 300, y: 160, params: { suctionPressure: 1.5, dischargePressure: 14.5, gasMw: 18.2, polytropicEfficiency: 82 } },
          { id: 'node_valve_1', type: 'VALVE', label: 'TCV-101 (Surge Recir Valve)', x: 500, y: 160, params: { pressureDrop: 4.5 } }
        ];
        const customStreams: FSStream[] = [
          { id: 'str_g1', name: 'S-01', fromNode: 'node_sep_1', toNode: 'node_compressor_1', temperature: 18.0, pressure: 1.5, flowRate: 12000.0, composition: { Water: 0.01, Ethanol: 0.0, Methanol: 0.99 } },
          { id: 'str_g2', name: 'S-02', fromNode: 'node_compressor_1', toNode: 'node_valve_1', temperature: 110.0, pressure: 14.5, flowRate: 12000.0, composition: { Water: 0.01, Ethanol: 0.0, Methanol: 0.99 } }
        ];
        setNodes(customNodes);
        setStreams(customStreams);
        setSelectedNodeId('node_compressor_1');
      }
    }
  };

  // Modify process parameters dynamically from Form sliders
  const handleParamsChange = (unit: UnitType, newParams: any) => {
    saveStateForUndo();
    setNodes(prev => prev.map(n => {
      if (n.type === unit) {
        return { ...n, params: { ...n.params, ...newParams } };
      }
      return n;
    }));
  };

  const handleOverrideState = (newState: SimulationState) => {
    // Map traditional state overrides onto active flowsheet nodes parameters
    saveStateForUndo();
    setNodes(prev => prev.map(n => {
      if (n.type === 'PUMP' && newState.pump) {
        return { ...n, params: { ...n.params, vaporPressure: newState.pump.vaporPressure } };
      }
      if (n.type === 'REACTOR' && newState.reactor) {
        return { ...n, params: { ...n.params, activationEnergy: newState.reactor.activationEnergy } };
      }
      if (n.type === 'COMPRESSOR' && newState.compressor) {
        return { ...n, params: { ...n.params, gasMw: newState.compressor.gasMw } };
      }
      if (n.type === 'COLUMN' && newState.column) {
        return { ...n, params: { ...n.params, relativeVolatility: newState.column.relativeVolatility } };
      }
      return n;
    }));
  };

  const handleAutoArrange = () => {
    if (nodes.length === 0) return;
    saveStateForUndo();

    const typeOrder: Record<string, number> = {
      'TANK': 0,
      'PUMP': 1,
      'VALVE': 1,
      'EXCHANGER': 1,
      'MIXER': 2,
      'REACTOR': 2,
      'COMPRESSOR': 2,
      'SEPARATOR': 3,
      'COLUMN': 3
    };

    const columnCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

    const arrangedNodes = nodes.map((node) => {
      const col = typeOrder[node.type] ?? 1;
      const count = columnCounts[col] || 0;
      columnCounts[col] = count + 1;

      // 24px snap grid logic alignment
      const xGap = 240;
      const yGap = 120;
      
      const newX = Math.round((96 + col * xGap) / 24) * 24;
      const newY = Math.round((96 + count * yGap) / 24) * 24;

      return {
        ...node,
        x: Math.min(1100, Math.max(48, newX)),
        y: Math.min(550, Math.max(48, newY))
      };
    });

    setNodes(arrangedNodes);
  };

  // Apply AI Generated Flowsheet
  const handleApplyGeneratedFlowsheet = (newGenNodes: any[], newGenStreams: any[]) => {
    saveStateForUndo();
    setNodes(newGenNodes);
    setStreams(newGenStreams);
    if (newGenNodes.length > 0) {
      setSelectedNodeId(newGenNodes[0].id);
    }
  };

  // Direct load project from local saves index
  const handleLoadSavedProject = (loadedNodes: FSNode[], loadedStreams: FSStream[]) => {
    saveStateForUndo();
    setNodes(loadedNodes);
    setStreams(loadedStreams);
    if (loadedNodes.length > 0) {
      setSelectedNodeId(loadedNodes[0].id);
    }
  };

  // Export JSON Schema
  const handleExportJSON = () => {
    const data = {
      generator: 'ChemSim AI Project Schema',
      supervisedBy: 'Eng. Ali saif aldin haider alnawfal',
      timestamp: new Date().toISOString(),
      flowsheet: {
        nodes,
        streams
      }
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'chemsim_project_flowsheet.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Report PDF format / Printable HTML
  const handleExportPDFReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بفتح النوافذ المنبثقة لرؤية وطباعة التقرير الهندسي الشامل!');
      return;
    }

    // Prepare thermodynamics design variables for the report
    const rGas = 8.314;
    const pump_flowM3s = (simState.pump.flowRate || 45) / 3600;
    const pump_vHead_suction = ((simState.pump.suctionPressure || 1.0) * 100000) / ((simState.pump.liquidDensity || 820) * 9.81);
    const pump_vHead_vapor = ((simState.pump.vaporPressure || 0.35) * 100000) / ((simState.pump.liquidDensity || 820) * 9.81);
    const pump_npsh = pump_vHead_suction + (simState.pump.suctionStaticHead || 4.5) - pump_vHead_vapor;
    const pump_dP_Pa = (simState.pump.flowRate * (simState.pump.efficiency / 100) * 0.05) * 100000;
    const pump_hydPower = (pump_dP_Pa * pump_flowM3s) / 1000;
    const pump_shaftPower = pump_hydPower / (simState.pump.efficiency / 100 || 0.75);

    const react_tempK = (simState.reactor.feedTemp || 35) + 273.15;
    const react_k = (simState.reactor.preExponential || 2e8) * Math.exp(-((simState.reactor.activationEnergy || 65) * 1000) / (rGas * react_tempK));
    const react_conv = Math.min(0.995, react_k / (1.0 + react_k));
    const react_thermalHeat = (react_conv * (simState.reactor.feedConcA || 1.5) * (simState.reactor.volume || 800) * Math.abs(simState.reactor.heatOfReaction || -85)) / 3600;

    const comp_pRatio = (simState.compressor.dischargePressure || 12.0) / (simState.compressor.suctionPressure || 1.2);
    const k_gas = 1.41;
    const comp_suctionT_K = 20 + 273.15;
    const comp_dischargeT_C = (comp_suctionT_K * Math.pow(comp_pRatio, (k_gas - 1) / (k_gas * (simState.compressor.polytropicEfficiency / 100 || 0.78)))) - 273.15;
    const comp_polyWork = (rGas * 1000 / (simState.compressor.gasMw || 28.9)) * comp_suctionT_K * (k_gas / (k_gas - 1)) * (Math.pow(comp_pRatio, (k_gas - 1) / k_gas) - 1);
    const comp_shaftPower = (12000 * comp_polyWork) / 3600;

    const ex_dT1 = (simState.exchanger.hotInletTemp || 120) - ((simState.exchanger.coldInletTemp || 20) + 35);
    const ex_dT2 = ((simState.exchanger.hotInletTemp || 120) - 40) - (simState.exchanger.coldInletTemp || 20);
    const ex_lmtd = (ex_dT1 - ex_dT2) / Math.log(Math.abs(ex_dT1 / (ex_dT2 || 1.1)) || 1.15);
    const ex_heatDuty = ((simState.exchanger.overallU || 850) * (simState.exchanger.area || 35) * Math.max(12, ex_lmtd || 35)) / 1000;

    const col_xD = simState.column.targetXD || 0.85;
    const col_xB = simState.column.targetXB || 0.02;
    const col_alpha = simState.column.relativeVolatility || 2.8;
    const col_nmin = Math.log10((col_xD * (1.0 - col_xB)) / (col_xB * (1.0 - col_xD) + 1e-6)) / Math.log10(col_alpha || 1.15);

    const streamsHtml = streams.map(s => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0f172a;">${s.name}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.temperature.toFixed(1)} &deg;C</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.pressure.toFixed(2)} bar</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.flowRate.toLocaleString()} kg/hr</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; direction: ltr; text-align: left;">${JSON.stringify(s.composition)}</td>
      </tr>
    `).join('');

    const nodesHtml = nodes.map(n => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">${n.label}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="background-color: #eff6ff; color: #1e40af; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">${n.type}</span></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; direction: ltr; text-align: left;">${JSON.stringify(n.params)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${pdfProjectName} - ChemSim AI Professional Technical Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
            body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; direction: rtl; padding: 50px; color: #1e293b; background: #fff; line-height: 1.6; }
            .letterhead { border-bottom: 3px double #1e3a8a; padding-bottom: 20px; margin-bottom: 35px; text-align: center; }
            .logo-placeholder { font-size: 24px; font-weight: 700; color: #1e3a8a; margin-bottom: 8px; font-family: sans-serif; }
            .report-title { font-size: 22px; color: #1e3a8a; font-weight: 700; margin-top: 10px; }
            h2 { color: #0f172a; border-right: 4px solid #3b82f6; padding-right: 12px; margin-top: 40px; font-size: 15px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { bg-color: #f8fafc; background-color: #f1f5f9; color: #334155; padding: 12px 10px; text-align: right; border: 1px solid #cbd5e1; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 30px; font-size: 12px; }
            .header-grid div p { margin: 6px 0; }
            .math-box { background-color: #fafafa; border-right: 4px solid #10b981; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; direction: ltr; text-align: left; margin: 10px 0; line-height: 1.5; color: #064e3b; }
            .footer-block { margin-top: 70px; padding-top: 25px; border-top: 1px solid #cbd5e1; text-align: right; font-size: 12px; display: flex; justify-content: space-between; align-items: top; }
            .stamp-badge { border: 2px solid #ef4444; color: #ef4444; padding: 8px 16px; font-weight: bold; border-radius: 8px; transform: rotate(-5deg); font-size: 11px; font-family: sans-serif; display: inline-block; letter-spacing: 1px; }
            .math-label { font-size: 12px; font-weight: 600; color: #334155; margin-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="logo-placeholder">🛢️ ChemSim AI Engineering System</div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">الهيئة العامة للمهندسين الكيميائيين في البصرة</div>
            <div class="report-title">تقرير موازنة المادة والطاقة وحسابات التصميم الهندسي</div>
          </div>
          
          <div class="header-grid">
            <div style="text-align: right; border-left: 1px solid #e2e8f0; padding-left: 10px;">
              <p><strong>اسم المشروع الهيدروليكي:</strong> ${pdfProjectName}</p>
              <p><strong>اسم الشركة المستفيدة:</strong> ${pdfCompanyName}</p>
              <p><strong>الجهة المشرفة:</strong> الهيئة العامة للمهندسين الكيميائيين</p>
            </div>
            <div style="text-align: right; padding-right: 10px;">
              <p><strong>كبير مهندسي العمليات:</strong> ${pdfLeadEngineer}</p>
              <p><strong>النموذج الثرموديناميكي:</strong> ${pdfThermoModel}</p>
              <p><strong>تاريخ وتوقيت التوليد:</strong> ${new Date().toLocaleString('ar-EG')}</p>
              <p><strong>الحالة التشغيلية:</strong> <span style="color: #10b981; font-weight: bold;">CONVERGED STEADY STATE ✓</span></p>
            </div>
          </div>

          <h2>أولاً: قائمة المعدات والمنظومات والبارامترات التشغيلية</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">اسم المعدة / الكود</th>
                <th style="width: 20%; text-align: center;">نوع الوحدة</th>
                <th style="width: 55%;">البارامترات والضغوط والقدرات المضبوطة بـ ChemSim HYSYS Core</th>
              </tr>
            </thead>
            <tbody>
              ${nodesHtml}
            </tbody>
          </table>

          <h2>ثانياً: موازنة كتل وسريان وصواني تيارات المخطط المتكامل</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">تيار السريان</th>
                <th style="width: 15%; text-align: center;">درجة الحرارة T</th>
                <th style="width: 15%; text-align: center;">الضغط P</th>
                <th style="width: 20%; text-align: center;">التدفق الكتلي</th>
                <th style="width: 35%; text-align: left;">المكونات الجزيئية المئوية (Composition)</th>
              </tr>
            </thead>
            <tbody>
              ${streamsHtml}
            </tbody>
          </table>

          <h2>ثالثاً: مخرجات الحسابات التصميمية والتحقق من السلامة الحركية</h2>
          
          <div class="math-label">۱. حسابات تدرج الضغوط وارتفاع السحب المعادل لمضخة التغذية P-101:</div>
          <div class="math-box">
            NPSHa = (P_suction - P_vapor) / (rho * g) + H_static<br/>
            NPSHa = (${simState.pump.suctionPressure} bar - ${simState.pump.vaporPressure} bar) * 10.19 + ${simState.pump.suctionStaticHead}m = ${pump_npsh.toFixed(2)} meters<br/>
            Required Shaft Motor Power (Ws) = Hydraulic Power / efficiency = ${pump_shaftPower.toFixed(2)} kW
          </div>

          <div class="math-label">۲. حسابات حركيات وسرعة تفاعل وموازنة حرارة مفاعل المزيج R-101 (CSTR):</div>
          <div class="math-box">
            Velocity Constant k = A_exp * exp(-Ea / (R * T)) = ${react_k.toFixed(4)} L/mol.s<br/>
            Organic conversion ratio X_A = k * tau / (1 + k * tau) = ${(react_conv * 100).toFixed(2)} % converted<br/>
            Exothermic Reaction heat duty total (Q) = ${react_thermalHeat.toFixed(1)} kW (Generated exotherm)
          </div>

          <div class="math-label">۳. الحسابات الترموديناميكية لـ درجات حرارة المخرج للضاغط الغازي C-101:</div>
          <div class="math-box">
            T_out = T_in * (P_out / P_in) ^ [(k-1) / (k * efficiency)] = ${comp_dischargeT_C.toFixed(1)} &deg;C<br/>
            Polytropic Adiabatic Work (W_p) = ${comp_polyWork.toFixed(1)} kJ/kg<br/>
            Total Shaft Engine Work Required (Ws) = ${comp_shaftPower.toFixed(2)} kW
          </div>

          <div class="math-label">٤. الحمل الحراري ومساحة التبادل للمبادل الحراري E-101 (LMTD):</div>
          <div class="math-box">
            LMTD = (dT1 - dT2) / ln(dT1 / dT2) = ${ex_lmtd.toFixed(2)} &deg;C<br/>
            Total Heat duty calculated = U * Area * LMTD = ${ex_heatDuty.toFixed(1)} kW Thermal Transfer
          </div>

          <div class="math-label">٥. حسابات فنسكي للحد الأدنى لأطباق برج صواني التقطير D-101 (Fenske Equation):</div>
          <div class="math-box">
            N_min = ln[ (xD * (1 - xB)) / (xB * (1 - xD)) ] / ln(alpha) = ${col_nmin.toFixed(1)} theoretical stage trays<br/>
            Number of Real Trays (based on 65% liquid tray efficiency) = ${Math.ceil(col_nmin / 0.65)} physical trays
          </div>

          <div class="footer-block">
            <div style="text-align: right; max-w: 60%;">
              <p>موافقة واعتماد موازنة العمليات الكيميائية الجارية ثرموديناميكياً بنجاح بواسطة محرك <strong>ChemSim AI</strong> دقة Aspen HYSYS.</p>
              <p style="margin-top: 15px; font-weight: bold; color: #1e3a8a;">إمضاء مراجع الترخيص: Eng. Ali Saif Aldeen</p>
              <p style="font-size: 10px; color: #64748b;">الهيئة العامة للمهندسين الكيميائيين بالبصرة</p>
            </div>
            
            <div class="stamp-badge">
              APPROVED STAMP<br/>
              BASRA CHE-ENG<br/>
              2026 OFFICIAL
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Safe client-side API call proxying to server-side Gemini client
  const handlePromptGemini = async (promptText: string, image?: { data: string; mimeType: string }): Promise<string> => {
    try {
      const resp = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, image })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }
      return data.text || '';
    } catch (err: any) {
      throw err;
    }
  };

  // Compile active bridged state parameters for the visual physics screens
  const activeSelectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Synthesize traditional bridge SimulationState
  const getSimState = (): SimulationState => {
    const pumpNode = nodes.find(n => n.type === 'PUMP');
    const reactorNode = nodes.find(n => n.type === 'REACTOR');
    const compNode = nodes.find(n => n.type === 'COMPRESSOR');
    const colNode = nodes.find(n => n.type === 'COLUMN');
    const exNode = nodes.find(n => n.type === 'EXCHANGER');

    return {
      pump: {
        flowRate: pumpNode?.params?.flowRate ?? 45,
        suctionPressure: pumpNode?.params?.suctionPressure ?? 1.0,
        efficiency: pumpNode?.params?.efficiency ?? 75,
        liquidDensity: pumpNode?.params?.liquidDensity ?? 820,
        vaporPressure: pumpNode?.params?.vaporPressure ?? 0.35,
        suctionStaticHead: pumpNode?.params?.suctionStaticHead ?? 4.5
      },
      reactor: {
        volume: reactorNode?.params?.volume ?? 800,
        activationEnergy: reactorNode?.params?.activationEnergy ?? 65,
        preExponential: reactorNode?.params?.preExponential ?? 2e8,
        heatOfReaction: reactorNode?.params?.heatOfReaction ?? -85,
        feedTemp: reactorNode?.params?.feedTemp ?? 35,
        feedConcA: reactorNode?.params?.feedConcA ?? 1.5,
        fluidCp: reactorNode?.params?.fluidCp ?? 3.5,
        jacketTemp: reactorNode?.params?.jacketTemp ?? 20
      },
      compressor: {
        suctionPressure: compNode?.params?.suctionPressure ?? 1.2,
        dischargePressure: compNode?.params?.dischargePressure ?? 12.0,
        gasMw: compNode?.params?.gasMw ?? 28.9,
        polytropicEfficiency: compNode?.params?.polytropicEfficiency ?? 78
      },
      column: {
        relativeVolatility: colNode?.params?.relativeVolatility ?? 2.8,
        totalTrays: colNode?.params?.totalTrays ?? 20,
        feedCompositionXF: colNode?.params?.feedCompositionXF ?? 0.5,
        refluxRatio: colNode?.params?.refluxRatio ?? 2.8,
        targetXD: colNode?.params?.targetXD ?? 0.85,
        targetXB: colNode?.params?.targetXB ?? 0.02
      },
      exchanger: {
        overallU: exNode?.params?.overallU ?? 850,
        area: exNode?.params?.area ?? 35,
        coldInletTemp: exNode?.params?.coldInletTemp ?? 20,
        hotInletTemp: exNode?.params?.hotInletTemp ?? 120
      }
    };
  };

  const simState = getSimState();

  // Real-time security state alarms (derived state - calculated directly on every render to eliminate any potential infinite update loops)
  const calculateAlarms = (): Alarm[] => {
    const activeAlarms: Alarm[] = [];

    // 1. Pump Cavitation Checks
    const suctionPressureM = (simState.pump.suctionPressure * 100000) / (simState.pump.liquidDensity * 9.81);
    const vaporPressureM = (simState.pump.vaporPressure * 100000) / (simState.pump.liquidDensity * 9.81);
    const npshAvailable = suctionPressureM + simState.pump.suctionStaticHead - vaporPressureM;
    if (npshAvailable < 2.5) {
      activeAlarms.push({
        id: 'pump_cavitation',
        unit: 'P-101 (Pump)',
        parameter: 'NPSH available',
        value: npshAvailable,
        limit: 2.5,
        type: 'CRITICAL',
        msg: 'صافي رأس السحب الإيجابي منخفض للغاية! مروحة المضخة معرّضة لخطر التكهف النشط والتحطم الميكانيكي الوشيك.'
      });
    }

    // 2. Heat Exchanger overheating check
    if (simState.exchanger.hotInletTemp > 185) {
      activeAlarms.push({
        id: 'exchanger_overheat',
        unit: 'E-101 (Exchanger)',
        parameter: 'Hot inlet temp',
        value: simState.exchanger.hotInletTemp,
        limit: 185,
        type: 'WARNING',
        msg: 'درجة حرارة مائع التبريد الساخن مرتفعة جداً، مما قد يعرض الأنابيب الحرارية للتبلر السريع والتكتل القاذوري.'
      });
    }

    // 3. Reactor Runway Peaks Checks
    const reactRise = (Math.abs(simState.reactor.heatOfReaction) * (simState.reactor.feedConcA * 0.72) * 5.5 / (simState.reactor.fluidCp * 1.5));
    const reactorPeakT = simState.reactor.feedTemp + reactRise;
    if (reactorPeakT > 130) {
      const isCritical = reactorPeakT > 155;
      activeAlarms.push({
        id: 'reactor_runaway',
        unit: 'R-101 (Reactor)',
        parameter: 'Reactor peak temperature',
        value: reactorPeakT,
        limit: 130,
        type: isCritical ? 'CRITICAL' : 'WARNING',
        msg: isCritical 
          ? 'خطر الهروب الهيدروليكي الحراري (CSTR Thermal Runaway Peak)! درجة الحرارة تتعدى حاجز الأمان الحرج.'
          : 'درجة حرارة المزيج التفاعلي تتجاوز حاجز الكفاءة الأمثل للكاتالست.'
      });
    }

    // 4. Compressor gas surge ratio check
    const compressionRatio = simState.compressor.dischargePressure / simState.compressor.suctionPressure;
    if (compressionRatio > 8.0) {
      activeAlarms.push({
        id: 'compressor_surge',
        unit: 'C-101 (Compressor)',
        parameter: 'Compression ratio',
        value: compressionRatio,
        limit: 8.0,
        type: 'CRITICAL',
        msg: 'ارتفاع حاد في نسبة الانضغاط يهدد بحدوث ظاهرة الارتجاج (Gas Surge). خطر تعطل شفرات التوربين.'
      });
    }

    // 5. Column tray flooding reflux checks
    if (simState.column.refluxRatio > 5.5) {
      activeAlarms.push({
        id: 'column_flooding',
        unit: 'D-101 (Column)',
        parameter: 'Reflux ratio',
        value: simState.column.refluxRatio,
        limit: 5.5,
        type: 'WARNING',
        msg: 'نسبة الراجع مرتفعة بشكل مفرط يهدد بغمر صواني التقطير (Tray Flooding) وضياع كفاءة الفصل النقائي.'
      });
    }

    return activeAlarms;
  };

  const alarms = calculateAlarms();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white" id="main-app">
      
      {/* Visual Header / Branding bar with Eng. Ali Saif details */}
      <BrandingHeader
        currentCase={currentCase}
        onSelectCase={handleSelectCase}
        isAdmin={isAdmin}
        onAdminToggle={(status) => {
          setIsAdmin(status);
          if (status) {
            setActiveSideTab('ADMIN');
          } else if (activeSideTab === 'ADMIN') {
            setActiveSideTab('CALCULATIONS');
          }
        }}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
      />

      {/* PWA Onboarding & Install banner for Android/iOS */}
      <PWAInstallBanner />

      {/* Main Workspace Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">

        {/* Trial limit alert ribbon */}
        {!isSubscribed && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 px-4 flex flex-col sm:flex-row gap-3 justify-between items-center text-right select-none text-yellow-300">
            <div className="flex items-center gap-2 flex-row-reverse">
              <ShieldAlert className="w-4 h-4 text-yellow-400 shrink-0 animate-pulse" />
              <span className="text-xs font-bold font-sans">تنبيه الفترة التجريبية: أنت مستمر في فترة التجربة المجانية المحددة بـ 24 ساعة</span>
            </div>
            <span className="text-[11px] font-mono bg-yellow-500/15 px-3 py-1 rounded-full text-yellow-300 font-bold">
              {trialTimeLeft}
            </span>
          </div>
        )}
        
        {/* SIMULATION WORKSPACE VIEW */}
        <div className="space-y-6 animate-fadeIn">
          
          {/* Flowsheet design layout canvas */}
          <ProcessFlowsheet
            nodes={nodes}
            streams={streams}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onAddNode={handleAddNode}
            onDeleteNode={handleDeleteNode}
            onAddStream={handleAddStream}
            onDeleteStream={handleDeleteStream}
            onMoveNode={handleMoveNode}
            alarms={alarms}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onAutoArrange={handleAutoArrange}
            onExportJSON={handleExportJSON}
            onExportPDF={() => setShowPdfSetupModal(true)}
          />

          {/* Combined Workspace Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Column 1: Flexible Side-Console containing secondary features inside organized tabs (5 columns) */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-4">
              
              {/* Tab Selector Buttons */}
              <div className="flex border-b border-slate-800 bg-slate-900/40 p-1.5 rounded-xl gap-1 flex-row-reverse" id="side-tab-bar">
                <button
                  type="button"
                  onClick={() => setActiveSideTab('CALCULATIONS')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all outline-none ${
                    activeSideTab === 'CALCULATIONS'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                  id="tab-btn-calcs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>الحسابات التصميمية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSideTab('AI')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all outline-none ${
                    activeSideTab === 'AI'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                  id="tab-btn-ai"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>المساعد الذكي AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSideTab('HISTORY')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all outline-none ${
                    activeSideTab === 'HISTORY'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                  id="tab-btn-history"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>أرشيف العمليات</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveSideTab('ADMIN')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all outline-none ${
                      activeSideTab === 'ADMIN'
                        ? 'bg-amber-600 text-white shadow-md border border-amber-500/20'
                        : 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/5'
                    }`}
                    id="tab-btn-admin"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>لوحة المشرف</span>
                  </button>
                )}
              </div>

              {/* Dynamic Console Panel View */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-0 overflow-hidden shadow-lg" id="tab-content-container">
                {activeSideTab === 'AI' && (
                  <AIChatCopilot
                    onPromptGemini={handlePromptGemini}
                    onApplyGeneratedFlowsheet={handleApplyGeneratedFlowsheet}
                  />
                )}
                {activeSideTab === 'CALCULATIONS' && (
                  <DesignCalculations
                    state={simState}
                  />
                )}
                {activeSideTab === 'HISTORY' && (
                  <ProjectHistory
                    nodes={nodes}
                    streams={streams}
                    onLoadProject={(loadedNodes, loadedStreams) => {
                      setNodes(loadedNodes);
                      setStreams(loadedStreams);
                    }}
                  />
                )}
                {activeSideTab === 'ADMIN' && isAdmin && (
                  <AdminPanel
                    state={simState}
                    onOverrideState={handleOverrideState}
                    adminEmail={adminEmail}
                    onPromptGemini={handlePromptGemini}
                  />
                )}
              </div>

            </div>

            {/* Column 2: Selected Equipment Parameters & HYSYS solver workbook specs (7 columns) */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
              
              {/* Active unit details parameter tuner */}
              <div className="grid grid-cols-1 gap-6">
                {activeSelectedNode ? (
                  <UnitDetails
                    unitType={activeSelectedNode.type}
                    state={simState}
                    onChangeParams={handleParamsChange}
                    isAdmin={isAdmin}
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-850/80 rounded-2xl p-6 text-center text-xs text-slate-400 font-sans shadow-lg">
                    من فضلك، انقر فوق أي وحدة أو خط على لوحة العمل في الأعلى لعرض وتخصيص التفاصيل والدايناميكية الفيزيائية الخاصة به.
                  </div>
                )}
              </div>

              {/* HYSYS steady-state solver workbook ledger */}
              <StatusMonitor
                nodes={nodes}
                streams={streams}
                onUpdateStreams={setStreams}
              />
              
            </div>

          </div>

        </div>

        {/* Process Alarms Bulletin Board */}
        {alarms.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4" id="alarms-bulletin">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <h4 className="font-bold text-slate-100 text-sm">نشرة إنذارات السلامة الحركية الجارية (Plant Security Alerts)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none animate-fadeIn">
              {alarms.map((alarm, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed text-right md:text-left ${
                    alarm.type === 'CRITICAL' 
                      ? 'bg-red-600/10 border-red-500/30 text-red-300' 
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1 flex-row-reverse">
                      <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded text-[10px]">{alarm.unit}</span>
                      <span className={`font-mono text-[9px] px-1 py-0.5 rounded ${alarm.type === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-yellow-500 text-slate-950'}`}>{alarm.type}</span>
                    </div>
                    <p className="font-bold pt-1 text-slate-100 leading-normal">{alarm.msg}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Parameter value: {alarm.value.toFixed(2)} vs threshold: {alarm.limit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Corporate Academic Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-500 py-6 mt-12 text-center" id="academic-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="text-xs leading-relaxed">
            تطبيق المحاكاة الهندسية الكيميائية المتكامل • تم التجهيز بالتشاور مع لوائح معهد المهندسين الكيميائيين ونظم توازن الفروع
          </p>
          <p className="text-[11px] font-sans text-slate-400">
            بإشراف وتطوير المهندس <b>علي سيف الدين حيدر النوفل</b> (الهيئة العامة للمهندسين الكيميائيين في البصرة)
          </p>
          <div className="text-[10px] font-mono text-slate-600 pt-2 flex flex-col md:flex-row items-center justify-center gap-4">
            <span>المنصة الأكاديمية للمحاكاة وتصميم العمليات</span>
            <span className="hidden md:inline">•</span>
            <span>بإشراف وتثبيت ترخيص الهيئة بالبصرة</span>
            <span className="hidden md:inline">•</span>
            <span>Basra, Iraq, 2026</span>
          </div>
        </div>
      </footer>

      {/* PDF Generation Customization Modal */}
      {showPdfSetupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowPdfSetupModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-2">تخصيص معلومات التقرير الهندسي (PDF Setup)</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">اسم المشروع التصميمي:</label>
                <input 
                  type="text"
                  value={pdfProjectName}
                  onChange={(e) => setPdfProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">الشركة / المنشأة المستفيدة:</label>
                <input 
                  type="text"
                  value={pdfCompanyName}
                  onChange={(e) => setPdfCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">اسم كبير مهندسي العمليات:</label>
                <input 
                  type="text"
                  value={pdfLeadEngineer}
                  onChange={(e) => setPdfLeadEngineer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">النموذج الحراري (Thermo Model Override):</label>
                <select 
                  value={pdfThermoModel}
                  onChange={(e) => setPdfThermoModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-blue-500 outline-none text-right"
                >
                  <option value="Peng-Robinson (PR) - HYSYS Core">Peng-Robinson (PR) - HYSYS Core</option>
                  <option value="NRTL - Activity Coefficient">NRTL - Activity Coefficient</option>
                  <option value="UNIQUAC - Complex Polymers">UNIQUAC - Complex Polymers</option>
                  <option value="SRK (Soave-Redlich-Kwong)">SRK (Soave-Redlich-Kwong)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  handleExportPDFReport();
                  setShowPdfSetupModal(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>إصدار وتحميل التقرير PDF</span>
              </button>
              <button
                onClick={() => setShowPdfSetupModal(false)}
                className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription licensing limit blocker overlay */}
      {isLockout && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
            
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>

            <div className="space-y-2">
              <span className="text-slate-500 text-[10px] block mx-auto font-mono">LICENSE_LIMIT_TIMEOUT [24H_FREE_TRIAL_EXPIRED]</span>
              <h3 className="text-xl font-bold text-slate-100">انتهت فترة التجربة المجانية (24 ساعة)</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                لقد استخدمت محاكي العمليات وموازنة الموائع aspen HYSYS-like لمدة يوم كامل مجاناً. للتمكن من الاستمرار في المحاكيات، وتوليد تقارير PDF الهندسية المعتمدة للمصافي، يُرجى الاشتراك السنوي أو الشهري بمبلغ 17$ لتفعيل ترخيصك الفوري.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl text-right">
              <p className="text-xs text-slate-400">سعر الاشتراك المباشر للتفعيل:</p>
              <div className="flex justify-between items-center mt-1 flex-row-reverse">
                <span className="text-lg font-bold text-emerald-400">17 دولار فقط / شهرياً</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">تنشيط رسمي الهيئة بالبصرة</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a 
                href="https://wa.me/9647806053200" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/15"
              >
                تحديث وتفعيل وتواصل واتساب: 07806053200
              </a>
              
              <div className="border-t border-slate-800/80 pt-4 mt-2">
                <p className="text-[11px] text-slate-400 mb-2">هل تمتلك بريداً إلكترونياً مشتركاً ومفعلاً؟ أدخله للدخول المباشر:</p>
                <form onSubmit={handleVerifySubscription} className="flex gap-2">
                  <input 
                    type="email" 
                    required
                    placeholder="example@gmail.com" 
                    value={enteredEmail}
                    onChange={(e) => setEnteredEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-blue-500 outline-none text-right"
                  />
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 shrink-0"
                  >
                    تفعيل الدخول
                  </button>
                </form>
                {authError && <p className="text-[10px] text-red-400 mt-2 text-right">{authError}</p>}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
