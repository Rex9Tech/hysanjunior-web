// src/services/atom.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import AtomService from "./atom.service";

describe("AtomService CRUD operations", () => {
  beforeEach(() => {
    AtomService.remove("testKey");
    AtomService.remove("testUser");
    AtomService.remove("testCount");
  });

  it("sets and gets primitive values", () => {
    expect(AtomService.get<string>("testKey")).toBeUndefined();

    AtomService.set("testKey", "hello_world");
    expect(AtomService.get<string>("testKey")).toBe("hello_world");
  });

  it("sets and gets structured objects", () => {
    const user = { id: "123", name: "Rex", active: true };
    AtomService.set("testUser", user);

    expect(AtomService.get<typeof user>("testUser")).toEqual(user);
  });

  it("removes stored items", () => {
    AtomService.set("testKey", "temporary");
    expect(AtomService.get<string>("testKey")).toBe("temporary");

    AtomService.remove("testKey");
    expect(AtomService.get<string>("testKey")).toBeUndefined();
  });

  it("creates and caches Jotai atoms via getAtom", () => {
    const atom1 = AtomService.getAtom("testCount", 0);
    const atom2 = AtomService.getAtom("testCount", 99);

    // Should return the cached atom instance
    expect(atom1).toBe(atom2);
  });

  it("retrieves loaded atom keys via getKeys", () => {
    AtomService.getAtom("testKey1", "val1");
    AtomService.getAtom("testKey2", "val2");

    const keys = AtomService.getKeys();
    expect(keys).toContain("testKey1");
    expect(keys).toContain("testKey2");
  });
});
