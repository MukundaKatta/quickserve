import { describe, it, expect } from "vitest";
import { Quickserve } from "../src/core.js";
describe("Quickserve", () => {
  it("init", () => { expect(new Quickserve().getStats().ops).toBe(0); });
  it("op", async () => { const c = new Quickserve(); await c.process(); expect(c.getStats().ops).toBe(1); });
  it("reset", async () => { const c = new Quickserve(); await c.process(); c.reset(); expect(c.getStats().ops).toBe(0); });
});
