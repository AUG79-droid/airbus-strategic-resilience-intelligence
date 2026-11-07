export const NUMERIC_EPSILON = 1e-10;

export class DomainValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid domain input:\n- ${issues.join('\n- ')}`);
    this.name = 'DomainValidationError';
    this.issues = issues;
  }
}

export function assertFiniteNonNegative(value: number, label: string, issues: string[]) {
  if (!Number.isFinite(value) || value < 0) {
    issues.push(`${label} must be a finite number greater than or equal to zero.`);
  }
}

export function assertProbability(value: number, label: string, issues: string[]) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    issues.push(`${label} must be between 0 and 1 inclusive.`);
  }
}

export function nearlyEqual(left: number, right: number, epsilon = NUMERIC_EPSILON) {
  return Math.abs(left - right) <= epsilon;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
