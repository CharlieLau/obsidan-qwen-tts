// src/dialogue/dialogue-template-manager.ts

import { DialogueTemplate, RoleDefinition } from './types';

export class DialogueTemplateManager {
  private templates: Map<string, DialogueTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Template 1: Solo Lecture
    this.templates.set('solo', {
      id: 'solo',
      name: '单人讲解',
      icon: '📖',
      description: '适合知识传授、教程',
      roles: [
        {
          name: '讲解者',
          voice: 'Ethan',
          personality: '清晰、有条理地讲解内容'
        }
      ]
    });

    // Template 2: Duo Dialogue
    this.templates.set('duo', {
      id: 'duo',
      name: '双人对话',
      icon: '💬',
      description: '适合轻松讨论、播客',
      roles: [
        {
          name: '对话者A',
          voice: 'Cherry',
          personality: '活泼、好奇'
        },
        {
          name: '对话者B',
          voice: 'Serena',
          personality: '理性、温和'
        }
      ]
    });

    // Template 3: Classroom
    this.templates.set('classroom', {
      id: 'classroom',
      name: '三人课堂',
      icon: '📚',
      description: '适合深度学习、课堂',
      roles: [
        {
          name: '讲师',
          voice: 'Ethan',
          personality: '经验丰富，讲解清晰'
        },
        {
          name: '好奇学生',
          voice: 'Cherry',
          personality: '充满好奇，提出基础问题'
        },
        {
          name: '批判学生',
          voice: 'Serena',
          personality: '善于思考，提出深度问题'
        }
      ]
    });

    // Template 4: Debate
    this.templates.set('debate', {
      id: 'debate',
      name: '双人辩论',
      icon: '⚔️',
      description: '适合观点碰撞、辩论',
      roles: [
        {
          name: '正方',
          voice: 'Ethan',
          personality: '坚定、有力地阐述观点'
        },
        {
          name: '反方',
          voice: 'Kai',
          personality: '批判性思考，提出反驳'
        }
      ]
    });

    // Template 5: Interview
    this.templates.set('interview', {
      id: 'interview',
      name: '访谈模式',
      icon: '🎙️',
      description: '适合人物采访、话题访谈',
      roles: [
        {
          name: '主持人',
          voice: 'Cherry',
          personality: '引导话题，提出关键问题'
        },
        {
          name: '嘉宾',
          voice: 'Ethan',
          personality: '分享见解，回答问题'
        }
      ]
    });
  }

  getTemplates(): DialogueTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): DialogueTemplate | undefined {
    return this.templates.get(id);
  }

  getDefaultTemplate(): DialogueTemplate {
    return this.templates.get('classroom')!;
  }
}
