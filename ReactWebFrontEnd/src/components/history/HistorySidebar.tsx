import { motion, AnimatePresence } from "motion/react";
import { History, X, Clock, ExternalLink, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface HistoryItem {
  id: string;
  input: string;
  verdict: string;
  timestamp: number;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export function HistorySidebar({ isOpen, onClose, items, onSelectItem, onClearHistory }: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          
          {/* Sidebar */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Lịch sử kiểm tra</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Clock className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium">Chưa có dữ liệu lịch sử</p>
                  <p className="text-xs text-slate-400 mt-1">Kết quả kiểm tra của bạn sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div 
                    key={item.id}
                    layoutId={item.id}
                    onClick={() => onSelectItem(item)}
                    className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                        item.verdict === "True" ? "bg-emerald-100 text-emerald-700" :
                        item.verdict === "Fake" ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {item.verdict}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 line-clamp-2 pr-4">
                      {item.input}
                    </p>
                    <ExternalLink className="absolute right-4 bottom-4 w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={onClearHistory}
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả lịch sử
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
