import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import SearchTextArea from './SearchTextArea';
import SearchProgress from './SearchProgress';
import SearchDonut1 from './SearchDonut1';
import InventorySearch from '../inventory/InventorySearch';
import styles from './SearchSticky.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface SearchStickyProps {
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

}

export default function SearchSticky({
  children,
  direction = 'horizontal',
  gap = 'md',
  padding = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  className,
  as: Component = 'div',

}: SearchStickyProps) {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

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
    <Component className={containerClasses}>
      {isVisible && (
        <div className={styles.content}>
          {children}
      <SearchTextArea />
      <SearchProgress />
      <SearchDonut1 />
      <InventorySearch />
        </div>
      )}
    </Component>
  );
}
