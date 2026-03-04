// src/dialogue/types.ts

export type DialogueMode = 'education' | 'podcast';

// 教育模式角色
export type EducationRole = 'host' | 'curious' | 'critical';

// 播客模式角色
export type PodcastRole = 'host1' | 'host2';

export type DialogueRole = EducationRole | PodcastRole;

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
