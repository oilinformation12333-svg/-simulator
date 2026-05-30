/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield, Sparkles, Send, Database, ClipboardList, Key, RefreshCcw, CheckCircle, HelpCircle,
  Users, CreditCard, BookOpen, Bell, Plus, Trash2, Mail, ExternalLink, ShieldAlert, Search
} from 'lucide-react';
import { SimulationState, UserAccount, CourseFile } from '../types';
import { appendActivityLog, getActivityLogs, clearActivityLogs, ActivityLogEntry } from '../utils/activityLogger';

interface AdminPanelProps {
  state: SimulationState;
  onOverrideState: (newState: SimulationState) => void;
  adminEmail: string;
  onPromptGemini: (promptText: string) => Promise<string>;
}

export default function AdminPanel({
  state,
  onOverrideState,
  adminEmail,
  onPromptGemini
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<'SIMULATOR' | 'ACCOUNTING' | 'LOGS' | 'COURSES'>('SIMULATOR');

  const [customPrompt, setCustomPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Thermodynamic overrides
  const [customVaporPressure, setCustomVaporPressure] = useState(state.pump.vaporPressure);
  const [customActivationEnergy, setCustomActivationEnergy] = useState(state.reactor.activationEnergy);
  const [customGasMw, setCustomGasMw] = useState(state.compressor.gasMw);
  const [customRelVolatility, setCustomRelVolatility] = useState(state.column.relativeVolatility);

  // Administrative User database (Trial & Subscriptions)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('chemsim_users_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const defaults: UserAccount[] = [
      { email: 'oilinformation12333@gmail.com', role: 'ADMIN', status: 'ACTIVE', subStartDate: '2026-05-15', subExpiryDate: '2027-05-15', trialUsed: true },
      { email: 'alisaifaldeen12@gmail.com', role: 'ADMIN', status: 'ACTIVE', subStartDate: '2026-05-18', subExpiryDate: '2027-05-18', trialUsed: true },
      { email: 'basra.engineer@gasco.iq', role: 'USER', status: 'ACTIVE', subStartDate: '2026-05-20', subExpiryDate: '2026-06-20', trialUsed: true },
      { email: 'hassan_kamil@petro.iq', role: 'USER', status: 'TRIAL', subStartDate: '2026-05-24', subExpiryDate: '2026-05-31', trialUsed: false },
      { email: 'zahraa_alkhafaji@std.edu.iq', role: 'USER', status: 'EXPIRED', subStartDate: '2026-05-01', subExpiryDate: '2026-05-08', trialUsed: true },
    ];
    localStorage.setItem('chemsim_users_db', JSON.stringify(defaults));
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('chemsim_users_db', JSON.stringify(users));
  }, [users]);

  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubRole, setNewSubRole] = useState<'USER' | 'ADMIN'>('USER');

  // Logs state
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [logsSearch, setLogsSearch] = useState('');

  useEffect(() => {
    setLogs(getActivityLogs());
  }, [adminTab]);

  // Interactive course files uploads
  const [courses, setCourses] = useState<CourseFile[]>([
    { id: 'c1', title: 'أساسيات موازنة المادة والطاقة على برنامج Aspen HYSYS V14', fileUrl: '#', uploadedAt: '2026-05-10', viewsCount: 142 },
    { id: 'c2', title: 'تصميم المبادلات الحرارية المتقدم Shell & Tube طبقاً لجمعية TEMA وكتاب بيري', fileUrl: '#', uploadedAt: '2026-05-12', viewsCount: 98 },
    { id: 'c3', title: 'التحكم وحسابات الكفاءة والـ NPSH للمضخات الكيميائية API 610', fileUrl: '#', uploadedAt: '2026-05-20', viewsCount: 220 },
  ]);

  const [newCourseTitle, setNewCourseTitle] = useState('');

  // Mock Notification Alerts
  const [adminNotificationText, setAdminNotificationText] = useState('');

  // Add sub handler
  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail.trim()) return;
    const isExist = users.find(u => u.email.toLowerCase() === newSubEmail.toLowerCase());
    if (isExist) {
      alert('هذا الحساب موجود بالفعل في منصة العمل!');
      return;
    }

    const today = new Date();
    const expiry = new Date();
    // 1-week trial expiration
    expiry.setDate(today.getDate() + 7);

    const newUser: UserAccount = {
      email: newSubEmail,
      role: newSubRole,
      status: 'TRIAL',
      subStartDate: today.toISOString().split('T')[0],
      subExpiryDate: expiry.toISOString().split('T')[0],
      trialUsed: false
    };

    setUsers([newUser, ...users]);
    setNewSubEmail('');
    setStatusMsg(`تم تسجيل الحساب ${newSubEmail} بنجاح تحت فترة تجربة 1 أسبوع!`);
    appendActivityLog(adminEmail, 'LOGIN_SUCCESS', `تنشيط ترخيص تجريبي تجاري جديد لحساب المهندس: ${newSubEmail}`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleToggleUserStatus = (email: string) => {
    let finalStatus = 'ACTIVE';
    setUsers(users.map(u => {
      if (u.email === email) {
        finalStatus = u.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
        return { ...u, status: finalStatus };
      }
      return u;
    }));
    appendActivityLog(adminEmail, finalStatus === 'ACTIVE' ? 'LOGIN_SUCCESS' : 'LOGIN_FAIL', `تعديل حالة ترخيص حساب المهندس ${email} يدوياً إلى: ${finalStatus === 'ACTIVE' ? 'مفعّل نشط ✓' : 'معطّل/منتهي 🛑'}`);
  };

  const handleDeleteUser = (email: string) => {
    if (confirm(`هل أنت متأكد من حذف الحساب ${email} نهائياً؟`)) {
      setUsers(users.filter(u => u.email !== email));
      appendActivityLog(adminEmail, 'LOGIN_FAIL', `حذف ترخيص الحساب ${email} نهائياً بطلب يدوي من المشرف`);
    }
  };

  // Add course handler
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    const item: CourseFile = {
      id: 'c_' + Date.now(),
      title: newCourseTitle,
      fileUrl: '#',
      uploadedAt: new Date().toISOString().split('T')[0],
      viewsCount: 0
    };
    setCourses([...courses, item]);
    setNewCourseTitle('');
    setStatusMsg('تم إضافة الدورة التعليمية الهندسية ومقرر HYSYS بنجاح!');
    appendActivityLog(adminEmail, 'COURSE_UPLOAD', `نشر ملف ومادة تدريبية جديدة بعنوان: "${newCourseTitle.slice(0, 45)}"`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleDeleteCourse = (id: string) => {
    const courseObj = courses.find(c => c.id === id);
    setCourses(courses.filter(c => c.id !== id));
    appendActivityLog(adminEmail, 'LOGIN_FAIL', `حذف وإلغاء نشر المرجع التعليمي: "${courseObj?.title || id}"`);
  };

  // Broadcast mock notify
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNotificationText.trim()) return;
    setStatusMsg(`تم بث الإشعار بنجاح لجميع المشتركين: "${adminNotificationText.slice(0,25)}..."`);
    appendActivityLog(adminEmail, 'ALERT_BROADCAST', `بث رسالة توجيهية عاجلة للطلاب والمهندسين: "${adminNotificationText.slice(0, 50)}..."`);
    setAdminNotificationText('');
    setTimeout(() => setStatusMsg(''), 5000);
  };

  const handleApplyOverrides = () => {
    const newState: SimulationState = {
      ...state,
      pump: {
        ...state.pump,
        vaporPressure: parseFloat(customVaporPressure.toString())
      },
      reactor: {
        ...state.reactor,
        activationEnergy: parseFloat(customActivationEnergy.toString())
      },
      compressor: {
        ...state.compressor,
        gasMw: parseFloat(customGasMw.toString())
      },
      column: {
        ...state.column,
        relativeVolatility: parseFloat(customRelVolatility.toString())
      }
    };
    onOverrideState(newState);
    setStatusMsg('تم تحديث الثوابت الكيميائية الدقيقة وتطبيق النموذج الرياضي بنجاح!');
    appendActivityLog(adminEmail, 'OVERRIDE_CONSTANTS', 'تعديل وتطبيق ثوابت موازنة العمليات الكيميائية الدقيقة (Thermodynamic Mode Overrides)');
    setTimeout(() => setStatusMsg(''), 4500);
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setLoadingAi(true);
    setAiResponse('');
    try {
      const response = await onPromptGemini(customPrompt);
      setAiResponse(response);
    } catch (err: any) {
      setAiResponse(`Failed to trace engine guidelines: ${err.message || err}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleQuickOptimizePrompt = async (unitName: string) => {
    let prompt = `أنت مهندس دكتور خبير في الهندسة الكيميائية وموازنة العمليات ومطور مساعد للمهندس Eng. Ali Saif Aldeen. قم بتحليل معايير التشغيل الحالية للوحدة ${unitName} في محاكاة الهايسس HYSYS واقترح التعديل المناسب لرفع الكفاءة التشغيلية ومنع حدوث التكهف أو التبريد الزائد أو غمر برج التقطير:
    Pump: Suction=${state.pump.suctionPressure} bar, Density=${state.pump.liquidDensity} kg/m3, Static=${state.pump.suctionStaticHead} m, Vapor P=${state.pump.vaporPressure} bar
    Exchanger: ColdIn=${state.exchanger.coldInletTemp}°C, HotIn=${state.exchanger.hotInletTemp}°C, Area=${state.exchanger.area} m2, U=${state.exchanger.overallU} W/m2.K
    Reactor: Feed=${state.reactor.feedTemp}°C, ConcA=${state.reactor.feedConcA} mol/L, Jacket=${state.reactor.jacketTemp}°C, HeatOfReaction=${state.reactor.heatOfReaction} kJ/mol
    Compressor: SuctionP=${state.compressor.suctionPressure} bar, DischargeP=${state.compressor.dischargePressure} bar, Mw=${state.compressor.gasMw} g/mol, Eff=${state.compressor.polytropicEfficiency}%
    Distillation Column: Reflux=${state.column.refluxRatio}, Volatility=${state.column.relativeVolatility}, Trays=${state.column.totalTrays}, FeedConc=${state.column.feedCompositionXF}
    يرجى تقديم رد عالي المستوى وواضح وصارم هندسياً في نقاط scannable باللغة العربية.`;
    
    setCustomPrompt(`دراسة استشارية سريعة لـ ${unitName}`);
    setLoadingAi(true);
    setAiResponse('');
    try {
      const response = await onPromptGemini(prompt);
      setAiResponse(response);
    } catch (err: any) {
      setAiResponse(`Failed to analyze: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6" id="admin-panel-section">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-850 gap-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="font-bold text-slate-100 text-sm">لوحة تنظيم الإدارة وتدقيق المحاكاة (Admin System Dashboard)</h4>
            <p className="text-[11px] text-slate-500 font-mono">
              Authorized System Administrator: {adminEmail} • Secure Terminal Protocol
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded font-bold uppercase tracking-wide self-start sm:self-auto">
          SYSTEM LEVEL 1
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 select-none text-xs">
        <button
          onClick={() => setAdminTab('SIMULATOR')}
          className={`flex-1 font-bold py-2 rounded-lg text-center transition-all ${
            adminTab === 'SIMULATOR' ? 'bg-slate-900 text-emerald-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 inline ml-1.5" />
          <span>الثوابت والمستشار (Thermodynamics & AI)</span>
        </button>
        <button
          onClick={() => setAdminTab('ACCOUNTING')}
          className={`flex-1 font-bold py-2 rounded-lg text-center transition-all ${
            adminTab === 'ACCOUNTING' ? 'bg-slate-900 text-blue-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 inline ml-1.5" />
          <span>إدارة المستخدمين والاشتراكات ($12/mo)</span>
        </button>
        <button
          onClick={() => setAdminTab('LOGS')}
          className={`flex-1 font-bold py-2 rounded-lg text-center transition-all ${
            adminTab === 'LOGS' ? 'bg-slate-900 text-rose-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 inline ml-1.5" />
          <span>سجل النشاط والدخول (Activity Log)</span>
        </button>
        <button
          onClick={() => setAdminTab('COURSES')}
          className={`flex-1 font-bold py-2 rounded-lg text-center transition-all ${
            adminTab === 'COURSES' ? 'bg-slate-900 text-amber-500 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 inline ml-1.5" />
          <span>رفع الدورات والإنذارات (Courses & Alerts)</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-[11px] text-emerald-450 animate-pulse font-mono justify-end">
          <span>{statusMsg}</span>
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
      )}

      {/* RENDER ACTIVE TAB CORES */}
      <div className="pt-2">
        
        {/* TAB 1: MODEL CONSTANTS OVERRIDES + AI */}
        {adminTab === 'SIMULATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            
            {/* Direct override of chemical properties / Antoine constants */}
            <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-850">
              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-start">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>تحديث المعايير الثرموديناميكية الدقيقة (Thermodynamic Core Model Overrides)</span>
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed text-right font-sans">
                التحكم المباشر في ثوابت كيمياء الموائع مثل ضغط التبخر للمائع وطاقة التنشيط للكاتالست لتحديث نتائج المحاكاة في مخططات السريان.
              </p>

              <div className="space-y-3.5 pt-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">ضغط بخار السائل للمضخة (Liquid Vapor Pressure) [bar]:</label>
                  <input
                    type="number" step="0.05" min="0.01" max="5"
                    value={customVaporPressure}
                    onChange={(e) => setCustomVaporPressure(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-205 focus:outline-none focus:border-emerald-500 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">طاقة التنشيط لتفاعل الكاتالست ($E_a$) [kJ/mol]:</label>
                  <input
                    type="number" step="1" min="30" max="150"
                    value={customActivationEnergy}
                    onChange={(e) => setCustomActivationEnergy(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-205 focus:outline-none focus:border-emerald-500 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">الوزن الجزيئي للغاز المدخل بالضاغطة (MW Raw Gas):</label>
                  <input
                    type="number" step="0.1" min="2" max="120"
                    value={customGasMw}
                    onChange={(e) => setCustomGasMw(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-205 focus:outline-none focus:border-emerald-500 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">العلاقة التطايرية النسبية ($\alpha$) لبرج التقطير:</label>
                  <input
                    type="number" step="0.1" min="1.1" max="6"
                    value={customRelVolatility}
                    onChange={(e) => setCustomRelVolatility(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-205 focus:outline-none focus:border-emerald-500 font-mono text-center"
                  />
                </div>

                <button
                  onClick={handleApplyOverrides}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-slate-100 font-bold rounded-lg shadow-lg transition-all outline-none"
                >
                  تطبيق المعايير الجديدة على المحاكاة
                </button>
              </div>
            </div>

            {/* Right Column: AI Engineering diagnostics */}
            <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-start">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>مساعد الهندسة الكيميائية والذكاء الاصطناعي (AI Process Copilot)</span>
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1 text-right font-sans">
                  استشر نموذج الذكاء الاصطناعي Gemini AI كخبير محاكي هايسس مخصص ومستشار للمهندس Eng. Ali Saif Aldeen، لضبط وتحليل ديناميكية تشغيل المنشأة الكيميائية الحالية.
                </p>

                <div className="grid grid-cols-3 gap-1.5 mt-3 select-none">
                  <button
                    onClick={() => handleQuickOptimizePrompt('المفاعل CSTR')}
                    className="p-2 text-center bg-slate-900 hover:bg-slate-800 text-[10px] text-purple-400 border border-purple-500/20 rounded-lg transition-all"
                  >
                    تحسين المفاعل
                  </button>
                  <button
                    onClick={() => handleQuickOptimizePrompt('برج التقطير D-101')}
                    className="p-2 text-center bg-slate-900 hover:bg-slate-800 text-[10px] text-rose-450 border border-rose-500/20 rounded-lg transition-all"
                  >
                    منع غمر البرج
                  </button>
                  <button
                    onClick={() => handleQuickOptimizePrompt('الضاغطة الكباسة C-101')}
                    className="p-2 text-center bg-slate-900 hover:bg-slate-800 text-[10px] text-amber-500 border border-amber-500/20 rounded-lg transition-all"
                  >
                    حساب كسر Surge
                  </button>
                </div>

                <form onSubmit={handleAskAI} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="اسأل مساعد الذكاء الاصطناعي للمحاكاة..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-910 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loadingAi}
                    className="px-3 bg-blue-600 hover:bg-blue-550 text-xs text-white rounded-lg flex items-center justify-center disabled:opacity-40"
                  >
                    {loadingAi ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </form>
              </div>

              <div className="mt-4 flex-1 bg-slate-900 rounded-lg border border-slate-850 p-4 font-mono text-xs overflow-y-auto max-h-[190px]">
                <div className="text-[10px] text-slate-500 mb-2 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                  <span>نتائج موازنة العملية (AI Consultancy Terminal)</span>
                </div>
                
                {loadingAi ? (
                  <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
                    <RefreshCcw className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-[10px] font-sans">برجاء تحضير وقراءة طاقات التثبيط الكيميائي...</span>
                  </div>
                ) : aiResponse ? (
                  <div className="text-slate-205 leading-relaxed text-right font-sans whitespace-pre-wrap select-text">
                    {aiResponse}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-600 font-sans text-xs">
                    انقر على أحد خيارات التحسين السريعة بالأعلى للبدء بالتحليل التلقائي.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE PREMIUM & TRIAL ACCOUNTS MANAGER */}
        {adminTab === 'ACCOUNTING' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Add User block */}
              <div className="md:col-span-1 bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-start">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>تسجيل مستخدم أو تفعيل تجربة جديد</span>
                </h5>
                <p className="text-[10px] text-slate-500 leading-relaxed text-right font-sans">
                  إلحاق المهندسين ومراجعي المحاكاة بفترة التسجيل الاختباري (1 أسبوع trial) لتجربة المنصة، أو تعيين صلاحياتهم كـ Admins.
                </p>

                <form onSubmit={handleAddNewUser} className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">البريد الإلكتروني (Email Address):</label>
                    <input
                      type="email"
                      required
                      placeholder="engineer@basra-refinery.gov"
                      value={newSubEmail}
                      onChange={(e) => setNewSubEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">الدور الوظيفي بالمنصة:</label>
                    <select
                      value={newSubRole}
                      onChange={(e) => setNewSubRole(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                    >
                      <option value="USER">مشترك عادي (Standard Chemical Engineer)</option>
                      <option value="ADMIN">مدير النظام المشرف (Consulting Admin)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md active:scale-95 transition-all outline-none"
                  >
                    تفعيل الحساب الجديد (1 Week Trial)
                  </button>
                </form>
              </div>

              {/* Users table */}
              <div className="md:col-span-2 bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 overflow-hidden">
                <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>جدول تراخيص مستخدمي المنظومة (ChemSim Users Registry)</span>
                </h5>
                
                <div className="overflow-x-auto rounded-lg border border-slate-850">
                  <table className="w-full text-right font-mono text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-910 border-b border-slate-850 text-slate-500 text-[10px]">
                        <th className="p-2">البريد الإلكتروني</th>
                        <th className="p-2 text-center">الدور</th>
                        <th className="p-2 text-center">الحالة</th>
                        <th className="p-2 text-center">تاريخ التفعيل</th>
                        <th className="p-2 text-center">الاشتراك السنوي</th>
                        <th className="p-2 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {users.map((u) => (
                        <tr key={u.email} className="hover:bg-slate-900/40">
                          <td className="p-2 font-sans">{u.email}</td>
                          <td className="p-2 text-center">
                            <span className={`px-1 rounded text-[9px] ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-450'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-sans ${
                              u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                              u.status === 'TRIAL' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-2 text-center">{u.subStartDate}</td>
                          <td className="p-2 text-center text-emerald-400 font-bold">$12.00 / mo</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Toggle active status */}
                              <button
                                onClick={() => handleToggleUserStatus(u.email)}
                                className="text-blue-400 hover:text-white text-[9px] font-sans"
                                title="Toggle subscription state"
                              >
                                {u.status === 'ACTIVE' ? 'تعطيل' : 'تنشيط'}
                              </button>
                              
                              {/* Delete only if not admins */}
                              {(u.email !== 'oilinformation12333@gmail.com' && u.email !== 'alisaifaldeen12@gmail.com') && (
                                <button
                                  onClick={() => handleDeleteUser(u.email)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY LOGS */}
        {adminTab === 'LOGS' && (
          <div className="space-y-4 animate-fadeIn text-right">
            <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
              
              {/* Header inside container */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900">
                <div className="text-right">
                  <h5 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 justify-start">
                    <ClipboardList className="w-4 h-4 text-rose-450" />
                    <span>سجل النشاط والرقابة والولوج بالمنظومة (Live System Access & Activity Audit)</span>
                  </h5>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans mt-0.5">
                    تتبع فوري لكافة المهندسين الذين دخلوا إلى المختبر الافتراضي، ونتاج محاولات التنشيط، والتعديلات الثرموديناميكية التي تمت من قبل المشرفين.
                  </p>
                </div>
                
                {/* Control buttons */}
                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[10px]">
                  <button
                    onClick={() => {
                      setLogs(getActivityLogs());
                      setStatusMsg('تم تحديث قائمة سجلات الوصول فورا!');
                      setTimeout(() => setStatusMsg(''), 3000);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded flex items-center gap-1 transition-all"
                  >
                    <RefreshCcw className="w-3 h-3 text-emerald-400" />
                    <span>تحديث فوري</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من مسح جميع سجلات النشاط والدخول نهائياً؟')) {
                        clearActivityLogs();
                        setLogs([]);
                        setStatusMsg('تم مسح السجل بأكمله بنجاح.');
                        setTimeout(() => setStatusMsg(''), 3000);
                      }
                    }}
                    className="px-2.5 py-1 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-950/30 rounded flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                    <span>مسح السجلات</span>
                  </button>
                </div>
              </div>

              {/* Filtering bar */}
              <div className="relative flex items-center bg-slate-910 border border-slate-850 rounded-lg px-2 text-xs">
                <Search className="w-4 h-4 text-slate-500 ml-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="فلترة حسب البريد الإلكتروني المحاول أو الكلمة دلالية للعملية..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  className="w-full bg-transparent border-0 text-slate-200 outline-none p-2 text-right font-sans"
                />
                {logsSearch && (
                  <button
                    onClick={() => setLogsSearch('')}
                    className="text-[10px] text-slate-500 hover:text-slate-300 px-1 font-sans"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Logs display container */}
              <div className="overflow-x-auto rounded-lg border border-slate-850">
                <table className="w-full text-right font-mono text-[11px] border-collapse select-text">
                  <thead>
                    <tr className="bg-slate-910 border-b border-slate-850 text-slate-500 text-[10px]">
                      <th className="p-2.5 font-sans">تاريخ والوقت</th>
                      <th className="p-2.5 font-sans">البريد الإلكتروني / الحساب</th>
                      <th className="p-2.5 font-sans text-center">نوع العملية</th>
                      <th className="p-2.5 font-sans text-right">تفاصيل النشاط التشغيلي</th>
                      <th className="p-2.5 font-sans text-center">موقع الولوج (IP Address)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {(() => {
                      const filtered = logs.filter(item => {
                        const s = logsSearch.toLowerCase();
                        return (item.email || '').toLowerCase().includes(s) || 
                               (item.message || '').toLowerCase().includes(s) ||
                               (item.eventType || '').toLowerCase().includes(s);
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 font-sans text-xs">
                              لا توجد سجلات دخول أو أنشطة مطابقة لبحثك في الذاكرة حالياً.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((item) => {
                        // Badge styling mappings
                        let badgeClass = 'bg-slate-800 text-slate-400 border border-slate-700/50';
                        let arabicType = item.eventType;

                        switch (item.eventType) {
                          case 'SYSTEM_INITIALIZATION':
                            badgeClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                            arabicType = 'تشغيل النواة';
                            break;
                          case 'LOGIN_SUCCESS':
                            badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                            arabicType = 'تفعيل/دخول ناجح';
                            break;
                          case 'LOGIN_FAIL':
                            badgeClass = 'bg-amber-500/10 text-amber-450 border border-amber-500/20';
                            arabicType = 'فشل ولوج هيدروليكي';
                            break;
                          case 'ADMIN_LOGIN':
                            badgeClass = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                            arabicType = 'مشرف معتمد 🌟';
                            break;
                          case 'ADMIN_LOGIN_FAIL':
                            badgeClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
                            arabicType = 'فشل مشرف/أمني 🛑';
                            break;
                          case 'OVERRIDE_CONSTANTS':
                            badgeClass = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                            arabicType = 'معادلات HYSYS';
                            break;
                          case 'COURSE_UPLOAD':
                            badgeClass = 'bg-teal-500/10 text-teal-450 border border-teal-500/20';
                            arabicType = 'مقرر دراسي';
                            break;
                          case 'ALERT_BROADCAST':
                            badgeClass = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
                            arabicType = 'توجيه/بث عاجل';
                            break;
                        }

                        return (
                          <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-2.5 text-slate-400 whitespace-nowrap text-right">{item.timestamp}</td>
                            <td className="p-2.5 font-mono text-slate-200 max-w-[200px] truncate text-right">{item.email}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 text-[9.5px] rounded-full font-sans font-bold inline-block border ${badgeClass}`}>
                                {arabicType}
                              </span>
                            </td>
                            <td className="p-2.5 font-sans text-right text-slate-300 leading-relaxed text-[11px]">{item.message}</td>
                            <td className="p-2.5 text-center">
                              <span className="p-1 px-1.5 bg-slate-900 border border-slate-850 rounded text-slate-400 font-mono text-[10px] whitespace-nowrap" dir="ltr">
                                🇮🇶 {item.ipAddress}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Live telemetry bar */}
              <div className="bg-slate-910 p-3 rounded-lg border border-slate-850 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-1.5 font-sans leading-relaxed text-right md:text-left" dir="rtl">
                <div className="flex items-center gap-2 flex-row-reverse sm:flex-row">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                  <span className="font-mono text-slate-500 text-[10px]">Security Agent Audit Status: ACTIVE & RECORDING</span>
                </div>
                <span>بروتوكول البصرة للهندسة الكيميائية - تم رصد وتوقيع سجلات الأجهزة لحماية الملكية الفكرية للمهندس Eng. Ali Saif Aldeen.</span>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: HYSYS COURSES & ACADEMIC ALERTS BROADCAST */}
        {adminTab === 'COURSES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn text-xs">
            
            {/* Class course builder */}
            <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-start">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>رفع مقررات تدريب HYSYS ومراجع التصميم (Upload Aspen Courses)</span>
              </h5>
              <p className="text-[10px] text-slate-500 leading-relaxed text-right font-sans">
                بإمكان المشرف رفع ومشاركة ملفات ومناقشات تصميم عمليات التقطير، موازنات الطاقة للمبادلات والمضخات لتصل لكافة المهندسين الملتحقين بالمنصة.
              </p>

              <form onSubmit={handleAddCourse} className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">اسم الدورة ومادة التدريب (Course Title):</label>
                  <input
                    type="text"
                    required
                    placeholder="موازنة التقطير McCabe Thiele المتقدمة للمهندس النوفل"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-sans"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-550 hover:from-amber-550 text-white font-bold rounded-lg shadow-md transition-all outline-none"
                >
                  نشر الملف التعلمي على شاشات المشتركين
                </button>
              </form>

              {/* Course list */}
              <div className="border-t border-slate-900 pt-3.5 space-y-2">
                <h6 className="text-[10px] text-slate-500 uppercase tracking-widest text-right">المحاضرات المنشورة حالياً</h6>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {courses.map(c => (
                    <div key={c.id} className="bg-slate-900/60 p-2 border border-slate-850 rounded-lg flex items-center justify-between">
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete Course File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-right">
                        <p className="text-[11px] font-sans text-slate-200 leading-tight">{c.title}</p>
                        <p className="text-[9px] text-slate-505 font-mono">Published: {c.uploadedAt} • Views: {c.viewsCount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Broadcast live engineering alerts */}
            <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-start">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>بث تعليمات عاجلة وإشعارات صيانة للطلاب والمهندسين</span>
                </h5>
                <p className="text-[10px] text-slate-500 leading-relaxed text-right font-sans">
                  إرسال نص بوقفة هندسية أو تحذير تشغيلي هام لخطوط التقطير يظهر فوراً في واجهة مستخدمي المنشأة.
                </p>

                <form onSubmit={handleSendNotification} className="space-y-3 pt-2">
                  <div>
                    <textarea
                      required
                      rows={3}
                      placeholder="تنبيه: نود إخبار المهندسين بأننا اختبرنا طاقة الرادياتير والمفاعل اليوم وبإمكانكم مراجعة موازنة الطاقة في الحسابات..."
                      value={adminNotificationText}
                      onChange={(e) => setAdminNotificationText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-650 hover:bg-emerald-550 text-white font-bold rounded-lg shadow-md transition-all outline-none"
                  >
                    بث الإشعار (Broadcast Notification)
                  </button>
                </form>
              </div>

              {/* Administrative warning display */}
              <div className="bg-slate-900 p-4 border border-slate-850 rounded-xl flex items-start gap-2 text-slate-400 text-[10px] leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-right font-sans">
                  ملاحظة أمنية: للتواصل المباشر مع المهندس المشرف في الهيئة بخصوص شروط ترخيص التوزيع، يرجى الاستعانة بواتساب الدعم وتوفير البريد المدخل.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
