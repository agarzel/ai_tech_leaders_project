"use client";

import { useState } from "react";
import { Button } from "@devmentor/ui/components/ui/button";

/** Characters shown in a collapsed question (rows in the mentor's list). */
export const QUESTION_PREVIEW = 280;

type BookingQuestionProps = {
  question: string;
  /** Rows show the first 280 characters and a *Show full question* toggle; a short question is shown whole. */
  collapsible?: boolean;
};

/**
 * The question of a booking as the mentee wrote it (spec E02, Q5): plain text in the body typeface with
 * the line breaks kept – no Markdown, no code blocks. Long words and URLs wrap instead of widening the
 * page. Only that mentee and that mentor ever see it, so it never goes in a title or a log.
 */
export function BookingQuestion({ question, collapsible = false }: BookingQuestionProps) {
  const [expanded, setExpanded] = useState(false);
  const long = collapsible && question.length > QUESTION_PREVIEW;
  const shown = long && !expanded ? `${question.slice(0, QUESTION_PREVIEW).trimEnd()}…` : question;

  return (
    <div className="flex flex-col items-start gap-in-group">
      <p className="max-w-prose whitespace-pre-line break-words type-body">{shown}</p>
      {long && (
        <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Show full question"}
        </Button>
      )}
    </div>
  );
}
