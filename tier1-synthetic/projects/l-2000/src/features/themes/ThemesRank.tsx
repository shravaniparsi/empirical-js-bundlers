import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import ThemesPanel1 from './ThemesPanel1';
import SearchDetail from '../search/SearchDetail';
import styles from './ThemesRank.module.css';

interface ThemesRankItem {
  description: string;
  tags: string[];
  priority: number;
  updatedAt: Date;
  assignee: string;
  id: string;
}

interface ThemesRankProps {
  items?: ThemesRankItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ThemesRank({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ThemesRankProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'description' | 'tags'>('description');

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
            className={clsx(styles.sortBtn, sortField === 'description' && styles.active)}
            onClick={() => handleSort('description')}
          >
            By description
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['description', 'tags', 'priority']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.description}</span>
                <span className={styles.meta}>{picked.tags}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <ThemesPanel1 />
      <SearchDetail />
      </div>
    </div>
  );
}
