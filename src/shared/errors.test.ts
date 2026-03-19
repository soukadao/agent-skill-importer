import { describe, it, expect } from "vitest";
import { SkillError, ParseError } from "./errors.js";

describe("SkillError", () => {
  it("should have the correct name", () => {
    const error = new SkillError("test");
    expect(error.name).toBe("SkillError");
  });

  it("should have the correct message", () => {
    const error = new SkillError("something went wrong");
    expect(error.message).toBe("something went wrong");
  });

  it("should be an instance of Error", () => {
    const error = new SkillError("test");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("ParseError", () => {
  it("should have the correct name", () => {
    const error = new ParseError("test");
    expect(error.name).toBe("ParseError");
  });

  it("should be an instance of SkillError", () => {
    const error = new ParseError("test");
    expect(error).toBeInstanceOf(SkillError);
  });

  it("should be an instance of Error", () => {
    const error = new ParseError("test");
    expect(error).toBeInstanceOf(Error);
  });
});
