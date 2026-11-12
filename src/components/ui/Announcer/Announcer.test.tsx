import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Announcer } from './Announcer';

it('keeps one status region mounted and updates its text', async () => {
  const { container, rerender } = render(<Announcer message="" />);
  const region = screen.getByRole('status');
  expect(region).toBeEmptyDOMElement();

  rerender(<Announcer message="Showing A New Hope" />);
  expect(screen.getByRole('status')).toBe(region);
  expect(region).toHaveTextContent('Showing A New Hope');

  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
});
