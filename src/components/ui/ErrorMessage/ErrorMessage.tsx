import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

/** A failed request: announced immediately (`role="alert"`) with a way out. */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div role="alert" className={styles.error}>
      <p className={styles.text}>{message}</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
