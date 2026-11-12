import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only auto-cleans when the runner exposes global afterEach;
// Vitest globals are off, so unmount explicitly between tests.
afterEach(() => {
  cleanup()
})

// jsdom has no <dialog> API (checked 2026-11-12). This stand-in covers only
// what the app relies on: `showModal()` opens, `close()` closes and fires
// `close`. Focus containment, Esc and light dismiss are verified by hand.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
