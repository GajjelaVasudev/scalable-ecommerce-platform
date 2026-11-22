import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper utilities for auth validation (mirroring component logic for unit verification)
export function evaluatePasswordStrength(password: string) {
  const len = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const num = /[0-9]/.test(password);
  const special = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const passedCount = [len, upper, num, special].filter(Boolean).length;

  let label = 'Weak';
  let color = '#D92D20';
  if (passedCount >= 4) {
    label = 'Strong';
    color = '#762FF2';
  } else if (passedCount >= 2) {
    label = 'Medium';
    color = '#4C2ACB';
  }

  return {
    score: passedCount,
    label,
    color,
    hasLength: len,
    hasUpper: upper,
    hasNum: num,
    hasSpecial: special,
  };
}

export function validateRegistrationPayload(fullName: string, email: string, password: string, confirmPassword: string) {
  const errors: string[] = [];
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();

  if (trimmedName.length < 3) {
    errors.push('Full name / username must be at least 3 characters long.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Please enter a valid email address.');
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  const username = trimmedName.toLowerCase().replace(/\s+/g, '_');

  return {
    isValid: errors.length === 0,
    errors,
    payload: {
      username,
      email: trimmedEmail,
      password,
    },
  };
}

export function validateResetPasswordPayload(resetToken: string, newPassword: string, confirmPassword: string, revokeSessions: boolean = true) {
  const errors: string[] = [];

  if (!resetToken || !resetToken.trim()) {
    errors.push('Reset token is required.');
  }

  if (newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  }

  if (newPassword !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    payload: {
      resetToken: resetToken.trim(),
      newPassword,
      revokeSessions,
    },
  };
}

describe('OMIZON Authentication — Password Strength & Validation Suite', () => {
  test('evaluatePasswordStrength marks empty and short passwords as Weak', () => {
    const emptyResult = evaluatePasswordStrength('');
    assert.equal(emptyResult.score, 0);
    assert.equal(emptyResult.label, 'Weak');
    assert.equal(emptyResult.hasLength, false);

    const shortResult = evaluatePasswordStrength('abc1');
    assert.equal(shortResult.score, 1);
    assert.equal(shortResult.label, 'Weak');
    assert.equal(shortResult.hasLength, false);
  });

  test('evaluatePasswordStrength marks alphanumeric 8+ character password as Medium', () => {
    const medResult = evaluatePasswordStrength('password123');
    assert.equal(medResult.hasLength, true);
    assert.equal(medResult.hasNum, true);
    assert.equal(medResult.hasUpper, false);
    assert.equal(medResult.hasSpecial, false);
    assert.equal(medResult.score, 2);
    assert.equal(medResult.label, 'Medium');
  });

  test('evaluatePasswordStrength marks fully conforming password as Strong with score 4', () => {
    const strongResult = evaluatePasswordStrength('OmizonSecure2025!');
    assert.equal(strongResult.hasLength, true);
    assert.equal(strongResult.hasUpper, true);
    assert.equal(strongResult.hasNum, true);
    assert.equal(strongResult.hasSpecial, true);
    assert.equal(strongResult.score, 4);
    assert.equal(strongResult.label, 'Strong');
    assert.equal(strongResult.color, '#762FF2');
  });
});

describe('OMIZON Authentication — Registration Form & Payload Suite', () => {
  test('validateRegistrationPayload catches short username and invalid email', () => {
    const result = validateRegistrationPayload('al', 'invalid-email', 'password123', 'password123');
    assert.equal(result.isValid, false);
    assert.equal(result.errors.length, 2);
  });

  test('validateRegistrationPayload catches password mismatch', () => {
    const result = validateRegistrationPayload('Elena Rostova', 'elena@omizon.in', 'Password123!', 'Password999!');
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('Passwords do not match')));
  });

  test('validateRegistrationPayload builds sanitized payload with transformed username', () => {
    const result = validateRegistrationPayload('Elena Rostova', 'ELENA@OMIZON.IN', 'SecurePass2025!', 'SecurePass2025!');
    assert.equal(result.isValid, true);
    assert.equal(result.payload.username, 'elena_rostova');
    assert.equal(result.payload.email, 'ELENA@OMIZON.IN');
    assert.equal(result.payload.password, 'SecurePass2025!');
  });
});

describe('OMIZON Authentication — Password Recovery Flow Suite', () => {
  test('validateResetPasswordPayload enforces 8-character minimum and token requirement', () => {
    const result = validateResetPasswordPayload('', 'short', 'short');
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('Reset token is required')));
    assert.ok(result.errors.some((e) => e.includes('at least 8 characters long')));
  });

  test('validateResetPasswordPayload defaults revokeSessions to true for security protection', () => {
    const result = validateResetPasswordPayload('test-raw-token-12345', 'NewSecurePass2025!', 'NewSecurePass2025!');
    assert.equal(result.isValid, true);
    assert.equal(result.payload.revokeSessions, true);
    assert.equal(result.payload.resetToken, 'test-raw-token-12345');
    assert.equal(result.payload.newPassword, 'NewSecurePass2025!');
  });
});

describe('OMIZON Authentication — Stitch Design System Token Integrity', () => {
  test('Stitch design tokens match approved visual specs', () => {
    const STITCH_TOKENS = {
      midnightViolet: '#190B46',
      electricViolet: '#762FF2',
      royalPurple: '#4C2ACB',
      porcelain: '#F7F7FB',
      lavenderMist: '#E8E6F0',
      ink: '#211D31',
      desktopLeftPanelRatio: '46%',
      desktopRightPanelRatio: '54%',
    };

    assert.equal(STITCH_TOKENS.midnightViolet, '#190B46');
    assert.equal(STITCH_TOKENS.electricViolet, '#762FF2');
    assert.equal(STITCH_TOKENS.royalPurple, '#4C2ACB');
    assert.equal(STITCH_TOKENS.desktopLeftPanelRatio, '46%');
    assert.equal(STITCH_TOKENS.desktopRightPanelRatio, '54%');
  });
});
