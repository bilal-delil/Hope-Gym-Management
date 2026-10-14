import { useCallback, useState } from 'react';
import { useDisclosure, useToast } from '@chakra-ui/react';

export default function useConfirmDelete({
  onDelete,
  title = 'Delete record',
  getMessage,
  successMessage = 'Deleted',
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const requestDelete = useCallback(
    (row) => {
      setTarget(row);
      onOpen();
    },
    [onOpen]
  );

  const confirmDelete = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    try {
      await onDelete(target);
      toast({ title: successMessage, status: 'success', duration: 2000 });
      onClose();
      setTarget(null);
    } catch (err) {
      toast({
        title: err.message || 'Delete failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [target, onDelete, successMessage, toast, onClose]);

  const message =
    typeof getMessage === 'function' && target
      ? getMessage(target)
      : 'This action cannot be undone. Are you sure you want to delete this item?';

  return {
    requestDelete,
    confirmDelete,
    isOpen,
    onClose: () => {
      if (!loading) {
        onClose();
        setTarget(null);
      }
    },
    loading,
    title,
    message,
    target,
  };
}
