import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 transition-all">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Search className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">CHECKER</h1>
            <p className="text-[10px] font-bold text-indigo-600 tracking-[0.2em] uppercase">Fake News Detector</p>
          </div>
        </div>
      </div>
    </header>
  );
}
