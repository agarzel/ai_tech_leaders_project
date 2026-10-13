import { Alert, AlertAction, AlertDescription, AlertTitle } from "@devmentor/ui/components/ui/alert";
import { Button } from "@devmentor/ui/components/ui/button";

type ErrorMessageProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorMessage({ title = "Something went wrong", message, onRetry }: ErrorMessageProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
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
