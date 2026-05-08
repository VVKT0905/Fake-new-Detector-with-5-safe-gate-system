import { useState } from "react";
import axios from "axios";
import { FactCheckResult } from "../components/verification/ResultCard";
import { GateStatus } from "../components/verification/GateStepper";
import { HistoryItem } from "../components/history/HistorySidebar";

export function useAnalysis(addItem: (item: Omit<HistoryItem, "id" | "timestamp">) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGate, setCurrentGate] = useState(1);
  const [gateStatus, setGateStatus] = useState<GateStatus>("idle");

  const getNormalizedVerdict = (rawVerdict: string) => {
    const v = rawVerdict.toLowerCase();
    if (v.includes("true") || v.includes("real")) return "True";
    if (v.includes("fake") || v.includes("false")) return "Fake";
    if (v.includes("misleading")) return "Misleading";
    return "Unverified";
  };

  const handleAnalyze = async (input: string, activeTab: "link" | "text") => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setGateStatus("loading");
    setCurrentGate(1);

    let simulationActive = true;
    const simulateProgress = async () => {
       const delayer = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
       if (simulationActive) { await delayer(800); if (!simulationActive) return; setCurrentGate(2); }
       if (simulationActive) { await delayer(1200); if (!simulationActive) return; setCurrentGate(3); }
       if (simulationActive) { await delayer(1500); if (!simulationActive) return; setCurrentGate(4); }
       if (simulationActive) { await delayer(1000); if (!simulationActive) return; setCurrentGate(5); }
    };

    try {
      let contentToAnalyze = input;
      simulateProgress();

      if (activeTab === "link") {
        try {
          const response = await axios.get(`/api/scrape?url=${encodeURIComponent(input)}`);
          contentToAnalyze = response.data.content;
        } catch (err) {
          throw new Error("Không thể lấy nội dung từ URL này. Vui lòng thử sao chép văn bản thủ công.");
        }
      }

      const verifyResponse = await axios.post("/api/verify", { text: contentToAnalyze });
      const finalResult = verifyResponse.data;
      
      simulationActive = false;
      
      if (finalResult.gate_fired) {
        setCurrentGate(finalResult.gate_fired);
        await new Promise(r => setTimeout(r, 500));
        setCurrentGate(5);
      } else {
        setCurrentGate(5);
      }
      
      setResult(finalResult);
      setGateStatus("completed");
      
      addItem({
        input: activeTab === "link" ? input : input.substring(0, 100) + "...",
        verdict: getNormalizedVerdict(finalResult.verdict)
      });

    } catch (err: any) {
      simulationActive = false;
      setError(err.response?.data?.error || err.message || "Đã xảy ra lỗi không mong muốn.");
      setGateStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setCurrentGate(1);
    setGateStatus("idle");
  };

  return {
    isLoading,
    result,
    error,
    currentGate,
    gateStatus,
    handleAnalyze,
    resetAnalysis,
    setResult
  };
}
