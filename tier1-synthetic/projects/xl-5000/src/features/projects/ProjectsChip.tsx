import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import ProjectsContainer2 from './ProjectsContainer2';
import ProjectsList2 from './ProjectsList2';
import ShippingTag1 from '../shipping/ShippingTag1';
import styles from './ProjectsChip.module.css';

interface ProjectsChipItem {
  updatedAt: Date;
  description: string;
  status: string;
  id: string;
}

interface ProjectsChipProps {
  items?: ProjectsChipItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ProjectsChip({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ProjectsChipProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'updatedAt' | 'description'>('updatedAt');

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
            className={clsx(styles.sortBtn, sortField === 'updatedAt' && styles.active)}
            onClick={() => handleSort('updatedAt')}
          >
            By updatedAt
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['updatedAt', 'description', 'status']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.updatedAt}</span>
                <span className={styles.meta}>{picked.description}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <ProjectsContainer2 />
      <ProjectsList2 />
      <ShippingTag1 />
      </div>
    </div>
  );
}
