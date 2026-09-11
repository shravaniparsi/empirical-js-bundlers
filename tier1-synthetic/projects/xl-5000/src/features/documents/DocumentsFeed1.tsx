import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import DocumentsScatter2 from './DocumentsScatter2';
import DocumentsFeed2 from './DocumentsFeed2';
import DocumentsColorPicker1 from './DocumentsColorPicker1';
import styles from './DocumentsFeed1.module.css';

interface DocumentsFeed1Item {
  createdAt: Date;
  tags: string[];
  description: string;
  title: string;
  assignee: string;
  id: string;
}

interface DocumentsFeed1Props {
  items?: DocumentsFeed1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function DocumentsFeed1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: DocumentsFeed1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'tags'>('createdAt');

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
            className={clsx(styles.sortBtn, sortField === 'createdAt' && styles.active)}
            onClick={() => handleSort('createdAt')}
          >
            By createdAt
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['createdAt', 'tags', 'description']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.createdAt}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <DocumentsScatter2 />
      <DocumentsFeed2 />
      <DocumentsColorPicker1 />
      </div>
    </div>
  );
}
