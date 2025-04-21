# ATAR Calculator Development Guide

## Domain Knowledge

### ATAR System Fundamentals
- Tertiary Entrance (TE) Score calculation rules
- ATAR calculation and scaling methodology
- Subject categorization (General, Applied, VET)
- Eligibility requirements
- Scaling curves and their interpretation

### Business Rules
1. Subject Combinations
   - Maximum number of subjects
   - Required subject types
   - Subject prerequisites
   - Invalid combinations

2. Score Calculations
   - Raw score ranges per subject type
   - Scaling formulas for general subjects
   - VET/Applied subject conversion rules
   - Minimum requirements for ATAR eligibility

3. Range Mode Rules
   - Variation limits
   - Impact on scaled scores
   - Statistical considerations
   - Confidence intervals

## Data Structures

### CSV File Formats
1. `subject_type_and_general_scaling.csv`: Contains subject type mappings and general subject scaling parameters
```csv
subject,type,validation_type,a,k
Mathematics,General,0-100,0.1,2.5
English,General,0-100,0.08,2.1
```

2. `applied_and_vet_scaling.csv`: Contains scaling data for Applied and VET subjects
```csv
subject,result,scaled_score
VET Business,A,85.5
VET Business,B,75.2
Applied Science,A,82.0
Applied Science,B,72.0
```

### Key Interfaces
```typescript
interface Subject {
  name: string;
  type: SubjectType;
  validationType: ValidationRule;
}

interface GeneralScalingParameters {
  subject: string;
  a: number;  // Logistic function parameter
  k: number;  // Logistic function parameter
}

interface StudentResult {
  subject: string;
  rawResult: string | number;
  scaledScore?: number;
}
```

## Mathematical Formulas

### Scaling Calculations
1. General Subjects
   ```typescript
   scaled_score = 100 / (1 + e^-(a * raw_score + k))
   where:
   - a and k are subject-specific parameters from subject_type_and_general_scaling.csv
   - raw_score is the student's result (0-100)
   - Result is rounded to 1 decimal place
   ```

2. Applied/VET Subjects
   ```typescript
   scaled_score = lookup_table[subject][result]
   where:
   - subject is the subject name
   - result is the grade (A-E for Applied, Pass for VET)
   - scaled_score is looked up from applied_and_vet_scaling.csv
   ```

3. TE Score
   ```
   TE_Score = max(
     sum(top_5_general_scaled_scores),
     sum(top_4_general_scaled_scores) + best_applied_scaled_score
   )
   ```

### Rubber Band Logic
1. Range Maintenance
   ```
   L ≤ R ≤ U
   where:
   - L is the lower bound
   - R is the result
   - U is the upper bound
   ```

2. Value Adjustment Rules
   - If L increases beyond R or U, all values become L
   - If R decreases below L, L becomes R
   - If R increases beyond U, U becomes R
   - If U decreases below L or R, all values become U

3. Quick Range Application
   ```
   lower_value = max(0, current_value - range)
   upper_value = min(100, current_value + range)
   ```

## Error Handling

### Validation Rules
1. Input Validation
   - Numeric scores: 0-100
   - Letter grades: A-E
   - Pass/Fail: "Pass" only
   - Subject names: Must match CSV data

2. Business Rule Validation
   - Subject combination rules
   - Minimum subject requirements
   - Maximum subject limits
   - Prerequisites

3. Data Integrity
   - CSV file format validation
   - Data type checking
   - Required field validation
   - Cross-reference validation

### Error Messages
- User-friendly error messages
- Technical error logging
- Validation feedback
- Recovery suggestions

## State Management

### Redux Store Structure
```typescript
interface RootState {
  subjects: {
    list: Subject[];
    loading: boolean;
    error: string | null;
  };
  calculations: {
    results: StudentResult[];
    rangeMode: boolean;
    variation: number;
  };
  cohort: {
    data: CohortData[];
    view: CohortView;
    filters: FilterState;
  };
}
```

### Data Flow
1. Data Loading
   ```mermaid
   graph TD
   A[CSV Files] --> B[Data Loader]
   B --> C[Redux Store]
   C --> D[Components]
   ```

2. Calculation Flow
   ```mermaid
   graph TD
   A[User Input] --> B[Validation]
   B --> C[Scaling]
   C --> D[TE Score]
   D --> E[ATAR]
   ```

## Performance Considerations

### Data Loading
- Lazy load CSV files
- Cache parsed data
- Implement loading indicators
- Handle large datasets efficiently

### Calculations
- Memoize expensive calculations
- Batch updates
- Debounce user input
- Use web workers for heavy computations

### UI Responsiveness
- Virtualize large lists
- Implement pagination
- Optimize re-renders
- Use skeleton loading

## Development Process

### Setup Requirements
1. Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_MOCK_DATA=true
VITE_DEBUG_MODE=true
```

2. Required Tools
- Node.js 18+
- npm/yarn
- Git
- VS Code + extensions

### Development Flow
1. Feature Development
   - Create feature branch
   - Implement components
   - Add tests
   - Document changes
   - Create PR

2. Code Review Process
   - Technical review
   - Business logic review
   - Test coverage check
   - Performance review

### Quality Checklist
- [ ] TypeScript strict mode compliance
- [ ] Unit test coverage > 80%
- [ ] E2E tests for critical paths
- [ ] Accessibility audit
- [ ] Performance benchmarks
- [ ] Documentation updates
- [ ] Error handling
- [ ] Mobile responsiveness

## Troubleshooting Guide 