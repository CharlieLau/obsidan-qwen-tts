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
