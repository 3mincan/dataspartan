import axe from 'axe-core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Film, Viewing } from '../../api/types';
import { useViewingLog } from '../../hooks/useViewingLog';
import { ViewingLogModal } from './ViewingLogModal';

const film: Film = {
  title: 'A New Hope',
  episode_id: 4,
  opening_crawl: '',
  release_date: '1977-05-25',
  characters: [],
  url: 'https://swapi.dev/api/films/1/',
};

/** Real viewing log state, so add/delete re-render the modal like the app does. */
function Harness({ initial = [] }: { initial?: Viewing[] }) {
  const log = useViewingLog({ 4: initial });
  return (
    <>
      <button id="log-button-4" type="button">
        Log
      </button>
      <ViewingLogModal
        film={film}
        getViewings={log.getViewings}
        onAdd={log.addViewing}
        onRemove={log.removeViewing}
        onClose={() => {}}
        logButtonId={(id) => `log-button-${id}`}
      />
    </>
  );
}

const viewing = (id: string, date: string, time: string, description?: string): Viewing => ({
  id,
  date,
  time,
  ...(description ? { description } : {}),
});

function setValue(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('ViewingLogModal', () => {
  it('opens as a dialog named after the film, with an empty state', async () => {
    const { container } = render(<Harness />);
    const dialog = screen.getByRole('dialog', { name: 'Viewing log — A New Hope' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('closedby', 'any');
    expect(screen.getByText('No viewings recorded yet.')).toBeInTheDocument();
    expect(screen.getByLabelText('Date (required)')).toHaveAttribute('autofocus');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it('lists existing viewings newest first, with descriptive delete buttons', () => {
    render(
      <Harness
        initial={[
          viewing('b', '2026-03-01', '20:00', 'With friends'),
          viewing('a', '2026-01-01', '10:00'),
        ]}
      />,
    );
    const deletes = screen.getAllByRole('button', { name: /^Delete viewing from/ });
    expect(deletes).toHaveLength(2);
    expect(deletes[0]).toHaveAccessibleName(/Mar 1, 2026/);
    expect(screen.getByText('With friends')).toBeInTheDocument();
  });

  it('does not add a viewing while date or time is missing', async () => {
    render(<Harness />);
    setValue(/^Date/, '2026-11-12');
    await userEvent.click(screen.getByRole('button', { name: 'Add viewing' }));

    expect(screen.getByText('No viewings recorded yet.')).toBeInTheDocument();
    expect(screen.getByLabelText('Time (required)')).toBeInvalid();
  });

  it('marks every empty required field invalid after one failed submit', () => {
    // jsdom has no :user-invalid; after a submit attempt it equals "invalid".
    const matches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (
      this: HTMLElement,
      selector: string,
    ) {
      if (selector === ':user-invalid' && this instanceof HTMLInputElement) return !this.validity.valid;
      return matches.call(this, selector);
    });
    render(<Harness />);
    const date = screen.getByLabelText(/^Date/);
    const time = screen.getByLabelText(/^Time/);

    // The browser fires `invalid` on both fields in the same task.
    act(() => {
      date.dispatchEvent(new Event('invalid', { cancelable: true }));
      time.dispatchEvent(new Event('invalid', { cancelable: true }));
    });

    expect(date).toHaveAttribute('aria-invalid', 'true');
    expect(date).toHaveAccessibleDescription('Date is required.');
    expect(time).toHaveAttribute('aria-invalid', 'true');
    expect(time).toHaveAccessibleDescription('Time is required.');
  });

  it('adds a viewing, resets the form, keeps the dialog open and announces it', async () => {
    render(<Harness />);
    setValue(/^Date/, '2026-11-12');
    setValue(/^Time/, '20:30');
    setValue(/^Description/, 'IMAX');
    await userEvent.click(screen.getByRole('button', { name: 'Add viewing' }));

    expect(screen.getByRole('button', { name: /Delete viewing from Nov 12, 2026/ })).toBeInTheDocument();
    expect(screen.getByText('IMAX')).toBeInTheDocument();
    expect(screen.getByLabelText('Date (required)')).toHaveValue('');
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    expect(screen.getByRole('status')).toHaveTextContent(/Viewing from Nov 12, 2026.* added/);
  });

  it('after a delete, focuses the next delete button, then the date field', async () => {
    render(
      <Harness
        initial={[viewing('b', '2026-03-01', '20:00'), viewing('a', '2026-01-01', '10:00')]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /from Mar 1, 2026/ }));
    const remaining = screen.getByRole('button', { name: /from Jan 1, 2026/ });
    expect(remaining).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(/Viewing from Mar 1, 2026.* deleted/);

    await userEvent.click(remaining);
    expect(screen.getByLabelText('Date (required)')).toHaveFocus();
    expect(screen.getByText('No viewings recorded yet.')).toBeInTheDocument();
  });

  it('focuses the previous delete button when the last one is deleted', async () => {
    render(
      <Harness
        initial={[viewing('b', '2026-03-01', '20:00'), viewing('a', '2026-01-01', '10:00')]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /from Jan 1, 2026/ }));
    expect(screen.getByRole('button', { name: /from Mar 1, 2026/ })).toHaveFocus();
  });
});
