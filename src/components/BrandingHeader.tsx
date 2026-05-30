/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, ChevronDown, Database, Cpu, Award, Users, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { CaseStudy } from '../types';
import { CASE_STUDIES, CHEMICAL_REFS } from '../data/chemData';
import { appendActivityLog } from '../utils/activityLogger';

interface BrandingHeaderProps {
  currentCase: CaseStudy;
  onSelectCase: (caseId: string) => void;
  isAdmin: boolean;
  onAdminToggle: (status: boolean) => void;
  adminEmail: string;
  setAdminEmail: (email: string) => void;
}

export default function BrandingHeader({
  currentCase,
  onSelectCase,
  isAdmin,
  onAdminToggle,
  adminEmail,
  setAdminEmail
}: BrandingHeaderProps) {
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRefsModal, setShowRefsModal] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const adminEmails = ['oilinformation12333@gmail.com', 'oilinfomrmation12333@gmail.com', 'alisaifaldeen12@gmail.com'];

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = adminEmail.toLowerCase().trim();
    if (!adminEmails.includes(cleanMail)) {
      setAuthError('عذراً، هذا البريد الإلكتروني ليس مسجلاً كمشرف معتمد.');
      appendActivityLog(cleanMail || 'مجهول', 'ADMIN_LOGIN_FAIL', 'محاولة دخول مشرف غير مصرح به');
      return;
    }
    if (password !== 'admin123' && password !== 'basra2026') {
      setAuthError('كلمة المرور غير صحيحة.');
      appendActivityLog(cleanMail, 'ADMIN_LOGIN_FAIL', 'محاولة دخول مشرف بكلمة مرور خاطئة');
      return;
    }
    setAuthError('');
    onAdminToggle(true);
    setShowAdminModal(false);
    setPassword('');
    appendActivityLog(cleanMail, 'ADMIN_LOGIN', 'تم تسجيل دخول المشرف بنجاح وتخويل لوحة الإدارة رقم 1');
  };

  const handleLogout = () => {
    const prevMail = adminEmail;
    onAdminToggle(false);
    setAdminEmail('');
    setPassword('');
    appendActivityLog(prevMail || 'System Admin', 'LOGIN_FAIL', 'تم تسجيل خروج المشرف بأمان من لوحة التحكم');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white" id="brand-header">
      {/* Upper bar: Logo, Title, and Supervised By */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Visual Emblem Representation */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-950 rounded-xl p-1 shadow-lg border border-slate-700 flex items-center justify-center">
            {/* SVG implementation of the teardrop oil flame & chemical refinery */}
            <svg viewBox="0 0 100 100" className="w-full h-full select-none">
              <defs>
                <linearGradient id="flameGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" /> {/* blue */}
                  <stop offset="40%" stopColor="#22c55e" /> {/* green */}
                  <stop offset="70%" stopColor="#eab308" /> {/* yellow/orange */}
                  <stop offset="100%" stopColor="#ef4444" /> {/* red */}
                </linearGradient>
              </defs>
              {/* Outer Golden/Cyan Shell curve */}
              <path d="M 12 75 C 10 40, 40 10, 50 5 C 60 10, 90 40, 88 75 C 85 92, 15 95, 12 75 Z" fill="url(#flameGrad)" className="opacity-85" />
              {/* Inside Cutout representing the Refinery Chimney & Towers */}
              <rect x="42" y="45" width="16" height="35" fill="#0f172a" rx="1" />
              <rect x="40" y="42" width="20" height="3" fill="#38bdf8" />
              <line x1="50" y1="45" x2="50" y2="80" stroke="#1e293b" strokeWidth="2" />
              {/* Secondary towers */}
              <rect x="28" y="55" width="8" height="25" fill="#1e293b" rx="1" />
              <rect x="64" y="50" width="10" height="30" fill="#1e293b" rx="1" />
              <circle cx="69" cy="45" r="4" fill="#ef4444" />
              <path d="M50 15 L50 35" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3,3" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                G&OT Engineering
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-300 via-emerald-200 to-amber-200 bg-clip-text text-transparent">
              الهيئة العامة للمهندسين الكيميائيين في البصرة
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Petrochemical & Process Dynamics Laboratory
            </p>
          </div>
        </div>

        {/* Supervision Accreditation */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3 shadow-inner max-w-sm text-right md:text-left self-stretch md:self-auto">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              SUPERVISED & DEVELOPED BY
            </div>
            <div className="text-sm font-bold text-slate-100">
              Eng. Ali saif aldin haider alnawfal
            </div>
            <div className="text-[11px] text-emerald-400">
              Senior Process Simulator Lead
            </div>
          </div>
        </div>

      </div>

      {/* Primary Navigation / Utility Bar */}
      <div className="bg-slate-950 border-t border-slate-800 py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Preset Selector Dropdown */}
          <div className="relative flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-mono text-slate-500 uppercase">Case:</span>
            <button
              onClick={() => setShowCaseDropdown(!showCaseDropdown)}
              className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-200 font-medium transition-all w-full sm:w-64 text-left"
              id="case-btn"
            >
              <div className="flex items-center gap-2 truncate">
                <Database className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">{currentCase.name}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showCaseDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg w-full sm:w-80 shadow-2xl z-50 py-1 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  اختر دراسة حالة لمحاكاتها:
                </div>
                {CASE_STUDIES.map((cs) => (
                  <button
                    key={cs.id}
                    onClick={() => {
                      onSelectCase(cs.id);
                      setShowCaseDropdown(false);
                    }}
                    className={`w-full text-right sm:text-left px-4 py-3 text-xs flex flex-col gap-1 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors ${
                      currentCase.id === cs.id ? 'bg-blue-500/10 border-r-4 border-r-blue-500' : ''
                    }`}
                  >
                    <span className="font-bold text-slate-200">{cs.name}</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                      {cs.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-3 justify-end w-full sm:w-auto font-mono text-xs">
            {/* References Button */}
            <button
              onClick={() => setShowRefsModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition-all text-xs"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>المصادر الهندسية</span>
            </button>

            {/* Admin Dashboard Trigger */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg">
                  <Shield className="w-3.5 h-3.5" />
                  <span>لوحة المشرف نشطة</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all font-sans"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAdminModal(true)}
                className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/30 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>دخول المشرفين / Admin</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Scientific References Modal */}
      {showRefsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-base">بروتوكول التصميم والمصادر الهندسية المعتمدة</h3>
              </div>
              <button
                onClick={() => setShowRefsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-right sm:text-left">
              <p className="text-xs text-slate-300 leading-relaxed">
                تقوم هذه المحاكاة التفاعلية بحساب الموازين المادية والحرارية والديناميكية الحرارية بالاعتماد المباشر والدقيق على نماذج الهندسية الكيميائية المعتمدة صناعياً وبحثياً:
              </p>
              
              <div className="grid gap-3 select-none">
                {CHEMICAL_REFS.map((ref, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-4 border border-slate-800/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">Ref #{idx+1}</span>
                      <h4 className="font-bold text-xs text-blue-400">{ref.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">Authors: {ref.authors} • {ref.edition}</p>
                    <p className="text-xs text-slate-200 mt-2 border-t border-slate-800/40 pt-2 bg-slate-900/10">
                      <strong>تطبيق العملية: </strong> {ref.useCase}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-4 h-auto text-xs text-slate-400 leading-relaxed flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-200">الضمانات المهنية وسلامة التصميم</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    جميع الحسابات الحركية والثرموديناميكية مفحوصة بدقة لمطابقة برامج محاكاة العمليات (Flowsheeting Softwares مثل Aspen HYSYS) للحصول على كفاءة موازنة حقيقية.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowRefsModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs text-slate-100 font-medium rounded-lg"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Credentials Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-850 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-slate-100 text-sm">تسجيل دخول المشرفين المعتمدين</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setAuthError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminVerify} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed text-right md:text-left">
                لحماية معايير العملية وتغيير ثوابت الثرموديناميك، يرجى إدخال البريد الإلكتروني للمشرف المعتمد وكلمة المرور الخاصة به.
              </p>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">البريد الإلكتروني المعتمد (Admin Email)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  الرجاء تسجيل الدخول باستخدام حساب المشرف المعتمد لإدارة التراخيص والثوابت الهيدروليكية.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">كلمة المرور (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  تلميح تجريبي: <code className="bg-slate-950 px-1 py-0.5 text-blue-400 rounded">basra2026</code> أو <code className="bg-slate-950 px-1 py-0.5 text-blue-400 rounded">admin123</code>
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-[11px] text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAuthError('');
                  }}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-slate-400 font-medium rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-100 font-medium rounded-lg shadow-lg active:scale-95 transition-all text-xs"
                >
                  تأكيد الهوية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
