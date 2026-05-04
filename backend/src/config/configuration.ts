function resolveJwtExpiresIn(rawValue?: string) {
  if (!rawValue) {
    return '7d';
  }

  const normalizedValue = rawValue.trim();
  if (/^\d+$/.test(normalizedValue)) {
    return normalizedValue;
  }

  if (/^\d+\s*(ms|s|m|h|d|w|y)$/i.test(normalizedValue)) {
    return normalizedValue;
  }

  return '7d';
}

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
    expiresIn: resolveJwtExpiresIn(process.env.JWT_EXPIRES_IN),
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
