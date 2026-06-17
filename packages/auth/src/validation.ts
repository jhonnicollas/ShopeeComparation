export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function validateEmail(email: string): ValidationResult {
  if (!email || email.length === 0) {
    return { valid: false, error: "Email is required" };
  }
  if (email.length > 254) {
    return { valid: false, error: "Email is too long" };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Email format is invalid" };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
    };
  }
  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  if (name.length === 0) {
    return { valid: true };
  }
  if (name.length > 100) {
    return { valid: false, error: "Name must be at most 100 characters" };
  }
  return { valid: true };
}

export function validateAuthInput(
  email: string,
  password: string,
  name?: string
): ValidationResult {
  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    return emailResult;
  }
  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    return passwordResult;
  }
  if (name !== undefined) {
    const nameResult = validateName(name);
    if (!nameResult.valid) {
      return nameResult;
    }
  }
  return { valid: true };
}
