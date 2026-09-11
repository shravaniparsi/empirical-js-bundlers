import { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import ProfileSlider2 from './ProfileSlider2';
import ProfileScore1 from './ProfileScore1';
import styles from './ProfileSkeleton.module.css';

type Severity = 'info' | 'success' | 'warning' | 'error';

interface ProfileSkeletonProps {
  open?: boolean;
  severity?: Severity;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export default function ProfileSkeleton({
  open: controlledOpen,
  severity = 'info',
  title,
  message,
  duration = 5000,
  dismissible = true,
  onClose,
  onAction,
  actionLabel = 'Dismiss',
  className,
}: ProfileSkeletonProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      if (!isControlled) setInternalOpen(false);
      setIsExiting(false);
      onClose?.();
    }, 200);
  }, [isControlled, onClose]);

  useEffect(() => {
    if (isOpen && duration > 0 && dismissible) {
      timerRef.current = setTimeout(handleClose, duration);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [isOpen, duration, dismissible, handleClose]);

  const handleAction = useCallback(() => {
    onAction?.();
    handleClose();
  }, [onAction, handleClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) handleClose();
    },
    [dismissible, handleClose]
  );

  if (!isOpen) return null;

  const severityIcons: Record<Severity, string> = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
  };

  return (
    <div
      className={clsx(
        styles.container,
        styles[severity],
        isExiting && styles.exiting,
        className
      )}
      role="alert"
      aria-live="polite"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{severityIcons[severity]}</span>
      </div>

      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{message}</div>
      </div>

      <div className={styles.actions}>
        {onAction && (
          <button className={styles.actionBtn} onClick={handleAction}>
            {actionLabel}
          </button>
        )}
        {dismissible && (
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.extra}>
      <ProfileSlider2 />
      <ProfileScore1 />
      </div>
    </div>
  );
}
