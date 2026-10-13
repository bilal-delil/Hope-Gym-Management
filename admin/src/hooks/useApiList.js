import { useCallback, useEffect, useState } from 'react';
import api from 'lib/api';

export default function useApiList(path, { enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.get(path);
      setRows(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rows, loading, error, reload, setRows };
}
