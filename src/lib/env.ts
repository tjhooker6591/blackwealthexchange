type AppEnv = "local" | "preview" | "production";

function read(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function getAppEnv(): AppEnv {
  if (process.env.NODE_ENV === "production") {
    if (process.env.VERCEL_ENV === "preview") return "preview";
    return "production";
  }
  return "local";
}

export function requireEnv(name: string): string {
  const value = read(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getJwtSecret(): string {
  const secret = getJwtSecretOrNull();
  if (!secret) {
    throw new Error("Missing JWT secret. Set JWT_SECRET (or NEXTAUTH_SECRET).");
  }
  return secret;
}

export function getJwtSecretOrNull(): string | null {
  const jwt = read("JWT_SECRET");
  const nextAuth = read("NEXTAUTH_SECRET");
  const secret = jwt ?? nextAuth;

  if (!secret) {
    return null;
  }

  if (jwt && nextAuth && jwt !== nextAuth) {
    return null;
  }

  return secret;
}

export function getNextAuthSecret(): string {
  const secret = read("NEXTAUTH_SECRET") ?? read("JWT_SECRET");
  if (!secret) {
    throw new Error(
      "Missing NextAuth secret. Set NEXTAUTH_SECRET (or JWT_SECRET).",
    );
  }
  return secret;
}

export function getMongoUri(): string {
  const uri = requireEnv("MONGODB_URI");
  const env = getAppEnv();

  if (
    env !== "local" &&
    /mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(uri)
  ) {
    throw new Error(
      `Unsafe MONGODB_URI for ${env}: localhost Mongo is not allowed outside local development.`,
    );
  }

  return uri;
}

export function getMongoDbName(defaultName = "bwes-cluster"): string {
  return read("MONGODB_DB") ?? defaultName;
}

export function getNextAuthUrl(): string | undefined {
  return read("NEXTAUTH_URL");
}

export function getAppUrl(): string {
  const env = getAppEnv();
  const url =
    read("APP_URL") ??
    read("NEXT_PUBLIC_APP_URL") ??
    read("NEXTAUTH_URL") ??
    "http://localhost:3000";

  if (env !== "local" && !url.startsWith("https://")) {
    throw new Error(
      "APP_URL/NEXT_PUBLIC_APP_URL must use HTTPS outside local development.",
    );
  }

  return url;
}

export function getResetTokenSecret(): string {
  return read("RESET_TOKEN_SECRET") ?? getJwtSecret();
}
