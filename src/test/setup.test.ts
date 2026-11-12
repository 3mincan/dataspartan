import axe from 'axe-core'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { expect, it } from 'vitest'

it('runs Testing Library, jest-dom matchers and axe-core in jsdom', async () => {
  const { container } = render(createElement('button', { type: 'button' }, 'Retry'))
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()

  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(results.violations).toEqual([])
})
