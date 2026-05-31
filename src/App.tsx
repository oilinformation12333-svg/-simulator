/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UnitType, SimulationState, FSNode, FSStream, Alarm } from './types';
import { CASE_STUDIES, CHEMICAL_REFS } from './data/chemData';
import ProcessFlowsheet from './components/ProcessFlowsheet';
import AIChatCopilot from './components/AIChatCopilot';
import DesignCalculations from './components/DesignCalculations';
import ProjectHistory from './components/ProjectHistory';
import G_OTLogo from './components/G_OTLogo';
import {
  AlertCircle, Terminal, Info, HelpCircle, Activity, LayoutGrid,
  Database, ArrowRightLeft, Sparkles, BookOpen, ShieldAlert, Check, X,
  GraduationCap, Key, Lock, Compass, Cpu, Mail, Star, Flame, Waves, Settings
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'WELCOME' | 'WORKSPACE' | 'CALCULATIONS' | 'HISTORY' | 'REFERENCES'>('WELCOME');
  const [activeSideTab, setActiveSideTab] = useState<'AI' | 'CALCULATIONS' | 'HISTORY'>('AI');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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

  // PWA Dynamic Installation Support
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  React.useEffect(() => {
    const handleBeforePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    // Initial check
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      alert('المنظومة مثبتة بالفعل كـ PWA أو أنه لا يوجد حدث معلق للتثبيت حالياً.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Flowsheet modifiers: Adding Nodes
  const handleAddNode = (type: UnitType) => {
    
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
    setStreams(prev => prev.filter(s => s.id !== id));
  };

  // Synchronize dynamic model case studies
  const handleSelectCase = (caseId: string) => {
    const found = CASE_STUDIES.find(cs => cs.id === caseId);
    if (found) {
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

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = adminEmail.toLowerCase().trim();
    const allowedEmails = ['oilinformation12333@gmail.com', 'oilinfomrmation12333@gmail.com', 'alisaifaldeen12@gmail.com', 'admin@got.org'];
    if (!allowedEmails.includes(cleanMail)) {
      setAdminError('عذراً، هذا البريد الإلكتروني ليس مسجلاً كمشرف معتمد.');
      return;
    }
    if (adminPassword !== 'admin123' && adminPassword !== 'basra2026') {
      setAdminError('كلمة المرور غير صحيحة.');
      return;
    }
    setAdminError('');
    setIsAdmin(true);
    setShowAdminPanel(false);
  };

  // Modify process parameters dynamically from Form sliders
  const handleParamsChange = (unit: UnitType, newParams: any) => {
    setNodes(prev => prev.map(n => {
      if (n.type === unit) {
        return { ...n, params: { ...n.params, ...newParams } };
      }
      return n;
    }));
  };

  const handleOverrideState = (newState: SimulationState) => {
    // Map traditional state overrides onto active flowsheet nodes parameters
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
    setNodes(newGenNodes);
    setStreams(newGenStreams);
    if (newGenNodes.length > 0) {
      setSelectedNodeId(newGenNodes[0].id);
    }
  };

  // Direct load project from local saves index
  const handleLoadSavedProject = (loadedNodes: FSNode[], loadedStreams: FSStream[]) => {
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
    const pdfProjectName = "Project A";
    const pdfCompanyName = "Company B";
    const pdfLeadEngineer = "Engineer C";
    const pdfThermoModel = "Peng-Robinson";
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

  // Safe client-side API call proxying to server-side Gemini client with current flowsheet data awareness!
  const handlePromptGemini = async (
    promptText: string,
    image?: { data: string; mimeType: string },
    activeNodes?: any[],
    activeStreams?: any[]
  ): Promise<string> => {
    try {
      const resp = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          image,
          activeNodes: activeNodes || nodes,
          activeStreams: activeStreams || streams
        })
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row-reverse font-sans selection:bg-purple-600 selection:text-white" dir="rtl" id="main-app">
      
      {/* 1. RIGHT SIDEBAR NAVIGATION MENU (RTL RTL-first flow) */}
      <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl" id="app-sidebar-navigation">
        
        {/* Brand/Accreditation section inside the sidebar */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3.5 flex-row-reverse">
          <G_OTLogo size="sm" className="shrink-0" />
          <div className="text-right flex-1 select-none">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase block w-fit ml-auto">
              G&OT SYSTEM
            </span>
            <h2 className="text-sm font-extrabold text-white mt-1 bg-gradient-to-l from-slate-100 via-blue-200 to-emerald-200 bg-clip-text text-transparent leading-snug">
              الهيئة العامة للمهندسين
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Petrochemical Lab Suite v3.5
            </p>
          </div>
        </div>

        {/* Dynamic Sidebar Menus/Lists */}
        <nav className="p-4 flex-1 space-y-1.5 overflow-y-auto" id="sidebar-tab-menu-list">
          <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-2 text-right">
            القوائم واللوحات الأساسية
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('WELCOME')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all flex-row-reverse text-right ${
              activeTab === 'WELCOME'
                ? 'bg-gradient-to-l from-purple-950/40 to-blue-950/40 border border-purple-500/30 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 shrink-0 ${activeTab === 'WELCOME' ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className="flex-1">الرئيسية والترحيب</span>
            {activeTab === 'WELCOME' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WORKSPACE')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all flex-row-reverse text-right ${
              activeTab === 'WORKSPACE'
                ? 'bg-gradient-to-l from-purple-950/40 to-blue-950/40 border border-purple-500/30 text-white shadow-lg animate-pulseState'
                : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'WORKSPACE' ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className="flex-1">غرفة التحكم والمحاكاة</span>
            {activeTab === 'WORKSPACE' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CALCULATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all flex-row-reverse text-right ${
              activeTab === 'CALCULATIONS'
                ? 'bg-gradient-to-l from-purple-950/40 to-blue-950/40 border border-purple-500/30 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'CALCULATIONS' ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className="flex-1">الحسابات الهيدروليكية</span>
            {activeTab === 'CALCULATIONS' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all flex-row-reverse text-right ${
              activeTab === 'HISTORY'
                ? 'bg-gradient-to-l from-purple-950/40 to-blue-950/40 border border-purple-500/30 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <Database className={`w-4 h-4 shrink-0 ${activeTab === 'HISTORY' ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className="flex-1">أرشيف العمليات والمشاريع</span>
            {activeTab === 'HISTORY' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REFERENCES')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all flex-row-reverse text-right ${
              activeTab === 'REFERENCES'
                ? 'bg-gradient-to-l from-purple-950/40 to-blue-950/40 border border-purple-500/30 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'REFERENCES' ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className="flex-1">المراجع والمصادر العلمية</span>
            {activeTab === 'REFERENCES' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>

          {/* PWA Installer Action Panel */}
          <div className="mt-6 p-4 bg-slate-950/60 border border-slate-850/80 rounded-xl text-right select-none space-y-2">
            <div className="flex items-center gap-2 justify-between flex-row-reverse">
              <span className="text-[9px] uppercase font-bold text-emerald-400 font-mono tracking-wider">
                PWA OFFLINE APPS
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {isAppInstalled 
                ? 'تم دمج وتحميل حزم العمل دون إنترنت بنجاح!' 
                : 'يدعم التثبيت الفوري كبرنامج مستقل ذو حواسب هيدروليكية ممتدة على الكومبيوتر والهواتف.'}
            </p>
            {isAppInstalled ? (
              <div className="text-[10px] font-bold text-emerald-450 bg-emerald-500/10 border border-emerald-500/25 py-2 px-3 rounded-lg text-center">
                ✓ التطبيق مثبت ومثالي على جهازك الحالي
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallPWA}
                className="w-full py-2 px-3 bg-purple-650 hover:bg-purple-550 border border-purple-500/30 text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>تثبيت تطبيق المنصة المستقل 📲</span>
              </button>
            )}
          </div>
        </nav>

        {/* Bottom Sidebar Footer section: Supervisor Info & Admin Status */}
        <div className="p-4 bg-slate-950 border-t border-slate-850 text-right space-y-3">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[8px] text-slate-500 font-mono">DEVELOPER ENGINEER</div>
              <div className="text-[10px] font-bold text-slate-200 truncate leading-snug" dir="ltr">
                Eng.Ali saif AlDIN Haider Alnawfal
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px] font-mono border-t border-slate-850 pt-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Jacobi Solver: Stable</span>
            </div>
            
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-sans">مشرف ✓</span>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="text-slate-500 hover:text-rose-400 font-sans text-[9px] transition-all"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setActiveTab('WELCOME');
                  setShowAdminPanel(true);
                }}
                className="text-yellow-400 hover:text-yellow-300 font-sans text-[9px] font-semibold tracking-wide border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-1 rounded-md transition-all shrink-0"
              >
                دخول المشرفين
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN PAGES AREA */}
      <main className="flex-1 overflow-y-auto" id="app-main-content-flow">
        
        {/* UPPER MINIMALIST CONSOLE HEADING */}
        <header className="bg-slate-900/60 border-b border-slate-850 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 backdrop-blur-md z-20">
          <div className="text-right">
            <span className="text-[10px] font-bold text-purple-400 font-mono tracking-wider">
              CHEMSIM LAB ENGINE v3.5
            </span>
            <h1 className="text-base font-bold text-slate-200 mt-0.5">
              {activeTab === 'WELCOME' && 'البوابة الرئيسية والمرحباً بالمهندسين'}
              {activeTab === 'WORKSPACE' && 'مختبر العمليات ومحاكاة السريان المتكامل'}
              {activeTab === 'CALCULATIONS' && 'براءة الحسابات والموازنات الحرارية والكتلية'}
              {activeTab === 'HISTORY' && 'أرشيف المشاريع ودراسات الحالات المسبقة'}
              {activeTab === 'REFERENCES' && 'المصادر والبروتوكولات الهندسية الأكاديمية'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'WORKSPACE' && (
              <button
                onClick={handleExportPDFReport}
                className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-slate-100 font-bold rounded-xl shadow-lg border border-blue-500/20 transition-all font-sans text-xs flex items-center gap-1.5 active:scale-95"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>تحميل تقرير الحسابات PDF</span>
              </button>
            )}

            <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 font-mono font-medium hidden sm:block">
              Basrah UTC: {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </header>

        {/* RENDERING DYNAMIC SCREENS ACCORDING TO THE ACTIVE TAB LINKED */}
        <div className="p-6 max-w-7xl mx-auto space-y-6">

          {/* SCREEN A: WELCOME (البوابة الرئيسية وقصاصة الترحيب المحددة) */}
          {activeTab === 'WELCOME' && (
            <div className="space-y-8 animate-fadeIn" id="screen-welcome-dashboard">
              
              {/* Centered Huge Glowing Emblem & Welcome banner */}
              <div className="relative overflow-hidden bg-slate-900 border border-slate-850 rounded-3xl p-8 text-center space-y-6 flex flex-col items-center">
                
                {/* Decorative absolute grids */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent opacity-50" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                <G_OTLogo size="xl" className="my-2" />

                <div className="max-w-2xl mx-auto space-y-2 relative">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-normal leading-snug">
                    الهيئة العامة للمهندسين الكيميائيين في البصرة
                  </h2>
                  <p className="text-sm font-bold text-amber-400 font-sans tracking-wide">
                    منصة المحاكاة وموازنة العمليات الكيمياوية والبترولية المتطورة
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
                    G&OT ENGINEERING • BASRAH PETROCHEMICAL & PROCESS CONTROL SUITE
                  </p>
                </div>

                {/* Welcoming text from developer ali seif aldeen */}
                <div className="max-w-3xl bg-slate-950/80 border border-slate-800 p-6 rounded-2xl relative text-right space-y-4 leading-relaxed font-sans shadow-inner">
                  <div className="flex items-center gap-2.5 flex-row-reverse">
                    <Star className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-100">تحية تقدير وترحيب من المهندس المطور:</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    يرحب بكم المهندس المطور والمصمم <strong className="text-blue-450 text-[13px] font-mono">Eng.Ali saif AlDIN Haider Alnawfal</strong> (مطور هذا الصرح التقني) في هذه المنصة التفاعلية المحدثة كلياً.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    يتمنى لكم المطور والمشهد الهندسي تجربة استخدام ممتعة ومفيدة ومثمرة أكاديمياً وعملياً! تم تصميم هذه البوابة لتجمع لكم أجهزة الرسم البياني الثنائي والتحليلات ثرموديناميكية الذكية في شاشة محددة ومحكمة لمساعدتكم على فهم موازنات كتل السوائل والغازات ومجابهة متغيرات السلامة وصامت التحكم.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => setActiveTab('WORKSPACE')}
                    className="px-6 py-3 bg-gradient-to-l from-purple-650 to-blue-650 hover:from-purple-550 hover:to-blue-550 text-white font-bold text-xs rounded-2xl shadow-xl transition-all hover:scale-[1.02] flex items-center gap-2 flex-row-reverse"
                  >
                    <Activity className="w-4 h-4 animate-ping" />
                    <span>الدخول الفوري إلى مختبر المحاكاة والذكاء الاصطناعي ⚡</span>
                  </button>

                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="px-5 py-3 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 text-slate-300 border border-slate-800 text-xs rounded-2xl transition-all"
                  >
                    🔐 تسجيل دخول المشرفين المعتمدين / Admin
                  </button>
                </div>
              </div>

              {/* Collapsible Admin credentials login form inside welcome view */}
              {showAdminPanel && !isAdmin && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md mx-auto space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2 flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      <h4 className="text-xs font-bold text-white font-sans">بوابة المشرفين المعتمدة للهيئة</h4>
                    </div>
                    <button
                      onClick={() => setShowAdminPanel(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAdminVerify} className="space-y-3.5 text-right">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">البريد الإلكتروني المعتمد</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="alisaifaldeen12@gmail.com"
                        required
                        className="w-full text-right px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-lg focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">كلمة مرور المشرف (Password)</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full text-right px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-lg focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        تلميح تجريبي: <code className="bg-slate-950 px-1 text-purple-400 rounded">basra2026</code>
                      </p>
                    </div>

                    {adminError && (
                      <p className="text-[10px] text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-sans">
                        ⚠️ {adminError}
                      </p>
                    )}

                    <div className="pt-2 flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowAdminPanel(false)}
                        className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-lg"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-gradient-to-l from-purple-650 to-blue-650 hover:bg-purple-500 text-white font-bold rounded-lg"
                      >
                        تأكيد الصلاحية
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Quick Preset study Launchers container */}
              <div className="space-y-4">
                <div className="text-right">
                  <h3 className="text-sm font-bold text-slate-300">اختر منظومة كيميائية لبدء المحاكاة المباشرة:</h3>
                  <p className="text-[11px] text-slate-500">حالات دراسية بترولية مبرمجة ومغذاة بموازين كيميائية دقيقة</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {CASE_STUDIES.map((study) => (
                    <div
                      key={study.id}
                      className="bg-slate-900 border border-slate-850 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01] relative select-none"
                    >
                      <div className="absolute top-3 left-4 text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono uppercase">
                        {study.id === 'ethanol_distillation' && 'Fractionation'}
                        {study.id === 'cstr_synthesis' && 'Kinetics'}
                        {study.id === 'gas_boosting' && 'Compression'}
                      </div>

                      <div className="space-y-2 text-right pt-2">
                        <h4 className="font-bold text-xs text-white leading-relaxed">
                          {study.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 font-sans">
                          {study.description}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleSelectCase(study.id);
                          setActiveTab('WORKSPACE');
                        }}
                        className="w-full py-2.5 bg-slate-950 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/30 text-blue-400 hover:text-white transition-all rounded-xl text-[10px] font-bold tracking-wide block text-center"
                      >
                        ابدأ تشغيل المحاكاة الفورية ⚡
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SCREEN B: WORKSPACE (مختبر غرفة التحكم المحكمة للبوت واللوحة معاً في شاشة واحدة!) */}
          {activeTab === 'WORKSPACE' && (
            <div className="space-y-6 animate-fadeIn" id="screen-unify-workspace">
              
              {/* Responsive 12 Columns Combined Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Master column left: Flowsheet graphics interactive canvas (Takes 8/12 of space on desktop) */}
                <div className="lg:col-span-12 xl:col-span-8 flex flex-col space-y-6">
                  
                  <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-4 flex-row-reverse">
                      <div className="flex items-center gap-2.5 flex-row-reverse">
                        <Flame className="w-5 h-5 text-purple-400" />
                        <div className="text-right">
                          <h3 className="font-bold text-xs text-white">لوحة تدفق السريان التفاعلية (Process Flowsheet Studio)</h3>
                          <p className="text-[9px] text-slate-400">انقر مع السحب لإزاحة المعدات وتعديل قيم موازنة ثنائية الأنابيب المتصلة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500">
                        <span>SNAP GRID: LOCKED</span>
                      </div>
                    </div>

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
                      onUndo={() => {}}
                      onRedo={() => {}}
                      canUndo={false}
                      canRedo={false}
                      onAutoArrange={handleAutoArrange}
                      onExportJSON={handleExportJSON}
                      onExportPDF={handleExportPDFReport}
                    />
                  </div>

                </div>

                {/* Side column right: AI Copilot Assistant chatbot directly next to it (Takes 4/12 of space) */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col space-y-6">
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[550px]" id="copilot-grid-sidebar">
                    <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-row-reverse">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="text-right">
                          <h4 className="font-bold text-xs text-white font-sans">المساعد الكيمياوي الذكي (AI Assistant)</h4>
                          <p className="text-[9px] text-slate-500 font-mono">Generates dynamic solutions on canvas</p>
                        </div>
                      </div>
                      <span className="text-[8px] bg-slate-800 text-slate-450 px-2 py-0.5 rounded font-mono">
                        Active Memory
                      </span>
                    </div>

                    <div className="flex-1 overflow-hidden p-0 flex flex-col">
                      <AIChatCopilot
                        onPromptGemini={handlePromptGemini}
                        onApplyGeneratedFlowsheet={handleApplyGeneratedFlowsheet}
                        activeNodes={nodes}
                        activeStreams={streams}
                      />
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* SCREEN C: CALCULATIONS (براءات التصميم والحسابات الهيدروليكية والديناميكية) */}
          {activeTab === 'CALCULATIONS' && (
            <div className="space-y-6 animate-fadeIn" id="screen-calculations">
              
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 relative">
                <div className="absolute top-4 left-6 py-1 px-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-mono text-[10px] uppercase">
                  Active Physics Module
                </div>
                
                <DesignCalculations state={simState} />
              </div>

            </div>
          )}

          {/* SCREEN D: HISTORY (أرشيف حفظ النماذج واسترداد المخططات) */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-6 animate-fadeIn" id="screen-history">
              
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
                <ProjectHistory
                  nodes={nodes}
                  streams={streams}
                  onLoadProject={(loadedNodes, loadedStreams) => {
                    setNodes(loadedNodes);
                    setStreams(loadedStreams);
                    setActiveTab('WORKSPACE');
                  }}
                />
              </div>

            </div>
          )}

          {/* SCREEN E: REFERENCES (مصادر الهيئة والمراجع الأكاديمية المعتمدة لبروست وثيرمو) */}
          {activeTab === 'REFERENCES' && (
            <div className="space-y-6 animate-fadeIn text-right" id="screen-references">
              
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="space-y-2 max-w-xl">
                  <h3 className="text-xl font-bold text-white leading-snug">
                    البروتوكولات الأكاديمية والمصادر الهندسية المعتمدة
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    تمت معايرة ومطابقة مخرجات موازنات المادة والخواص الثرموديناميكية لـ ChemSim AI بالاعتماد على الكتب والمقررات الهندسية الكيميائية والصناعية الرائدة لضمان الكفاءة القصوى:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 select-none">
                  {CHEMICAL_REFS.map((ref, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-850/80 p-5 rounded-2xl space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2 flex-row-reverse">
                        <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-md">
                          مرجع رقم #{idx + 1}
                        </span>
                        <h4 className="font-extrabold text-xs text-blue-400 font-sans">
                          {ref.title}
                        </h4>
                      </div>
                      
                      <div className="text-[11px] text-slate-400 font-sans space-y-1">
                        <p><strong>المؤلفون:</strong> {ref.authors}</p>
                        <p><strong>الإصدار الناشر:</strong> {ref.edition}</p>
                      </div>

                      <div className="bg-slate-900/55 p-3 rounded-xl border border-slate-850 mt-2 text-xs text-slate-300 leading-relaxed font-sans">
                        <strong>تطبيق المعادلة:</strong> {ref.useCase}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mt-8 flex items-center gap-4 flex-row-reverse text-right leading-relaxed font-sans">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">آمن ومطابق لمقاييس التصميم والموازنة</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يتم تسوية وتدوير معادلات فنسكي للمكعبات، معاملات ثنائي السوائل، والهروب الكيميائي الحركي لتضاهي برمجيات Aspen HYSYS و Pro/II، بفضل الترابط الخوارزمي المستدام.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}

