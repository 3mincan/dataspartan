import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Spinner } from './Spinner';

it('is a named, indeterminate native progress bar', async () => {
  const { container } = render(<Spinner label="Loading films" />);

  const progress = screen.getByRole('progressbar', { name: 'Loading films' });
  expect(progress.tagName).toBe('PROGRESS');
  expect(progress).not.toHaveAttribute('value');

  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
});
