import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import MediaLoader1 from './MediaLoader1';
import MediaInfiniteScroll from './MediaInfiniteScroll';
import MediaStat1 from './MediaStat1';
import styles from './MediaFooter2.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface MediaFooter2Props {
  children?: React.ReactNode;
  direction?: LayoutDirection;
  gap?: LayoutGap;
  padding?: LayoutGap;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  fullWidth?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'aside' | 'article';
  sidebarWidth?: string;
  collapsible?: boolean;
}

export default function MediaFooter2({
  children,
  direction = 'horizontal',
  gap = 'md',
  padding = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  className,
  as: Component = 'aside',
  sidebarWidth = '280px',
  collapsible = true,
}: MediaFooter2Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const sidebarStyle = useMemo(() => ({
    width: isCollapsed ? '60px' : sidebarWidth,
    transition: 'width 0.2s ease',
  }), [isCollapsed, sidebarWidth]);

  const containerClasses = useMemo(
    () =>
      clsx(
        styles.container,
        styles[`dir-${direction}`],
        styles[`gap-${gap}`],
        styles[`pad-${padding}`],
        styles[`align-${align}`],
        styles[`justify-${justify}`],
        wrap && styles.wrap,
        fullWidth && styles.fullWidth,
        className
      ),
    [direction, gap, padding, align, justify, wrap, fullWidth, className]
  );

  return (
    <Component className={containerClasses} style={sidebarStyle}>
      {collapsible && (
        <button className={styles.collapseBtn} onClick={toggleCollapse}>
          {isCollapsed ? '→' : '←'}
        </button>
      )}
      {!isCollapsed && (
        <div className={styles.content}>
          {children}
      <MediaLoader1 />
      <MediaInfiniteScroll />
      <MediaStat1 />
        </div>
      )}
    </Component>
  );
}
