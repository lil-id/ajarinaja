/**
 * Structured logger satisfying the Logging and Observability Mandate.
 */

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

interface LogContext {
    operation: string;
    correlationId?: string;
    userId?: string;
    duration?: number;
    error?: any;
    [key: string]: any;
}

class Logger {
    private log(level: LogLevel, context: LogContext, message: string) {
        const timestamp = new Date().toISOString();
        const structuredLog = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...context,
        };

        if (level === 'error') {
            console.error(JSON.stringify(structuredLog));
        } else if (level === 'warn') {
            console.warn(JSON.stringify(structuredLog));
        } else {
            console.log(JSON.stringify(structuredLog));
        }
    }

    info(operation: string, context: Omit<LogContext, 'operation'>, message: string) {
        this.log('info', { operation, ...context }, message);
    }

    error(operation: string, context: Omit<LogContext, 'operation'>, message: string) {
        this.log('error', { operation, ...context }, message);
    }

    warn(operation: string, context: Omit<LogContext, 'operation'>, message: string) {
        this.log('warn', { operation, ...context }, message);
    }

    debug(operation: string, context: Omit<LogContext, 'operation'>, message: string) {
        this.log('debug', { operation, ...context }, message);
    }
}

export const logger = new Logger();

export function generateCorrelationId(): string {
    return crypto.randomUUID();
}
