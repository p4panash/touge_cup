import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type TextVariant = 'default' | 'secondary' | 'title' | 'subtitle';

interface ThemedTextProps extends TextProps {
  /** Text style variant */
  variant?: TextVariant;
}

/**
 * Text component with automatic dark mode support
 * Supports variants: default, secondary, title, subtitle
 */
export function ThemedText({ style, variant = 'default', ...props }: ThemedTextProps) {
  const { colors } = useTheme();

  const variantStyle = getVariantStyle(variant, colors);

  return (
    <Text
      style={[variantStyle, style]}
      {...props}
    />
  );
}

function getVariantStyle(variant: TextVariant, colors: ReturnType<typeof useTheme>['colors']) {
  switch (variant) {
    case 'title':
      return {
        ...styles.title,
        color: colors.text,
      };
    case 'subtitle':
      return {
        ...styles.subtitle,
        color: colors.textSecondary,
      };
    case 'secondary':
      return {
        ...styles.default,
        color: colors.textSecondary,
      };
    case 'default':
    default:
      return {
        ...styles.default,
        color: colors.text,
      };
  }
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
  },
});
