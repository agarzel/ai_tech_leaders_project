// Documentation blocks for the "Start here" and "Components" pages (prompt rule 5: helpers live in the
// Storybook folder and are not exported from the package). The previews are the real stories of each
// component, composed here with `composeStories`, so the catalogue never shows a copy.
import type { ReactNode } from "react";
import { composeStories } from "@storybook/react-vite";

import { COMPONENTS, GROUPS, docsHref, type ComponentEntry, type ComponentGroup } from "./components-data";

import * as ActiveFiltersS from "../../stories/blocks/ActiveFilters.stories";
import * as AppHeaderS from "../../stories/blocks/AppHeader.stories";
import * as CopyFieldS from "../../stories/blocks/CopyField.stories";
import * as CrudFormS from "../../stories/blocks/CrudForm.stories";
import * as DataTableS from "../../stories/blocks/DataTable.stories";
import * as EmptyStateS from "../../stories/blocks/EmptyState.stories";
import * as ErrorMessageS from "../../stories/blocks/ErrorMessage.stories";
import * as LoadingMessageS from "../../stories/blocks/LoadingMessage.stories";
import * as PageLayoutS from "../../stories/blocks/PageLayout.stories";
import * as PaginationS from "../../stories/blocks/Pagination.stories";
import * as ResultCountS from "../../stories/blocks/ResultCount.stories";
import * as RoleNavS from "../../stories/blocks/RoleNav.stories";
import * as AlertS from "../../stories/primitives/Alert.stories";
import * as AlertDialogS from "../../stories/primitives/AlertDialog.stories";
import * as AvatarS from "../../stories/primitives/Avatar.stories";
import * as BadgeS from "../../stories/primitives/Badge.stories";
import * as ButtonS from "../../stories/primitives/Button.stories";
import * as CardS from "../../stories/primitives/Card.stories";
import * as CheckboxS from "../../stories/primitives/Checkbox.stories";
import * as DialogS from "../../stories/primitives/Dialog.stories";
import * as DropdownMenuS from "../../stories/primitives/DropdownMenu.stories";
import * as FieldS from "../../stories/primitives/Field.stories";
import * as InputS from "../../stories/primitives/Input.stories";
import * as InputGroupS from "../../stories/primitives/InputGroup.stories";
import * as ItemS from "../../stories/primitives/Item.stories";
import * as KbdS from "../../stories/primitives/Kbd.stories";
import * as LabelS from "../../stories/primitives/Label.stories";
import * as NativeSelectS from "../../stories/primitives/NativeSelect.stories";
import * as PopoverS from "../../stories/primitives/Popover.stories";
import * as RadioGroupS from "../../stories/primitives/RadioGroup.stories";
import * as SeparatorS from "../../stories/primitives/Separator.stories";
import * as SkeletonS from "../../stories/primitives/Skeleton.stories";
import * as SpinnerS from "../../stories/primitives/Spinner.stories";
import * as SwitchS from "../../stories/primitives/Switch.stories";
import * as TableS from "../../stories/primitives/Table.stories";
import * as TabsS from "../../stories/primitives/Tabs.stories";
import * as TextLinkS from "../../stories/primitives/TextLink.stories";
import * as TextareaS from "../../stories/primitives/Textarea.stories";
import * as TooltipS from "../../stories/primitives/Tooltip.stories";
import * as AccountMenuS from "../../stories/product/E01/AccountMenu.stories";
import * as AddSlotFormS from "../../stories/product/E01/AddSlotForm.stories";
import * as DeleteSlotDialogS from "../../stories/product/E01/DeleteSlotDialog.stories";
import * as InvitationLinkPanelS from "../../stories/product/E01/InvitationLinkPanel.stories";
import * as InvitationStatusBadgeS from "../../stories/product/E01/InvitationStatusBadge.stories";
import * as MentorCardS from "../../stories/product/E01/MentorCard.stories";
import * as MentorProfileFormS from "../../stories/product/E01/MentorProfileForm.stories";
import * as MentorProfileHeaderS from "../../stories/product/E01/MentorProfileHeader.stories";
import * as OfferChecklistS from "../../stories/product/E01/OfferChecklist.stories";
import * as PriceListS from "../../stories/product/E01/PriceList.stories";
import * as PublicWorkLinksS from "../../stories/product/E01/PublicWorkLinks.stories";
import * as SlotListS from "../../stories/product/E01/SlotList.stories";
import * as SlotTimeFieldS from "../../stories/product/E01/SlotTimeField.stories";
import * as TagListS from "../../stories/product/E01/TagList.stories";
import * as AcceptDeadlineS from "../../stories/product/E02/AcceptDeadline.stories";
import * as BookingFormS from "../../stories/product/E02/BookingForm.stories";
import * as BookingQuestionS from "../../stories/product/E02/BookingQuestion.stories";
import * as BookingRowS from "../../stories/product/E02/BookingRow.stories";
import * as BookingStatusBadgeS from "../../stories/product/E02/BookingStatusBadge.stories";
import * as BookingStatusPanelS from "../../stories/product/E02/BookingStatusPanel.stories";
import * as BookingSummaryS from "../../stories/product/E02/BookingSummary.stories";
import * as DeclineBookingDialogS from "../../stories/product/E02/DeclineBookingDialog.stories";
import * as MentorBookingRowS from "../../stories/product/E02/MentorBookingRow.stories";
import * as PaymentPendingS from "../../stories/product/E02/PaymentPending.stories";
import * as PendingBookingsNoticeS from "../../stories/product/E02/PendingBookingsNotice.stories";
import * as QuestionFieldS from "../../stories/product/E02/QuestionField.stories";
import * as SlotBookActionsS from "../../stories/product/E02/SlotBookActions.stories";

