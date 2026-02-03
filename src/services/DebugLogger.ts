/**
 * In-memory debug logger for runtime diagnostics
 *
 * Captures logs from various subsystems for display in Settings > Debug Logs.
 * Logs are stored in memory only (not persisted) and limited to prevent memory issues.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  tag: string;
  message: string;
}

type LogListener = (entry: LogEntry) => void;

const MAX_LOGS = 500;

class DebugLoggerClass {
  private logs: LogEntry[] = [];
  private nextId = 1;
  private listeners: Set<LogListener> = new Set();

  /**
   * Add a log entry
   */
  log(level: LogLevel, tag: string, message: string): void {
    const entry: LogEntry = {
      id: this.nextId++,
      timestamp: Date.now(),
      level,
      tag,
      message,
    };

    this.logs.push(entry);

    // Trim old logs if exceeding max
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(entry));

    // Also log to console in dev
    if (__DEV__) {
      const prefix = `[${tag}]`;
      switch (level) {
        case 'debug':
          console.debug(prefix, message);
          break;
        case 'info':
          console.info(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        case 'error':
          console.error(prefix, message);
          break;
      }
    }
  }

  debug(tag: string, message: string): void {
    this.log('debug', tag, message);
  }

  info(tag: string, message: string): void {
    this.log('info', tag, message);
  }

  warn(tag: string, message: string): void {
    this.log('warn', tag, message);
  }

  error(tag: string, message: string): void {
    this.log('error', tag, message);
  }

  /**
   * Get all logs (newest first)
   */
  getLogs(): LogEntry[] {
    return [...this.logs].reverse();
  }

  /**
   * Get logs filtered by tag
   */
  getLogsByTag(tag: string): LogEntry[] {
    return this.logs.filter((log) => log.tag === tag).reverse();
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    this.nextId = 1;
  }

  /**
   * Subscribe to new log entries
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const DebugLogger = new DebugLoggerClass();

// Common tags for consistency
export const LogTags = {
  SETTINGS: 'Settings',
  KEEP_AWAKE: 'KeepAwake',
  SENSORS: 'Sensors',
  DRIVE: 'Drive',
  AUDIO: 'Audio',
  DATABASE: 'Database',
  LOCATION: 'Location',
} as const;
