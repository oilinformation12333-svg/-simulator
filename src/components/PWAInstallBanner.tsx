/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';

// Resilient fallback state when localStorage is unavailable inside sandboxed iFrames
let sessionDismissed = false;

const safeGetDismissed = (): boolean => {
  if (sessionDismissed) return true;
  try {
    return localStorage.getItem('chemsim_pwa_dismissed') === 'true';
  } catch (err) {
    console.warn("PWA: LocalStorage read blocked (standard for sandboxed preview iframe):", err);
    return false;
  }
};

const safeSetDismissed = () => {
  sessionDismissed = true;
  try {
    localStorage.setItem('chemsim_pwa_dismissed', 'true');
  } catch (err) {
    console.warn("PWA: LocalStorage write blocked:", err);
  }
};

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [platform, setPlatform] = useState<'ANDROID' | 'IOS' | 'DESKTOP'>('DESKTOP');

  useEffect(() => {
    // 1. Detect if already running in standalone (installed) mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;

    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // 2. Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    if (isIOS) {
      setPlatform('IOS');
    } else if (isAndroid) {
      setPlatform('ANDROID');
    } else {
      setPlatform('DESKTOP');
    }

    // 3. Listen for browser install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (!safeGetDismissed()) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Show compact banner for onboarding if not dismissed
    if (!safeGetDismissed()) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deferredPrompt) {
      alert('يتم التثبيت من خلال متصفحك. ابحث عن خيار "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية" في قائمة خيارات المتصفح.');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installment outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = (e?: React.SyntheticEvent) => {
    if (e) {
      try {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
      } catch (err) {
        console.warn("Event propagation prevention failed:", err);
      }
    }
    safeSetDismissed();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[350px] z-[9999] animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-3 shadow-2xl text-right relative overflow-hidden">
        
        {/* Subtle decorative glows */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-550/10 rounded-full blur-xl pointer-events-none" />

        {/* COMPACT HEADER ROW: Minimal footprint */}
        <div className="flex items-center gap-2 flex-row-reverse justify-between">
          
          <div className="flex items-center gap-2 flex-row-reverse min-w-0">
            <div className="p-1.5 bg-emerald-950/50 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0 pr-0.5">
              <h4 className="text-[11px] font-bold text-slate-100 truncate font-sans">
                تثبيت المحاكي للجوال (PWA)
              </h4>
              <p className="text-[9px] text-slate-400 font-sans">
                لتجربة تصفح سريعة وملء الشاشة
              </p>
            </div>
          </div>

          {/* LARGE TOUCH-TARGET CLOSE BUTTON (At least 44px for reliable dismissing) */}
          <button 
            type="button"
            onClick={handleDismiss}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors bg-slate-950/40 rounded-full border border-slate-800/40 shrink-0 active:scale-90"
            title="إغلاق"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        {/* EXPANDABLE INSTRUCTIONS ACCORDION */}
        {showDetails && (
          <div className="mt-2.5 p-2 bg-slate-950/90 rounded-xl border border-slate-850/60 text-[9.5px] text-slate-350 leading-relaxed font-sans animate-fadeIn">
            {platform === 'IOS' ? (
              <div className="space-y-1">
                <p className="font-bold text-amber-400">📲 تشغيل آيفون (Safari):</p>
                <div className="flex items-center gap-1 justify-end flex-row-reverse">
                  <span className="font-semibold text-white">1. اضغط على زر "مشاركة" (Share)</span>
                  <Share className="w-2.5 h-2.5 text-blue-400" />
                </div>
                <p className="text-slate-400">2. اختر <strong className="text-white">"إضافة للشاشة الرئيسية"</strong>.</p>
                <p className="text-slate-400">3. انقر <strong className="text-emerald-400">"إضافة"</strong> بالزاوية العليا.</p>
              </div>
            ) : platform === 'ANDROID' ? (
              <div>
                <p className="font-bold text-emerald-400 mb-1">📲 لأجهزة الأندرويد:</p>
                <p className="text-slate-400">انقر "تثبيت الآن" أدناه، أو عبر قائمة المتصفح متمثلة بالثلاث نقاط.</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-blue-400 mb-1">💻 للكمبيوتر (Chrome/Edge):</p>
                <p className="text-slate-400">اضغط زر التثبيت بالأسفل أو من شريط العنوان العلوي.</p>
              </div>
            )}
          </div>
        )}

        {/* ACTION ROW */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-850/50">
          
          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className="text-[9px] text-emerald-400 hover:text-emerald-350 font-semibold flex items-center gap-1.5 hover:underline select-none px-1"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{showDetails ? "إخفاء التعليمات" : "عرض طريقة التثبيت"}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Later Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-1 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg border border-slate-800 transition-colors font-medium text-[9px]"
            >
              لاحقاً
            </button>
            
            {/* Install Trigger Button */}
            {(platform === 'ANDROID' || platform === 'DESKTOP' || deferredPrompt) ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg shadow-md hover:scale-101 transition-all flex items-center gap-1 text-[9px]"
              >
                <Download className="w-3 h-3 shrink-0" />
                <span>تثبيت</span>
              </button>
            ) : (
              platform === 'IOS' && (
                <div className="flex items-center gap-0.5 text-[9px] text-amber-400 font-semibold animate-pulse">
                  <span>شارك لإضافتها</span>
                  <ArrowDown className="w-2.5 h-2.5 shrink-0" />
                </div>
              )
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

