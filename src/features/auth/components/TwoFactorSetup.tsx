/**
 * TwoFactorSetup Component
 *
 * Component for setting up and managing 2FA/TOTP
 */

import { useState, useEffect } from 'react';
import { Shield, Smartphone, Key, Copy, Check, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import {
  generateSecret,
  generateQRCode,
  enable2FA,
  disable2FA,
  is2FAEnabled,
  getBackupCodes,
  regenerateBackupCodes,
} from '../services/twoFactorService';
import { logger } from '@/core/utils/logger';

export const TwoFactorSetup = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isBackupCodesDialogOpen, setIsBackupCodesDialogOpen] = useState(false);

  // Setup state
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr');

  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Check if 2FA is enabled on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) return;

      try {
        const enabled = await is2FAEnabled(user.id);
        setIsEnabled(enabled);
      } catch (error) {
        logger.error('Error checking 2FA status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user?.id]);

  // Start setup process
  const handleStartSetup = async () => {
    if (!user?.email) {
      toast.error('User email not found');
      return;
    }

    try {
      setIsLoading(true);
      const { secret: newSecret, qrCodeUrl: otpauth } = generateSecret(user.email);
      const qrDataUrl = await generateQRCode(otpauth);

      setSecret(newSecret);
      setQrCodeUrl(qrDataUrl);
      setSetupStep('qr');
      setIsSetupDialogOpen(true);
    } catch (error) {
      logger.error('Error starting 2FA setup:', error);
      toast.error('Failed to start 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify and enable 2FA
  const handleVerifyAndEnable = async () => {
    if (!user?.id || !secret || !verificationCode) {
      toast.error('Missing required information');
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error('Code must be 6 digits');
      return;
    }

    try {
      setIsEnabling(true);

      // Enable 2FA (this also verifies the code)
      await enable2FA(user.id, {
        secret,
        verificationToken: verificationCode,
      });

      // Get backup codes
      const codes = await getBackupCodes(user.id);
      setBackupCodes(codes);
      setSetupStep('backup');
      setIsEnabled(true);

      toast.success('2FA enabled successfully', {
        description: 'Your account is now protected with two-factor authentication',
      });
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      toast.error('Invalid verification code', {
        description: 'Please check your authenticator app and try again',
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Disable 2FA
  const handleDisable = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      await disable2FA(user.id);
      setIsEnabled(false);
      setIsDisableDialogOpen(false);

      toast.success('2FA disabled', {
        description: 'Two-factor authentication has been disabled',
      });
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy secret to clipboard
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  // Copy backup code to clipboard
  const handleCopyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gestihotel-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  // View backup codes
  const handleViewBackupCodes = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const codes = await getBackupCodes(user.id);
      setBackupCodes(codes);
      setIsBackupCodesDialogOpen(true);
    } catch (error) {
      logger.error('Error getting backup codes:', error);
      toast.error('Failed to get backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate backup codes
  const handleRegenerateBackupCodes = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const codes = await regenerateBackupCodes(user.id);
      setBackupCodes(codes);
      toast.success('Backup codes regenerated');
    } catch (error) {
      logger.error('Error regenerating backup codes:', error);
      toast.error('Failed to regenerate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  // Close setup dialog
  const handleCloseSetup = () => {
    setIsSetupDialogOpen(false);
    setSetupStep('qr');
    setSecret('');
    setQrCodeUrl('');
    setVerificationCode('');
  };

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Two-factor authentication adds an extra layer of security to your account by requiring a
          verification code in addition to your password.
        </AlertDescription>
      </Alert>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                <Shield className={`h-5 w-5 ${isEnabled ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  {isEnabled ? 'Currently enabled' : 'Currently disabled'}
                </CardDescription>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isEnabled
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
              }`}
            >
              {isEnabled ? 'Active' : 'Inactive'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your account with an additional security layer. You'll need an authenticator
                app like Google Authenticator or Authy.
              </p>
              <Button onClick={handleStartSetup} disabled={isLoading} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication is protecting your account.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleViewBackupCodes} variant="outline" disabled={isLoading}>
                  <Key className="mr-2 h-4 w-4" />
                  View Backup Codes
                </Button>
                <Button
                  onClick={() => setIsDisableDialogOpen(true)}
                  variant="destructive"
                  disabled={isLoading}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === 'qr' && 'Scan QR Code'}
              {setupStep === 'verify' && 'Enter Verification Code'}
              {setupStep === 'backup' && 'Save Backup Codes'}
            </DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' &&
                'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'}
              {setupStep === 'verify' &&
                'Enter the 6-digit code from your authenticator app to verify'}
              {setupStep === 'backup' &&
                'Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />}
              </div>

              {/* Manual entry */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Or enter this code manually:
                </Label>
                <div className="flex items-center gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button size="sm" variant="outline" onClick={handleCopySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={() => setSetupStep('verify')} className="w-full">
                Next: Verify Code
              </Button>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Enter the 6-digit code from your authenticator app
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSetupStep('qr')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={isEnabling || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isEnabling ? 'Verifying...' : 'Enable 2FA'}
                </Button>
              </div>
            </div>
          )}

          {setupStep === 'backup' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Save these codes now! You won't be able to see them again.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <span className="font-mono text-sm">{code}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyBackupCode(code)}
                      className="h-6 w-6 p-0"
                    >
                      {copiedCode === code ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadBackupCodes} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={handleCloseSetup} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              Your account will be less secure without two-factor authentication. Are you sure you
              want to disable it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisableDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable} disabled={isLoading}>
              {isLoading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={isBackupCodesDialogOpen} onOpenChange={setIsBackupCodesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Use these codes to access your account if you lose your authenticator device. Each
              code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-background rounded border"
                >
                  <span className="font-mono text-sm">{code}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyBackupCode(code)}
                    className="h-6 w-6 p-0"
                  >
                    {copiedCode === code ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRegenerateBackupCodes}
                disabled={isLoading}
                className="flex-1"
              >
                Regenerate Codes
              </Button>
              <Button onClick={handleDownloadBackupCodes} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
