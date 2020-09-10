export class ProgbotError extends Error {
  public code: string;
  public message: any;

  public constructor(code: string, message: any) {
    super(message);
    this.code = code || 'PROGBOT_ERROR';
    this.message = message || '';
  }
}
