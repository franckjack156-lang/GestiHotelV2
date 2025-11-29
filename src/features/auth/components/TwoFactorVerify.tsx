/**
 * TwoFactorVerify Component
 *
 * Component for verifying 2FA code during login
 */

import { useState } from 'react';
import { Shield, AlertCircle, Key } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { verify2FAToken } from '../services/twoFactorService';
import { logger } from '@/core/utils/logger';

interface TwoFactorVerifyProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorVerify = ({ userId, onSuccess, onCancel }: TwoFactorVerifyProps) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }

    // TOTP codes should be 6 digits, backup codes are 8 characters
    if (!isUsingBackupCode && verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    if (isUsingBackupCode && verificationCode.length !== 8) {
      setError('Backup code must be 8 characters');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const result = await verify2FAToken(userId, verificationCode);

      if (result.isValid) {
        onSuccess();
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      logger.error('Error verifying 2FA code:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setError(null);
    if (isUsingBackupCode) {
      // Backup codes are alphanumeric
      setVerificationCode(
        value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8)
      );
    } else {
      // TOTP codes are numeric only
      setVerificationCode(value.replace(/\D/g, '').slice(0, 6));
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter the verification code from your authenticator app
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Verification Form */}
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verification-code" className="text-sm font-medium">
            {isUsingBackupCode ? 'Backup Code' : 'Verification Code'}
          </Label>
          <Input
            id="verification-code"
            type="text"
            placeholder={isUsingBackupCode ? 'ABC12345' : '000000'}
            value={verificationCode}
            onChange={e => handleCodeChange(e.target.value)}
            className={`text-center text-2xl tracking-widest font-mono ${
              isUsingBackupCode ? 'uppercase' : ''
            }`}
            autoFocus
            disabled={isVerifying}
          />
          <p className="text-xs text-muted-foreground text-center">
            {isUsingBackupCode
              ? 'Enter your 8-character backup code'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {/* Backup Code Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsUsingBackupCode(!isUsingBackupCode);
              setVerificationCode('');
              setError(null);
            }}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1 mx-auto"
            disabled={isVerifying}
          >
            <Key className="h-3 w-3" />
            {isUsingBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
          </button>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-xs">
          This code changes every 30 seconds. If you lost your device, use a backup code to sign in.
        </AlertDescription>
      </Alert>
    </div>
  );
};
