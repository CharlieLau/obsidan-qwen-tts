// src/dialogue/types.ts

export type DialogueRole = 'host' | 'curious' | 'critical';

export interface DialogueLine {
  role: DialogueRole;
  content: string;
  voice: string;
}

export interface DialogueValidation {
  isValid: boolean;
  errors: string[];
}

export interface DialogueLength {
  targetRounds: number;
  estimatedMinutes: number;
  detailLevel: 'brief' | 'moderate' | 'detailed';
}

export type DialogueGenerationStage =
  | 'analyzing'
  | 'generating'
  | 'saving'
  | 'preparing'
  | 'complete';

export interface DialogueGenerationProgress {
  stage: DialogueGenerationStage;
  message: string;
  percentage: number;
}

export type ProgressCallback = (progress: DialogueGenerationProgress) => void;
