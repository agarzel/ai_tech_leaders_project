// Data behind the "Start here" table and the "Components" catalogue (stage 4). One list, two views; the agent
// file `.ai/docs/design-system.md` repeats it as a table – change a row here and there (Contributing page).
// Every row points at a component that exists in packages/ui. The when / when-not wording is taken from the
// "When to use" and "When not to use" sections of the component's own documentation page.

export type ComponentGroup =
  | "Actions"
  | "Forms and input"
  | "Feedback and states"
  | "Overlays"
  | "Structure and navigation"
  | "Lists and data"
  | "Mentor offer (E01)"
  | "Booking and prepayment (E02)"
  | "Session and aftermath (E03)";

/** The Storybook section the component's page lives in (the first part of its story title). */
export type ComponentSection = "Primitives" | "Primitives/Panel blocks" | "Product/E01" | "Product/E02" | "Product/E03";

export type ComponentEntry = {
  name: string;
  group: ComponentGroup;
  section: ComponentSection;
  /** Title segment when it differs from the component name (only "Text link"). */
  pageName?: string;
  importLine: string;
  /** One sentence: the user's problem it solves. */
  purpose: string;
  when: string;
  whenNot: string;
};

export const GROUPS: { name: ComponentGroup; intro: string }[] = [
  { name: "Actions", intro: "Start something now or follow a reference." },
  { name: "Forms and input", intro: "Collect values and tell the person what to fix." },
  { name: "Feedback and states", intro: "Say what is happening, what failed and what is empty." },
  { name: "Overlays", intro: "Interrupt or annotate the page, then give focus back." },
  { name: "Structure and navigation", intro: "Frame a page, group a topic, move between places." },
  { name: "Lists and data", intro: "Show many things of one kind." },
  { name: "Mentor offer (E01)", intro: "Product components of the mentor's offer: accounts, profile, prices, slots, public list." },
  { name: "Booking and prepayment (E02)", intro: "Product components of booking, paying and the mentor's decision." },
  { name: "Session and aftermath (E03)", intro: "Product components of the session itself: the text thread and the mentor's note." },
];

const ui = (file: string) => `@devmentor/ui/components/ui/${file}`;
const block = (path: string) => `@devmentor/ui/backend/${path}`;
const product = (concept: string, file: string) => `@devmentor/ui/components/${concept}/${file}`;

