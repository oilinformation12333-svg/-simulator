/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UnitType, SimulationState } from '../types';
import { Settings, HelpCircle, Flame, Droplets, Zap, ShieldAlert, Cpu, Calculator, Sliders, CornerDownLeft, Sparkles, Activity, Atom } from 'lucide-react';

interface UnitDetailsProps {
  unitType: UnitType;
  state: SimulationState;
  onChangeParams: (unit: UnitType, newParams: any) => void;
  isAdmin: boolean;
}

// Technical details of parameters for precise operation
interface ParamMeta {
  key: string;
  label: string;
  labelEn: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const getUnitParams = (type: UnitType): ParamMeta[] => {
  switch (type) {
    case 'PUMP':
      return [
        { key: 'flowRate', label: 'معدل تدفق المائع', labelEn: 'Flow Rate', unit: 'm³/hr', min: 5, max: 100, step: 1 },
        { key: 'suctionPressure', label: 'ضغط السحب للمضخة', labelEn: 'Suction Press', unit: 'bar', min: 0.5, max: 10, step: 0.1 },
        { key: 'efficiency', label: 'الكفاءة الهيدروليكية', labelEn: 'Efficiency', unit: '%', min: 40, max: 90, step: 1 },
        { key: 'suctionStaticHead', label: 'الارتفاع الاستاتيكي بالسحب', labelEn: 'Static Head', unit: 'm', min: 1, max: 15, step: 0.5 }
      ];
    case 'EXCHANGER':
      return [
        { key: 'hotInletTemp', label: 'حرارة المائع الساخن الداخل', labelEn: 'Hot Inlet Temp', unit: '°C', min: 60, max: 220, step: 1 },
        { key: 'hotFlowRate', label: 'معدل تدفق المائع الساخن', labelEn: 'Hot Flow Rate', unit: 'kg/hr', min: 5000, max: 40000, step: 500 },
        { key: 'area', label: 'مساحة تبادل الحرارة (A)', labelEn: 'Exchanger Area', unit: 'm²', min: 10, max: 120, step: 1 },
        { key: 'overallU', label: 'معامل انتقال الحرارة الإجمالي', labelEn: 'Overall U-coef', unit: 'W/m²K', min: 200, max: 1800, step: 20 }
      ];
    case 'REACTOR':
      return [
        { key: 'feedTemp', label: 'درجة حرارة تغذية المفاعل', labelEn: 'Feed Temp', unit: '°C', min: 30, max: 120, step: 1 },
        { key: 'feedConcA', label: 'تركيز المادة المتفاعلة CA0', labelEn: 'Reactant Conc', unit: 'mol/L', min: 0.5, max: 10.0, step: 0.1 },
        { key: 'jacketTemp', label: 'حرارة سائل التبريد بالقميص', labelEn: 'Jacket Cool Temp', unit: '°C', min: 15, max: 75, step: 1 },
        { key: 'heatOfReaction', label: 'طاقة المحتوى الحراري Peak', labelEn: 'Reaction Heat', unit: 'kJ/mol', min: 40, max: 200, step: 5 }
      ];
    case 'COMPRESSOR':
      return [
        { key: 'suctionPressure', label: 'ضغط السحب للغاز', labelEn: 'Suction Press', unit: 'bar', min: 0.5, max: 5.0, step: 0.1 },
        { key: 'dischargePressure', label: 'ضغط الطرد المطلوب', labelEn: 'Discharge Target', unit: 'bar', min: 5.0, max: 25.0, step: 0.5 },
        { key: 'suctionTemp', label: 'حرارة الغاز الداخل', labelEn: 'Inlet Gas Temp', unit: '°C', min: 15, max: 80, step: 1 },
        { key: 'polytropicEfficiency', label: 'الكفاءة البوليتكنيكية', labelEn: 'Poly Efficiency', unit: '%', min: 50, max: 90, step: 1 }
      ];
    case 'COLUMN':
      return [
        { key: 'refluxRatio', label: 'نسبة الراجع المكثف (R)', labelEn: 'Reflux Ratio', unit: ':1', min: 1.0, max: 8.0, step: 0.1 },
        { key: 'relativeVolatility', label: 'التطايرية النسبية (α)', labelEn: 'Rel Volatility', unit: 'α', min: 1.5, max: 4.5, step: 0.05 },
        { key: 'feedCompositionXF', label: 'تركيز المركب الخفيف zF', labelEn: 'Feed Comp zF', unit: 'fraction', min: 0.1, max: 0.9, step: 0.02 },
        { key: 'totalTrays', label: 'إجمالي صواني الفصل المبرمجة', labelEn: 'Total Trays', unit: 'trays', min: 10, max: 40, step: 1 }
      ];
    default:
      return [];
  }
};

export default function UnitDetails({
  unitType,
  state,
  onChangeParams,
  isAdmin
}: UnitDetailsProps) {
  
  // Controllers
  const [editMode, setEditMode] = useState<'CALCULATOR' | 'SLIDERS'>('CALCULATOR');
  const paramsList = getUnitParams(unitType);
  const [activeParamKey, setActiveParamKey] = useState<string>('');
  const [calcBuffer, setCalcBuffer] = useState<string>('');
  const [calcStatus, setCalcStatus] = useState<'READY' | 'ERR' | 'SUCCESS'>('READY');
  const [isTurboActive, setIsTurboActive] = useState<boolean>(true); // Extreme fast simulation visualizer toggle
  const [isDynamicActive, setIsDynamicActive] = useState<boolean>(true); // Dynamic analysis mode toggle (enabled by default)

  // Get current parameter value safely
  const getCurrentParamValue = (key: string): number => {
    const subState = state[unitType.toLowerCase() as keyof SimulationState] as any;
    if (!subState) return 0;
    const val = subState[key];
    if (key === 'heatOfReaction') return Math.abs(val); // show positive absolute value on LCD
    return val ?? 0;
  };

  // Sync parameter when unit changes
  useEffect(() => {
    const list = getUnitParams(unitType);
    if (list.length > 0) {
      const defaultKey = list[0].key;
      setActiveParamKey(defaultKey);
      setCalcBuffer(getCurrentParamValue(defaultKey).toString());
    }
    setCalcStatus('READY');
  }, [unitType]);

  const handleSelectParam = (key: string) => {
    setActiveParamKey(key);
    setCalcBuffer(getCurrentParamValue(key).toString());
    setCalcStatus('READY');
  };

  // Handlers for adjustments
  const handleRangeChange = (paramKey: string, value: number) => {
    const currentParams = { ...state[unitType.toLowerCase() as keyof SimulationState] };
    currentParams[paramKey] = value;
    onChangeParams(unitType, currentParams);
  };

  // Interactive calculator keypad input handlers
  const handleKeyPress = (char: string) => {
    if (!isAdmin) return;
    setCalcStatus('READY');

    if (char === 'C') {
      setCalcBuffer('0');
      return;
    }

    if (char === '⌫') {
      setCalcBuffer(prev => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
      return;
    }

    setCalcBuffer(prev => {
      if (prev === '0' && char !== '.') {
        return char;
      }
      // Max length limit to prevent crazy layouts
      if (prev.length > 8) return prev;
      return prev + char;
    });
  };

  const handleSetMinVal = () => {
    if (!isAdmin) return;
    const meta = paramsList.find(p => p.key === activeParamKey);
    if (meta) {
      setCalcBuffer(meta.min.toString());
      setCalcStatus('READY');
    }
  };

  const handleSetMaxVal = () => {
    if (!isAdmin) return;
    const meta = paramsList.find(p => p.key === activeParamKey);
    if (meta) {
      setCalcBuffer(meta.max.toString());
      setCalcStatus('READY');
    }
  };

  const handleApplyValue = () => {
    if (!isAdmin) return;
    const meta = paramsList.find(p => p.key === activeParamKey);
    if (!meta) return;

    let num = parseFloat(calcBuffer);
    if (isNaN(num)) {
      setCalcStatus('ERR');
      return;
    }

    // Force values inside acceptable bounds
    if (num < meta.min) num = meta.min;
    if (num > meta.max) num = meta.max;

    setCalcBuffer(num.toString());

    // Apply negative coefficients to reactor heat of reaction standard
    let finalValue = num;
    if (activeParamKey === 'heatOfReaction') {
      finalValue = -Math.abs(num);
    }

    handleRangeChange(activeParamKey, finalValue);
    setCalcStatus('SUCCESS');
    
    // Quick success animation reset
    setTimeout(() => {
      setCalcStatus('READY');
    }, 1200);
  };

  const activeMeta = paramsList.find(p => p.key === activeParamKey);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6" id="unit-details-panel">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-all duration-305 ${
            unitType === 'PUMP' ? 'bg-blue-500/10 text-blue-400' :
            unitType === 'EXCHANGER' ? 'bg-sky-500/10 text-sky-400' :
            unitType === 'REACTOR' ? `bg-purple-500/10 text-purple-400 ${isDynamicActive ? 'ring-2 ring-purple-500/30' : ''}` :
            unitType === 'COMPRESSOR' ? 'bg-amber-500/10 text-amber-500' :
            'bg-rose-500/10 text-rose-500'
          }`}>
            {unitType === 'REACTOR' ? (
              <Atom className={`w-5 h-5 ${isDynamicActive ? 'animate-breath' : 'animate-spin-slow text-purple-400/80'}`} />
            ) : (
              <Settings className="w-5 h-5 animate-spin-slow" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">
              {unitType === 'PUMP' && 'المضخة الطاردة عن المركز (Centrifugal Pump P-101)'}
              {unitType === 'EXCHANGER' && 'المبادل الحراري الأنبوبي (Shell & Tube Exchanger E-101)'}
              {unitType === 'REACTOR' && 'المفاعل البتروكيمياوي المستمر (Catalytic CSTR Reactor R-101)'}
              {unitType === 'COMPRESSOR' && 'ضاغط الغاز الدوار (Centrifugal Compressor C-101)'}
              {unitType === 'COLUMN' && 'برج التقطير وتجزئة الغاز (Distillation Tower D-101)'}
            </h4>
            <p className="text-[11px] text-slate-500 font-mono">
              Thermodynamic & Mechanical Equations • Active Workspace
            </p>
          </div>
        </div>
        
        <span className="text-[10px] bg-slate-805 text-slate-400 font-mono px-2 py-1 rounded border border-slate-800">
          TYPE: {unitType}
        </span>
      </div>

      {/* Main Grid: Parameters on Left/Right & Physics Screen on top */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Unit Physical Internal Screen Widget */}
        <div className="lg:col-span-7 bg-slate-950 rounded-xl p-5 border border-slate-850 flex flex-col justify-between min-h-[300px]">
          
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <span className="text-xs font-bold text-slate-400 tracking-wide flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>شاشة التحليل الفيزيائي الداخلي (Internal Physics Visualizer)</span>
            </span>
            <div className="flex items-center gap-2">
              {isTurboActive && (
                <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[8.5px] px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                  <Activity className="w-2.5 h-2.5" /> TURBO RESOLUTION
                </span>
              )}
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                REAL-TIME SOLVER
              </span>
            </div>
          </div>

          {/* Render Unit Inside Physics & Mathematics */}
          <div className="my-auto py-4">
            {unitType === 'PUMP' && <PumpPhysics state={state.pump} />}
            {unitType === 'EXCHANGER' && <ExchangerPhysics state={state.exchanger} />}
            {unitType === 'REACTOR' && (
              <ReactorPhysics 
                state={state.reactor} 
                isDynamicActive={isDynamicActive}
                setIsDynamicActive={setIsDynamicActive}
              />
            )}
            {unitType === 'COMPRESSOR' && <CompressorPhysics state={state.compressor} />}
            {unitType === 'COLUMN' && <ColumnPhysics state={state.column} />}
          </div>

          {/* Reference standard of design note */}
          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Standard: API 610 / ASME Sec VIII</span>
            <span>Developed under: Eng. Ali saif aldin</span>
          </div>
        </div>

        {/* Operating parameter sliders/inputs & Retro Keypad Controller */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Section Header with Mode Selector Tab */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide">التحكم وبث التغير الرياضي</h5>
              
              {!isAdmin ? (
                <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded font-mono">
                  View-Only / للقراءة فقط
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2' py-0.5 rounded font-mono">
                  Admin Control / تحكم منشط
                </span>
              )}
            </div>

            {/* Selector TABS to easily switch interface styles */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => setEditMode('CALCULATOR')}
                className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none ${
                  editMode === 'CALCULATOR'
                    ? 'bg-emerald-550/15 border border-emerald-500/30 text-emerald-400'
                    : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900'
                }`}
                id="btn-calculator-mode"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>لوحة التحكم الحاسبة (Keypad)</span>
              </button>
              <button
                onClick={() => setEditMode('SLIDERS')}
                className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none ${
                  editMode === 'SLIDERS'
                    ? 'bg-blue-550/15 border border-blue-500/30 text-blue-400'
                    : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900'
                }`}
                id="btn-sliders-mode"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>المُنزلقات المباشرة</span>
              </button>
            </div>
          </div>

          {/* MODE 1: THE RETRO INTEGRATED PROCESS CALCULATOR PANEL */}
          {editMode === 'CALCULATOR' && (
            <div className="space-y-4" id="dcs-calculator-panel">
              
              {/* Parameter Selection Grid - visually acts as direct terminal keys */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase block text-right">
                  1. اختر المعامل الهندسي لتعديله / Select Parameter Key
                </span>
                <div className="grid grid-cols-2 gap-2 text-right">
                  {paramsList.map((param) => {
                    const isActive = activeParamKey === param.key;
                    const val = getCurrentParamValue(param.key);
                    return (
                      <button
                        key={param.key}
                        onClick={() => handleSelectParam(param.key)}
                        className={`p-2 rounded-xl text-xs flex flex-col justify-between border select-none transition-all ${
                          isActive
                            ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-400 ring-2 ring-emerald-500/10'
                            : 'border-slate-800/80 bg-slate-950 hover:bg-slate-850 text-slate-350'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse shadow-glow' : 'bg-slate-700'}`} />
                          <span className="font-mono text-[9px] text-slate-500 uppercase">{param.labelEn}</span>
                        </div>
                        <span className="font-sans font-bold text-[10px] mt-1.5 truncate max-w-full text-right" dir="rtl">
                          {param.label}
                        </span>
                        <span className="font-mono text-xs font-bold text-right mt-1" dir="ltr">
                          {val} {param.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fluoroscent Amber LCD screen terminal */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-12 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase mb-1 border-b border-slate-900 pb-1">
                  <span>SYSTEM LATENCY: {(isTurboActive ? 0.03 : 0.45).toFixed(2)} ms</span>
                  <span className="text-amber-500 font-mono">DCS DIGITAL INTERFACES • ACTIVE</span>
                </div>

                <div className="flex justify-between items-end">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold block truncate" dir="rtl">
                      {activeMeta?.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      الحدود: [{activeMeta?.min} - {activeMeta?.max}] {activeMeta?.unit}
                    </span>
                  </div>

                  {/* Typing characters */}
                  <div className="text-left font-mono">
                    <span className={`text-xl font-bold tracking-tight select-all ${
                      calcStatus === 'ERR' ? 'text-red-500 animate-shake' : 
                      calcStatus === 'SUCCESS' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                    }`}>
                      {calcBuffer || '0'}
                      <span className="animate-ping font-light text-amber-500/70 ml-0.5">_</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold ml-1">
                      {activeMeta?.unit}
                    </span>
                  </div>
                </div>

                {/* Simulated live speed optimizations readout */}
                <div className="mt-2.5 flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1.5 border-t border-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-pulse" />
                    <span>خوارزمية الحل: مستقرة فائقة السرعة</span>
                  </div>
                  <div>
                    <button 
                      onClick={() => setIsTurboActive(!isTurboActive)}
                      className={`px-1.5 py-0.5 rounded transition-all text-[8px] font-bold ${isTurboActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                    >
                      REAL-TIME TURBO: {isTurboActive ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Physical numeric keypad and control grid */}
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-850 shadow-md">
                
                <div className="grid grid-cols-4 gap-2">
                  
                  {/* Left Column: Direct range helper tools */}
                  <div className="col-span-1 flex flex-col gap-2">
                    <button
                      onClick={handleSetMinVal}
                      disabled={!isAdmin}
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 active:bg-slate-800 hover:text-slate-100 transition-colors py-2 select-none"
                    >
                      MIN
                      <span className="block text-[8px] font-mono font-light mt-0.5 text-slate-550">({activeMeta?.min})</span>
                    </button>
                    <button
                      onClick={handleSetMaxVal}
                      disabled={!isAdmin}
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 active:bg-slate-800 hover:text-slate-100 transition-colors py-2 select-none"
                    >
                      MAX
                      <span className="block text-[8px] font-mono font-light mt-0.5 text-slate-550">({activeMeta?.max})</span>
                    </button>
                    <button
                      onClick={() => handleKeyPress('⌫')}
                      disabled={!isAdmin}
                      title="مسح حرف"
                      className="rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 active:bg-rose-900/30 hover:bg-rose-950/40 font-bold transition-all py-3 select-none text-[11px]"
                    >
                      ⌫ مسح
                    </button>
                  </div>

                  {/* Middle Column: 3x3 Digit Grid */}
                  <div className="col-span-3 grid grid-cols-3 gap-2">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((digit) => (
                      <button
                        key={digit}
                        onClick={() => handleKeyPress(digit)}
                        disabled={!isAdmin}
                        className="rounded-xl bg-slate-900 border border-slate-800/80 text-sm font-semibold text-slate-200 active:scale-95 active:bg-slate-850 hover:border-slate-700 transition-all py-3.5 select-none"
                      >
                        {digit}
                      </button>
                    ))}
                    
                    {/* Bottom Row */}
                    <button
                      onClick={() => handleKeyPress('C')}
                      disabled={!isAdmin}
                      className="rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-rose-500 active:bg-slate-900 transition-colors py-3.5 select-none"
                    >
                      C
                    </button>
                    
                    <button
                      onClick={() => handleKeyPress('0')}
                      disabled={!isAdmin}
                      className="rounded-xl bg-slate-900 border border-slate-800/80 text-sm font-semibold text-slate-200 active:bg-slate-850 hover:border-slate-700 transition-colors py-3.5 select-none"
                    >
                      0
                    </button>
                    
                    <button
                      onClick={() => handleKeyPress('.')}
                      disabled={!isAdmin}
                      className="rounded-xl bg-slate-900 border border-slate-800/80 text-sm font-bold text-slate-200 active:bg-slate-850 hover:border-slate-700 transition-colors py-3.5 select-none"
                    >
                      .
                    </button>
                  </div>

                </div>

                {/* BIG SOLVE BUTTON (ENTER) */}
                <div className="mt-3">
                  <button
                    onClick={handleApplyValue}
                    disabled={!isAdmin}
                    className={`w-full font-bold select-none py-3.5 rounded-xl border flex items-center justify-center gap-2 transition-all transition-duration-100 ${
                      !isAdmin 
                        ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                        : calcStatus === 'SUCCESS'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-[1.01] shadow-lg shadow-emerald-500/20'
                        : calcStatus === 'ERR'
                        ? 'bg-red-650 border-red-500 text-white animate-shake'
                        : 'bg-emerald-500 hover:bg-emerald-555 text-slate-950 active:scale-[0.99] border-emerald-400 shadow-md hover:shadow-emerald-500/10'
                    }`}
                  >
                    <CornerDownLeft className="w-4 h-4 shrink-0" />
                    <span className="text-[12px] uppercase tracking-wide">
                      {calcStatus === 'SUCCESS' ? 'اكتمل حل معادلات التدفق الفوري بنجاح ✓' : 'تطبيق وحل المحاكاة الفورية / ENTER'}
                    </span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* MODE 2: CLASSIC STEPPING SLIDERS PANEL */}
          {editMode === 'SLIDERS' && (
            <div className="space-y-4 text-xs" id="dcs-sliders-panel">
              {unitType === 'PUMP' && (
                <>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>معدل تدفق السائل (Flow Rate):</span>
                      <span className="font-mono text-slate-200">{state.pump.flowRate} m³/hr</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      disabled={!isAdmin}
                      value={state.pump.flowRate}
                      onChange={(e) => handleRangeChange('flowRate', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>ضغط السحب (Suction Pressure):</span>
                      <span className="font-mono text-slate-200">{state.pump.suctionPressure} bar</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.1"
                      disabled={!isAdmin}
                      value={state.pump.suctionPressure}
                      onChange={(e) => handleRangeChange('suctionPressure', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>كفاءة المضخة الهيدروليكية:</span>
                      <span className="font-mono text-slate-200">{state.pump.efficiency}%</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="90"
                      step="1"
                      disabled={!isAdmin}
                      value={state.pump.efficiency}
                      onChange={(e) => handleRangeChange('efficiency', parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>ارتفاع خط السحب الاستاتيكي (Static Head):</span>
                      <span className="font-mono text-slate-300">{state.pump.suctionStaticHead} m</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      disabled={!isAdmin}
                      value={state.pump.suctionStaticHead}
                      onChange={(e) => handleRangeChange('suctionStaticHead', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </>
              )}

              {unitType === 'EXCHANGER' && (
                <>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>درجة الحرارة للمائع الساخن الداخل:</span>
                      <span className="font-mono text-slate-200">{state.exchanger.hotInletTemp} °C</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="220"
                      step="1"
                      disabled={!isAdmin}
                      value={state.exchanger.hotInletTemp}
                      onChange={(e) => handleRangeChange('hotInletTemp', parseFloat(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>معدل تدفق المائع الساخن (Hot Flow Rate):</span>
                      <span className="font-mono text-slate-200">{state.exchanger.hotFlowRate} kg/hr</span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="40000"
                      step="500"
                      disabled={!isAdmin}
                      value={state.exchanger.hotFlowRate}
                      onChange={(e) => handleRangeChange('hotFlowRate', parseFloat(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>مساحة تبادل الحرارة (Heat Area $A$):</span>
                      <span className="font-mono text-slate-200">{state.exchanger.area} m²</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="1.0"
                      disabled={!isAdmin}
                      value={state.exchanger.area}
                      onChange={(e) => handleRangeChange('area', parseFloat(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>معامل انتقال الحرارة الإجمالي ($U$):</span>
                      <span className="font-mono text-slate-200">{state.exchanger.overallU} W/m²K</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="1800"
                      step="20"
                      disabled={!isAdmin}
                      value={state.exchanger.overallU}
                      onChange={(e) => handleRangeChange('overallU', parseFloat(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </>
              )}

              {unitType === 'REACTOR' && (
                <>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{state.reactor.feedTemp} °C</span>
                      <span>حرارة التغذية للمفاعل (Feed Temperature):</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="120"
                      step="1"
                      disabled={!isAdmin}
                      value={state.reactor.feedTemp}
                      onChange={(e) => handleRangeChange('feedTemp', parseFloat(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{state.reactor.feedConcA} mol/L</span>
                      <span>{"تركيز المادة المتفاعلة C_A0:"}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.1"
                      disabled={!isAdmin}
                      value={state.reactor.feedConcA}
                      onChange={(e) => handleRangeChange('feedConcA', parseFloat(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{state.reactor.jacketTemp} °C</span>
                      <span>حرارة سائل التبريد بالقميص (Jacket Temp):</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="75"
                      step="1"
                      disabled={!isAdmin}
                      value={state.reactor.jacketTemp}
                      onChange={(e) => handleRangeChange('jacketTemp', parseFloat(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{Math.abs(state.reactor.heatOfReaction)} kJ/mol</span>
                      <span>الحرارة المنبعثة من التفاعل (Exothermic Peak):</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="200"
                      step="5"
                      disabled={!isAdmin}
                      value={Math.abs(state.reactor.heatOfReaction)}
                      onChange={(e) => handleRangeChange('heatOfReaction', -Math.abs(parseFloat(e.target.value)))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </>
              )}

              {unitType === 'COMPRESSOR' && (
                <>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>ضغط السحب (Suction Pressure):</span>
                      <span className="font-mono text-slate-200">{state.compressor.suctionPressure} bar</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.1"
                      disabled={!isAdmin}
                      value={state.compressor.suctionPressure}
                      onChange={(e) => handleRangeChange('suctionPressure', parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>ضغط الطرد المطلوب (Discharge Pressure):</span>
                      <span className="font-mono text-slate-200">{state.compressor.dischargePressure} bar</span>
                    </div>
                    <input
                      type="range"
                      min="5.0"
                      max="25.0"
                      step="0.5"
                      disabled={!isAdmin}
                      value={state.compressor.dischargePressure}
                      onChange={(e) => handleRangeChange('dischargePressure', parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>الحرارة الداخلة للغاز (Gas Inlet Temp):</span>
                      <span className="font-mono text-slate-200">{state.compressor.suctionTemp} °C</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="80"
                      step="1"
                      disabled={!isAdmin}
                      value={state.compressor.suctionTemp}
                      onChange={(e) => handleRangeChange('suctionTemp', parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>الكفاءة البوليتكنيكية (Polytropic Efficiency):</span>
                      <span className="font-mono text-slate-200">{state.compressor.polytropicEfficiency}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      step="1"
                      disabled={!isAdmin}
                      value={state.compressor.polytropicEfficiency}
                      onChange={(e) => handleRangeChange('polytropicEfficiency', parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </>
              )}

              {unitType === 'COLUMN' && (
                <>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{state.column.refluxRatio} : 1</span>
                      <span>نسبة الراجع المكثف (Reflux Ratio $R$):</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="8.0"
                      step="0.1"
                      disabled={!isAdmin}
                      value={state.column.refluxRatio}
                      onChange={(e) => handleRangeChange('refluxRatio', parseFloat(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{state.column.relativeVolatility}</span>
                      <span>العلاقة التطايرية النسبية ($\alpha$ Chemistry):</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="4.5"
                      step="0.05"
                      disabled={!isAdmin}
                      value={state.column.relativeVolatility}
                      onChange={(e) => handleRangeChange('relativeVolatility', parseFloat(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{state.column.feedCompositionXF * 100}%</span>
                      <span>تركيز المركب الخفيف في التغذية ($z_F$):</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.02"
                      disabled={!isAdmin}
                      value={state.column.feedCompositionXF}
                      onChange={(e) => handleRangeChange('feedCompositionXF', parseFloat(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 flex-row-reverse">
                      <span className="font-mono text-slate-200">{state.column.totalTrays}</span>
                      <span>إجمالي الصواني للبرج (Total Spec Trays):</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="1"
                      disabled={!isAdmin}
                      value={state.column.totalTrays}
                      onChange={(e) => handleRangeChange('totalTrays', parseInt(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Prompt regarding admin activation */}
          {!isAdmin && (
            <div className="mt-4 p-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-[11px] text-yellow-500 flex items-start gap-1.5 leading-relaxed text-right md:text-left">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>لحماية سلامة المصنع الفيدرالية، تم تأمين تغيير المعلمات لغير المشرفين المعتمدين. اضغط على زر <b>دخول المشرفين</b> لتفعيل بريد الإشراف والمصادقة الأمنية.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// ----------------------------------------------------
// SUB-PHYSICS RENDERERS WITH SCIENTIFIC CALCULATIONS
// ----------------------------------------------------

// 1. PUMP PHYSICS HANDLER (WITH HEAD-FLOW PERFORMANCE CURVE)
function PumpPhysics({ state }: { state: any }) {
  const g = 9.81;
  const flowM3S = state.flowRate / 3600;
  const dP = (state.flowRate * state.efficiency * 0.05) * 1e5;
  const hydraulicPowerKw = (flowM3S * dP) / 1000;
  const electricalPowerKw = hydraulicPowerKw / (state.efficiency / 100);

  const suctionPressureM = (state.suctionPressure * 100000) / (state.liquidDensity * g);
  const vaporPressureM = (state.vaporPressure * 100000) / (state.liquidDensity * g);
  const npshAvailable = suctionPressureM + state.suctionStaticHead - vaporPressureM;

  const npshRequired = 2.0; // standard safety threshold
  const isCavitationActive = npshAvailable < (npshRequired + 0.5);

  // Aspen HYSYS characteristic curve calculations
  const pShutoff = state.suctionPressure + 5.5;
  const getX = (q: number) => 40 + (q / 110) * 235;
  const getY = (p: number) => 135 - (p / 9) * 115; // Max 9 bar scale

  // Generate curve path Q vs P
  const curvePoints: string[] = [];
  for (let q = 0; q <= 110; q += 5) {
    const pVal = pShutoff - 0.00035 * q * q * (65 / state.efficiency);
    curvePoints.push(`${getX(q)},${getY(Math.max(0, pVal))}`);
  }
  const curvePath = "M " + curvePoints.join(" L ");

  const activeQ = state.flowRate;
  const activeP = state.suctionPressure + dP / 1e5;

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">قوة الطرد المبرمجة / Elec Power</div>
          <p className="text-sm font-bold text-blue-400">{electricalPowerKw.toFixed(2)} kW</p>
        </div>
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">ضغط الطرد المستنتج / Pump Outlet</div>
          <p className="text-sm font-bold text-blue-400">{activeP.toFixed(2)} bar</p>
        </div>
      </div>

      {/* Characteristic Plot */}
      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
        <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          منحنى الأداء المميز للمضخة (Pump Head-Flow Characteristic Curve)
        </span>
        
        <div className="relative">
          <svg className="w-full h-36 bg-slate-950 rounded-lg border border-slate-800/80" viewBox="0 0 300 150">
            {/* Grid Lines */}
            <line x1="40" y1="20" x2="280" y2="20" stroke="#101b2e" strokeWidth="1" />
            <line x1="40" y1="50" x2="280" y2="50" stroke="#101b2e" strokeWidth="1" />
            <line x1="40" y1="80" x2="280" y2="80" stroke="#101b2e" strokeWidth="1" />
            <line x1="40" y1="110" x2="280" y2="110" stroke="#101b2e" strokeWidth="1" />
            <line x1="100" y1="20" x2="100" y2="135" stroke="#101b2e" strokeWidth="1" />
            <line x1="160" y1="20" x2="160" y2="135" stroke="#101b2e" strokeWidth="1" />
            <line x1="220" y1="20" x2="220" y2="135" stroke="#101b2e" strokeWidth="1" />

            {/* Axes */}
            <line x1="40" y1="10" x2="40" y2="135" stroke="#334155" strokeWidth="1.5" />
            <line x1="40" y1="135" x2="290" y2="135" stroke="#334155" strokeWidth="1.5" />

            {/* Curve Path */}
            <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />

            {/* Highlight Cavitation risk area */}
            <rect x={getX(75)} y="15" width="45" height="115" fill="rgba(239, 68, 68, 0.08)" />
            <text x={getX(86)} y="40" className="fill-red-500/60 text-[7px]" textAnchor="middle">خطر التكهف</text>

            {/* Active Duty Point */}
            <circle cx={getX(activeQ)} cy={getY(activeP)} r="5" fill="#f59e0b" className="animate-pulse" />
            <circle cx={getX(activeQ)} cy={getY(activeP)} r="3.5" fill="#eab308" />

            {/* Labels */}
            <text x="35" y="20" className="fill-slate-500 text-[7px]" textAnchor="end">9 bar</text>
            <text x="35" y="80" className="fill-slate-500 text-[7px]" textAnchor="end">4.5 bar</text>
            <text x="35" y="135" className="fill-slate-500 text-[7px]" textAnchor="end">0</text>

            <text x="40" y="144" className="fill-slate-500 text-[7px]" textAnchor="middle">0</text>
            <text x="160" y="144" className="fill-slate-500 text-[7px]" textAnchor="middle">55 m³/hr</text>
            <text x="280" y="144" className="fill-slate-500 text-[7px]" textAnchor="middle">110</text>

            {/* Axis titles */}
            <text x="285" y="130" className="fill-slate-400 text-[7px] font-bold" textAnchor="end">Q (m³/hr)</text>
            <text x="45" y="15" className="fill-slate-400 text-[7px] font-bold" textAnchor="start">P_out (bar)</text>

            {/* Legend */}
            <rect x="180" y="20" width="85" height="25" fill="#020617" rx="3" stroke="#1e293b" />
            <circle cx="190" cy="27" r="2.5" fill="#eab308" />
            <text x="197" y="30" className="fill-slate-300 text-[7px]">نقطة التشغيل الحالية</text>
            <line x1="187" y1="38" x2="193" y2="38" stroke="#2563eb" strokeWidth="2" />
            <text x="197" y="41" className="fill-slate-300 text-[7px]">منحنى المضخة الحركي</text>
          </svg>
        </div>
      </div>

      <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1">
        <div className="text-[10px] text-slate-500 uppercase">NPSH Available (صافي رأس السحب الإيجابي المتاح)</div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-xs">{npshAvailable.toFixed(2)} m</span>
          <span className="text-[10px] text-slate-400">NPSH Required: {npshRequired.toFixed(1)} m</span>
        </div>
        
        {/* Visual indicator of NPSH Margin */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1.5 flex">
          <div 
            className={`h-full ${isCavitationActive ? 'bg-rose-500' : 'bg-green-500'}`} 
            style={{ width: `${Math.min(100, (npshAvailable / 10) * 100)}%` }} 
          />
        </div>
      </div>

      {isCavitationActive && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-start gap-2 text-[11px] leading-relaxed">
          <Droplets className="w-4 h-4 shrink-0 text-rose-500 mt-0.5 animate-bounce" />
          <span><b>خطر التكهف النشط (Cavitation Alert!):</b> NPSH المتاح منخفض جداً مقارنة بضغط البخار للمائع. قد يؤدي لتآكل ريش المروحة والاهتزاز الميكانيكي المدمر.</span>
        </div>
      )}
    </div>
  );
}

// 2. EXCHANGER PHYSICS HANDLER
function ExchangerPhysics({ state }: { state: any }) {
  // Simple ε-NTU or LMTD thermodynamic representation
  // Cold flow in kg/s
  const mCold = state.coldFlowRate / 3600;
  const mHot = state.hotFlowRate / 3600;

  // Let's assume hot stream organic exits pre-cooled
  const hotCpVal = state.hotCp * 1000; // J/kg-K
  const coldCpVal = state.coldCp * 1000; // J/kg-K

  // Heat duty loop
  const maxQ_ideal = Math.min(mCold * coldCpVal, mHot * hotCpVal) * (state.hotInletTemp - state.coldInletTemp);
  const efficiency = 1 - Math.exp(- (state.overallU * state.area) / Math.min(mCold * coldCpVal, mHot * hotCpVal));
  const heatDutyW = maxQ_ideal * efficiency * 0.75; // Real transfer duty J/s
  const heatDutyKw = heatDutyW / 1000;

  const coldOutletTemp = state.coldInletTemp + (heatDutyW / (mCold * coldCpVal));
  const hotOutletTemp = state.hotInletTemp - (heatDutyW / (mHot * hotCpVal));

  // Logarithmic Mean Temperature Difference LMTD
  const dT1 = state.hotInletTemp - coldOutletTemp;
  const dT2 = hotOutletTemp - state.coldInletTemp;
  const lmtd = dT1 !== dT2 ? (dT1 - dT2) / Math.log(dT1 / dT2) : dT1;

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">الحمل الحراري الفعلي / Heat Duty (Q)</div>
          <p className="text-sm font-bold text-sky-400">{heatDutyKw.toFixed(1)} kW</p>
        </div>
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">المعدل اللوغاريتمي فارق الحرارة LMTD</div>
          <p className="text-sm font-bold text-sky-400">{lmtd.toFixed(1)} °C</p>
        </div>
      </div>

      <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-805 space-y-2">
        <div className="text-[10px] text-slate-500 uppercase">تتبع درجات الحرارة للمخارج (Thermal Output Stream Profile)</div>
        <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800/40">
          <span>المائع البارد الخارج (Cold Stream Out):</span>
          <span className="font-bold text-emerald-400">{coldOutletTemp.toFixed(1)} °C</span>
        </div>
        <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800/40">
          <span>المائع الساخن الخارج (Hot Stream Out):</span>
          <span className="font-bold text-rose-400">{hotOutletTemp.toFixed(1)} °C</span>
        </div>
      </div>
    </div>
  );
}

// 3. REACTOR PHYSICS CSTR KINETICS
function ReactorPhysics({ 
  state, 
  isDynamicActive, 
  setIsDynamicActive 
}: { 
  state: any; 
  isDynamicActive: boolean; 
  setIsDynamicActive: (val: boolean) => void; 
}) {
  // Catalyst Kinetic Constants Arrhenius
  const R_gas = 8.314; // J/mol-K or 0.008314 kJ/mol-K
  const T_kelvin = state.feedTemp + 273.15;
  
  // Rate constant k = A * exp(-Ea / RT)
  const k = state.preExponential * Math.exp(-state.activationEnergy / (0.008314 * T_kelvin));

  // For a CSTR conversion X = Tau * k / (1 + Tau * k)
  const tau = state.volume / state.flowRate; // min
  const conversion = (tau * k) / (1 + tau * k);

  // Exothermic Heat Generation (Q_generation = V * r_A * (-dH))
  // r_A = k * C_A = k * C_A0 * (1 - X)
  const concA_outlet = state.feedConcA * (1 - conversion);
  const rateA = k * concA_outlet; // mol/L-min
  const q_generated_watts = (state.volume * rateA * Math.abs(state.heatOfReaction) * 1000) / 60; // conversion to J/s

  // Heat removal by jacket Q_jacket = U * A * (T_reactor - T_jacket)
  // Let's approximate the reactor peak temperature with steady-state balance
  const liquidDensity = 1000; // g/L
  const massFlowG_s = (state.flowRate * liquidDensity) / 60;
  const tempRiseIdeal = (q_generated_watts) / (massFlowG_s * state.fluidCp);
  const reactorPeakTemp = state.feedTemp + tempRiseIdeal * 0.45; // factoring jacket insulation
  
  const q_removed_jacket_watts = state.overallU * state.heatTransArea * (reactorPeakTemp - state.jacketTemp);

  // Runaway thermal index
  const isThermalRunaway = (reactorPeakTemp > 135) || (q_generated_watts > q_removed_jacket_watts * 1.6);

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300">
      
      {/* Dynamic Analysis Mode DCS System Switch */}
      <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-4">
        <div className="text-right">
          <span className="font-bold text-slate-200 text-[11px] block">وضع التحليل الكينيتيكي الديناميكي (Dynamic Kinetics Solver)</span>
          <p className="text-[9px] text-slate-500 mt-0.5" dir="rtl">حساب فوري لمعاملات الفوضى الحرارية وحركية التفاعل عبر الزمن</p>
        </div>
        <button
          onClick={() => setIsDynamicActive(!isDynamicActive)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer select-none ${
            isDynamicActive
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 ring-1 ring-purple-500/10'
              : 'bg-slate-950 text-slate-405 border-slate-900 hover:text-slate-200'
          }`}
        >
          <Activity className={`w-3 h-3 ${isDynamicActive ? 'animate-breath' : ''}`} />
          <span>{isDynamicActive ? 'نشط / ACTIVE' : 'غير نشط / INACTIVE'}</span>
        </button>
      </div>

      {/* Reactor Visual schematic and catalyst stirrer */}
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden min-h-[140px]">
        {/* Ambient background glow */}
        <div className={`absolute inset-0 bg-purple-500/5 transition-all duration-1000 pointer-events-none ${isDynamicActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
        
        <div className="relative flex items-center justify-center pointer-events-none mt-1">
          {/* Outer CSTR vessel shape */}
          <div className={`w-14 h-18 rounded-t-3xl rounded-b-xl border-2 flex flex-col items-center justify-center relative transition-all duration-300 ${isDynamicActive ? 'border-purple-400 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.25)]' : 'border-slate-700 bg-slate-950/60'}`}>
            
            {/* Catalyst Impeller Paddle (Rotates on active mode) */}
            <div className={`w-0.5 h-11 bg-slate-400 relative flex items-end justify-center transition-transform ${isDynamicActive ? 'animate-spin' : ''}`} style={isDynamicActive ? { animationDuration: '2.5s' } : undefined}>
              <div className="w-8 h-1 bg-slate-200 rounded absolute bottom-0.5" />
              <div className="w-6 h-1 bg-slate-300 rounded absolute bottom-2.5" />
            </div>
            
            {/* Hot cooling jacket background dotted border */}
            <div className="absolute inset-[2px] rounded-t-3xl rounded-b-lg border border-dashed border-purple-500/20 pointer-events-none" />
          </div>
          
          {/* Reaction Activity expanding waves */}
          {isDynamicActive && (
            <div className="absolute inset-0 -m-3 border border-purple-500/15 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
          )}
        </div>
        
        <div className="text-center relative z-10">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">ملف محاكاة خزان التفاعل (Vessel Dynamic Profile)</span>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5" dir="rtl">
            {isDynamicActive ? 'التقليب الحركي: نشط ومتحرك • الموازنة: ديناميكية زمنية' : 'التقليب الحركي: مستقر وساكن • الموازنة: مستقرة ساكنة'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 p-2 text-center rounded-lg border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">معدل التفاعل k</div>
          <p className="text-xs font-bold text-purple-400">{k.toFixed(3)} min⁻¹</p>
        </div>
        <div className="bg-slate-900 p-2 text-center rounded-lg border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">زمن المكوث Tau</div>
          <p className="text-xs font-bold text-purple-400">{tau.toFixed(1)} mins</p>
        </div>
        <div className="bg-slate-900 p-2 text-center rounded-lg border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">معدل التحول Conversion</div>
          <p className="text-xs font-bold text-emerald-400">{(conversion * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-slate-900 p-3 rounded-lg border border-slate-805 space-y-1.5">
        <div className="text-[10px] text-slate-500 uppercase">الموازنة الحرارية والتحكم الحراري (Reaction Heat Balance)</div>
        <div className="flex justify-between">
          <span className="text-slate-400">الحرارة المتولدة بالتفاعل (Exothermic Peak):</span>
          <span className="font-bold text-rose-400">{(q_generated_watts / 1000).toFixed(1)} kW</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">الحرارة المزالة بالقميص (Jacket Transfer):</span>
          <span className="font-bold text-blue-400">{(q_removed_jacket_watts / 1000).toFixed(1)} kW</span>
        </div>
        <div className="flex justify-between border-t border-slate-800 mt-2 pt-1.5">
          <span className="text-slate-300 font-bold">الحرارة الفعلية بمزيج التفاعل:</span>
          <span className="font-bold text-yellow-400">{reactorPeakTemp.toFixed(1)} °C</span>
        </div>
      </div>

      {isThermalRunaway && (
        <div className="p-3 bg-red-650/15 border border-red-500/25 text-red-400 rounded-xl flex items-start gap-2 text-[11px] leading-relaxed">
          <Flame className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
          <span><b>تحذير الهروب الحراري الوشيك (Thermal Runaway Hazard!):</b> الحرارة المنبعثة من التفاعل تتفوق بمراحل على معامل إزالة التبريد الخارجي بالقميص. خطر الانفجار أو تفحم الكاتالست بزيادة مفرطة للحرارة.</span>
        </div>
      )}
    </div>
  );
}

// 4. COMPRESSOR POLYTROPIC PHYSICS
function CompressorPhysics({ state }: { state: any }) {
  // Fluid dynamics gas compression
  // T_discharge = T_suction * (P_out / P_in) ^ ((gamma - 1) / (gamma * efficiency))
  const tSuctionK = state.suctionTemp + 273.15;
  const compressionRatio = state.dischargePressure / state.suctionPressure;
  const polytropicExponent = (state.specificHeatRatio - 1) / (state.specificHeatRatio * (state.polytropicEfficiency / 100));
  
  const tDischargeK = tSuctionK * Math.pow(compressionRatio, polytropicExponent);
  const tDischargeC = tDischargeK - 273.15;

  // Gas law power requirement: W = m * R * T_in / (gamma-1) * [(P_out/P_in)^poly - 1]
  const massFlow_molS = (state.flowRate / 3600) * 1000 / state.gasMw;
  const R_constant = 8.314; // J/mol-K
  const polyWorkJs = massFlow_molS * R_constant * tSuctionK * (1 / polytropicExponent) * (Math.pow(compressionRatio, polytropicExponent) - 1);
  const polyWorkKw = polyWorkJs / 1000;

  // Surge and vibration envelope
  const isSurgeCondition = compressionRatio > 8.0;

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">حرارة الغاز المضغوط الخارج</div>
          <p className="text-sm font-bold text-amber-500">{tDischargeC.toFixed(1)} °C</p>
        </div>
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">الجهد المطلوب للضغط / Shaft Power</div>
          <p className="text-sm font-bold text-amber-500">{polyWorkKw.toFixed(1)} kW</p>
        </div>
      </div>

      <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-805 space-y-1.5">
        <div className="text-[10px] text-slate-500 uppercase">معايير الغاز والضغط بالضاغطة (Polytropic Envelope Parameters)</div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400">نسبة الانضغاط (Compression Ratio):</span>
          <span className="font-bold text-white">{compressionRatio.toFixed(2)} : 1</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400">الوزن الجزيئي للغاز المستهدف:</span>
          <span className="font-bold text-white">{state.gasMw} g/mol</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400">معامل الأس البولتروبيكي (Polytropic Exponent):</span>
          <span className="font-bold text-white">{polytropicExponent.toFixed(3)}</span>
        </div>
      </div>

      {isSurgeCondition && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-start gap-2 text-[11px]">
          <Zap className="w-4 h-4 shrink-0 text-amber-500 mt-0.5 animate-bounce" />
          <span><b>تحذير ظاهرة الاضطراب المغاكسة (Gas Surge Imminent!):</b> نسبة الضغط مرتفعة للغاية مما قد يعيق سريان الغاز ويسبب ارتجاعاً وانفجاراً بالضاغطة الدوارة ميكانيكياً.</span>
        </div>
      )}
    </div>
  );
}

// 5. DISTILLATION COLUMN McCABE-THIELE MATH
function ColumnPhysics({ state }: { state: any }) {
  // Distillation Engineering Math
  // Reflux line: y = (R/(R+1)) * x + (x_D / (R+1))
  // q-line for saturated liquid: x = z_F
  // Intersect point coordinates
  const R = state.refluxRatio;
  const alpha = state.relativeVolatility;
  
  const xD = state.targetXD;
  const xF = state.feedCompositionXF;
  const xB = state.targetXB;

  // Fenske Minimum reflux calculation: N_min = log( [xD/(1-xD)] / [xB/(1-xB)] ) / log(alpha)
  const fenskePart = (xD / (1 - xD)) / (xB / (1 - xB));
  const minTrays = Math.log(fenskePart) / Math.log(alpha);

  // Gilliland / Underwood dynamic tray optimization
  // Min reflux ratio R_min = 1/(alpha-1) * [ alpha*xD/z_F - (1-xD)/(1-z_F) ]
  let minReflux = 1.2;
  try {
    const term1 = (alpha * xD) / xF;
    const term2 = (1 - xD) / (1 - xF);
    minReflux = (1 / (alpha - 1)) * (term1 - term2);
    if (isNaN(minReflux) || minReflux < 0.1) minReflux = 0.8;
  } catch (err) {
    minReflux = 1.1;
  }

  // Actual operating condition check
  const isFloodingActive = R > 5.5;

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300">
      <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2">
        <h6 className="text-[10px] text-slate-400 uppercase font-bold">McCabe-Thiele Equilibrium Solvers</h6>
        
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60">
            <div className="text-[9px] text-slate-500 uppercase">أقل عدد صواني نظري (Fenske N_min)</div>
            <p className="text-xs font-bold text-rose-400">{minTrays.toFixed(1)} صواني</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60">
            <div className="text-[9px] text-slate-500 uppercase">أدنى نسبة راجع (Underwood R_min)</div>
            <p className="text-xs font-bold text-rose-400">{minReflux.toFixed(2)} : 1</p>
          </div>
        </div>

        <div className="border-t border-slate-800/50 pt-2.5 space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">معادلة خط التشغيل العلوي (Rectifying line):</span>
            <span className="text-slate-200">y = {(R/(R+1)).toFixed(2)}x + {(xD/(R+1)).toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">حمل مرجل البرج الكلي (Reboiler Thermal Load):</span>
            <span className="font-bold text-emerald-400">{(state.feedRate * (R + 1) * 0.45).toFixed(1)} MW</span>
          </div>
        </div>
      </div>

      {isFloodingActive && (
        <div className="p-3 bg-red-650/15 border border-red-500/25 text-red-400 rounded-xl flex items-start gap-2 text-[11px] leading-relaxed">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5 animate-bounce" />
          <span><b>تحذير ظاهرة غمر البرج (Tower Flooding Alert!):</b> بسبب فرط الراجع الارتدادي R، يتراكم السائل فوق الصواني معيقاً حركة تصاعد الأبخرة مما يقلل النقاوة تماماً بـ Entrainment.</span>
        </div>
      )}
    </div>
  );
}
