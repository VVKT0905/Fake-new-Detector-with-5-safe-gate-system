import { useState, useEffect } from "react";
import { 
  Link as LinkIcon, 
  FileText, 
  AlertTriangle, 
  History as HistoryIcon,
  Search,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { cn } from "./lib/utils";

// Components
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { GateStepper, GateStatus } from "./components/verification/GateStepper";
import { ResultCard, FactCheckResult } from "./components/verification/ResultCard";
import { HistorySidebar, HistoryItem } from "./components/history/HistorySidebar";

// Hooks
import { useHistory } from "./hooks/useHistory";

export default function App() {
  const [activeTab, setActiveTab] = useState<"link" | "text">("link");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New UI states
  const [currentGate, setCurrentGate] = useState(1);
  const [gateStatus, setGateStatus] = useState<GateStatus>("idle");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { items: historyItems, addItem, clearHistory } = useHistory();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setGateStatus("loading");
    setCurrentGate(1);

    // Simulated gate progress for better UX
    const simulateProgress = async () => {
       await new Promise(r => setTimeout(r, 800));
       setCurrentGate(2);
       await new Promise(r => setTimeout(r, 1200));
       setCurrentGate(3);
       await new Promise(r => setTimeout(r, 1500));
       setCurrentGate(4);
       await new Promise(r => setTimeout(r, 1000));
       setCurrentGate(5);
    };

    try {
      let contentToAnalyze = input;
      
      // Start simulation in parallel with the real request
      const progressPromise = simulateProgress();

      if (activeTab === "link") {
        try {
          const response = await axios.get(`/api/scrape?url=${encodeURIComponent(input)}`);
          contentToAnalyze = response.data.content;
        } catch (err) {
          throw new Error("Không thể lấy nội dung từ URL này. Vui lòng thử sao chép văn bản thủ công.");
        }
      }

      const verifyResponse = await axios.post("/api/verify", { text: contentToAnalyze });
      
      // Wait for simulation to catch up or at least reach a decent stage
      await progressPromise;
      
      const finalResult = verifyResponse.data;
      setResult(finalResult);
      setGateStatus("completed");
      
      // Add to history
      addItem({
        input: activeTab === "link" ? input : input.substring(0, 100) + "...",
        verdict: getNormalizedVerdict(finalResult.verdict)
      });

    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Đã xảy ra lỗi không mong muốn.");
      setGateStatus("error");
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

  const handleSelectHistory = (item: HistoryItem) => {
    // In a real app, we'd fetch the full result again or store it in history
    // For now, let's just show the input and clear the current result
    setInput(item.input);
    setResult(null);
    setIsHistoryOpen(false);
  };

  const handleReset = () => {
    setResult(null);
    setInput("");
    setCurrentGate(1);
    setGateStatus("idle");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Floating Action Buttons */}
        <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-20">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-4 bg-white text-slate-900 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 hover:scale-110 transition-all group"
            >
              <HistoryIcon className="w-6 h-6 group-hover:text-indigo-600" />
            </button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Truth Verification
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]"
          >
            Bảo vệ bạn trước <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Thông tin sai lệch</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
          >
            Hệ thống 5 trạm kiểm soát sử dụng PhoBERT, Google Search và Gemini AI để phân tích và xác minh tính xác thực của mọi thông tin.
          </motion.p>
        </div>

        {/* Input Section */}
        {!result && (
          <motion.div 
            layout
            className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden mb-12"
          >
            <div className="flex p-2 bg-slate-50/50">
              <button 
                onClick={() => setActiveTab("link")}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all rounded-2xl",
                  activeTab === "link" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LinkIcon className="w-4 h-4" />
                Dán liên kết
              </button>
              <button 
                onClick={() => setActiveTab("text")}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all rounded-2xl",
                  activeTab === "text" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <FileText className="w-4 h-4" />
                Nhập văn bản
              </button>
            </div>

            <div className="p-8">
              <div className="relative">
                {activeTab === "link" ? (
                  <input 
                    type="url"
                    placeholder="https://example.com/tin-tuc-can-kiem-tra"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg font-medium text-slate-900 placeholder:text-slate-300"
                  />
                ) : (
                  <textarea 
                    placeholder="Dán nội dung bài viết hoặc tuyên bố cần xác minh tại đây..."
                    rows={6}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg font-medium text-slate-900 placeholder:text-slate-300 resize-none"
                  />
                )}
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading || !input.trim()}
                className="w-full mt-6 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang phân tích dữ liệu...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Xác minh ngay lập tức
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading / Stepper Section */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12"
            >
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black uppercase tracking-[0.2em] text-slate-400 text-xs">Tiến trình 5-Gate</h3>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">Gate {currentGate}/5</div>
                </div>
                <GateStepper currentGate={currentGate} status={gateStatus} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-6 mb-8 flex items-start gap-4 shadow-lg shadow-rose-100/50"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-rose-600 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-rose-900 uppercase tracking-widest text-xs mb-1">Đã xảy ra lỗi</h4>
                <p className="text-rose-700 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && !isLoading && (
            <ResultCard result={result} onReset={handleReset} />
          )}
        </AnimatePresence>

        {/* Feature Grid (Only on Home) */}
        {!result && !isLoading && (
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
             <FeatureCard 
               title="Dữ liệu thời gian thực"
               description="Kết nối trực tiếp với Google Search để lấy thông tin mới nhất trên toàn cầu."
               icon={<Search className="w-6 h-6 text-indigo-600" />}
             />
             <FeatureCard 
               title="Suy luận AI"
               description="Sử dụng Gemini Pro 1.5 để phân tích logic và phát hiện các mâu thuẫn trong văn bản."
               icon={<Sparkles className="w-6 h-6 text-indigo-600" />}
             />
             <FeatureCard 
               title="Bảo mật & Riêng tư"
               description="Dữ liệu của bạn được phân tích ẩn danh và không được lưu trữ trên máy chủ."
               icon={<LinkIcon className="w-6 h-6 text-indigo-600" />}
             />
          </div>
        )}
      </main>

      <Footer />

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelectItem={handleSelectHistory}
        onClearHistory={clearHistory}
      />
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: any }) {
  return (
    <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-indigo-100 transition-all hover:-translate-y-1">
      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight">{title}</h4>
      <p className="text-slate-500 font-medium text-sm leading-relaxed">{description}</p>
    </div>
  );
}
