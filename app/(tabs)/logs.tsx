import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Share,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { DebugLogger, LogEntry, LogLevel } from '@/services/DebugLogger';
import { Spacing } from '@/theme/spacing';
import { useTheme } from '@/hooks/useTheme';

const levelColors: Record<LogLevel, string> = {
  debug: '#888888',
  info: '#00d4ff',
  warn: '#ffaa00',
  error: '#ff4444',
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function LogItem({ entry }: { entry: LogEntry }) {
  return (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <ThemedText style={styles.timestamp}>{formatTime(entry.timestamp)}</ThemedText>
        <View style={[styles.levelBadge, { backgroundColor: levelColors[entry.level] }]}>
          <ThemedText style={styles.levelText}>{entry.level.toUpperCase()}</ThemedText>
        </View>
        <ThemedText style={styles.tag}>[{entry.tag}]</ThemedText>
      </View>
      <ThemedText style={styles.message}>{entry.message}</ThemedText>
    </View>
  );
}

export default function DebugLogsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(() => {
    setLogs(DebugLogger.getLogs());
  }, []);

  useEffect(() => {
    loadLogs();

    // Subscribe to new logs
    const unsubscribe = DebugLogger.subscribe(() => {
      loadLogs();
    });

    return unsubscribe;
  }, [loadLogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLogs();
    setRefreshing(false);
  }, [loadLogs]);

  const handleClear = useCallback(() => {
    DebugLogger.clear();
    setLogs([]);
  }, []);

  const handleShare = useCallback(async () => {
    const logText = logs
      .map(
        (log) =>
          `${formatTime(log.timestamp)} [${log.level.toUpperCase()}] [${log.tag}] ${log.message}`
      )
      .join('\n');

    try {
      await Share.share({
        message: `Water Cup Debug Logs\n${'='.repeat(40)}\n\n${logText}`,
        title: 'Debug Logs',
      });
    } catch {
      // User cancelled
    }
  }, [logs]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with actions */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Debug Logs</ThemedText>
        <View style={styles.actions}>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <ThemedText style={[styles.actionText, { color: colors.primary }]}>Share</ThemedText>
          </Pressable>
          <Pressable onPress={handleClear} style={styles.actionButton}>
            <ThemedText style={[styles.actionText, { color: colors.danger }]}>Clear</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Log count */}
      <View style={[styles.countRow, { backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.countText, { color: colors.textSecondary }]}>{logs.length} entries</ThemedText>
      </View>

      {/* Log list */}
      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>No logs yet</ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Logs will appear as you use the app
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <LogItem entry={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionText: {
    fontWeight: '500',
  },
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  countText: {
    fontSize: 12,
  },
  listContent: {
    padding: Spacing.md,
  },
  logItem: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'monospace',
    opacity: 0.6,
  },
  levelBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  levelText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
  },
  tag: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  message: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
});
