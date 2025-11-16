/**
 * ============================================================================
 * USE QR CODE HOOK
 * ============================================================================
 *
 * Hook pour générer et gérer les QR codes
 */

import { useState, useCallback } from 'react';
import { generateRoomQRCode, downloadQRCode, type RoomQRCodeData } from '../services/qrcodeService';
import { toast } from 'sonner';

interface UseQRCodeOptions {
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const useQRCode = (options?: UseQRCodeOptions) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Générer un QR code pour une chambre
   */
  const generateQRCode = useCallback(
    async (data: RoomQRCodeData) => {
      setIsGenerating(true);
      try {
        const dataUrl = await generateRoomQRCode(data, options);
        setQrCodeUrl(dataUrl);
        return dataUrl;
      } catch (error: any) {
        console.error('Error generating QR code:', error);
        toast.error('Erreur de génération', {
          description: error.message || 'Impossible de générer le QR code',
        });
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [options]
  );

  /**
   * Télécharger le QR code
   */
  const download = useCallback(
    (fileName?: string) => {
      if (!qrCodeUrl) {
        toast.error('Aucun QR code à télécharger');
        return;
      }

      try {
        downloadQRCode(qrCodeUrl, fileName || 'qr-code');
        toast.success('QR code téléchargé avec succès');
      } catch (error: any) {
        console.error('Error downloading QR code:', error);
        toast.error('Erreur de téléchargement', {
          description: error.message,
        });
      }
    },
    [qrCodeUrl]
  );

  /**
   * Réinitialiser le QR code
   */
  const reset = useCallback(() => {
    setQrCodeUrl(null);
  }, []);

  return {
    qrCodeUrl,
    isGenerating,
    generateQRCode,
    download,
    reset,
  };
};
