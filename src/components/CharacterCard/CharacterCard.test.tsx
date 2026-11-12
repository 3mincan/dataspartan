import axe from 'axe-core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CharacterDetails } from '../../api/types';
import type { AsyncResult } from '../../hooks/useAsync';
import { CharacterCard } from './CharacterCard';

const retry = vi.fn();

function renderCard(name: string, details: AsyncResult<CharacterDetails>) {
  return render(
    <main>
      <h1>Film</h1>
      <CharacterCard name={name} details={details} />
    </main>,
  );
}

/** Reads the <dl> as { label: value }. */
function facts(container: HTMLElement): Record<string, string> {
  const list = container.querySelector('dl');
  if (list === null) throw new Error('No <dl> rendered');
  return Object.fromEntries(
    within(list)
      .getAllByRole('term')
      .map((term) => [term.textContent, term.nextElementSibling?.textContent ?? '']),
  );
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('CharacterCard', () => {
  it('shows the name immediately and a labelled progress bar while loading', () => {
    renderCard('C-3PO', { status: 'loading', retry });
    expect(screen.getByRole('heading', { level: 2, name: 'C-3PO' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Loading details for C-3PO' })).toBeInTheDocument();
  });

  it('shows an alert with retry on error', async () => {
    renderCard('C-3PO', { status: 'error', error: new Error('500'), retry });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Details for C-3PO could not be loaded.');
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('robot: artificial-being mark in text, height, mass and manufacturing year', async () => {
    const { container } = renderCard('R2-D2', {
      status: 'success',
      data: { kind: 'robot', name: 'R2-D2', height: '96', mass: 'unknown', manufacturingYear: '33BBY' },
      retry,
    });

    expect(screen.getByText('Artificial being')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(facts(container)).toEqual({ Height: '96 cm', Mass: 'Unknown', 'Manufacturing year': '33BBY' });
    await expectNoAxeViolations(container);
  });

  it('organic: species, classification, homeworld, height and birth year; no robot mark', async () => {
    const { container } = renderCard('Luke Skywalker', {
      status: 'success',
      data: {
        kind: 'organic',
        name: 'Luke Skywalker',
        speciesName: 'Human',
        speciesClassification: 'mammal',
        homeworldName: 'Tatooine',
        height: '172',
        birthYear: '19BBY',
      },
      retry,
    });

    expect(screen.queryByText('Artificial being')).not.toBeInTheDocument();
    expect(facts(container)).toEqual({
      Species: 'Human',
      Classification: 'mammal',
      Homeworld: 'Tatooine',
      Height: '172 cm',
      'Birth year': '19BBY',
    });
    await expectNoAxeViolations(container);
  });
});
