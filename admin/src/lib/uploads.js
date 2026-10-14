/**
 * Payment proofs are stored on disk under nodejs-server/uploads/payments/
 * and served by Express at http://<api-host>/uploads/payments/<file>.
 *
 * DB keeps:
 * - proof_image_path  e.g. uploads/payments/payment-....jpg
 * - proof_image_url   absolute URL captured at upload time
 */
const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api')
  .replace(/\/api\/?$/, '');

export function resolveUploadUrl(urlOrPath) {
  if (!urlOrPath) return null;
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${API_ORIGIN}${path}`;
}
