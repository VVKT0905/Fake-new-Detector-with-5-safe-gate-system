import { motion } from "motion/react";
import { 
  ShieldCheck, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Info, 
  ArrowRight, 
  Copy, 
  Check, 
  Share2 
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export interface FactCheckResult {
  source: string;
  verdict: string;
  explanation: string;
  source_links: string[];
}

interface ResultCardProps {
  result: FactCheckResult;
  onReset: () => void;
}

export function ResultCard({ result, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const getNormalizedVerdict = (rawVerdict: string) => {
    const v = rawVerdict.toLowerCase();
    if (v.includes("true") || v.includes("real")) return "True";
    if (v.includes("fake") || v.includes("false")) return "Fake";
    if (v.includes("misleading")) return "Misleading";
    return "Unverified";
  };

  const normalizedVerdict = getNormalizedVerdict(result.verdict);

  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case "True": return "text-emerald-600 bg-emerald-50 border-emerald-200 shadow-emerald-100";
      case "Fake": return "text-rose-600 bg-rose-50 border-rose-200 shadow-rose-100";
      case "Misleading": return "text-amber-600 bg-amber-50 border-amber-200 shadow-amber-100";
      default: return "text-slate-600 bg-slate-50 border-slate-200 shadow-slate-100";
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "True": return <ShieldCheck className="w-8 h-8" />;
      case "Fake": return <XCircle className="w-8 h-8" />;
      case "Misleading": return <AlertTriangle className="w-8 h-8" />;
      default: return <HelpCircle className="w-8 h-8" />;
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case "True": return "Đáng tin cậy / Thật";
      case "Fake": return "Tin giả / Sai sự thật";
      case "Misleading": return "Gây hiểu lầm";
      default: return "Chưa xác minh";
    }
  };

  const handleCopy = () => {
    const text = `Kết quả kiểm tra: ${getVerdictLabel(normalizedVerdict)}\n\nGiải thích: ${result.explanation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Verdict Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className={cn("p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4", getVerdictStyles(normalizedVerdict))}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/50 rounded-2xl shadow-sm backdrop-blur-sm">
              {getVerdictIcon(normalizedVerdict)}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Kết luận phân tích</p>
              <h3 className="text-3xl font-black tracking-tight">{getVerdictLabel(normalizedVerdict)}</h3>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={handleCopy}
               className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-bold"
             >
               {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
               {copied ? "Đã chép" : "Sao chép"}
             </button>
             <button className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all shadow-sm">
               <Share2 className="w-4 h-4" />
             </button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Giải thích chi tiết</h4>
               <p className="text-lg font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                {result.explanation}
               </p>
            </div>
          </div>
        </div>

        {/* Source Badges */}
        <div className="px-8 pb-8 flex flex-wrap gap-2">
            <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Nguồn: {result.source}
            </div>
        </div>
      </div>

      {/* Recommended Sources */}
      {result.source_links && result.source_links.length > 0 && (
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200/20">
          <div className="absolute -top-10 -right-10 opacity-10">
            <Globe className="w-48 h-48 rotate-12" />
          </div>
          <div className="relative z-10">
            <h4 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-indigo-500/30" />
              Tài liệu tham khảo & đối chiếu
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.source_links.map((source, idx) => (
                <li key={idx}>
                  <a 
                    href={source} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group"
                  >
                    <span className="text-sm font-medium text-slate-300 truncate pr-4 group-hover:text-white transition-colors">
                      {source}
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="pt-8 flex flex-col items-center gap-4">
         <button 
           onClick={onReset}
           className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
         >
           Thực hiện kiểm tra mới
         </button>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dữ liệu phân tích sẽ được lưu vào lịch sử của bạn</p>
      </div>
    </motion.div>
  );
}

function Globe(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}
