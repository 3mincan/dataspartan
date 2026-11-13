import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ErrorMessage } from './ErrorMessage';

it('announces the failure as an alert and retries on demand', async () => {
  const onRetry = vi.fn();
  const { container } = render(<ErrorMessage message="Films could not be loaded." onRetry={onRetry} />);

  expect(screen.getByRole('alert')).toHaveTextContent('Films could not be loaded.');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);

  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
});
