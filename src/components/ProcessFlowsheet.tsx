/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { FSNode, FSStream, UnitType } from '../types';
import {
  Activity, Play, Plus, Trash2, ArrowRightLeft, Move, Settings, HelpCircle,
  Sparkles, Save, FolderOpen, RefreshCcw, Undo2, Redo2, Download, ShieldCheck, AlertCircle
} from 'lucide-react';

const getTempColor = (temp: number) => {
  if (temp <= 25) return '#38bdf8'; // Blue-sky (#38bdf8)
  if (temp >= 150) return '#ef4444'; // Hot red (#ef4444)
  if (temp < 60) {
    // sky-400 (#38bdf8) to amber-500 (#f59e0b)
    const pct = (temp - 25) / (60 - 25);
    const r = Math.round(56 + (245 - 56) * pct);
    const g = Math.round(189 + (158 - 189) * pct);
    const b = Math.round(248 + (11 - 248) * pct);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // amber-500 (#f59e0b) to rose-500 (#f43f5e) / red (#ef4444)
    const pct = (temp - 60) / (150 - 60);
    const r = Math.round(245 + (239 - 245) * pct);
    const g = Math.round(158 + (68 - 158) * pct);
    const b = Math.round(11 + (68 - 11) * pct);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

interface ProcessFlowsheetProps {
  nodes: FSNode[];
  streams: FSStream[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onAddNode: (type: UnitType) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddStream: (name: string, fromNode: string, toNode: string, temp: number, pres: number, flow: number, comps: Record<string, number>) => void;
  onDeleteStream: (streamId: string) => void;
  onMoveNode: (nodeId: string, dx: number, dy: number) => void;
  alarms: any[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onAutoArrange?: () => void;
  onExportJSON?: () => void;
  onExportPDF?: () => void;
}

export default function ProcessFlowsheet({
  nodes,
  streams,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onAddStream,
  onDeleteStream,
  onMoveNode,
  alarms,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAutoArrange,
  onExportJSON,
  onExportPDF
}: ProcessFlowsheetProps) {
  const [streamName, setStreamName] = useState('S-05');
  const [fromNode, setFromNode] = useState('');
  const [toNode, setToNode] = useState('');
  const [streamTemp, setStreamTemp] = useState(25);
  const [streamPres, setStreamPres] = useState(1.0);
  const [streamFlow, setStreamFlow] = useState(1000);
  const [selectedCompName, setSelectedCompName] = useState('Water');

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Add Stream connection form toggle
  const [showStreamForm, setShowStreamForm] = useState(false);

  // Available equipment catalog with standard labels and colors
  const catalog: { type: UnitType; label: string; desc: string; color: string }[] = [
    { type: 'TANK', label: 'خزان تجميع (Tank)', desc: 'Vessels for storing buffer processes', color: 'border-emerald-600' },
    { type: 'PUMP', label: 'مضخة طاردة (Pump)', desc: 'Hydraulic centrifugal boosters', color: 'border-blue-600' },
    { type: 'EXCHANGER', label: 'مبادل حراري (Exchanger)', desc: 'Shell & tube heat preheaters', color: 'border-sky-600' },
    { type: 'REACTOR', label: 'مفاعل كيميائي (Reactor)', desc: 'CSTR / kinetic reaction vessel', color: 'border-purple-600' },
    { type: 'COMPRESSOR', label: 'ضاغط كابس (Compressor)', desc: 'Polytropic gas compression', color: 'border-amber-600' },
    { type: 'COLUMN', label: 'برج تقطير (Column)', desc: 'Fractionating tray split towers', color: 'border-rose-600' },
    { type: 'VALVE', label: 'صمام تحكم (Valve)', desc: 'Isenthalpic expansion control', color: 'border-teal-600' },
    { type: 'MIXER', label: 'خلاط ومجمع (Mixer)', desc: 'Merging multiple chemical flows', color: 'border-indigo-600' },
    { type: 'SEPARATOR', label: 'فاصل الحالات (Separator)', desc: 'Saturated flash vapor/liquid splitter', color: 'border-orange-500' }
  ];

  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setIsDraggingNode(nodeId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    onSelectNode(nodeId);
  };

  const handleMouseMoveContainer = (e: React.MouseEvent) => {
    if (!isDraggingNode) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      onMoveNode(isDraggingNode, dx, dy);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUpContainer = () => {
    setIsDraggingNode(null);
  };

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromNode || !toNode || fromNode === toNode) {
      alert('الرجاء اختيار وحدة مصدر ووحدة هدف مخالفتين!');
      return;
    }

    const defaultComps: Record<string, number> = { Water: 1.0, Ethanol: 0.0, Methanol: 0.0, Benzene: 0.0, Acetone: 0.0, Toluene: 0.0 };
    if (selectedCompName !== 'Water') {
      defaultComps['Water'] = 0.5;
      defaultComps[selectedCompName] = 0.5;
    }

    onAddStream(
      streamName,
      fromNode,
      toNode,
      streamTemp,
      streamPres,
      streamFlow,
      defaultComps
    );

    // Auto increment stream counter
    const nextNum = parseInt(streamName.replace('S-', '')) + 1;
    setStreamName(`S-${String(nextNum).padStart(2, '0')}`);
    setShowStreamForm(false);
  };

  // Helper to dynamically read temperature and pressure for any node
  const getNodeTP = (nodeId: string, nodeType: UnitType, params: any) => {
    const connectedStreams = streams.filter(s => s.fromNode === nodeId || s.toNode === nodeId);
    let temp = 25.0;
    let pres = 1.0;

    if (connectedStreams.length > 0) {
      const outletStream = streams.find(s => s.fromNode === nodeId);
      if (outletStream) {
        temp = outletStream.temperature;
        pres = outletStream.pressure;
      } else {
        const inletStream = streams.find(s => s.toNode === nodeId);
        if (inletStream) {
          temp = inletStream.temperature;
          pres = inletStream.pressure;
        }
      }
    } else {
      if (nodeType === 'COLUMN') {
        temp = 78.3;
        pres = 1.0;
      } else if (nodeType === 'PUMP') {
        temp = 29.5;
        pres = params?.suctionPressure ? (params.suctionPressure + 2.2) : 3.2;
      } else if (nodeType === 'REACTOR') {
        temp = params?.feedTemp ?? 85.0;
        pres = 2.5;
      } else if (nodeType === 'COMPRESSOR') {
        temp = 95.0;
        pres = params?.dischargePressure ?? 12.0;
      } else if (nodeType === 'EXCHANGER') {
        temp = params?.coldInletTemp ? (params.coldInletTemp + 35) : 60.0;
        pres = 3.5;
      } else if (nodeType === 'VALVE') {
        temp = 24.8;
        pres = 1.25;
      } else if (nodeType === 'TANK') {
        temp = 25.0;
        pres = params?.suctionPressure ?? 1.0;
      } else if (nodeType === 'SEPARATOR') {
        temp = 65.0;
        pres = 2.0;
      }
    }

    return {
      t: temp.toFixed(1),
      p: pres.toFixed(2)
    };
  };

  // Get coordinates for ports
  const getNodePort = (nodeId: string, side: 'IN' | 'OUT') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    // Node width = 140, height = 88
    if (side === 'IN') {
      return { x: node.x, y: node.y + 44 };
    } else {
      return { x: node.x + 140, y: node.y + 44 };
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden" id="flowsheet-sandbox">
      {/* Blueprint Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-35 pointer-events-none" />

      {/* Control Actions upper header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>لوحة رسم المخططات التفاعلية (Process Flowsheet Design Canvas)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            اصنع عمليتك الكيميائية الخاصة: اسحب المعدات، حركها، واربطها بأنابيب السريان لتشغيل المحاكاة live.
          </p>
        </div>

        {/* Undo, Redo, Clear toolbar */}
        <div className="flex items-center gap-2 self-end md:self-auto select-none flex-wrap">
          {onAutoArrange && (
            <button
              onClick={onAutoArrange}
              title="رتب الأجهزة عشوائية التموضع تلقائياً بنظام PFD منسق"
              className="p-1.5 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-purple-200 rounded-lg font-bold transition-all flex items-center gap-1 text-[10px] shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>ترتيب تلقائي (Auto-Arrange)</span>
            </button>
          )}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-[10px]"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>رجوع (Undo)</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-[10px]"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>إعادة (Redo)</span>
          </button>
          <button
            onClick={() => setShowStreamForm(!showStreamForm)}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-all flex items-center gap-1 text-[10px]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>ربط خط تيار (Connect Stream)</span>
          </button>
          
          {onExportJSON && (
            <button
              onClick={onExportJSON}
              title="تصدير مخطط السريان التفاعلي بصيغة JSON"
              className="p-1.5 bg-slate-905 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-lg text-yellow-400 transition-all flex items-center gap-1 text-[10px]"
            >
              <Save className="w-3.5 h-3.5 text-yellow-500" />
              <span>تصدير مخطط JSON</span>
            </button>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              title="تحميل و طباعة التقرير الفني لموازنة المادة والحرارة"
              className="p-1.5 bg-slate-905 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-lg text-rose-400 transition-all flex items-center gap-1 text-[10px]"
            >
              <Download className="w-3.5 h-3.5 text-rose-500" />
              <span>طباعة تقرير موازنة PDF</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* LEFT COLUMN: EQUIPMENT PALETTE */}
        <div className="lg:col-span-1 space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-900 h-[480px] overflow-y-auto" id="palette-sidebar">
          <h4 className="text-xs font-bold text-slate-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-right">
            مكتبة المعدات والمنظومات
          </h4>
          <p className="text-[10px] text-slate-500 leading-normal text-right">
            انقر على أي نموذج مبيّن أدناه لإضافته فوراً إلى مخطط السريان:
          </p>

          <div className="space-y-2 pt-1 select-none">
            {catalog.map((cat) => (
              <button
                key={cat.type}
                onClick={() => onAddNode(cat.type)}
                className="w-full p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl transition-all cursor-pointer text-right flex items-center justify-between gap-2.5 active:scale-[0.98]"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <Plus className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-200">{cat.label.split(' (')[0]}</p>
                  <p className="text-[9px] text-slate-500 font-sans">{cat.label.split('(')[1]?.replace(')', '')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER/RIGHT COLUMNS: INTERACTIVE BLUEPRINT WORKSPACE */}
        <div className="lg:col-span-3 flex flex-col space-y-3">
          
          {/* Active Canvas Frame */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMoveContainer}
            onMouseUp={handleMouseUpContainer}
            onMouseLeave={handleMouseUpContainer}
            className="w-full h-[485px] bg-slate-950 border border-slate-900 rounded-2xl relative overflow-auto select-none"
            id="flowsheading-canvas-window"
          >
            {/* SVG Wire lines connecting nodes */}
            <svg className="absolute inset-0 w-[1500px] h-[1500px] pointer-events-none z-0">
              {streams.map((str) => {
                if (!str.fromNode || !str.toNode) return null;
                const p1 = getNodePort(str.fromNode, 'OUT');
                const p2 = getNodePort(str.toNode, 'IN');
                
                // Draw elegant orthogonal mechanical step lines
                const midX = p1.x + (p2.x - p1.x) / 2;
                const pathDesc = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;

                return (
                  <g key={str.id}>
                    {/* Shadow pipe tube outline */}
                    <path
                      d={pathDesc}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    {/* Colored pipe line */}
                    <path
                      d={pathDesc}
                      fill="none"
                      stroke={str.temperature > 50 ? '#ef4444' : '#0ea5e9'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`هل تريد حذف الخط الكيميائي ${str.name}؟`)) {
                          onDeleteStream(str.id);
                        }
                      }}
                    />
                    
                    {/* Stream Tag Text label */}
                    <foreignObject
                      x={midX - 25}
                      y={p1.y + (p2.y - p1.y)/2 - 12}
                      width="60"
                      height="24"
                      className="pointer-events-auto"
                    >
                      <div className="bg-slate-900 border border-slate-800 text-[9px] font-mono text-center text-slate-300 rounded px-1 shadow border-b border-b-blue-500 leading-tight">
                        {str.name}
                      </div>
                    </foreignObject>

                    {/* Fluid Flow anim cycle point */}
                    <circle r="3.5" fill={str.temperature > 50 ? '#fca5a5' : '#7dd3fc'} className="animate-pulse">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path={pathDesc} />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Placed Nodes list */}
            <div className="absolute w-[1500px] h-[1500px] z-10 pointer-events-none">
              {nodes.map((node) => {
                const hasAlarm = alarms.some(a => a.id.startsWith(node.id));
                const isSelected = selectedNodeId === node.id;
                
                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute w-[140px] h-[88px] pointer-events-auto cursor-grab rounded-xl border p-2.5 flex flex-col justify-between transition-all select-none bg-slate-900/95 shadow-lg ${
                      isSelected
                        ? 'border-orange-500 scale-102 ring-2 ring-orange-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Label + Delete button */}
                    <div className="flex justify-between items-center bg-slate-950 px-1 py-0.5 rounded border border-slate-900 shadow-inner">
                      <span className="text-[9px] font-mono font-bold text-slate-300 truncate max-w-[85px]">
                        {node.label}
                      </span>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNode(node.id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-0.5 transition-colors pointer-events-auto"
                        title="Delete Equipment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Visual schematic shape index representing Aspen design */}
                    <div className="flex-1 flex items-center justify-center py-0.5 text-[9.5px] font-bold">
                      {node.type === 'PUMP' && (
                        <span className="text-blue-400 flex items-center gap-1 font-mono">
                          <span className="w-3.5 h-3.5 rounded-full border border-blue-450 flex items-center justify-center">▶</span>
                          PUMP
                        </span>
                      )}
                      {node.type === 'EXCHANGER' && (
                        <span className="text-sky-450 flex items-center font-mono text-[9px]">
                          ⧓ SHELL-TUBE
                        </span>
                      )}
                      {node.type === 'REACTOR' && (
                        <span className="text-purple-400 font-mono flex items-center gap-1">
                          ⧪ CSTR
                        </span>
                      )}
                      {node.type === 'COMPRESSOR' && (
                        <span className="text-amber-500 font-mono">
                          🌀 COM-C10
                        </span>
                      )}
                      {node.type === 'COLUMN' && (
                        <span className="text-rose-400 font-mono flex items-center gap-1">
                          ▮ COLUMN
                        </span>
                      )}
                      {node.type === 'TANK' && (
                        <span className="text-emerald-400 font-mono">
                          ⏀ V-VESSEL
                        </span>
                      )}
                      {node.type === 'VALVE' && (
                        <span className="text-teal-400 font-mono">
                          ⧓ VALVE
                        </span>
                      )}
                      {node.type === 'MIXER' && (
                        <span className="text-indigo-400 font-mono">
                          ⛛ MIXER
                        </span>
                      )}
                      {node.type === 'SEPARATOR' && (
                        <span className="text-orange-400 font-mono">
                          ▮ FLASH-SEP
                      </span>
                      )}
                    </div>

                    {/* Operational values line on footer */}
                    <div className="text-[8.5px] text-slate-400 font-mono truncate flex justify-between border-t border-slate-800/40 pt-1">
                      {node.type === 'PUMP' && <span>Q: {node.params?.flowRate ?? 45} m³/h</span>}
                      {node.type === 'REACTOR' && <span>Cool Vol: {node.params?.volume ?? 800} L</span>}
                      {node.type === 'COLUMN' && <span>Trays: {node.params?.totalTrays ?? 20}</span>}
                      {node.type === 'TANK' && <span>Cap: {node.params?.volume ?? 5000} L</span>}
                      {node.type === 'COMPRESSOR' && <span>P_out: {node.params?.dischargePressure ?? 12} bar</span>}
                      {node.type === 'EXCHANGER' && <span>U: {node.params?.overallU ?? 850} W/m²</span>}
                      {node.type === 'VALVE' && <span>dP: {node.params?.pressureDrop ?? 1.5} bar</span>}
                      {node.type === 'MIXER' && <span>Inlets: {streams.filter(s=>s.toNode===node.id).length}</span>}
                      {node.type === 'SEPARATOR' && <span>V_frac: 0.50</span>}

                      {hasAlarm && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                      )}
                    </div>

                    {/* Thermodynamic dynamic variables row */}
                    <div className="flex items-center justify-between text-[8px] font-mono mt-1 bg-slate-950 p-1 px-1.5 rounded border border-slate-900">
                      <span className="text-amber-400" dir="ltr">T: {getNodeTP(node.id, node.type, node.params).t}°C</span>
                      <span className="text-cyan-400" dir="ltr">P: {getNodeTP(node.id, node.type, node.params).p} bar</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Alarm safe state notification */}
          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-300 text-[11px]">
                نظام محاكاة العمليات ChemSim AI جاهز. استخدام نظام الإحداثيات والجر الحر للتوجيه.
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Grid size: 24px • Snap-to-grid auto</span>
          </div>

        </div>

      </div>

      {/* MODAL STREAM BUILDER DRAWER */}
      {showStreamForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-850 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm">ربط خط تدفق كيميائي جديد (Insert Stream)</h3>
              </div>
              <button
                onClick={() => setShowStreamForm(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConnection} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">اسم التيار (Stream Tag)</label>
                  <input
                    type="text"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">المادة الطاغية (Main Fluid)</label>
                  <select
                    value={selectedCompName}
                    onChange={(e) => setSelectedCompName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="Water">الماء (Water)</option>
                    <option value="Ethanol">الإيثانول (Ethanol)</option>
                    <option value="Methanol">الميثانول (Methanol)</option>
                    <option value="Benzene">البنزين (Benzene)</option>
                    <option value="Acetone">الأسيتون (Acetone)</option>
                    <option value="Toluene">التولوين (Toluene)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">المصدر (Source Unit Outlet)</label>
                  <select
                    value={fromNode}
                    onChange={(e) => setFromNode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                    required
                  >
                    <option value="">-- اختر مخرج وحدة --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">الهدف (Target Unit Inlet)</label>
                  <select
                    value={toNode}
                    onChange={(e) => setToNode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                    required
                  >
                    <option value="">-- اختر مدخل وحدة --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-550 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    value={streamTemp}
                    onChange={(e) => setStreamTemp(parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-550 mb-1">Press (bar)</label>
                  <input
                    type="number" step="0.1"
                    value={streamPres}
                    onChange={(e) => setStreamPres(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-550 mb-1">Flow (kg/hr)</label>
                  <input
                    type="number"
                    value={streamFlow}
                    onChange={(e) => setStreamFlow(parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowStreamForm(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-850"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg"
                >
                  تأكيد الربط الهيدروليكي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
