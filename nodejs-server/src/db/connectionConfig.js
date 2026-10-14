function parseDatabaseUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) {
    throw new Error('DATABASE_URL / DB_URL is empty');
  }

  // URI form: postgres://... or postgresql://...
  if (/^postgres(ql)?:\/\//i.test(value)) {
    return { connectionString: value };
  }

  // libpq keyword/value form: host=... user=... password=... dbname=...
  if (value.includes('=') && !value.includes('://')) {
    const config = {};
    const parts = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

    for (const part of parts) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const key = part.slice(0, eq).trim();
      let val = part.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }

      switch (key) {
        case 'host':
        case 'hostname':
          config.host = val;
          break;
        case 'port':
          config.port = Number(val);
          break;
        case 'user':
        case 'username':
          config.user = val;
          break;
        case 'password':
          config.password = val;
          break;
        case 'dbname':
        case 'database':
          config.database = val;
          break;
        case 'sslmode':
          if (val && val !== 'disable') {
            config.ssl = { rejectUnauthorized: false };
          }
          break;
        default:
          break;
      }
    }

    if (!config.host && !config.database) {
      throw new Error('Could not parse DB_URL keyword connection string');
    }

    return config;
  }

  // Fallback: let pg try it as a connection string
  return { connectionString: value };
}

module.exports = {
  parseDatabaseUrl,
};
