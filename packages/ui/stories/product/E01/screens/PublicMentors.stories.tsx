import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { useCallback, useEffect, useId, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { EmptyState } from "../../../../src/backend/feedback/EmptyState";
import { ErrorMessage } from "../../../../src/backend/feedback/ErrorMessage";
import { ActiveFilters } from "../../../../src/backend/filters/ActiveFilters";
import { ResultCount } from "../../../../src/backend/filters/ResultCount";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { Pagination } from "../../../../src/backend/tables/Pagination";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { MentorCard, MentorCardSkeleton } from "../../../../src/components/mentors/MentorCard";
import type { PublicMentor } from "../../../../src/components/mentors/types";
import { Button } from "../../../../src/components/ui/button";
import { Field, FieldLabel } from "../../../../src/components/ui/field";
import { ItemGroup } from "../../../../src/components/ui/item";
import { NativeSelect, NativeSelectOption } from "../../../../src/components/ui/native-select";
import { respondError, respondNever } from "../../../mocks/api";
import { manyMentors, nav, publicMentorLong, publicMentorPartial, publicMentors, tagOptions, timeZone } from "../../../mocks/fixtures";

const MENTORS = "/api/mentors";
const PAGE_SIZE = 10;
type Page = { items: PublicMentor[]; page: number; pageSize: number; total: number };

/** A mock `GET /api/mentors?page&pageSize&tag` over a fixed set of mentors (`Page<PublicMentorDto>`, spec E01). */
function mentorsApi(all: PublicMentor[]) {
  return http.get(MENTORS, ({ request }) => {
    const url = new URL(request.url);
    const tag = url.searchParams.get("tag");
    const page = Number(url.searchParams.get("page") ?? 1);
    const matching = tag ? all.filter((mentor) => mentor.tags.includes(tag)) : all;
    const data: Page = { items: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pageSize: PAGE_SIZE, total: matching.length };
    return HttpResponse.json({ ok: true, data });
  });
}

/**
 * `/mentors` (spec E01, Phase 4): the public list of mentors, filtered by stack tag. A dense single-column
 * list (C6) with the result count and the filter in effect. Two different empty states: no mentor matches
 * the filter (offer *Clear filters*) versus nobody is listed yet (nothing to do – a visitor creates nothing).
 */
function PublicMentorsScreen({ initialTag = "" }: { initialTag?: string }) {
  const selectId = useId();
  const [tag, setTag] = useState(initialTag);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), ...(tag ? { tag } : {}) });
    const result = await apiCall<Page>(`${MENTORS}?${query}`);
    setIsLoading(false);
    if (!result.ok) return setError(result.error);
    setData(result.data);
  }, [page, tag]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching when the filter or page changes is the intended effect
    void load();
  }, [load]);

  const filters = tag ? [{ key: "tag", label: `Stack: ${tag}` }] : [];
  const clear = () => {
    setTag("");
    setPage(1);
  };

  return (
    <PageLayout
      header={<AppHeader nav={nav.visitor} currentHref="/mentors" account={<AccountMenu user={null} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Mentors"
      description="Senior engineers who answer in writing. Prices are per session; times are shown in your time zone."
    >
      <div className="flex flex-col gap-in-group">
        <Field className="max-w-48">
          <FieldLabel htmlFor={selectId}>Stack</FieldLabel>
          <NativeSelect
            id={selectId}
            value={tag}
            onChange={(event) => {
              setTag(event.target.value);
              setPage(1);
            }}
          >
            <NativeSelectOption value="">All</NativeSelectOption>
            {tagOptions.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <ActiveFilters filters={filters} onRemove={clear} onClearAll={clear} label="Mentor filters" />
      </div>

      <section aria-label="Mentor list" className="flex flex-col gap-in-group">
        {error ? (
          <ErrorMessage title="Could not load the mentors" error={error} onRetry={() => void load()} />
        ) : !data ? (
          <MentorCardSkeleton />
        ) : (
          <>
            <ResultCount total={data.total} noun="mentor" isLoading={isLoading} />
            {data.total === 0 ? (
              tag ? (
                <EmptyState
                  title="No mentors match this filter"
                  description={`Nobody with ${tag} has a time to book right now.`}
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState title="No mentors here yet" description="Mentors appear once they have set their prices and published a time. Check back soon." />
              )
            ) : (
              <>
                <ItemGroup aria-label="Mentors">
                  {data.items.map((mentor) => (
                    <MentorCard key={mentor.slug} mentor={mentor} href={`/m/${mentor.slug}`} timeZone={timeZone} />
                  ))}
                </ItemGroup>
                {data.total > PAGE_SIZE && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} isLoading={isLoading} label="Mentors pages" />}
              </>
            )}
          </>
        )}
      </section>
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/PublicMentors",
  component: PublicMentorsScreen,
  parameters: { layout: "fullscreen", msw: { handlers: [mentorsApi(publicMentors)] } },
} satisfies Meta<typeof PublicMentorsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four mentors, count above the list, no filter in effect. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("4 mentors")).toBeInTheDocument();
    await expect(canvas.getAllByRole("link", { name: /Zieliński|Lewandowska|Wójcik|Kamińska/ })).toHaveLength(4);
    await expect(canvas.queryByRole("group", { name: "Mentor filters" })).not.toBeInTheDocument();
  },
};

/** Choosing a stack filters the list; the filter is shown and removable; the count follows. */
export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(await canvas.findByLabelText("Stack"), "React");
    await expect(await canvas.findByText("1 mentor")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Remove filter: Stack: React" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(await canvas.findByText("4 mentors")).toBeInTheDocument();
  },
};

/** The filter matches nobody: say so and offer *Clear filters*. */
export const NoResults: Story = {
  args: { initialTag: "React" },
  parameters: { msw: { handlers: [mentorsApi(publicMentors.filter((mentor) => !mentor.tags.includes("React")))] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("No mentors match this filter")).toBeInTheDocument();
    await userEvent.click(canvas.getAllByRole("button", { name: "Clear filters" })[1]);
    await expect(await canvas.findByText("3 mentors")).toBeInTheDocument();
  },
};

/** Nobody is listed yet: a different message, no filter to clear and nothing for a visitor to create. */
export const NobodyListed: Story = {
  parameters: { msw: { handlers: [mentorsApi([])] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("No mentors here yet")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", MENTORS)] } } };

export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", MENTORS, { status: 500, code: "internal_error", message: "Internal server error" })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  },
};

/** Twenty-five mentors in pages of ten. */
export const Many: Story = {
  parameters: { msw: { handlers: [mentorsApi(manyMentors)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("25 mentors")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(await canvas.findByText("11–20 of 25")).toBeInTheDocument();
  },
};

/** The longest values and a profile with optional parts missing, in one list. */
export const LongText: Story = {
  parameters: { msw: { handlers: [mentorsApi([publicMentorLong, publicMentorPartial, ...publicMentors])] } },
};

export const Narrow320: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  parameters: { msw: { handlers: [mentorsApi([publicMentorLong, ...publicMentors])] } },
};

