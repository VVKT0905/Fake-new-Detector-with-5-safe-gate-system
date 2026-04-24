import { useState, useEffect } from "react";
import { HistoryItem } from "../components/history/HistorySidebar";

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("checker_history");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addItem = (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...items].slice(0, 20); // Keep last 20
    setItems(updated);
    localStorage.setItem("checker_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setItems([]);
    localStorage.removeItem("checker_history");
  };

  return { items, addItem, clearHistory };
}
