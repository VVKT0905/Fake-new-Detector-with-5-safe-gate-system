import { motion } from "motion/react";
import { CheckCircle2, Circle, Loader2, Shield, Search, Cpu, Globe, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export type GateStatus = "idle" | "loading" | "completed" | "error";

interface Gate {
  id: number;
  name: string;
  description: string;
  icon: any;
}

const GATES: Gate[] = [
  { id: 1, name: "Gate 1: Cache", description: "Kiểm tra cơ sở dữ liệu", icon: Shield },
  { id: 2, name: "Gate 2: PhoBERT", description: "Phân tích sắc thái ngôn ngữ", icon: Cpu },
  { id: 3, name: "Gate 3: Google Search", description: "Đối chiếu thông tin thực tế", icon: Search },
  { id: 4, name: "Gate 4: Gemini LLM", description: "Suy luận logic nâng cao", icon: Globe },
  { id: 5, name: "Gate 5: Verdict", description: "Tổng hợp kết luận cuối cùng", icon: AlertCircle },
];

interface GateStepperProps {
  currentGate: number;
  status: GateStatus;
}

export function GateStepper({ currentGate, status }: GateStepperProps) {
  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between items-start max-w-2xl mx-auto">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-0" />
        <motion.div 
          className="absolute top-5 left-0 h-0.5 bg-indigo-600 -z-0 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (currentGate - 1) / (GATES.length - 1) }}
          transition={{ duration: 0.5 }}
        />

        {GATES.map((gate, index) => {
          const isCompleted = index + 1 < currentGate;
          const isActive = index + 1 === currentGate;
          const Icon = gate.icon;

          return (
            <div key={gate.id} className="relative z-10 flex flex-col items-center group w-1/5">
              <motion.div 
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted || isActive ? "#4f46e5" : "#f1f5f9"
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm",
                  isCompleted || isActive ? "text-white" : "text-slate-400"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isActive && status === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>
              
              <div className="mt-4 text-center">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}>
                  {gate.name.split(":")[1].trim()}
                </p>
                <p className={cn(
                  "text-[8px] leading-tight text-slate-400 hidden md:block",
                  isActive ? "text-slate-600 font-medium" : ""
                )}>
                  {gate.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