export const COMPONENTS: ComponentEntry[] = [
  // ---- Actions
  {
    name: "Button",
    group: "Actions",
    section: "Primitives",
    importLine: `import { Button } from "${ui("button")}"`,
    purpose: "Starts one action now and shows which action on the screen matters most.",
    when: "One action: Pay, Accept, Add slot, Delete slot. One `default` button per screen; rows use `size=\"sm\"`.",
    whenNot: "Going to a URL: link. Choosing 25 or 50 min: RadioGroup. A setting that stays on: Switch.",
  },
  {
    name: "TextLink",
    group: "Actions",
    section: "Primitives",
    pageName: "Text link",
    importLine: `<a className="link-text"> (utility from @devmentor/ui/styles/theme.css)`,
    purpose: "Lets a person follow a reference inside a sentence and recognise it without colour.",
    when: "A link inside running text, a hint, an alert, a profile.",
    whenNot: "An action: Button. A whole list row: ItemLink. App navigation: RoleNav. Never in the accent colour.",
  },
  {
    name: "DropdownMenu",
    group: "Actions",
    section: "Primitives",
    importLine: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, … } from "${ui("dropdown-menu")}"`,
    purpose: "Keeps secondary actions of a row out of sight so dense lists stay readable.",
    when: "Three or more secondary row actions (Change time, Copy share link, Delete slot).",
    whenNot: "One or two actions: visible Buttons. The main action (Accept, Pay): a visible `default` Button. Choosing a value: NativeSelect.",
  },
  // ---- Forms and input
  {
    name: "Field",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldSet, FieldLegend } from "${ui("field")}"`,
    purpose: "Keeps a control's name, hint and error together.",
    when: "Every form field; wrap a whole form in FieldGroup.",
    whenNot: "A form CrudForm can render: CrudForm. A server error about the whole form: Alert or ErrorMessage.",
  },
  {
    name: "Label",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { Label } from "${ui("label")}"`,
    purpose: "Names a control for people and screen readers and enlarges its click target.",
    when: "Your own layout where Field does not fit (a control in a dense toolbar).",
    whenNot: "A form field: Field + FieldLabel. A group of radios: FieldSet + FieldLegend. A placeholder as the name: never.",
  },
  {
    name: "Input",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { Input } from "${ui("input")}"`,
    purpose: "Takes one short value: an email, a headline, a link, a price.",
    when: "One line of text, always inside a Field with a visible label.",
    whenNot: "Several lines: Textarea. A fixed list: NativeSelect or RadioGroup. A value shown but not editable: plain text.",
  },
  {
    name: "InputGroup",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText, InputGroupButton, InputGroupTextarea } from "${ui("input-group")}"`,
    purpose: "Attaches a unit, an icon or a small action to a field.",
    when: "A price with PLN after the number; a link with a copy button; a counter under the booking question.",
    whenNot: "A plain field: Input. A field and a submit button: Input + Button side by side. Explaining the field: FieldDescription.",
  },
  {
    name: "Textarea",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { Textarea } from "${ui("textarea")}"`,
    purpose: "Lets a person write and read back several lines.",
    when: "The booking question (2,000), the mentor bio (2,000), the decline reason (280).",
    whenNot: "One short value: Input. Session messages (Enter sends): the session composer, not built.",
  },
  {
    name: "NativeSelect",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { NativeSelect, NativeSelectOption } from "${ui("native-select")}"`,
    purpose: "Picks one value from a known list with the browser's own control.",
    when: "Stack filter, role, time zone, rows per page; more than about five options or tight space.",
    whenNot: "Two to four options worth comparing: RadioGroup. Several values: Checkbox group. A long searchable list: not built.",
  },
  {
    name: "Checkbox",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { Checkbox } from "${ui("checkbox")}"`,
    purpose: "Turns an option on or off, or picks several from a short list, saved with the form.",
    when: "The mentor's stack tags; a yes/no option saved with a form.",
    whenNot: "A setting that acts at once: Switch. Exactly one option: RadioGroup. An action: Button.",
  },
  {
    name: "RadioGroup",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { RadioGroup, RadioGroupItem } from "${ui("radio-group")}"`,
    purpose: "Chooses exactly one of a few options while seeing all of them and their prices.",
    when: "Session length with prices, before the question box; two to five options worth comparing.",
    whenNot: "More than about five options: NativeSelect. Several answers: Checkbox group. One on/off: Switch.",
  },
  {
    name: "Switch",
    group: "Forms and input",
    section: "Primitives",
    importLine: `import { Switch } from "${ui("switch")}"`,
    purpose: "Turns a setting on or off with immediate effect.",
    when: "Any setting that takes effect the moment it changes, not one saved with a form.",
    whenNot: "An option saved later with the form: Checkbox. Two named options: RadioGroup. Starting an action: Button.",
  },
  {
    name: "CrudForm",
    group: "Forms and input",
    section: "Primitives/Panel blocks",
    importLine: `import { CrudForm, type CrudFormField } from "${block("forms/CrudForm")}"`,
    purpose: "Creates or edits one record with the server's own validation and says what to fix.",
    when: "Sign-in, registration, invitations, admin forms: text, email, number, password or one choice.",
    whenNot: "Tags, a list of links, prices, a switch: a bespoke form from Field parts (MentorProfileForm). A single action: Button.",
  },
  {
    name: "CopyField",
    group: "Forms and input",
    section: "Primitives/Panel blocks",
    importLine: `import { CopyField } from "${block("forms/CopyField")}"`,
    purpose: "Copies a value the person must pass on without selecting text by hand.",
    when: "The invitation link (shown once), the mentor's share link.",
    whenNot: "A value the person types: Input. A secret: never shown.",
  },
  // ---- Feedback and states
  {
    name: "Alert",
    group: "Feedback and states",
    section: "Primitives",
    importLine: `import { Alert, AlertTitle, AlertDescription, AlertAction } from "${ui("alert")}"`,
    purpose: "Tells a person what happened and what to do, where it matters, until it is no longer true.",
    when: "A form or page-level failure; information that changes a decision (the mentor may decline, full refund).",
    whenNot: "An error of one field: FieldError. A short confirmation: inline text. An empty list: EmptyState. Marketing: nothing.",
  },
  {
    name: "Badge",
    group: "Feedback and states",
    section: "Primitives",
    importLine: `import { Badge } from "${ui("badge")}"`,
    purpose: "Labels a state or kind in a word or two so a list can be scanned.",
    when: "A booking status (`secondary` or `outline`), stack tags, a missing checklist step.",
    whenNot: "An action: Button. A counter or \"Top rated\": nothing. A status in the accent colour: never (`default` is not for statuses).",
  },
  {
    name: "Spinner",
    group: "Feedback and states",
    section: "Primitives",
    importLine: `import { Spinner } from "${ui("spinner")}"`,
    purpose: "Shows that a short action is in progress where the person is looking.",
    when: "Inside a button that is saving (Saving…); a short status.",
    whenNot: "A list or panel of known shape: Skeleton. A progress \"journey\": nothing. A wait of minutes: a status in words.",
  },
  {
    name: "Skeleton",
    group: "Feedback and states",
    section: "Primitives",
    importLine: `import { Skeleton } from "${ui("skeleton")}"`,
    purpose: "Shows the shape content will take so the page does not jump when data arrives.",
    when: "The first page of a list of rows; a panel whose data has not arrived.",
    whenNot: "A wait inside a button: Spinner. A wait with no known shape: LoadingMessage. Zero rows: EmptyState.",
  },
  {
    name: "EmptyState",
    group: "Feedback and states",
    section: "Primitives/Panel blocks",
    importLine: `import { EmptyState } from "${block("feedback/EmptyState")}"`,
    purpose: "Says why a list is empty and what to do next so it never looks broken.",
    when: "Nothing yet (No bookings yet + Find a mentor); a mentor page without bookable times.",
    whenNot: "A failed load: ErrorMessage. Still loading: Skeleton. No results for filters: its own state with Clear filters.",
  },
  {
    name: "ErrorMessage",
    group: "Feedback and states",
    section: "Primitives/Panel blocks",
    importLine: `import { ErrorMessage } from "${block("feedback/ErrorMessage")}"`,
    purpose: "Says that something needed failed, what happened and what to do next.",
    when: "A list or detail view failed to load (Try again); a form rejected without a field to point at.",
    whenNot: "One field: FieldError. An error that needs action as a toast: never. An empty list: EmptyState.",
  },
  {
    name: "LoadingMessage",
    group: "Feedback and states",
    section: "Primitives/Panel blocks",
    importLine: `import { LoadingMessage } from "${block("feedback/LoadingMessage")}"`,
    purpose: "Says that a view is loading when its shape is not yet known.",
    when: "First load of an admin list; a short wait with no known layout.",
    whenNot: "A list or card of known shape: Skeleton. Saving a form: the button's Saving… state. Payment: PaymentPending.",
  },
  // ---- Overlays
  {
    name: "Dialog",
    group: "Overlays",
    section: "Primitives",
    importLine: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "${ui("dialog")}"`,
    purpose: "Asks for a short, focused input or decision without leaving the page.",
    when: "Declining a booking with an optional reason; a short form of about three fields.",
    whenNot: "Confirming with no input: AlertDialog. A long form: its own page. Extra info: Popover. A message: Alert.",
  },
  {
    name: "AlertDialog",
    group: "Overlays",
    section: "Primitives",
    importLine: `import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, … } from "${ui("alert-dialog")}"`,
    purpose: "Stops a person before an irreversible action, names it, and makes keeping things easy.",
    when: "Deleting a slot; any irreversible action with no input.",
    whenNot: "An action that needs input: Dialog. A reversible or cheap action: do it and show the result. Reporting an error: Alert.",
  },
  {
    name: "Popover",
    group: "Overlays",
    section: "Primitives",
    importLine: `import { Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverDescription } from "${ui("popover")}"`,
    purpose: "Shows a short explanation next to the thing it explains without blocking the page.",
    when: "Why a slot time differs between mentor and mentee; a short note with a link.",
    whenNot: "Information needed to act: visible text. An icon name: Tooltip. A decision or form: Dialog. Actions: DropdownMenu.",
  },
  {
    name: "Tooltip",
    group: "Overlays",
    section: "Primitives",
    importLine: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "${ui("tooltip")}"`,
    purpose: "Names an icon-only control, or its shortcut, for people who point at or focus it.",
    when: "Icon-only buttons (the same text as `aria-label`); a shortcut next to a label.",
    whenNot: "Anything needed to act (why a button is disabled, a limit, a price): visible text. Long text or links: Popover.",
  },
  // ---- Structure and navigation
  {
    name: "Card",
    group: "Structure and navigation",
    section: "Primitives",
    importLine: `import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "${ui("card")}"`,
    purpose: "Groups one topic of a page on its own surface.",
    when: "A checklist panel, a booking summary, a frame around a form with a title.",
    whenNot: "Each row of a list: Item rows. A grid of identical cards with an icon: never. A state message: Alert.",
  },
  {
    name: "Separator",
    group: "Structure and navigation",
    section: "Primitives",
    importLine: `import { Separator } from "${ui("separator")}"`,
    purpose: "Divides groups inside one surface with a thin line.",
    when: "Between groups inside one panel; between items of a toolbar (vertical).",
    whenNot: "Between rows of a list: the row's own border. Between page sections: space (`gap-section`). Around a group: nothing.",
  },
  {
    name: "Tabs",
    group: "Structure and navigation",
    section: "Primitives",
    importLine: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "${ui("tabs")}"`,
    purpose: "Switches between a few views of the same thing on one page.",
    when: "Two to five short, parallel views of one list on one page.",
    whenNot: "Different tasks (profile, slots): separate pages. Filtering: filters with a result count. Steps: a page per step.",
  },
  {
    name: "PageLayout",
    group: "Structure and navigation",
    section: "Primitives/Panel blocks",
    importLine: `import { PageLayout } from "${block("layout/PageLayout")}"`,
    purpose: "Gives every page the same frame: header, title, width and spacing.",
    when: "Every page: `content` width for lists and panels, `narrow` for one form.",
    whenNot: "A dialog's content: Dialog. The session view: its own layout, not built.",
  },
  {
    name: "AppHeader",
    group: "Structure and navigation",
    section: "Primitives/Panel blocks",
    importLine: `import { AppHeader } from "${block("layout/AppHeader")}"`,
    purpose: "Tells a person where they are and who they are on every page.",
    when: "The top of every page, inside PageLayout.",
    whenNot: "The session view side panel: the session panel, not built. A marketing hero: nothing.",
  },
  {
    name: "RoleNav",
    group: "Structure and navigation",
    section: "Primitives/Panel blocks",
    importLine: `import { RoleNav, type RoleNavItem } from "${block("layout/RoleNav")}"`,
    purpose: "Takes a person to the few places their role uses and shows where they are.",
    when: "AppHeader of every signed-in page: one fixed list per role, only places that exist.",
    whenNot: "A list of sections with descriptions: Item + ItemLink. Views inside a page: Tabs. A link in a sentence: `link-text`.",
  },
  {
    name: "Avatar",
    group: "Structure and navigation",
    section: "Primitives",
    importLine: `import { Avatar, AvatarImage, AvatarFallback } from "${ui("avatar")}"`,
    purpose: "Shows who wrote a group of messages in a session.",
    when: "The author of a message group, next to the name and time.",
    whenNot: "A wall of mentor cards led by faces: never. Presence dots, \"+3\" stacks: never. Decoration of a row: text.",
  },
  {
    name: "Kbd",
    group: "Structure and navigation",
    section: "Primitives",
    importLine: `import { Kbd, KbdGroup } from "${ui("kbd")}"`,
    purpose: "Shows which key to press.",
    when: "The composer hint: Enter to send · Shift + Enter for a new line.",
    whenNot: "Code, file names, versions: `type-code`. A control that looks like a key: Button.",
  },
  // ---- Lists and data
  {
    name: "Item",
    group: "Lists and data",
    section: "Primitives",
    importLine: `import { ItemGroup, Item, ItemContent, ItemTitle, ItemLink, ItemDescription, ItemActions } from "${ui("item")}"`,
    purpose: "Shows many things of one kind as short rows that can be scanned.",
    when: "Bookings, slots, mentors, sections of a page: a title and one metadata line.",
    whenNot: "Admin data with many comparable columns: DataTable. One topic with a form: Card. Cards per item with shadows: never.",
  },
  {
    name: "Table",
    group: "Lists and data",
    section: "Primitives",
    importLine: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "${ui("table")}"`,
    purpose: "Lines up comparable values in columns; used through DataTable.",
    when: "Genuinely tabular data with several independent attributes per row.",
    whenNot: "Product lists (bookings, slots): Item rows. A one-column list: Item.",
  },
  {
    name: "DataTable",
    group: "Lists and data",
    section: "Primitives/Panel blocks",
    importLine: `import { DataTable, type DataTableColumn } from "${block("tables/DataTable")}"`,
    purpose: "Lets an admin scan and act on many records column by column.",
    when: "Admin lists: users, invitations. It has loading, error, empty states and paging.",
    whenNot: "Product lists (bookings, slots, mentors): Item rows. Two or three facts about one record: Card.",
  },
  {
    name: "Pagination",
    group: "Lists and data",
    section: "Primitives/Panel blocks",
    importLine: `import { Pagination } from "${block("tables/Pagination")}"`,
    purpose: "Moves through a long list one page at a time and shows where the person is.",
    when: "Under DataTable and under paged product lists (mentors, bookings).",
    whenNot: "A list that fits on one page (a mentor's slots): nothing. An endless feed: nothing.",
  },
  {
    name: "ActiveFilters",
    group: "Lists and data",
    section: "Primitives/Panel blocks",
    importLine: `import { ActiveFilters } from "${block("filters/ActiveFilters")}"`,
    purpose: "Shows which filters are in effect and removes one or all.",
    when: "/mentors filtered by stack; /bookings filtered by status.",
    whenNot: "The control that sets a filter: NativeSelect or Input in a Field. A saved search: not built.",
  },
  {
    name: "ResultCount",
    group: "Lists and data",
    section: "Primitives/Panel blocks",
    importLine: `import { ResultCount } from "${block("filters/ResultCount")}"`,
    purpose: "Says how many items a list holds and announces the new number when a filter changes it.",
    when: "Above the mentor list and the bookings list.",
    whenNot: "A count as a badge or hype number: never. The page range: Pagination.",
  },
  // ---- Mentor offer (E01)
  {
    name: "AccountMenu",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { AccountMenu, AccountMenuSkeleton, type SessionUser } from "${product("auth", "AccountMenu")}"`,
    purpose: "Shows a visitor how to sign in and a signed-in person who they are and how to log out.",
    when: "The account area of AppHeader.",
    whenNot: "Profile and prices: the `/mentor/profile` page. A menu for one or two items: the inline links here.",
  },
  {
    name: "InvitationLinkPanel",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { InvitationLinkPanel } from "${product("mentors", "InvitationLinkPanel")}"`,
    purpose: "Gives a founder the new invitation link once to copy and send.",
    when: "Right after an invitation is created, until Done.",
    whenNot: "The always-available share link: CopyField on `/mentor`. An old invitation's link: it cannot be shown.",
  },
  {
    name: "InvitationStatusBadge",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { InvitationStatusBadge, type InvitationStatus } from "${product("mentors", "InvitationStatusBadge")}"`,
    purpose: "Says whether an invitation is pending, used, expired or revoked.",
    when: "Rows of `/admin/invitations`.",
    whenNot: "Booking statuses: BookingStatusBadge. A status that needs an action: a sentence and a button.",
  },
  {
    name: "TagList",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { TagList, TagListSkeleton } from "${product("mentors", "TagList")}"`,
    purpose: "Shows which stack a mentor helps with at a glance.",
    when: "MentorCard and the mentor's profile.",
    whenNot: "Choosing tags: checkboxes in MentorProfileForm. Statuses: Badge. Skill levels, years, counts: nothing.",
  },
  {
    name: "PublicWorkLinks",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { PublicWorkLinks, displayUrl } from "${product("mentors", "PublicWorkLinks")}"`,
    purpose: "Lets a developer check what the mentor built before paying; the trust signal instead of ratings.",
    when: "MentorCard (inline) and the mentor's profile; up to five https links.",
    whenNot: "Star ratings, review counts, \"Top rated\": nothing. In-app navigation: RoleNav, ItemLink.",
  },
  {
    name: "PriceList",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { PriceList, PriceListSkeleton } from "${product("mentors", "PriceList")}"`,
    purpose: "Shows what a 25- and a 50-minute session cost before the developer writes anything.",
    when: "The mentor's profile and MentorCard.",
    whenNot: "The price of one chosen booking: BookingSummary. Entering prices: MentorProfileForm.",
  },
  {
    name: "MentorProfileHeader",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { MentorProfileHeader, type PublicMentor } from "${product("mentors", "MentorProfileHeader")}"`,
    purpose: "Tells a developer who the mentor is and what they have done.",
    when: "Top of `/m/[slug]`.",
    whenNot: "A row of the public list: MentorCard. An avatar wall, years of experience: nothing.",
  },
  {
    name: "MentorCard",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { MentorCard, MentorCardSkeleton } from "${product("mentors", "MentorCard")}"`,
    purpose: "Shows one mentor in the public list with what a visitor needs to choose.",
    when: "A row of `/mentors`: name, headline, tags, public work, prices, the next time.",
    whenNot: "The full profile: MentorProfileHeader. A grid of cards, an avatar wall, ratings: never.",
  },
  {
    name: "OfferChecklist",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { OfferChecklist, OfferChecklistSkeleton } from "${product("mentors", "OfferChecklist")}"`,
    purpose: "Shows a mentor what stands between them and their first booking.",
    when: "`/mentor` until the offer is bookable.",
    whenNot: "A progress bar or \"3 of 5\": never. Booking statuses: BookingStatusPanel.",
  },
  {
    name: "MentorProfileForm",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { MentorProfileForm, type MentorProfileInput } from "${product("mentors", "MentorProfileForm")}"`,
    purpose: "Lets a mentor say who they are, what they charge and whether they are listed.",
    when: "`/mentor/profile`.",
    whenNot: "Simple admin forms: CrudForm. Publishing times: AddSlotForm.",
  },
  {
    name: "SlotTimeField",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { SlotTimeField } from "${product("availability", "SlotTimeField")}"`,
    purpose: "Takes the date and time of a slot in the mentor's zone and returns a UTC moment, or says why not.",
    when: "Inside AddSlotForm; any input of a time in a zone, with DST handled.",
    whenNot: "Showing a time: `formatDateTime` + `formatZoneLabel`. A range or recurrence: not built.",
  },
  {
    name: "AddSlotForm",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { AddSlotForm } from "${product("availability", "AddSlotForm")}"`,
    purpose: "Lets a mentor publish one more bookable time.",
    when: "`/mentor/slots`.",
    whenNot: "Adding many slots at once or editing a slot: not built (delete and add again).",
  },
  {
    name: "SlotList",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { SlotList, SlotRow, SlotListSkeleton } from "${product("availability", "SlotList")}"`,
    purpose: "Lists slots by the viewer's local day, each with time and zone.",
    when: "The mentor's own slots and the public mentor page.",
    whenNot: "A calendar grid: not built. Bookings: BookingRow.",
  },
  {
    name: "DeleteSlotDialog",
    group: "Mentor offer (E01)",
    section: "Product/E01",
    importLine: `import { DeleteSlotDialog } from "${product("availability", "DeleteSlotDialog")}"`,
    purpose: "Asks before a slot is deleted and shows what the server answered.",
    when: "Deleting an open slot.",
    whenNot: "A booked slot: no action, cancel the booking instead. Anything undoable at once: no dialog.",
  },
  // ---- Booking and prepayment (E02)
  {
    name: "SlotBookActions",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { SlotBookActions } from "${product("bookings", "SlotBookActions")}"`,
    purpose: "Starts a booking from a slot row: one action per length with its price in the button.",
    when: "A slot row on `/m/[slug]`.",
    whenNot: "Paying: BookingForm. A slot nobody can book: no action, the reason in words.",
  },
  {
    name: "BookingSummary",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { BookingSummary } from "${product("bookings", "BookingSummary")}"`,
    purpose: "Shows what is being bought: mentor, time with zone, length, price.",
    when: "Before paying on `/book/[slotId]` and on the booking page.",
    whenNot: "A list row: BookingRow. Computing a price: never, the server computes it.",
  },
  {
    name: "QuestionField",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { QuestionField, QUESTION_MAX } from "${product("bookings", "QuestionField")}"`,
    purpose: "Collects the question the mentor reads before deciding.",
    when: "BookingForm (plain text, up to 2,000, required).",
    whenNot: "A short single-line value: Input in a Field. Editing after booking: not possible.",
  },
  {
    name: "BookingForm",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { BookingForm } from "${product("bookings", "BookingForm")}"`,
    purpose: "Turns the chosen slot and a question into a booking and sends the mentee to pay.",
    when: "`/book/[slotId]`.",
    whenNot: "Paying: the hosted card page. Changing a booking: not built.",
  },
  {
    name: "PaymentPending",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { PaymentPending } from "${product("bookings", "PaymentPending")}"`,
    purpose: "Says the payment is being confirmed and, after about a minute, that the page will update.",
    when: "`/bookings/[id]` right after paying.",
    whenNot: "Waiting for the mentor: BookingStatusPanel.",
  },
  {
    name: "BookingStatusBadge",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { BookingStatusBadge } from "${product("bookings", "BookingStatusBadge")}"`,
    purpose: "Names a booking's state in one short phrase in a row.",
    when: "BookingRow and any list of bookings.",
    whenNot: "The status with the next action: BookingStatusPanel.",
  },
  {
    name: "BookingStatusPanel",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { BookingStatusPanel } from "${product("bookings", "BookingStatusPanel")}"`,
    purpose: "Says where a booking stands and what happens next, above the fold.",
    when: "Top of `/bookings/[id]`, for the mentee or the mentor.",
    whenNot: "A row of a list: BookingStatusBadge. Payment progress: PaymentPending.",
  },
  {
    name: "BookingQuestion",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { BookingQuestion } from "${product("bookings", "BookingQuestion")}"`,
    purpose: "Shows a booking's question as the mentee wrote it.",
    when: "The booking page and the mentor's rows (collapsible).",
    whenNot: "Markdown or code blocks: not built, plain text only.",
  },
  {
    name: "BookingRow",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { BookingRow } from "${product("bookings", "BookingRow")}"`,
    purpose: "Shows one of the mentee's bookings in a list with its status in words.",
    when: "`/bookings`.",
    whenNot: "The mentor's list: MentorBookingRow. The full status: BookingStatusPanel.",
  },
  {
    name: "MentorBookingRow",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { MentorBookingRow } from "${product("bookings", "MentorBookingRow")}"`,
    purpose: "Lets the mentor read a question and accept or decline before the deadline.",
    when: "`/mentor/bookings`; Accept in the accent only for the nearest deadline.",
    whenNot: "Cancelling after acceptance: not built. The mentee's list: BookingRow.",
  },
  {
    name: "AcceptDeadline",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { AcceptDeadline } from "${product("bookings", "AcceptDeadline")}"`,
    purpose: "Tells the mentor by when to decide and how soon that is.",
    when: "MentorBookingRow and the mentor's booking page.",
    whenNot: "A countdown that ticks by the second: never. The mentee's wait: BookingStatusPanel.",
  },
  {
    name: "DeclineBookingDialog",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { DeclineBookingDialog } from "${product("bookings", "DeclineBookingDialog")}"`,
    purpose: "Confirms a decline, states the refund and takes an optional reason.",
    when: "Declining a booking (reason up to 280).",
    whenNot: "A confirmation with no input: AlertDialog.",
  },
  {
    name: "PendingBookingsNotice",
    group: "Booking and prepayment (E02)",
    section: "Product/E02",
    importLine: `import { PendingBookingsNotice } from "${product("bookings", "PendingBookingsNotice")}"`,
    purpose: "Tells the mentor that bookings wait for a decision and by when; the only in-app signal.",
    when: "`/mentor` when something is pending.",
    whenNot: "A counter badge in the navigation: never. Email: not built.",
  },

  // ---- Session and aftermath (E03)
  {
    name: "SessionThread",
    group: "Session and aftermath (E03)",
    section: "Product/E03",
    importLine: `import { SessionThread } from "${product("sessions", "SessionThread")}"`,
    purpose: "Lets the mentee and the mentor of a confirmed booking exchange text during the session.",
    when: "The booking page of a confirmed booking, for both the mentee and the mentor.",
    whenNot: "Chat between people outside a booking, or a thread after the grace period (read-only text instead).",
  },
  {
    name: "SessionNotePanel",
    group: "Session and aftermath (E03)",
    section: "Product/E03",
    importLine: `import { SessionNotePanel } from "${product("sessions", "SessionNotePanel")}"`,
    purpose: "Lets the mentee approve or reject the mentor's note before anyone else sees it.",
    when: "The mentee's booking page once the mentor has written a note (a draft to decide on, or an approved note).",
    whenNot: "The mentor's own note (SessionNoteEditor). A rejected note: it is not returned at all.",
  },
  {
    name: "SessionNoteEditor",
    group: "Session and aftermath (E03)",
    section: "Product/E03",
    importLine: `import { SessionNoteEditor } from "${product("sessions", "SessionNoteEditor")}"`,
    purpose: "Lets the mentor write the optional note after a session and see whether the mentee approved it.",
    when: "The mentor's session page of a confirmed booking.",
    whenNot: "The mentee's view (SessionNotePanel). Writing before the session ends: the editor is read-only then.",
  },
];

/** Storybook's id sanitising: lower case, every other character becomes a hyphen. */
function sanitize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The story title of the component's page, e.g. `Primitives/Panel blocks/CrudForm`. */
export function pageTitle(entry: ComponentEntry): string {
  return `${entry.section}/${entry.pageName ?? entry.name}`;
}

/** The Storybook id of the component's documentation page. */
export function docsId(entry: ComponentEntry): string {
  return `${sanitize(pageTitle(entry))}--docs`;
}

/** Link to the page from inside the Storybook preview iframe (the manager sits one level up). */
export function docsHref(entry: ComponentEntry): string {
  return `./?path=/docs/${docsId(entry)}`;
}
