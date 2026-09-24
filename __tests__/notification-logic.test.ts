import { describe, expect, it } from 'vitest';
import { formatReminderTime, getReminderTimeLabel } from '../domain/progress-logic';

describe('Notification time formatting', () => {
  it('formats evening hours correctly (18:30 -> 06:30 PM)', () => {
    expect(formatReminderTime(18, 30)).toBe('06:30 PM');
  });

  it('formats midnight correctly (00:00 -> 12:00 AM)', () => {
    expect(formatReminderTime(0, 0)).toBe('12:00 AM');
  });

  it('formats noon correctly (12:00 -> 12:00 PM)', () => {
    expect(formatReminderTime(12, 0)).toBe('12:00 PM');
  });

  it('formats morning single-digit hours and minutes with leading zero', () => {
    expect(formatReminderTime(7, 5)).toBe('07:05 AM');
  });

  it('returns default 06:30 PM label when no settings provided', () => {
    expect(getReminderTimeLabel()).toBe('06:30 PM');
  });

  it('returns formatted label for custom settings', () => {
    expect(getReminderTimeLabel({ enabled: true, hour: 20, minute: 45 })).toBe('08:45 PM');
  });
});
