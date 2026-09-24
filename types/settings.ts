export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export function createDefaultReminderSettings(): ReminderSettings {
  return {
    enabled: true,
    hour: 18,
    minute: 30,
  };
}
