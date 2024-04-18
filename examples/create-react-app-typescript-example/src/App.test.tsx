import { render, screen } from '@testing-library/react'

import App from './App'

test('renders learn react link', () => {
  render(<App path="tasks" />)
  const linkElement = screen.getByText(/Using Ditto with path/i)
  expect(linkElement).toBeInTheDocument()
})
