export class SkillError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillError";
  }
}

export class ParseError extends SkillError {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}
