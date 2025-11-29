/**
 * Two-Factor Authentication Types
 *
 * Types for 2FA/MFA with TOTP
 */

/**
 * Two-factor secret data
 */
export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
}

/**
 * Two-factor verification data
 */
export interface TwoFactorVerification {
  token: string;
  userId: string;
}

/**
 * Two-factor setup data
 */
export interface TwoFactorSetupData {
  secret: string;
  verificationToken: string;
}

/**
 * User 2FA settings stored in Firestore
 */
export interface UserTwoFactorSettings {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // Encrypted secret
  twoFactorBackupCodes?: string[]; // Encrypted backup codes
  twoFactorEnabledAt?: Date;
}

/**
 * 2FA verification result
 */
export interface TwoFactorVerificationResult {
  isValid: boolean;
  error?: string;
}
