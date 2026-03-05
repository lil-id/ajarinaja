/**
 * A lightweight structured JSON logger for Supabase Edge Functions.
 * 
 * Supabase inherently captures console.log and console.error, and parses JSON output.
 * This logger formats output as JSON containing `level`, `message`, `timestamp`, and additional context.
 * It adheres to the Logging and Observability Mandate for operations.
 */

export type LogLevel = 'info' | 'error' | 'warn' | 'debug';

export interface LogContext {
    correlationId?: string;
    userId?: string;
    duration?: number;
    [key: string]: unknown;
}

class StructuredLogger {
    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context,
        };
        return JSON.stringify(logEntry);
    }

    /**
     * General informational messages (e.g. Request started, task created)
     */
    info(message: string, context?: LogContext): void {
        console.log(this.formatMessage('info', message, context));
    }

    /**
     * Expected or unexpected error events
     * Note: The `error` property inside context should be serialized as a string or object.
     */
    error(message: string, context?: LogContext): void {
        // If context.error is an actual Error prototype, capture its stack trace
        if (context && context.error instanceof Error) {
            context.error = {
                message: context.error.message,
                stack: context.error.stack,
                name: context.error.name,
            };
        }
        console.error(this.formatMessage('error', message, context));
    }

    /**
     * Potentially harmful situations
     */
    warn(message: string, context?: LogContext): void {
        console.warn(this.formatMessage('warn', message, context));
    }

    /**
     * Detailed flow for debugging
     */
    debug(message: string, context?: LogContext): void {
        console.debug(this.formatMessage('debug', message, context));
    }

    /**
     * Generates a simple UUID v4 for correlation ID purposes if one isn't provided by the client.
     * Deno's native crypto.randomUUID() is available in Edge Functions.
     */
    generateCorrelationId(): string {
        return crypto.randomUUID();
    }
}

export const logger = new StructuredLogger();
