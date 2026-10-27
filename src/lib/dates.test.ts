import { describe, expect, it } from "vitest";
import { d, fmt, fmtLong, relative, urgency, tile, frac, TODAY } from "./dates";

describe("dates", () => {
  it("formats plain dates (R-29)", () => {
    expect(fmt(d(2026, 10, 14))).toBe("14 Oct");
    expect(fmt(d(2026, 9, 14))).toBe("14 Sep");
    expect(fmtLong(TODAY)).toBe("Tuesday, 6 October 2026");
  });

  it("tiles a date as day and month", () => {
    expect(tile(d(2026, 10, 2))).toEqual({ day: "02", mon: "OCT" });
  });

  it("tints by urgency from today", () => {
    expect(urgency(d(2026, 10, 2))).toBe("bad");
    expect(urgency(d(2026, 10, 9))).toBe("warn");
    expect(urgency(d(2026, 10, 20))).toBe("prog");
    expect(urgency(d(2026, 11, 20))).toBe("idle");
  });

  it("writes relative dates", () => {
    expect(relative(d(2026, 10, 2))).toBe("Overdue");
    expect(relative(d(2026, 10, 6))).toBe("Today");
    expect(relative(d(2026, 10, 7))).toBe("Tomorrow");
    expect(relative(d(2026, 10, 9))).toBe("In 3 days");
    expect(relative(d(2026, 12, 1))).toBe("1 Dec");
  });

  it("clamps a fraction of a span", () => {
    expect(frac(d(2026, 1, 1), d(2026, 2, 1), d(2026, 3, 1))).toBe(0);
    expect(frac(d(2026, 4, 1), d(2026, 2, 1), d(2026, 3, 1))).toBe(1);
  });
});
