import { describe, expect, it } from "vitest";
import { extractFirstJson, parseResponseBody, parseToolCallArguments } from "./responseParser.js";

describe("extractFirstJson", () => {
  it("parses plain JSON", () => {
    expect(extractFirstJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses JSON in markdown code block", () => {
    expect(extractFirstJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(extractFirstJson('```\n{"a":3}\n```')).toEqual({ a: 3 });
  });

  it("extracts first JSON object from surrounding text", () => {
    expect(extractFirstJson('prefix text {"a":4} suffix')).toEqual({ a: 4 });
  });

  it("returns null for non-JSON", () => {
    expect(extractFirstJson("hello world")).toBeNull();
    expect(extractFirstJson("")).toBeNull();
  });

  it("handles nested objects", () => {
    const text = 'noise {"a":{"b":[1,2,3]}} more';
    expect(extractFirstJson(text)).toEqual({ a: { b: [1, 2, 3] } });
  });
});

describe("parseResponseBody", () => {
  it("parses plain JSON", () => {
    expect(parseResponseBody('{"x":1}')).toEqual({ x: 1 });
  });

  it("parses SSE-style response and picks last data line", () => {
    const sse = `data: {"choices":[{"message":{"content":"hi"}}]}

data: [DONE]`;
    expect(parseResponseBody(sse)).toEqual({ choices: [{ message: { content: "hi" } }] });
  });

  it("handles SSE with multiple data lines", () => {
    const sse = `data: {"choices":[{"message":{"content":"first"}}]}

data: {"choices":[{"message":{"content":"last"}}]}

data: [DONE]`;
    expect(parseResponseBody(sse)).toEqual({ choices: [{ message: { content: "last" } }] });
  });

  it("extracts JSON from markdown-wrapped SSE", () => {
    const body = '```json\n{"ok":true}\n```';
    expect(parseResponseBody(body)).toEqual({ ok: true });
  });

  it("returns empty object for empty input", () => {
    expect(parseResponseBody("")).toEqual({});
    expect(parseResponseBody("   ")).toEqual({});
  });

  it("returns empty object when SSE has no parseable data", () => {
    expect(parseResponseBody("data: [DONE]")).toEqual({});
    expect(parseResponseBody("data: not-json")).toEqual({});
  });

  it("does not throw on malformed JSON", () => {
    expect(() => parseResponseBody("garbage{{{")).not.toThrow();
    expect(parseResponseBody("garbage{{{")).toEqual({});
  });

  it("handles trailing garbage after JSON (the production bug)", () => {
    const body = '{"choices":[{"message":{"content":"x"}}]}\nextra trailing [DONE]';
    expect(parseResponseBody(body)).toEqual({ choices: [{ message: { content: "x" } }] });
  });
});

describe("parseToolCallArguments", () => {
  it("parses plain JSON", () => {
    expect(parseToolCallArguments('{"content":"hello"}')).toEqual({ content: "hello" });
  });

  it("returns null for empty", () => {
    expect(parseToolCallArguments("")).toBeNull();
    expect(parseToolCallArguments("   ")).toBeNull();
  });

  it("handles trailing comma", () => {
    expect(parseToolCallArguments('{"content":"hi",}')).toEqual({ content: "hi" });
  });

  it("extracts JSON from text with prefix", () => {
    expect(parseToolCallArguments('prefix {"a":1}')).toEqual({ a: 1 });
  });

  it("extracts JSON from markdown code block", () => {
    expect(parseToolCallArguments('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("returns null for pure garbage", () => {
    expect(parseToolCallArguments("not json at all")).toBeNull();
  });
});
