/**
 * Optional OCR pipeline for tickets (spec §6.6, §12).
 * Stub implementation: returns placeholder data. Replace with real OCR (e.g. Tesseract, cloud API) when needed.
 */

export interface OcrResult {
  carrier?: string;
  departureTime?: string;
  arrivalTime?: string;
  seat?: string;
  gate?: string;
  pnr?: string;
  flightNumber?: string;
  [key: string]: string | undefined;
}

/**
 * Process a ticket file and return extracted fields for smart card.
 * Optional: integrate real OCR (filePath or buffer) and return structured data.
 */
export async function processTicketOcr(_filePath: string | null, _fileName?: string): Promise<OcrResult> {
  // Stub: return placeholder. In production, read file, run OCR, parse text into carrier, time, seat, gate, PNR.
  return {
    carrier: 'Carrier (OCR)',
    departureTime: '--:--',
    arrivalTime: '--:--',
    seat: '--',
    gate: '--',
    pnr: '--------',
    flightNumber: '----',
  };
}
