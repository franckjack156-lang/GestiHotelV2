/**
 * LoginForm Component with 2FA Support
 *
 * Formulaire de connexion avec email/mot de passe et Google
 * Supporte l'authentification à deux facteurs (2FA)
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { logger } from '@/core/utils/logger';
import { TwoFactorVerify } from './TwoFactorVerify';
import { is2FAEnabled } from '../services/twoFactorService';
import { loginWithEmail } from '../services/authService';

/**
 * Schema de validation Zod
 */
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (min. 6 caractères)'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Soumission du formulaire
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      // First, try to login to get the user ID
      const user = await loginWithEmail(data);

      // Check if 2FA is enabled for this user
      const has2FA = await is2FAEnabled(user.uid);

      if (has2FA) {
        // User needs to verify 2FA code
        setTempUserId(user.uid);
        setNeedsTwoFactor(true);
        // Note: The user is already logged in at this point
        // but we show the 2FA screen before redirecting
      } else {
        // No 2FA, proceed with normal login flow
        await login(data);
        navigate('/dashboard');
      }
    } catch (error) {
      // L'erreur est déjà gérée par le hook useAuth
      logger.error('Erreur de connexion:', error);
    }
  };

  /**
   * Connexion avec Google
   */
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // TODO: Check 2FA for Google users too if needed
      navigate('/dashboard');
    } catch (error) {
      logger.error('Erreur de connexion Google:', error);
    }
  };

  /**
   * Handle successful 2FA verification
   */
  const handle2FASuccess = () => {
    navigate('/dashboard');
  };

  /**
   * Handle 2FA cancellation
   */
  const handle2FACancel = async () => {
    // Log the user out
    try {
      await login({ email: '', password: '' }); // This will fail and logout
    } catch {
      // Ignore error
    }
    setNeedsTwoFactor(false);
    setTempUserId(null);
  };

  // Show 2FA verification screen if needed
  if (needsTwoFactor && tempUserId) {
    return (
      <TwoFactorVerify
        userId={tempUserId}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Titre */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Connexion</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Connectez-vous à votre compte GestiHôtel
        </p>
      </div>

      {/* Erreur globale */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              className="pl-10"
              {...register('email')}
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        {/* Mot de passe */}
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-10 pr-10"
              {...register('password')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {/* Mot de passe oublié */}
        <div className="text-right">
          <Link
            to="/reset-password"
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Bouton de connexion */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            'Connexion en cours...'
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Se connecter
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Ou continuer avec
          </span>
        </div>
      </div>

      {/* Connexion Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </Button>

      {/* Lien inscription */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Pas encore de compte ?{' '}
        <Link
          to="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          S'inscrire
        </Link>
      </p>
    </div>
  );
};
