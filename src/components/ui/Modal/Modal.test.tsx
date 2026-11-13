import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function renderModal(open: boolean, onClose = vi.fn()) {
  const ui = (isOpen: boolean) => (
    <>
      <button id="opener" type="button">
        Open
      </button>
      <Modal open={isOpen} labelledBy="title" onClose={onClose} fallbackFocusId="opener">
        <h2 id="title">Example</h2>
        <button type="button">Inside</button>
      </Modal>
    </>
  );
  const result = render(ui(open));
  return { ...result, onClose, setOpen: (isOpen: boolean) => result.rerender(ui(isOpen)) };
}

describe('Modal', () => {
  it('opens and closes to follow `open`, named by its heading', async () => {
    const { container, setOpen, onClose } = renderModal(false);
    const dialog = container.querySelector('dialog');
    expect(dialog).not.toHaveAttribute('open');

    setOpen(true);
    expect(screen.getByRole('dialog', { name: 'Example' })).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('closedby', 'any');
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);

    setOpen(false);
    expect(dialog).not.toHaveAttribute('open');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the fallback when focus would be lost on close', () => {
    const { container, onClose } = renderModal(true);
    screen.getByRole('button', { name: 'Inside' }).focus();

    container.querySelector('dialog')?.close();

    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves focus alone when the browser already returned it outside', () => {
    const { container } = renderModal(true);
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();

    container.querySelector('dialog')?.close();

    expect(outside).toHaveFocus();
    outside.remove();
  });
});
