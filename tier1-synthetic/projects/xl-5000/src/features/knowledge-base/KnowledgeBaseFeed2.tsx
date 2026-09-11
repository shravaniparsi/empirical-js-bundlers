import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import KnowledgeBaseSplit1 from './KnowledgeBaseSplit1';
import styles from './KnowledgeBaseFeed2.module.css';

interface KnowledgeBaseFeed2Item {
  status: string;
  title: string;
  tags: string[];
  updatedAt: Date;
  id: string;
}

interface KnowledgeBaseFeed2Props {
  items?: KnowledgeBaseFeed2Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function KnowledgeBaseFeed2({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: KnowledgeBaseFeed2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'status' | 'title'>('status');

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
          const picked = pick(item, ['status', 'title', 'tags']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.status}</span>
                <span className={styles.meta}>{picked.title}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <KnowledgeBaseSplit1 />
      </div>
    </div>
  );
}