/** One small working preview per component: the story named here, rendered by `composeStories`. */
const previews: Record<string, () => ReactNode> = {
  Button: () => <composed.Button.Playground />,
  TextLink: () => <composed.TextLink.Playground />,
  DropdownMenu: () => <composed.DropdownMenu.Playground />,
  Field: () => <composed.Field.Playground />,
  Label: () => <composed.Label.Playground />,
  Input: () => <composed.Input.Playground />,
  InputGroup: () => <composed.InputGroup.Playground />,
  Textarea: () => <composed.Textarea.Playground />,
  NativeSelect: () => <composed.NativeSelect.Playground />,
  Checkbox: () => <composed.Checkbox.Playground />,
  RadioGroup: () => <composed.RadioGroup.Playground />,
  Switch: () => <composed.Switch.Playground />,
  CrudForm: () => <composed.CrudForm.Playground />,
  CopyField: () => <composed.CopyField.Playground />,
  Alert: () => <composed.Alert.Playground />,
  Badge: () => <composed.Badge.Playground />,
  Spinner: () => <composed.Spinner.Playground />,
  Skeleton: () => <composed.Skeleton.Playground />,
  EmptyState: () => <composed.EmptyState.Playground />,
  ErrorMessage: () => <composed.ErrorMessage.Playground />,
  LoadingMessage: () => <composed.LoadingMessage.Playground />,
  Dialog: () => <composed.Dialog.Playground />,
  AlertDialog: () => <composed.AlertDialog.Playground />,
  Popover: () => <composed.Popover.Playground />,
  Tooltip: () => <composed.Tooltip.Playground />,
  Card: () => <composed.Card.Playground />,
  Separator: () => <composed.Separator.Playground />,
  Tabs: () => <composed.Tabs.Playground />,
  PageLayout: () => <composed.PageLayout.Playground />,
  AppHeader: () => <composed.AppHeader.Playground />,
  RoleNav: () => <composed.RoleNav.Playground />,
  Avatar: () => <composed.Avatar.Playground />,
  Kbd: () => <composed.Kbd.Playground />,
  Item: () => <composed.Item.Playground />,
  Table: () => <composed.Table.Playground />,
  DataTable: () => <composed.DataTable.Playground />,
  Pagination: () => <composed.Pagination.Playground />,
  ActiveFilters: () => <composed.ActiveFilters.Playground />,
  ResultCount: () => <composed.ResultCount.Playground />,
  AccountMenu: () => <composed.AccountMenu.Playground />,
  InvitationLinkPanel: () => <composed.InvitationLinkPanel.Playground />,
  InvitationStatusBadge: () => <composed.InvitationStatusBadge.Playground />,
  TagList: () => <composed.TagList.Playground />,
  PublicWorkLinks: () => <composed.PublicWorkLinks.Playground />,
  PriceList: () => <composed.PriceList.Playground />,
  MentorProfileHeader: () => <composed.MentorProfileHeader.Playground />,
  MentorCard: () => <composed.MentorCard.Playground />,
  OfferChecklist: () => <composed.OfferChecklist.Playground />,
  MentorProfileForm: () => <composed.MentorProfileForm.Playground />,
  SlotTimeField: () => <composed.SlotTimeField.Playground />,
  AddSlotForm: () => <composed.AddSlotForm.Playground />,
  SlotList: () => <composed.SlotList.Playground />,
  DeleteSlotDialog: () => <composed.DeleteSlotDialog.Playground />,
  SlotBookActions: () => <composed.SlotBookActions.Playground />,
  BookingSummary: () => <composed.BookingSummary.Playground />,
  QuestionField: () => <composed.QuestionField.Playground />,
  BookingForm: () => <composed.BookingForm.Playground />,
  PaymentPending: () => <composed.PaymentPending.Checking />,
  BookingStatusBadge: () => <composed.BookingStatusBadge.Playground />,
  BookingStatusPanel: () => <composed.BookingStatusPanel.WaitingMentee />,
  BookingQuestion: () => <composed.BookingQuestion.Playground />,
  BookingRow: () => <composed.BookingRow.Playground />,
  MentorBookingRow: () => <composed.MentorBookingRow.Playground />,
  AcceptDeadline: () => <composed.AcceptDeadline.MoreThanTwoHours />,
  DeclineBookingDialog: () => <composed.DeclineBookingDialog.Playground />,
  PendingBookingsNotice: () => <composed.PendingBookingsNotice.Playground />,
};

