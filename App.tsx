import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder import to verify path aliases work
// This will be replaced with actual sensor components in later tasks

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Cup Coach</Text>
      <Text style={styles.subtitle}>Sensor pipeline initializing...</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
  },
});
