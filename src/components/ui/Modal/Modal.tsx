import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  /** Id of the heading that names the dialog. */
  labelledBy: string;
  /** Called on every close: button, Esc, light dismiss or `open` turning false. */
  onClose: () => void;
  /**
   * Element to focus when the dialog closes and the browser had no opener to
   * return focus to (the page was loaded straight into the dialog).
   */
  fallbackFocusId: string;
  children: ReactNode;
}

// Safari has no `closedby` yet; it then gets the pointer fallback below.
const supportsClosedBy =
  typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;

function isOutside(event: PointerEvent<HTMLDialogElement>): boolean {
  // Test the pointer position, not the target: the dialog is also the target
  // for clicks on its own padding (dialog guide, closedby fallback).
  const rect = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/**
 * Native modal `<dialog>`. The platform provides the inert page, focus
 * containment, Esc, the backdrop and focus return (D-015); this component
 * only opens and closes it to follow `open`, which comes from the URL (D-025).
 */
export function Modal({ open, labelledBy, onClose, fallbackFocusId, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutside = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleClose = () => {
    // Usually the browser has already returned focus to the opener. It has
    // not when there was no opener (deep link), or after a light dismiss:
    // the outside press focuses the dialog itself before closing it (seen in
    // Chrome), leaving focus on the hidden dialog and then on <body>.
    const active = document.activeElement;
    const focusLost =
      active === null || active === document.body || dialogRef.current?.contains(active);
    if (focusLost) document.getElementById(fallbackFocusId)?.focus();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      closedby="any"
      onClose={handleClose}
      onPointerDown={
        supportsClosedBy ? undefined : (event) => (pressedOutside.current = isOutside(event))
      }
      onPointerUp={
        supportsClosedBy
          ? undefined
          : (event) => {
              // Press and release both outside, so a text selection that ends
              // on the backdrop does not dismiss.
              if (pressedOutside.current && isOutside(event)) event.currentTarget.close();
            }
      }
    >
      {children}
    </dialog>
  );
}
