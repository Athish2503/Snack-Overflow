export type SnackStatus = 'stocked' | 'running_low' | 'gone';

export function getSnackStatus(quantity: number, lowStockThreshold: number): SnackStatus {
  if (quantity === 0) {
    return 'gone';
  }
  if (quantity <= lowStockThreshold) {
    return 'running_low';
  }
  return 'stocked';
}
