import { describe, expect, it } from "vitest";
import { PUBLIC_MENTORS_DEFAULT_PAGE_SIZE, PUBLIC_MENTORS_MAX_PAGE_SIZE, publicMentorQuerySchema } from "./public-mentor-query.schema";

describe("publicMentorQuerySchema", () => {
  it("applies the defaults to an empty query", () => {
    expect(publicMentorQuerySchema.parse({})).toEqual({ page: 1, pageSize: PUBLIC_MENTORS_DEFAULT_PAGE_SIZE });
  });

  it("coerces string query values and accepts a known tag", () => {
    expect(publicMentorQuerySchema.parse({ page: "2", pageSize: "10", tag: "React" })).toEqual({ page: 2, pageSize: 10, tag: "React" });
  });

  it("clamps a page size above the maximum", () => {
    expect(publicMentorQuerySchema.parse({ pageSize: "1000" }).pageSize).toBe(PUBLIC_MENTORS_MAX_PAGE_SIZE);
  });

  it("keeps a page size equal to the maximum", () => {
    expect(publicMentorQuerySchema.parse({ pageSize: String(PUBLIC_MENTORS_MAX_PAGE_SIZE) }).pageSize).toBe(PUBLIC_MENTORS_MAX_PAGE_SIZE);
  });

  it.each([
    ["page below 1", { page: "0" }],
    ["fractional page", { page: "1.5" }],
    ["non-numeric page", { page: "abc" }],
    ["page size below 1", { pageSize: "0" }],
    ["negative page size", { pageSize: "-5" }],
    ["fractional page size", { pageSize: "2.5" }],
    ["non-numeric page size", { pageSize: "many" }],
    ["unknown tag", { tag: "Cobol" }],
  ])("rejects %s", (_name, query) => {
    expect(publicMentorQuerySchema.safeParse(query).success).toBe(false);
  });
});
