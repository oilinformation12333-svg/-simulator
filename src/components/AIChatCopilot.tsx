/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, HelpCircle, FileJson, Check, Play, Paperclip, X, Camera } from 'lucide-react';

interface AIChatCopilotProps {
  onPromptGemini: (promptText: string, image?: { data: string; mimeType: string }) => Promise<string>;
  onApplyGeneratedFlowsheet: (nodes: any[], streams: any[]) => void;
}

export default function AIChatCopilot({
  onPromptGemini,
  onApplyGeneratedFlowsheet
}: AIChatCopilotProps) {
  const [messages, setMessages] = useState<{
    sender: 'USER' | 'AI';
    text: string;
    flowsheet?: any;
    imagePreviewUrl?: string;
  }[]>([
    {
      sender: 'AI',
      text: `مرحباً بك مهندس كيميائي، أنا مساعدك الذكي ChemSim AI للتصميم والمحاكاة.\nاطلب مني القيام بأي تصميم أو استكشاف أخطاء، مثل:\n"صمم وحدة فصل غاز البترول المسال LPG" أو "صمم مبخر تبريد للإيثانول والماء". سأقترح التصميم وأبنيه لك فوراً على لوحة العمل!\n\n💡 يمكنك الآن أيضاً إرفاق أو سحب وإسقاط أي صورة لمخطط هندسي أو كروكي يدوي وسأقوم بتحليله وتوليد محاكاة كاملة له!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    data: string; // Base64 raw string
    mimeType: string;
    previewUrl: string; // data URL
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File reader helper for image data extracting
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('من فضلك اختر ملف صورة كيميائي صالح (PNG, JPEG, WebP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const resultString = e.target.result as string;
        const commaIdx = resultString.indexOf(',');
        const base64Data = commaIdx > -1 ? resultString.substring(commaIdx + 1) : resultString;
        setAttachedImage({
          data: base64Data,
          mimeType: file.type,
          previewUrl: resultString
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Support clipboard image pasting (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!input.trim() && !attachedImage) return;

    const userText = input.trim() || "قم بتحليل مخطط العمليات المرفق بمواصفاته الكيميائية الحركية وتشغيل المحاكاة.";
    const currentImg = attachedImage;

    setMessages(prev => [...prev, {
      sender: 'USER',
      text: userText,
      imagePreviewUrl: currentImg?.previewUrl
    }]);

    setInput('');
    setAttachedImage(null);
    setLoading(true);

    // Prompt compilation to trigger structured JSON building if needed
    const structuredPrompt = `${userText}

IMPORTANT: If the user is asking to design, build, or create a chemical process or flowsheet, please add a chemical flowsheet JSON definition at the end of your explanation starting exactly with \`\`\`json-flowsheet and ending with \`\`\` so the system can automatically render it on the grid!

The JSON format should be:
{
  "nodes": [
    { "id": "node_tank_1", "type": "TANK", "label": "V-101 (Raw Feed Tank)", "x": 100, "y": 150, "params": { "volume": 5000, "suctionPressure": 1.0 } },
    { "id": "node_pump_1", "type": "PUMP", "label": "P-101 (Centrifugal Pump)", "x": 300, "y": 150, "params": { "efficiency": 75, "suctionPressure": 1.0, "flowRate": 45 } }
  ],
  "streams": [
    { "id": "str_1", "name": "S-01", "fromNode": "node_tank_1", "toNode": "node_pump_1", "temperature": 25.0, "pressure": 1.0, "flowRate": 3500.0, "composition": { "Water": 0.5, "Ethanol": 0.5 } }
  ]
}

Very Important Constraints:
1. Ensure coordinates x/y are spacious and DO NOT overlap or stand too close to each other. Place equipment logically from left-to-right:
   - FEED / TANK: x = 100 to 180
   - PUMP / EXCHANGER / VALVE: x = 280 to 420
   - REACTOR / COMPRESSOR / MIXER: x = 480 to 650
   - SEPARATOR / COLUMN / STORAGE TANK: x = 750 to 950
   Make sure horizontal x gap between adjacent elements is at least 180px and vertical y gap is at least 130px.
2. If the user provided an image that lacks thermodynamic data (temperature, pressure, mass balances, component compositions), you MUST utilize your profound knowledge and HYSYS reference data to define and estimate realistic values for these fields in the generated streams and add them professionally to the simulation.
3. Choose from these supported UnitTypes only: TANK, PUMP, EXCHANGER, REACTOR, COMPRESSOR, COLUMN, VALVE, MIXER, SEPARATOR.

Keep your explanation concise, written in beautiful engineering Arabic. Show equations where necessary. Supervised by Ali Saif Aldeen.`;

    try {
      const response = await onPromptGemini(
        structuredPrompt,
        currentImg ? { data: currentImg.data, mimeType: currentImg.mimeType } : undefined
      );
      
      // Parse flowsheet JSON if present
      let finalResponseText = response;
      let extractedFlowsheet: any = null;

      const flowRegex = /```json-flowsheet([\s\S]*?)```/;
      const match = response.match(flowRegex);
      if (match && match[1]) {
        try {
          extractedFlowsheet = JSON.parse(match[1].trim());
          // Remove the raw JSON block from displayed messages for premium clean look
          finalResponseText = response.replace(flowRegex, '').trim();
        } catch (err) {
          console.error('Failed to parse generated flowsheet JSON:', err);
        }
      }

      setMessages(prev => [...prev, {
        sender: 'AI',
        text: finalResponseText,
        flowsheet: extractedFlowsheet
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'AI',
        text: `عذراً، حدث خطأ أثناء الاتصال بموازن الأكاديمية: ${err.message || err}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (flowsheet: any) => {
    if (flowsheet && flowsheet.nodes && flowsheet.streams) {
      onApplyGeneratedFlowsheet(flowsheet.nodes, flowsheet.streams);
      alert('تم تحميل مخطط السريان والبارامترات المقترحة بنجاح إلى لوحة العمل التفاعلية!');
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`bg-slate-900 border rounded-2xl p-6 shadow-2xl flex flex-col h-[520px] transition-all relative ${
        dragActive ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-800'
      }`} 
      id="ai-chat-copilot"
    >
      {/* Absolute overlay when dragging files */}
      {dragActive && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-50 pointer-events-none select-none border-2 border-dashed border-purple-500 animate-fadeIn">
          <Camera className="w-10 h-10 text-purple-400 animate-bounce" />
          <span className="text-xs font-bold text-purple-200 font-sans">أسقط صورة المخطط هنا مباشرة للتحليل والمحاكاة!</span>
        </div>
      )}

      <div className="flex items-center gap-2 pb-3 border-b border-slate-850 justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h4 className="font-bold text-slate-100 text-sm">مساعد الذكاء الاصطناعي للمحاكاة (ChemSim AI Copilot)</h4>
            <p className="text-[10px] text-slate-500">
              Supervised and developed by Eng. Ali Saif Aldeen
            </p>
          </div>
        </div>
        <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-bold uppercase">
          GEMINI MULTIMODAL
        </span>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto my-3 space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-850/60 font-sans" id="ai-messages-terminal">
        {messages.map((m, index) => (
          <div key={index} className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}>
            <span className="text-[9px] text-slate-500 font-mono mb-0.5 select-none uppercase">
              {m.sender === 'USER' ? 'المستخدم (User)' : 'المستشار الذكي (ChemSim Copilot)'}
            </span>
            <div className={`p-3.5 rounded-xl text-xs max-w-[85%] leading-relaxed whitespace-pre-wrap select-text text-right ${
              m.sender === 'USER'
                ? 'bg-blue-600/15 border border-blue-500/20 text-blue-250'
                : 'bg-slate-900 border border-slate-800 text-slate-200'
            }`}>
              {/* Show image thumbnail if user uploaded an image in this message */}
              {m.imagePreviewUrl && (
                <div className="mb-3 overflow-hidden rounded-lg border border-slate-850 max-w-[200px] shadow-lg">
                  <img 
                    src={m.imagePreviewUrl} 
                    alt="مخطط أرسله المستخدم" 
                    className="w-full h-auto max-h-[140px] object-cover bg-slate-950 block" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              {m.text}

              {/* Apply flowsheet button if generated */}
              {m.flowsheet && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>تم تجهيز مخطط سريان من {m.flowsheet.nodes?.length} وحدات!</span>
                  </div>
                  <button
                    onClick={() => handleApply(m.flowsheet)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 font-bold active:scale-95 transition-all text-[10px]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>تطبيق المخطط على لوحة الرسم</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-slate-500 font-mono mb-0.5 select-none">AI Copilot</span>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>جاري تحليل الأشكال المرفقة وصياغة موازنات الثرموديناميك وتنسيق المخطط...</span>
            </div>
          </div>
        )}
      </div>

      {/* Attached image preview bar */}
      {attachedImage && (
        <div className="mx-1 mb-2 p-2 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg border border-slate-800 overflow-hidden shrink-0 bg-slate-900">
              <img src={attachedImage.previewUrl} alt="Attached layout preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-300">تم اختيار صورة المخطط</p>
              <p className="text-[8px] text-slate-500 font-mono truncate max-w-[150px]">{attachedImage.mimeType}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            className="p-1 px-1.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-lg transition-all"
            title="إلغاء المرفق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0 items-center">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          id="chat-image-uploader"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="إرفاق صورة مخطط أو رسم كروكي"
          className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-purple-400 rounded-xl transition-all active:scale-95"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={attachedImage ? "صف المخطط المرفق أو وجه الاستشاري..." : "اطلب تصميماً أو أرفق مخططاً..."}
          required={!attachedImage}
          className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/35"
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && !attachedImage)}
          className="px-4 py-2.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
