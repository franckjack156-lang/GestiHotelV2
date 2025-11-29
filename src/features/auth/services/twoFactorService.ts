/**
 * Two-Factor Authentication Service
 *
 * Service for managing TOTP-based 2FA
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';
import type {
  TwoFactorSecret,
  TwoFactorSetupData,
  UserTwoFactorSettings,
  TwoFactorVerificationResult,
} from '../types/twoFactor.types';

// Configuration TOTP
authenticator.options = {
  window: 1, // Allow 1 step before/after (30 seconds)
  step: 30, // 30 seconds validity window
};

/**
 * Generate a new TOTP secret for a user
 */
export const generateSecret = (email: string): TwoFactorSecret => {
  try {
    const secret = authenticator.generateSecret();
    const appName = 'GestiHôtel';

    // Generate otpauth URL for QR code
    const otpauth = authenticator.keyuri(email, appName, secret);

    return {
      secret,
      qrCodeUrl: otpauth,
    };
  } catch (error) {
    logger.error('Error generating 2FA secret:', error);
    throw new Error('Failed to generate 2FA secret');
  }
};

/**
 * Generate QR code as data URL from otpauth URL
 */
export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    return qrCodeDataUrl;
  } catch (error) {
    logger.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify a TOTP token against a secret
 */
export const verifyToken = (secret: string, token: string): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    logger.error('Error verifying TOTP token:', error);
    return false;
  }
};

/**
 * Generate backup codes for account recovery
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate random 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Simple encryption for storing secrets (XOR-based)
 * NOTE: For production, consider using a proper encryption library
 */
const encryptSecret = (secret: string): string => {
  // Simple XOR encryption with a key (in production, use proper encryption)
  const key = 'GESTIHOTEL_2FA_KEY'; // In production, store this securely in env
  let encrypted = '';
  for (let i = 0; i < secret.length; i++) {
    encrypted += String.fromCharCode(secret.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(encrypted).toString('base64');
};

/**
 * Simple decryption for retrieving secrets
 */
const decryptSecret = (encrypted: string): string => {
  const key = 'GESTIHOTEL_2FA_KEY';
  const decoded = Buffer.from(encrypted, 'base64').toString();
  let decrypted = '';
  for (let i = 0; i < decoded.length; i++) {
    decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return decrypted;
};

/**
 * Enable 2FA for a user
 */
export const enable2FA = async (userId: string, data: TwoFactorSetupData): Promise<void> => {
  try {
    // Verify the token first
    const isValid = verifyToken(data.secret, data.verificationToken);
    if (!isValid) {
      throw new Error('Invalid verification token');
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Encrypt the secret and backup codes
    const encryptedSecret = encryptSecret(data.secret);
    const encryptedBackupCodes = backupCodes.map(code => encryptSecret(code));

    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    const twoFactorSettings: UserTwoFactorSettings = {
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: encryptedBackupCodes,
      twoFactorEnabledAt: new Date(),
    };

    await updateDoc(userRef, {
      twoFactorEnabled: twoFactorSettings.twoFactorEnabled,
      twoFactorSecret: twoFactorSettings.twoFactorSecret,
      twoFactorBackupCodes: twoFactorSettings.twoFactorBackupCodes,
      twoFactorEnabledAt: twoFactorSettings.twoFactorEnabledAt,
    });

    logger.info('2FA enabled for user:', userId);
  } catch (error) {
    logger.error('Error enabling 2FA:', error);
    throw error;
  }
};

/**
 * Disable 2FA for a user
 */
export const disable2FA = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorEnabledAt: null,
    });

    logger.info('2FA disabled for user:', userId);
  } catch (error) {
    logger.error('Error disabling 2FA:', error);
    throw new Error('Failed to disable 2FA');
  }
};

/**
 * Check if 2FA is enabled for a user
 */
export const is2FAEnabled = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data() as UserTwoFactorSettings;
    return userData.twoFactorEnabled || false;
  } catch (error) {
    logger.error('Error checking 2FA status:', error);
    return false;
  }
};

/**
 * Get user's 2FA secret (decrypted)
 */
export const get2FASecret = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data() as UserTwoFactorSettings;
    if (!userData.twoFactorSecret) {
      return null;
    }

    return decryptSecret(userData.twoFactorSecret);
  } catch (error) {
    logger.error('Error getting 2FA secret:', error);
    return null;
  }
};

/**
 * Verify 2FA token for a user during login
 */
export const verify2FAToken = async (
  userId: string,
  token: string
): Promise<TwoFactorVerificationResult> => {
  try {
    const secret = await get2FASecret(userId);

    if (!secret) {
      return {
        isValid: false,
        error: '2FA is not enabled for this user',
      };
    }

    // Check if it's a valid TOTP token
    const isValid = verifyToken(secret, token);

    if (isValid) {
      return { isValid: true };
    }

    // If TOTP failed, check backup codes
    const isBackupCodeValid = await verifyBackupCode(userId, token);
    if (isBackupCodeValid) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Invalid verification code',
    };
  } catch (error) {
    logger.error('Error verifying 2FA token:', error);
    return {
      isValid: false,
      error: 'Failed to verify 2FA token',
    };
  }
};

/**
 * Verify and consume a backup code
 */
const verifyBackupCode = async (userId: string, code: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data() as UserTwoFactorSettings;
    if (!userData.twoFactorBackupCodes || userData.twoFactorBackupCodes.length === 0) {
      return false;
    }

    // Decrypt and check backup codes
    const decryptedCodes = userData.twoFactorBackupCodes.map(c => decryptSecret(c));
    const codeIndex = decryptedCodes.findIndex(c => c === code.toUpperCase());

    if (codeIndex === -1) {
      return false;
    }

    // Remove the used backup code
    const updatedBackupCodes = [...userData.twoFactorBackupCodes];
    updatedBackupCodes.splice(codeIndex, 1);

    await updateDoc(userRef, {
      twoFactorBackupCodes: updatedBackupCodes,
    });

    logger.info('Backup code used for user:', userId);
    return true;
  } catch (error) {
    logger.error('Error verifying backup code:', error);
    return false;
  }
};

/**
 * Get user's backup codes (decrypted)
 */
export const getBackupCodes = async (userId: string): Promise<string[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as UserTwoFactorSettings;
    if (!userData.twoFactorBackupCodes) {
      return [];
    }

    return userData.twoFactorBackupCodes.map(code => decryptSecret(code));
  } catch (error) {
    logger.error('Error getting backup codes:', error);
    return [];
  }
};

/**
 * Regenerate backup codes for a user
 */
export const regenerateBackupCodes = async (userId: string): Promise<string[]> => {
  try {
    const newBackupCodes = generateBackupCodes(10);
    const encryptedBackupCodes = newBackupCodes.map(code => encryptSecret(code));

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorBackupCodes: encryptedBackupCodes,
    });

    logger.info('Backup codes regenerated for user:', userId);
    return newBackupCodes;
  } catch (error) {
    logger.error('Error regenerating backup codes:', error);
    throw new Error('Failed to regenerate backup codes');
  }
};

export default {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateBackupCodes,
  enable2FA,
  disable2FA,
  is2FAEnabled,
  get2FASecret,
  verify2FAToken,
  getBackupCodes,
  regenerateBackupCodes,
};
