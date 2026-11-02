import { describe, expect, it } from "vitest";
import { ACTS, parseSections, readAct } from "../scripts/load-laws.mjs";

describe("law text", () => {
  it("splits headings and skips contents lines", () => {
    const sections = parseSections("66C. Punishment for identity theft.\n66C. Punishment for identity theft.—Whoever fraudulently uses a password of another person shall be punished.\n66D. Punishment for cheating.—Whoever cheats by personation using a computer resource shall be punished.");
    expect([...sections.keys()]).toEqual(["66C", "66D"]);
    expect(sections.get("66C")).toContain("password");
  });

  it("reads the real cheating section of the enacted BNS", async () => {
    const sections = await readAct(ACTS[0]);
    expect(sections.get("318")).toMatch(/^318\. Cheating/);
    expect(sections.get("319")).toMatch(/Cheating by personation/);
    expect(sections.size).toBeGreaterThanOrEqual(350);
  }, 60000);

  it("reads the amended hacking sections of the IT Act", async () => {
    const sections = await readAct(ACTS[1]);
    expect(sections.get("43")).toContain("damage to computer");
    expect(sections.get("66")).toContain("Computer related offences");
  });

  it("reads the identity theft and personation sections of the IT Act", async () => {
    const sections = await readAct(ACTS[1]);
    expect(sections.get("66C")).toMatch(/identity theft/i);
    expect(sections.get("66D")).toMatch(/personation/i);
  }, 60000);
});
