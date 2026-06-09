import { render, screen } from '@testing-library/react'

import App from './App'

// Rendered without a DittoProvider, so no Ditto instance is available and the
// query stays in its loading state.
test('renders the loading state when no Ditto instance is available', () => {
  render(<App path="tasks" />)
  const loading = screen.getByText(/Loading/i)
  expect(loading).toBeInTheDocument()
})
