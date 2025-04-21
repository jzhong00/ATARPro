// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Automatically cleanup after each test
afterEach(() => {
  cleanup()
}) 