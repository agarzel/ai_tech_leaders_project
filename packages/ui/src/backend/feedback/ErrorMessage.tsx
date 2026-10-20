import { Alert, AlertAction, AlertDescription, AlertTitle } from "@devmentor/ui/components/ui/alert";
import { Button } from "@devmentor/ui/components/ui/button";
import { describeApiError } from "../api/describeApiError";
import type { ApiError } from "../api/types";

type ErrorMessageProps = {
  /** Overrides the title (and, for `error`, the title of domain errors). */
  title?: string;
  onRetry?: () => void;
} & (
  | {
      /** The API error: technical codes (network, invalid response, internal) get a written explanation (C18). */
      error: ApiError;
      message?: never;
    }
  | {
      /** Text written for people. Prefer `error` for API failures. */
      message: string;
      error?: never;
    }
);

/** An error that blocks the view or the form: what happened and what to do, with an optional retry. */
export function ErrorMessage({ title, message, error, onRetry }: ErrorMessageProps) {
  const description = error ? describeApiError(error, title) : { title: title ?? "Something went wrong", message };

  return (
    <Alert variant="destructive">
      <AlertTitle>{description.title}</AlertTitle>
      <AlertDescription>{description.message}</AlertDescription>
      {onRetry && (
        <AlertAction>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}
