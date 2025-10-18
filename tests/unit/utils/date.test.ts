/**
 * Testy jednostkowe dla funkcji formatDate i getMonthName
 */

import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/utils/formatDate';
import { getMonthName } from '@/lib/utils/getMonthName';

describe('formatDate', () => {
  describe('DD.MM format', () => {
    it('should format date to DD.MM', () => {
      const result = formatDate('2025-10-15', 'DD.MM');
      expect(result).toBe('15.10');
    });

    it('should handle single digit day', () => {
      const result = formatDate('2025-10-05', 'DD.MM');
      expect(result).toBe('05.10');
    });

    it('should handle single digit month', () => {
      const result = formatDate('2025-01-15', 'DD.MM');
      expect(result).toBe('15.01');
    });

    it('should handle first day of month', () => {
      const result = formatDate('2025-03-01', 'DD.MM');
      expect(result).toBe('01.03');
    });

    it('should handle last day of month', () => {
      const result = formatDate('2025-12-31', 'DD.MM');
      expect(result).toBe('31.12');
    });
  });

  describe('DD.MM.YYYY format', () => {
    it('should format date to DD.MM.YYYY', () => {
      const result = formatDate('2025-10-15', 'DD.MM.YYYY');
      expect(result).toBe('15.10.2025');
    });

    it('should handle single digit day', () => {
      const result = formatDate('2025-10-05', 'DD.MM.YYYY');
      expect(result).toBe('05.10.2025');
    });

    it('should handle single digit month', () => {
      const result = formatDate('2025-01-15', 'DD.MM.YYYY');
      expect(result).toBe('15.01.2025');
    });

    it('should handle leap year date', () => {
      const result = formatDate('2024-02-29', 'DD.MM.YYYY');
      expect(result).toBe('29.02.2024');
    });

    it('should handle different year', () => {
      const result = formatDate('2023-06-20', 'DD.MM.YYYY');
      expect(result).toBe('20.06.2023');
    });
  });
});

describe('getMonthName', () => {
  it('should return correct month name for January', () => {
    expect(getMonthName(1)).toBe('Styczeń');
  });

  it('should return correct month name for February', () => {
    expect(getMonthName(2)).toBe('Luty');
  });

  it('should return correct month name for March', () => {
    expect(getMonthName(3)).toBe('Marzec');
  });

  it('should return correct month name for April', () => {
    expect(getMonthName(4)).toBe('Kwiecień');
  });

  it('should return correct month name for May', () => {
    expect(getMonthName(5)).toBe('Maj');
  });

  it('should return correct month name for June', () => {
    expect(getMonthName(6)).toBe('Czerwiec');
  });

  it('should return correct month name for July', () => {
    expect(getMonthName(7)).toBe('Lipiec');
  });

  it('should return correct month name for August', () => {
    expect(getMonthName(8)).toBe('Sierpień');
  });

  it('should return correct month name for September', () => {
    expect(getMonthName(9)).toBe('Wrzesień');
  });

  it('should return correct month name for October', () => {
    expect(getMonthName(10)).toBe('Październik');
  });

  it('should return correct month name for November', () => {
    expect(getMonthName(11)).toBe('Listopad');
  });

  it('should return correct month name for December', () => {
    expect(getMonthName(12)).toBe('Grudzień');
  });

  it('should return error message for month 0', () => {
    expect(getMonthName(0)).toBe('Nieprawidłowy miesiąc');
  });

  it('should return error message for month 13', () => {
    expect(getMonthName(13)).toBe('Nieprawidłowy miesiąc');
  });

  it('should return error message for negative month', () => {
    expect(getMonthName(-1)).toBe('Nieprawidłowy miesiąc');
  });

  it('should return error message for very large month number', () => {
    expect(getMonthName(100)).toBe('Nieprawidłowy miesiąc');
  });
});

