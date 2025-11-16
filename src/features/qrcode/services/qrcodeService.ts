/**
 * ============================================================================
 * QR CODE SERVICE
 * ============================================================================
 *
 * Service pour générer et scanner des QR codes pour les chambres
 * - Génération de QR codes avec logo établissement
 * - Encodage des données chambre
 * - Export PNG
 */

import QRCode from 'qrcode';

export interface RoomQRCodeData {
  roomId: string;
  roomNumber: string;
  establishmentId: string;
  establishmentName: string;
  type: 'room'; // Pour identifier le type de QR code
  version: '1.0'; // Pour compatibilité future
}

/**
 * Générer un QR code pour une chambre
 */
export const generateRoomQRCode = async (
  data: RoomQRCodeData,
  options?: {
    size?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> => {
  const qrData = JSON.stringify(data);

  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
    type: 'image/png',
    margin: 2,
    width: options?.size || 300,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  };

  try {
    // Générer le QR code en base64
    const dataUrl = await QRCode.toDataURL(qrData, qrOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Impossible de générer le QR code');
  }
};

/**
 * Télécharger le QR code en PNG
 */
export const downloadQRCode = (dataUrl: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parser les données d'un QR code scanné
 */
export const parseRoomQRCode = (qrData: string): RoomQRCodeData | null => {
  try {
    const parsed = JSON.parse(qrData);

    // Vérifier que c'est bien un QR code de chambre
    if (parsed.type !== 'room') {
      throw new Error('QR code invalide: pas un QR code de chambre');
    }

    // Vérifier que toutes les données nécessaires sont présentes
    if (
      !parsed.roomId ||
      !parsed.roomNumber ||
      !parsed.establishmentId ||
      !parsed.establishmentName
    ) {
      throw new Error('QR code invalide: données manquantes');
    }

    return parsed as RoomQRCodeData;
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

/**
 * Générer plusieurs QR codes en batch
 */
export const generateBatchQRCodes = async (
  rooms: Array<{
    id: string;
    number: string;
    establishmentId: string;
    establishmentName: string;
  }>,
  options?: {
    size?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<Array<{ roomId: string; roomNumber: string; dataUrl: string }>> => {
  const qrCodes = await Promise.all(
    rooms.map(async room => {
      const data: RoomQRCodeData = {
        roomId: room.id,
        roomNumber: room.number,
        establishmentId: room.establishmentId,
        establishmentName: room.establishmentName,
        type: 'room',
        version: '1.0',
      };

      const dataUrl = await generateRoomQRCode(data, options);

      return {
        roomId: room.id,
        roomNumber: room.number,
        dataUrl,
      };
    })
  );

  return qrCodes;
};
