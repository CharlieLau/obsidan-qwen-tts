// src/utils/speed-controller.ts

export class SpeedController {
  private currentSpeed: number = 1.0;
  private readonly speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  constructor(initialSpeed: number = 1.0) {
    this.currentSpeed = initialSpeed;
  }

  setSpeed(speed: number): void {
    if (!this.speedOptions.includes(speed)) {
      throw new Error(`Invalid speed: ${speed}. Must be one of ${this.speedOptions.join(', ')}`);
    }
    this.currentSpeed = speed;
  }

  getSpeed(): number {
    return this.currentSpeed;
  }

  getSpeedOptions(): number[] {
    return [...this.speedOptions];
  }

  applyToAudio(audio: HTMLAudioElement): void {
    audio.playbackRate = this.currentSpeed;
  }

  applyToSpeech(utterance: SpeechSynthesisUtterance): void {
    // Web Speech API rate: 0.1 to 10, default 1
    utterance.rate = this.currentSpeed;
  }

  // Convert to Qwen TTS speech_rate parameter (-500 to 500)
  toQwenSpeechRate(): number {
    // 0.5x = -250, 1.0x = 0, 2.0x = 500
    return Math.round((this.currentSpeed - 1.0) * 500);
  }
}
