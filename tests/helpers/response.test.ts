/**
 * Тесты: response хелперы (ok / err).
 */

import { describe, it, expect } from "vitest";
import { ok, err } from "../../src/helpers/response.js";

describe("response helpers", () => {
  describe("ok()", () => {
    it("должен вернуть content с JSON-строкой", () => {
      const result = ok({ foo: "bar", num: 42 });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(JSON.parse(result.content[0].text)).toEqual({ foo: "bar", num: 42 });
    });

    it("должен обрабатывать null/undefined/массивы", () => {
      expect(JSON.parse(ok(null).content[0].text)).toBeNull();
      expect(JSON.parse(ok([1, 2, 3]).content[0].text)).toEqual([1, 2, 3]);
    });

    it("не должен иметь поле isError", () => {
      const result = ok("test");
      expect(result).not.toHaveProperty("isError");
    });
  });

  describe("err()", () => {
    it("должен извлечь message из Error", () => {
      const result = err(new Error("что-то сломалось"));

      expect(result.content[0].text).toBe("Ошибка: что-то сломалось");
      expect(result.isError).toBe(true);
    });

    it("должен конвертировать не-Error в строку", () => {
      const result = err("plain string error");
      expect(result.content[0].text).toBe("Ошибка: plain string error");
    });

    it("должен конвертировать число в строку", () => {
      const result = err(404);
      expect(result.content[0].text).toBe("Ошибка: 404");
    });
  });
});
