import { create } from "zustand";
import { AIAnalysisResponse } from "@/types/ai";
import { SMCAnalysisResult } from "@/types/smc";
import { TechnicalIndicatorsResult } from "@/types/indicators";

interface AnalysisState {
  aiAnalysis: AIAnalysisResponse | null;
  smcResult: SMCAnalysisResult | null;
  indicators: TechnicalIndicatorsResult | null;
  isAnalyzing: boolean;
  error: string | null;

  setAIAnalysis: (analysis: AIAnalysisResponse | null) => void;
  setSMCResult: (smc: SMCAnalysisResult | null) => void;
  setIndicators: (indicators: TechnicalIndicatorsResult | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  aiAnalysis: null,
  smcResult: null,
  indicators: null,
  isAnalyzing: false,
  error: null,

  setAIAnalysis: (aiAnalysis) => set({ aiAnalysis, isAnalyzing: false, error: null }),
  setSMCResult: (smcResult) => set({ smcResult }),
  setIndicators: (indicators) => set({ indicators }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setError: (error) => set({ error, isAnalyzing: false }),
}));
