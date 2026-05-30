import React, { useState, useEffect } from 'react';
import { FSNode, FSStream } from '../types';
import { Save, FolderOpen, Trash2, Clock, CheckCircle } from 'lucide-react';

interface ProjectHistoryProps {
  nodes: FSNode[];
  streams: FSStream[];
  onLoadProject: (nodes: FSNode[], streams: FSStream[]) => void;
}

interface SavedSim {
  id: string;
  name: string;
  timestamp: string;
  nodes: FSNode[];
  streams: FSStream[];
}

export default function ProjectHistory({ nodes, streams, onLoadProject }: ProjectHistoryProps) {
  const [saveName, setSaveName] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedSim[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const listRaw = localStorage.getItem('chemsim_saved_simulations');
    if (listRaw) {
      try {
        setSavedProjects(JSON.parse(listRaw));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Set some beautiful default preset history items representing prior calculations
      const defaultHistory: SavedSim[] = [
        {
          id: 'preset_hist_1',
          name: 'المخطط المتكامل لمجمع تكرير الشعيبة - وحدة الهدرجة',
          timestamp: '2026/05/28, 11:24:15 ص',
          nodes: [
            { id: 'node_tank_1', type: 'TANK', label: 'T-101 (Naphtha Charge)', x: 100, y: 150, params: { volume: 5000, suctionPressure: 1.0 } },
            { id: 'node_pump_1', type: 'PUMP', label: 'P-101 (Charge Pump)', x: 300, y: 150, params: { efficiency: 75, suctionPressure: 1.0, flowRate: 45, liquidDensity: 820, vaporPressure: 0.35, suctionStaticHead: 4.5 } }
          ],
          streams: [
            { id: 'str_1', name: 'S-01', fromNode: 'node_tank_1', toNode: 'node_pump_1', temperature: 25.0, pressure: 1.0, flowRate: 3500.0, composition: { Water: 0.1, Ethanol: 0.9 } }
          ]
        },
        {
          id: 'preset_hist_2',
          name: 'دراسة محاكاة حركية تفاعل CSTR لمصنع الأسمدة بالبصرة',
          timestamp: '2026/05/27, 03:45:10 م',
          nodes: [
            { id: 'node_reactor_1', type: 'REACTOR', label: 'R-101 (Ammonia Converter)', x: 280, y: 140, params: { volume: 1500, activationEnergy: 58, preExponential: 5e7, heatOfReaction: -92, feedTemp: 30, feedConcA: 2.5, fluidCp: 4.2 } }
          ],
          streams: []
        }
      ];
      localStorage.setItem('chemsim_saved_simulations', JSON.stringify(defaultHistory));
      setSavedProjects(defaultHistory);
    }
  }, []);

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToSave = saveName.trim() || `محاكاة غير معنونة (${new Date().toLocaleDateString()})`;
    
    const newSim: SavedSim = {
      id: 'sim_' + Date.now(),
      name: nameToSave,
      timestamp: new Date().toLocaleString('ar-EG'),
      nodes: JSON.parse(JSON.stringify(nodes)),
      streams: JSON.parse(JSON.stringify(streams))
    };

    const updated = [newSim, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('chemsim_saved_simulations', JSON.stringify(updated));
    setSaveName('');
    
    setSuccessMsg('تم حفظ المحاكاة والعمليات الهندسية الجارية بنجاح في أرشيفك المهني!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteSim = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع من سجل الأرشيف؟')) return;
    
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('chemsim_saved_simulations', JSON.stringify(updated));
  };

  const handleLoadSim = (sim: SavedSim) => {
    onLoadProject(sim.nodes, sim.streams);
    alert(`تم تحميل المشروع: "${sim.name}" بنجاح في لوحة المحاكاة!`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6" id="project-history-panel">
      
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800 flex-row-reverse">
        <Clock className="w-5 h-5 text-blue-400 shrink-0" />
        <div className="text-right">
          <h3 className="font-bold text-slate-100 text-sm">سجل العمليات التاريخية للمهندس (Simulation Archive)</h3>
          <p className="text-[10px] text-slate-400">تابع العمليات السابقة لتعزيز كفاءة التعلم والأرشفة المهنية بالمنصة</p>
        </div>
      </div>

      {/* Save action form */}
      <form onSubmit={handleSaveCurrent} className="space-y-3">
        <label className="block text-[11px] text-slate-300 text-right font-medium">حفظ حالة الفلوشيت والبارامترات الحالية كمسودة:</label>
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="مثال: موازنة برج التكرير الجنوبي T-102..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-xs focus:border-blue-500 outline-none text-right"
          />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-150 flex items-center gap-1 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ العمل</span>
          </button>
        </div>
        {successMsg && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] text-right flex items-center gap-1.5 justify-end">
            <span>{successMsg}</span>
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        )}
      </form>

      {/* List of previously saved runs */}
      <div className="space-y-2">
        <p className="text-[11px] text-slate-400 text-right">أرشيف المحاكاة الخاص بك (Switch Cost Asset):</p>
        {savedProjects.length === 0 ? (
          <div className="bg-slate-950/40 border border-slate-850 p-4 text-center rounded-xl text-xs text-slate-500">
            أرشيفك وسجل عملياتك فارغ حالياً. احفظ مشاريعك لبناء قاعدة بيانات شخصية مخصصة وعالية القيمة.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {savedProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleLoadSim(proj)}
                className="group border border-slate-800/80 hover:border-blue-500/40 bg-slate-950/40 hover:bg-slate-950/80 rounded-xl p-3 text-right cursor-pointer transition select-none flex items-center justify-between gap-3"
              >
                <button
                  onClick={(e) => handleDeleteSim(proj.id, e)}
                  className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition"
                  title="حذف من الأرشيف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-400 transition">
                    {proj.name}
                  </p>
                  <div className="flex items-center gap-3 justify-end text-[10px] text-slate-400">
                    <span>{proj.nodes.length} معدات</span>
                    <span className="text-slate-700">•</span>
                    <span>{proj.streams.length} تيارات</span>
                    <span className="text-slate-700">•</span>
                    <span className="font-mono text-[9px] text-slate-400">{proj.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
