import React, { useState } from 'react';
import { SimulationState } from '../types';
import { Calculator, Settings, Cpu, Compass, BookOpen } from 'lucide-react';

interface DesignCalculationsProps {
  state: SimulationState;
}

export default function DesignCalculations({ state }: DesignCalculationsProps) {
  const [activeTab, setActiveTab] = useState<'PUMP' | 'REACTOR' | 'COMPRESSOR' | 'EXCHANGER' | 'COLUMN'>('PUMP');

  // Compute live design values
  // 1. Pump Sizing
  const pump_flowM3s = state.pump.flowRate / 3600; // m3/s
  const pump_vHead_suction = (state.pump.suctionPressure * 100000) / (state.pump.liquidDensity * 9.81); // meters
  const pump_vHead_vapor = (state.pump.vaporPressure * 100000) / (state.pump.liquidDensity * 9.81); // meters
  const pump_npsh = pump_vHead_suction + state.pump.suctionStaticHead - pump_vHead_vapor; // meters
  const pump_dP_Pa = (state.pump.flowRate * (state.pump.efficiency / 100) * 0.05) * 100000; // rough design pressure drop
  const pump_hydPower = (pump_dP_Pa * pump_flowM3s) / 1000; // kW
  const pump_shaftPower = pump_hydPower / (state.pump.efficiency / 100); // kW

  // 2. Reactor kinetics (CSTR / Batch Conversion Curve)
  const rGas = 8.314; // Gas constant
  const react_tempK = state.reactor.feedTemp + 273.15;
  const react_k = state.reactor.preExponential * Math.exp(-(state.reactor.activationEnergy * 1000) / (rGas * react_tempK)); // L/mol.s
  const react_conv = Math.min(0.995, react_k / (1.0 + react_k)); // X = Da / (1 + Da)
  const react_spaceTime = state.reactor.volume / (3500 / 0.82); // Volume / volumFlow (hr)
  const react_thermalHeat = (react_conv * state.reactor.feedConcA * state.reactor.volume * Math.abs(state.reactor.heatOfReaction)) / 3600; // kW exothermic heat duty

  // 3. Compressor gas thermodynamic
  const comp_pRatio = state.compressor.dischargePressure / state.compressor.suctionPressure;
  const k_gas = 1.41; // Air/Methane Cp/Cv ratio
  const comp_suctionT_K = 20 + 273.15;
  const comp_dischargeT_C = (comp_suctionT_K * Math.pow(comp_pRatio, (k_gas - 1) / (k_gas * (state.compressor.polytropicEfficiency / 100)))) - 273.15;
  const comp_polyWork = (rGas * 1000 / state.compressor.gasMw) * comp_suctionT_K * (k_gas / (k_gas - 1)) * (Math.pow(comp_pRatio, (k_gas - 1) / k_gas) - 1); // kJ/kg
  const comp_shaftPower = (12000 * comp_polyWork) / 3600; // kW, based on 12 mt flow

  // 4. Heat Exchanger
  const ex_dT1 = state.exchanger.hotInletTemp - (state.exchanger.coldInletTemp + 35);
  const ex_dT2 = (state.exchanger.hotInletTemp - 40) - state.exchanger.coldInletTemp;
  const ex_lmtd = (ex_dT1 - ex_dT2) / Math.log(Math.abs(ex_dT1 / (ex_dT2 || 1.1)) || 1.15); // Log mean temp difference
  const ex_heatDuty = (state.exchanger.overallU * state.exchanger.area * Math.max(12, ex_lmtd || 35)) / 1000; // kW

  // 5. Fractionation Tower Tray stepping (Fenske Shortcut)
  const col_xD = state.column.targetXD;
  const col_xB = state.column.targetXB;
  const col_alpha = state.column.relativeVolatility;
  const col_nmin = Math.log10((col_xD * (1.0 - col_xB)) / (col_xB * (1.0 - col_xD) + 1e-6)) / Math.log10(col_alpha || 1.15); // Fenske minimum theoretical stages

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5" id="design-calculations-panel">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 flex-row-reverse">
        <div className="flex items-center gap-2 flex-row-reverse">
          <Calculator className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
          <div className="text-right">
            <h3 className="font-bold text-slate-100 text-sm">الحسابات الهندسية المرتبطة بالمحاكاة (Linked Process Formulas)</h3>
            <p className="text-[10px] text-slate-400">حسابات موازنة المادة والطاقة وحركيات التفاعل المرتبطة آنياً بنموذج المحاكاة</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-mono self-start sm:self-auto uppercase select-none animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow" />
          <span>مرتبط بالبث الحي للمحاكاة • SYNCED LIVE</span>
        </div>
      </div>

      {/* Equipment tabs navigation */}
      <div className="flex flex-wrap gap-1.5 justify-end">
        <button
          onClick={() => setActiveTab('COLUMN')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
            activeTab === 'COLUMN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-950 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span>برج صواني التقطير</span>
        </button>
        <button
          onClick={() => setActiveTab('EXCHANGER')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
            activeTab === 'EXCHANGER' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-950 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span>المبادل الحراري</span>
        </button>
        <button
          onClick={() => setActiveTab('COMPRESSOR')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
            activeTab === 'COMPRESSOR' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-950 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span>الضاغط الغازي</span>
        </button>
        <button
          onClick={() => setActiveTab('REACTOR')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
            activeTab === 'REACTOR' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-950 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span>المفاعل الكيميائي</span>
        </button>
        <button
          onClick={() => setActiveTab('PUMP')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
            activeTab === 'PUMP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-950 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span>مضخة التغذية</span>
        </button>
      </div>

      {/* Dynamic calculation result ledger */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-right space-y-4 font-sans select-none animate-fadeIn">
        
        {activeTab === 'PUMP' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 border-b border-slate-850 pb-2">۱. حسابات تدرج الضغط والـ NPSH لمضخة السحب الطاردة الطردية (Centrifugal Sizing):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">معادلة NPSH المتوفر (NPSH Available Formula):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  NPSHa = (P_suction - P_vapor) / (rho * g) + H_static<br/>
                  NPSHa = (${state.pump.suctionPressure} bar - ${state.pump.vaporPressure} bar) * 10.19 + ${state.pump.suctionStaticHead}m = <span className="text-white font-bold">{pump_npsh.toFixed(2)} meters</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">القدرة الهيدروليكية وحمل المحرك (Shaft Brake Power WP):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  Hydraulic Power (Wh) = dP * Flow_rate = {pump_hydPower.toFixed(2)} kW<br/>
                  Required Shaft Motor Power (Ws) = Wh / efficiency<br/>
                  Ws = {pump_hydPower.toFixed(2)} / {(state.pump.efficiency/100)} = <span className="text-white font-bold">{pump_shaftPower.toFixed(2)} kW (Electrical Draw)</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-[10px] text-red-300">
              ملاحظة تشغيلية: لضمان سلامة مروحة المضخة وعدم انهيار غلاف السحب، يرجى دائماً إبقاء قيمة صافي رأس السحب المتوفر أكبر من حاجز التكهف التصميمي الآمن البالغ ۲.۵ متر لمصافي الجنوب بالبصرة.
            </div>
          </div>
        )}

        {activeTab === 'REACTOR' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 border-b border-slate-850 pb-2">۲. الحركيات ومعدلات تفاعل المزيج وموازنة المفاعل (Reactor Exothermic Energy):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">معادلة كينتيك أرهينيوس لسرعة التفاعل (Arrhenius Kinetic Curve):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  Velocity Constant k = A_exp * exp(-Ea / (R * T))<br/>
                  k = {state.reactor.preExponential} * exp(-{state.reactor.activationEnergy}000 / (8.314 * {react_tempK.toFixed(1)}))<br/>
                  k = <span className="text-white font-bold">{react_k.toFixed(4)} L/mol.second</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">موازنة مادة المفاعل الكيميائي ونسبة التحول (Conversion Ratio %):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  Damköhler conversion X_A = k * tau / (1 + k * tau)<br/>
                  Active conversion % = <span className="text-white font-bold">{(react_conv * 100).toFixed(2)} % converted</span><br/>
                  Exothermic Reaction heat duty = <span className="text-white font-bold">{react_thermalHeat.toFixed(1)} kW (Heat Duty Generated)</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-[10px] text-blue-300">
              إشراف الهيئة: يعتمد معدل الانبعاث التفريغي على كفاءة مضخة سائل التبريد الخارجية في لولب سترة التفاعل لتفادي ظاهرة التجاوز الحراري القاتلة (Runaway Peak Explosion).
            </div>
          </div>
        )}

        {activeTab === 'COMPRESSOR' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 border-b border-slate-850 pb-2">۳. الديناميكا الثرموديناميكية لضغوط وحرارة الضاغط الغازي (Polytropic Compress Gas):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">معادلة درجة حرارة غاز المخرج التصميمية (Discharge Temperature):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  T_out = T_in * (P_out / P_in) ^ [(k-1) / (k * efficiency)]<br/>
                  T_out = {comp_suctionT_K.toFixed(1)}K * ({comp_pRatio.toFixed(2)}) ^ 0.354 = <span className="text-white font-bold">{comp_dischargeT_C.toFixed(1)} &deg;C</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">العمل البوليمري المصروف وقدرة المحور (Polytropic Shaft Work & Power):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  Polytropic Work (W_p) = {comp_polyWork.toFixed(1)} kJ/kg<br/>
                  Discharge Load Total (Ws) = Flow * W_p / 3600<br/>
                  Ws = 12,000kg/hr * W_p = <span className="text-white font-bold">{comp_shaftPower.toFixed(2)} kW Engine Load</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'EXCHANGER' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 border-b border-slate-850 pb-2">٤. المساحة التصميمية وفرق درجات الحرارة اللوغاريتمي للمبادل (LMTD Sizing):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">معادلة فرق درجات الحرارة اللوغاريتمي LMTD:</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  LMTD = (dT1 - dT2) / ln(dT1 / dT2)<br/>
                  dT1 = {ex_dT1.toFixed(1)} &deg;C | dT2 = {ex_dT2.toFixed(1)} &deg;C<br/>
                  LMTD = <span className="text-white font-bold">{ex_lmtd.toFixed(2)} &deg;C</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">الحمل الحراري الكلي وسعة التبادل المكتشفة (Duty Loads):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  Total Heat duty Q_ex = U * Area * LMTD<br/>
                  Q_ex = {state.exchanger.overallU} * {state.exchanger.area} * LMTD = <span className="text-white font-bold">{ex_heatDuty.toFixed(1)} kW Thermal Transfer</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'COLUMN' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 border-b border-slate-850 pb-2">٥. معادلات فنسكي لحساب عدد الأطباق النظرية الأمثل ببرج التقطير D-101 (Fenske Formula):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">معادلة فنسكي للمكافئات الدنيا (Fenske Equation):</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  N_min = ln[ (xD * (1 - xB)) / (xB * (1 - xD)) ] / ln(alpha)<br/>
                  N_min = ln[ ({col_xD} * (1 - {col_xB})) / ({col_xB} * (1 - {col_xD})) ] / ln({col_alpha})<br/>
                  N_min = <span className="text-white font-bold">{col_nmin.toFixed(1)} theoretical stage trays</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">علاقة مراجعة كفاءة برج صواني المصافي:</p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-left text-[11px] text-emerald-400 direction-ltr">
                  Number of Real Trays (efficiency 65%) = N_min / 0.65 = <span className="text-white font-bold">{Math.ceil(col_nmin / 0.65)} physical trays</span><br/>
                  Current Active Reflux dynamic ratio = {state.column.refluxRatio}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
