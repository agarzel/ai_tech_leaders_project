import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Regression test for the `<form method="post">` rule in eslint.config.mjs (threat model T-13, lesson 17):
// the selector is easy to break silently, so it is checked against the real config.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const eslint = new ESLint({ cwd: root });

async function formErrors(source) {
  const [result] = await eslint.lintText(source, { filePath: path.join(root, "packages/ui/src/form-method-rule-fixture.tsx") });
  return result.messages.filter((message) => message.ruleId === "no-restricted-syntax").map((message) => message.message);
}

describe("form method lint rule", () => {
  it("refuses a form without method", async () => {
    expect(await formErrors("export const F = () => <form onSubmit={() => {}} />;\n")).toEqual([expect.stringContaining("T-13")]);
  });

  it.each(['method="get"', "method={undefined}"])("refuses %s", async (attribute) => {
    expect(await formErrors(`export const F = () => <form ${attribute} />;\n`)).toHaveLength(1);
  });

  it.each(['method="post"', 'method="POST"'])("accepts %s", async (attribute) => {
    expect(await formErrors(`export const F = () => <form ${attribute} />;\n`)).toEqual([]);
  });

  it("leaves forms with an action alone (React posts them and rejects a method)", async () => {
    expect(await formErrors("const save = async () => {};\nexport const F = () => <form action={save} />;\n")).toEqual([]);
  });
}, 60_000);
