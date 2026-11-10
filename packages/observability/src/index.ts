export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  service?: string;
  environment?: string;
  requestId?: string;
  traceId?: string;
  actorId?: string;
  tenantId?: string;
  action?: string;
  entityId?: string;
  resultCode?: string;
  [key: string]: unknown;
}

const REDACTED = "[REDACTED]";

const SENSITIVE_KEY_PATTERN =
  /^(?:password|passphrase|secret|client_?secret|access_?key|secret_?key|private_?key|content_?key|encryption_?key|(?:[a-z0-9_-]+_)?api_?key|apikey|[a-z0-9_-]*api_?key|auth_?secret|session_?secret|signing_?secret|token|playback_?token|license_?token|refresh_?token|access_?token|id_?token|authorization|cookie|set-cookie|signed_?url|presigned_?url|upload_?url|download_?url|manifest_?url|source_?object_?key)$/i;

const SENSITIVE_QUERY_PARAM_PATTERN =
  /([?&](?:token|playback_token|license_token|access_token|refresh_token|signature|sig|key|api_?key|apikey|x-amz-signature|x-amz-credential|x-amz-security-token|policy|key-pair-id)=)[^&\s#]+/gi;

const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const BEARER_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi;

export function redactString(input: string): string {
  return input
    .replace(SENSITIVE_QUERY_PARAM_PATTERN, `$1${REDACTED}`)
    .replace(JWT_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, `$1 ${REDACTED}`);
}

export function redactSensitive(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value !== "object") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
    };
  }
  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      output[key] = REDACTED;
    } else {
      output[key] = redactSensitive(entry, seen);
    }
  }
  return output;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

export interface CreateLoggerOptions {
  service: string;
  environment?: string;
  minLevel?: LogLevel;
  sink?: (serializedJsonLine: string) => void;
  bindings?: LogContext;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const minLevel = options.minLevel ?? "info";
  const sink =
    options.sink ??
    ((line: string) => {
      process.stdout.write(`${line}\n`);
    });
  const baseBindings: LogContext = {
    service: options.service,
    environment: options.environment ?? process.env.NODE_ENV ?? "development",
    ...options.bindings,
  };

  function write(level: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minLevel]) {
      return;
    }
    const sanitizedContext = redactSensitive({
      ...baseBindings,
      ...context,
    }) as Record<string, unknown>;

    const record = {
      timestamp: new Date().toISOString(),
      level,
      message: redactString(message),
      ...sanitizedContext,
    };
    sink(JSON.stringify(record));
  }

  return {
    debug: (msg, ctx) => write("debug", msg, ctx),
    info: (msg, ctx) => write("info", msg, ctx),
    warn: (msg, ctx) => write("warn", msg, ctx),
    error: (msg, ctx) => write("error", msg, ctx),
    child: (bindings) =>
      createLogger({
        ...options,
        bindings: { ...baseBindings, ...bindings },
      }),
  };
}

export function createRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function createCorrelationId(): string {
  return `cor_${crypto.randomUUID().replace(/-/g, "")}`;
}
