import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import ApiKeysBreadcrumb from './ApiKeysBreadcrumb';
import ApiKeysAreaChart1 from './ApiKeysAreaChart1';
import WorkflowsCard from '../workflows/WorkflowsCard';
import styles from './ApiKeysDetail.module.css';

interface ApiKeysDetailItem {
  status: string;
  tags: string[];
  description: string;
  updatedAt: Date;
  id: string;
}

interface ApiKeysDetailProps {
  items?: ApiKeysDetailItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ApiKeysDetail({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ApiKeysDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'status' | 'tags'>('status');

  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      return aVal.localeCompare(bVal);
    });
    return sorted.slice(0, maxItems);
  }, [items, sortField, maxItems]);

  const summary = useMemo(
    () => ({ total: items.length, visible: visibleItems.length }),
    [items.length, visibleItems.length]
  );

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    onItemClick?.(id);
  };

  const handleSort = (field: typeof sortField) => {
    setSortField(field);
  };

  return (
    <div className={clsx(styles.container, styles[variant], className)}>
      <div className={styles.header}>
        <span className={styles.count}>
          Showing {summary.visible} of {summary.total}
        </span>
        <div className={styles.sortControls}>
          <button
            className={clsx(styles.sortBtn, sortField === 'status' && styles.active)}
            onClick={() => handleSort('status')}
          >
            By status
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['status', 'tags', 'description']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.status}</span>
                <span className={styles.meta}>{picked.tags}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <ApiKeysBreadcrumb />
      <ApiKeysAreaChart1 />
      <WorkflowsCard />
      </div>
    </div>
  );
}