const composed = {
  ActiveFilters: composeStories(ActiveFiltersS),
  AppHeader: composeStories(AppHeaderS),
  CopyField: composeStories(CopyFieldS),
  CrudForm: composeStories(CrudFormS),
  DataTable: composeStories(DataTableS),
  EmptyState: composeStories(EmptyStateS),
  ErrorMessage: composeStories(ErrorMessageS),
  LoadingMessage: composeStories(LoadingMessageS),
  PageLayout: composeStories(PageLayoutS),
  Pagination: composeStories(PaginationS),
  ResultCount: composeStories(ResultCountS),
  RoleNav: composeStories(RoleNavS),
  Alert: composeStories(AlertS),
  AlertDialog: composeStories(AlertDialogS),
  Avatar: composeStories(AvatarS),
  Badge: composeStories(BadgeS),
  Button: composeStories(ButtonS),
  Card: composeStories(CardS),
  Checkbox: composeStories(CheckboxS),
  Dialog: composeStories(DialogS),
  DropdownMenu: composeStories(DropdownMenuS),
  Field: composeStories(FieldS),
  Input: composeStories(InputS),
  InputGroup: composeStories(InputGroupS),
  Item: composeStories(ItemS),
  Kbd: composeStories(KbdS),
  Label: composeStories(LabelS),
  NativeSelect: composeStories(NativeSelectS),
  Popover: composeStories(PopoverS),
  RadioGroup: composeStories(RadioGroupS),
  Separator: composeStories(SeparatorS),
  Skeleton: composeStories(SkeletonS),
  Spinner: composeStories(SpinnerS),
  Switch: composeStories(SwitchS),
  Table: composeStories(TableS),
  Tabs: composeStories(TabsS),
  TextLink: composeStories(TextLinkS),
  Textarea: composeStories(TextareaS),
  Tooltip: composeStories(TooltipS),
  AccountMenu: composeStories(AccountMenuS),
  AddSlotForm: composeStories(AddSlotFormS),
  DeleteSlotDialog: composeStories(DeleteSlotDialogS),
  InvitationLinkPanel: composeStories(InvitationLinkPanelS),
  InvitationStatusBadge: composeStories(InvitationStatusBadgeS),
  MentorCard: composeStories(MentorCardS),
  MentorProfileForm: composeStories(MentorProfileFormS),
  MentorProfileHeader: composeStories(MentorProfileHeaderS),
  OfferChecklist: composeStories(OfferChecklistS),
  PriceList: composeStories(PriceListS),
  PublicWorkLinks: composeStories(PublicWorkLinksS),
  SlotList: composeStories(SlotListS),
  SlotTimeField: composeStories(SlotTimeFieldS),
  TagList: composeStories(TagListS),
  AcceptDeadline: composeStories(AcceptDeadlineS),
  BookingForm: composeStories(BookingFormS),
  BookingQuestion: composeStories(BookingQuestionS),
  BookingRow: composeStories(BookingRowS),
  BookingStatusBadge: composeStories(BookingStatusBadgeS),
  BookingStatusPanel: composeStories(BookingStatusPanelS),
  BookingSummary: composeStories(BookingSummaryS),
  DeclineBookingDialog: composeStories(DeclineBookingDialogS),
  MentorBookingRow: composeStories(MentorBookingRowS),
  PaymentPending: composeStories(PaymentPendingS),
  PendingBookingsNotice: composeStories(PendingBookingsNoticeS),
  QuestionField: composeStories(QuestionFieldS),
  SlotBookActions: composeStories(SlotBookActionsS),
};

