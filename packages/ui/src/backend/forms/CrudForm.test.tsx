import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ApiResult } from "../api/types";
import { CrudForm, type CrudFormField } from "./CrudForm";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  role: z.enum(["mentor", "mentee"]),
  age: z.number().optional(),
  nickname: z.string().nullable().default(null),
});

const fields: CrudFormField<typeof schema>[] = [
  { name: "name", label: "Name", placeholder: "Ada" },
  { name: "email", label: "Email" },
  { name: "role", label: "Role" },
  { name: "age", label: "Age" },
  { name: "nickname", label: "Nickname" },
];

const ok: ApiResult<unknown> = { ok: true, data: null, status: 200 };

function setup(props: Partial<Parameters<typeof CrudForm<typeof schema>>[0]> = {}) {
  const onSubmit = vi.fn(async () => ok);
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  render(<CrudForm schema={schema} fields={fields} onSubmit={onSubmit} onSuccess={onSuccess} onCancel={onCancel} {...props} />);
  return { onSubmit: (props.onSubmit as typeof onSubmit) ?? onSubmit, onSuccess, onCancel };
}

async function fillValid() {
  await userEvent.type(screen.getByLabelText("Name"), "Ada");
  await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
}

describe("CrudForm", () => {
  it("renders inputs inferred from the schema", () => {
    setup();

    expect(screen.getByLabelText("Name")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Name")).toHaveAttribute("placeholder", "Ada");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Age")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("Nickname")).toHaveAttribute("type", "text");
    const role = screen.getByLabelText("Role");
    expect(role.tagName).toBe("SELECT");
    // Enums default to their first option.
    expect(role).toHaveValue("mentor");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("uses initial values when provided, ignoring null ones", () => {
    setup({ initialValues: { name: "Grace", role: "mentee", age: 42, nickname: null } });

    expect(screen.getByLabelText("Name")).toHaveValue("Grace");
    expect(screen.getByLabelText("Role")).toHaveValue("mentee");
    expect(screen.getByLabelText("Age")).toHaveValue(42);
    expect(screen.getByLabelText("Nickname")).toHaveValue("");
  });

  it("shows client-side errors next to fields and does not submit", async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Name is required");
    expect(screen.getByLabelText("Role")).not.toHaveAttribute("aria-invalid");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits parsed values (numbers converted, empty numbers omitted) and calls onSuccess", async () => {
    const { onSubmit, onSuccess } = setup({ submitLabel: "Create" });
    await fillValid();
    await userEvent.selectOptions(screen.getByLabelText("Role"), "mentee");

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Ada", email: "ada@example.com", role: "mentee", nickname: "" });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("converts filled number fields", async () => {
    const { onSubmit } = setup();
    await fillValid();
    await userEvent.type(screen.getByLabelText("Age"), "36");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ age: 36 }));
  });

  it("works without onSuccess and onCancel", async () => {
    const onSubmit = vi.fn(async () => ok);
    render(<CrudForm schema={schema} fields={fields} onSubmit={onSubmit} />);
    await fillValid();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.keyboard("{Escape}");

    expect(onSubmit).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("shows server field errors and the form error", async () => {
    const onSubmit = vi.fn(
      async (): Promise<ApiResult<unknown>> => ({
        ok: false,
        status: 409,
        error: { code: "conflict", message: "Already exists", fieldErrors: { email: ["Email taken"] } },
      }),
    );
    setup({ onSubmit });
    await fillValid();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
    expect(screen.getByRole("alert")).toHaveTextContent("Already exists");
    expect(screen.getByText("Email taken")).toBeInTheDocument();
  });

  it("shows a server error without field errors", async () => {
    const onSubmit = vi.fn(
      async (): Promise<ApiResult<unknown>> => ({ ok: false, status: 0, error: { code: "network_error", message: "Offline" } }),
    );
    const { onSuccess } = setup({ onSubmit });
    await fillValid();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Offline");
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("disables the form while submitting and ignores repeated submits", async () => {
    let finish: (result: ApiResult<unknown>) => void = () => undefined;
    const onSubmit = vi.fn(() => new Promise<ApiResult<unknown>>((resolve) => (finish = resolve)));
    setup({ onSubmit });
    await fillValid();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByLabelText("Name")).toBeDisabled();
    // A second submit while saving (double click before re-render, programmatic requestSubmit) is ignored.
    fireEvent.submit(screen.getByLabelText("Name").closest("form")!);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => finish(ok));
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it.each([
    ["Cmd+Enter", "{Meta>}{Enter}{/Meta}"],
    ["Ctrl+Enter", "{Control>}{Enter}{/Control}"],
  ])("submits with %s", async (_label, keys) => {
    const { onSubmit } = setup();
    await fillValid();

    await userEvent.keyboard(keys);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit on plain Enter in a text field via the shortcut handler", async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByLabelText("Name"));

    await userEvent.keyboard("a");

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels with Escape and with the Cancel button", async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByLabelText("Name"));

    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("renders an empty select for an enum without options", () => {
    const emptyEnum = z.object({ kind: z.enum([] as unknown as ["x"]) });
    render(<CrudForm schema={emptyEnum} fields={[{ name: "kind", label: "Kind" }]} onSubmit={vi.fn()} />);

    const select = screen.getByLabelText<HTMLSelectElement>("Kind");
    expect(select.options).toHaveLength(0);
    expect(select.value).toBe("");
  });
});
