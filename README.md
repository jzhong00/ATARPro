# ATAR Calculator

A modern, type-safe ATAR calculator application built with React, TypeScript, and Redux Toolkit.

## Features

- Individual student ATAR calculations
- Cohort analysis and bulk processing
- Scaling visualization and analysis
- Score equivalence calculations
- Range-based predictions

## Project Structure

```
src/
├── components/  # UI components
├── services/    # Business logic and state coordination
├── utils/       # Stateless pure functions
├── store/       # Redux state slices and selectors
├── types/       # Shared TypeScript types and interfaces
└── test/        # Test setup and utilities
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Development Guidelines

- Follow the architectural patterns defined in `.cursor-context/architecture.md`
- Maintain test coverage as specified in `.cursor-context/contributing.md`
- Use TypeScript strict mode
- Follow the component/service/utils separation pattern

## License

MIT 