import { Switch } from 'react-native';
import { SettingRow } from './SettingRow';
import { useTheme } from '../../hooks/useTheme';

interface SettingToggleProps {
  /** Setting label */
  label: string;
  /** Optional description text */
  description?: string;
  /** Current toggle value */
  value: boolean;
  /** Called when toggle changes */
  onValueChange: (value: boolean) => void;
}

/**
 * Toggle setting row with Switch component
 * Accessible with proper labels for screen readers
 */
export function SettingToggle({
  label,
  description,
  value,
  onValueChange,
}: SettingToggleProps) {
  const { colors } = useTheme();

  return (
    <SettingRow label={label} description={description}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface, true: colors.primary }}
        thumbColor="#ffffff"
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </SettingRow>
  );
}