const cell = "border-b border-border px-list-row py-list-row text-left align-top";
const head = `${cell} type-meta text-muted-foreground font-medium`;

/** Text with `code` segments (backticks) rendered as code. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className="type-code">
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Opens the component's documentation page in the Storybook manager (the preview sits in an iframe). */
function PageLink({ entry, children }: { entry: ComponentEntry; children: ReactNode }) {
  return (
    <a href={docsHref(entry)} target="_top" className="link-text">
      {children}
    </a>
  );
}

function Frame({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card text-card-foreground">
      <table className="w-full border-collapse type-body">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

/** "Start here": name, import, when, when not – for every component. */
export function ComponentTable({ group }: { group?: ComponentGroup }) {
  const rows = group ? COMPONENTS.filter((entry) => entry.group === group) : COMPONENTS;
  return (
    <Frame caption={group ? `Components: ${group}` : "All components"}>
      <thead className="bg-muted">
        <tr>
          {["Component", "Import", "Use when", "Do not use when"].map((title) => (
            <th key={title} scope="col" className={head}>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((entry) => (
          <tr key={entry.name}>
            <th scope="row" className={`${cell} type-label`}>
              <PageLink entry={entry}>{entry.name}</PageLink>
            </th>
            <td className={`${cell} type-meta break-words`}>
              <code className="type-code">{entry.importLine}</code>
            </td>
            <td className={cell}>
              <Rich text={entry.when} />
            </td>
            <td className={cell}>
              <Rich text={entry.whenNot} />
            </td>
          </tr>
        ))}
      </tbody>
    </Frame>
  );
}

/** A small working preview: the component's own story in a bordered, scrollable box. */
function Preview({ entry }: { entry: ComponentEntry }) {
  return (
    <div
      role="group"
      aria-label={`Preview of ${entry.name}`}
      // tabIndex: a scrollable region must be reachable by keyboard (WCAG 2.1.1)
      tabIndex={0}
      className="max-h-56 min-w-56 max-w-md overflow-auto rounded-lg border border-border bg-background p-panel"
    >
      {previews[entry.name]()}
    </div>
  );
}

/** "Components": per group a table with preview, description and a link to the documentation page. */
export function ComponentCatalogue({ group }: { group: ComponentGroup }) {
  const rows = COMPONENTS.filter((entry) => entry.group === group);
  return (
    <Frame caption={`Components: ${group}`}>
      <thead className="bg-muted">
        <tr>
          {["Component", "Preview", "What it is for", "Documentation"].map((title) => (
            <th key={title} scope="col" className={head}>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((entry) => (
          <tr key={entry.name}>
            <th scope="row" className={`${cell} type-label`}>
              {entry.name}
              <span className="block type-meta font-normal text-muted-foreground">{entry.section}</span>
            </th>
            <td className={cell}>
              <Preview entry={entry} />
            </td>
            <td className={cell}>{entry.purpose}</td>
            <td className={cell}>
              <PageLink entry={entry}>Open the page</PageLink>
            </td>
          </tr>
        ))}
      </tbody>
    </Frame>
  );
}

/** Every group with its one-line intro, for the pages that list all of them. */
export { GROUPS };
