import { useState } from "react";
import { 
  Search, 
  Link as LinkIcon, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Loader2,
  ArrowRight,
  Info,
  ExternalLink,
  RefreshCw,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import axios from "axios";

interface FactCheckResult {
  source: string;
  verdict: string;
  explanation: string;
  source_links: string[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"link" | "text">("link");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<{ title: string; content: string } | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setScrapedData(null);

    try {
      let contentToAnalyze = input;
      let sourceTitle = "";

      if (activeTab === "link") {
        try {
          const response = await axios.get(`/api/scrape?url=${encodeURIComponent(input)}`);
          contentToAnalyze = response.data.content;
          sourceTitle = response.data.title;
          setScrapedData({ title: sourceTitle, content: contentToAnalyze });
        } catch (err) {
          throw new Error("Không thể lấy nội dung từ URL này. Vui lòng thử sao chép văn bản thủ công.");
        }
      }

      // Call our 5-Gate Backend via proxy
      const verifyResponse = await axios.post("/api/verify", { text: contentToAnalyze });
      setResult(verifyResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Đã xảy ra lỗi không mong muốn trong quá trình phân tích.");
    } finally {
      setIsLoading(false);
    }
  };

  const getNormalizedVerdict = (rawVerdict: string) => {
    const v = rawVerdict.toLowerCase();
    if (v.includes("true") || v.includes("real")) return "True";
    if (v.includes("fake") || v.includes("false")) return "Fake";
    if (v.includes("misleading")) return "Misleading";
    return "Unverified";
  };

  const normalizedVerdict = result ? getNormalizedVerdict(result.verdict) : "Unverified";

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "True": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "Fake": return "text-rose-600 bg-rose-50 border-rose-200";
      case "Misleading": return "text-amber-600 bg-amber-50 border-amber-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "True": return <ShieldCheck className="w-6 h-6" />;
      case "Fake": return <XCircle className="w-6 h-6" />;
      case "Misleading": return <AlertTriangle className="w-6 h-6" />;
      default: return <HelpCircle className="w-6 h-6" />;
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Search className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Fake News Detector</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight"
          >
            Hệ Thống 5-Gate Xác Minh
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-xl mx-auto"
          >
            Sử dụng PhoBERT, Google Search và Gemini AI để phát hiện tin giả.
          </motion.p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab("link")}
              className={cn(
                "flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all",
                activeTab === "link" ? "text-indigo-600 bg-indigo-50/30 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LinkIcon className="w-4 h-4" />
              Dán liên kết
            </button>
            <button 
              onClick={() => setActiveTab("text")}
              className={cn(
                "flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all",
                activeTab === "text" ? "text-indigo-600 bg-indigo-50/30 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <FileText className="w-4 h-4" />
              Nhập văn bản
            </button>
          </div>

          <div className="p-6">
            <div className="relative">
              {activeTab === "link" ? (
                <input 
                  type="url"
                  placeholder="https://example.com/bai-viet-can-kiem-tra"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                />
              ) : (
                <textarea 
                  placeholder="Dán tuyên bố hoặc nội dung bài viết tại đây..."
                  rows={5}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                />
              )}
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isLoading || !input.trim()}
              className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Hệ thống đang chạy qua các trạm (Gates)...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Xác minh ngay
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-8 flex items-start gap-3"
            >
              <AlertTriangle className="text-rose-600 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Gate Info Card */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex items-center justify-between text-white">
                 <div className="flex items-center gap-3">
                   <div className="bg-indigo-600 p-2 rounded-lg">
                      <Cpu className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Nguồn phân tích</p>
                     <p className="font-semibold">{result.source}</p>
                   </div>
                 </div>
              </div>

              {/* Main Verdict Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className={cn("p-6 border-b flex items-center justify-between", getVerdictColor(normalizedVerdict))}>
                  <div className="flex items-center gap-3">
                    {getVerdictIcon(normalizedVerdict)}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-70">Kết luận</p>
                      <h3 className="text-2xl font-black">{getVerdictLabel(normalizedVerdict)}</h3>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    <div className="space-y-2">
                       <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Giải thích</h4>
                       <p className="text-lg font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {result.explanation}
                       </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Sources */}
              {result.source_links && result.source_links.length > 0 && (
                <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Search className="w-32 h-32 rotate-12" />
                  </div>
                  <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-4">Các nguồn liên quan</h4>
                  <ul className="space-y-3 relative z-10">
                    {result.source_links.map((source, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-lg font-medium break-all">
                        <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0" />
                        <a href={source} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30">
                          {source}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

               <div className="pt-4 flex justify-center">
                  <button 
                    onClick={() => {
                      setResult(null);
                      setInput("");
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Kiểm tra nội dung khác
                  </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        {!result && !isLoading && (
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-200 pt-12">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="text-slate-600 w-5 h-5" />
              </div>
              <h5 className="font-bold">Trạm 1 & 2: Caching & PhoBERT</h5>
              <p className="text-sm text-slate-500">Truy xuất kết quả siêu tốc từ CSDL hoặc lọc nhanh các mô hình ngôn ngữ độc hại.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <ExternalLink className="text-slate-600 w-5 h-5" />
              </div>
              <h5 className="font-bold">Trạm 3: Google Search</h5>
              <p className="text-sm text-slate-500">Tự động tìm kiếm các bài viết liên quan trên internet để đối chiếu với tuyên bố.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-slate-600 w-5 h-5" />
              </div>
              <h5 className="font-bold">Trạm 4: Gemini LLM</h5>
              <p className="text-sm text-slate-500">Dùng khả năng suy luận sâu của mô hình ngôn ngữ lớn để đưa ra kết luận cuối cùng.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-slate-200 text-center mt-12">
        <p className="text-sm text-slate-400">© 2026 Fake News Detection 5-Gate System.</p>
      </footer>
    </div>
  );
}
