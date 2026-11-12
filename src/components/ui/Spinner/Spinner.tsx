import styles from './Spinner.module.css';

interface SpinnerProps {
  /** Accessible name, e.g. "Loading films". */
  label: string;
}

/**
 * Indeterminate native `<progress>` (no `value`): screen readers announce it
 * as a busy progress bar without any ARIA (spinner guide).
 */
export function Spinner({ label }: SpinnerProps) {
  return <progress className={styles.spinner} aria-label={label} />;
}
