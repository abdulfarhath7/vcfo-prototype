import { describe, expect, it } from "vitest";
import { NOC_SAMPLES, receiveChecks, resolveNocVariant, trackEvents, type NocCase } from "./board-resolution";
import { nocPath } from "@/components/cards/NocTree";

// docs/BOARD-RESOLUTION-NOC.md section 7.

describe("resolveNocVariant", () => {
  const want: Record<NocCase, string | null> = { foreign: "foreign-parent", name: "indian-name-only", investing: "indian-investing", unset: null };
  for (const k of Object.keys(want) as NocCase[]) {
    it(`gives the variant for the ${k} sample`, () => expect(resolveNocVariant(NOC_SAMPLES[k].answers)).toBe(want[k]));
  }
  it("gives no NOC for a standalone company", () => expect(resolveNocVariant({ ownershipType: "independent", companyType: "foreign", parentIndianRelationship: null })).toBeNull());
});

describe("tree path", () => {
  it("lights the path that the variant gives", () => {
    expect(nocPath(NOC_SAMPLES.foreign.answers).at(-1)).toBe("nocf");
    expect(nocPath(NOC_SAMPLES.name.answers).at(-1)).toBe("ni1");
    expect(nocPath(NOC_SAMPLES.investing.answers).at(-1)).toBe("ni2");
    expect(nocPath(NOC_SAMPLES.unset.answers).at(-1)).toBe("ni3");
  });
});

describe("track and checklist", () => {
  it("has 6 steps for a foreign parent and 4 for an Indian parent", () => {
    expect(trackEvents(true, true)).toHaveLength(6);
    expect(trackEvents(false, true)).toHaveLength(4);
    expect(trackEvents(true, false)).toHaveLength(4);
  });
  it("has 6 checks for a foreign parent and 4 for an Indian parent", () => {
    expect(receiveChecks(true, true)).toHaveLength(6);
    expect(receiveChecks(false, true)).toHaveLength(4);
  });
});
