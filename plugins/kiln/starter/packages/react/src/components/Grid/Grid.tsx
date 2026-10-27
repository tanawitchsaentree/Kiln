import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from '../../cx';
import styles from './Grid.module.css';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Override the column count. By default it follows the layout tokens, which give 4, then 8 at md (768px), then 12 at lg (1024px). */
  columns?: number;
}

/** Responsive column grid. Columns, gutter and breakpoints all come from the layout tokens. */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid({ columns, className, style, ...rest }, ref) {
  const s = columns ? ({ ...style, '--ds-grid-columns': columns } as CSSProperties) : style;
  return <div ref={ref} data-component="Grid" className={cx(styles.root, className)} style={s} {...rest} />;
});

export type GridSpan = number | 'full';

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Columns to span below md (and above, unless md/lg are set). 'full' = every column. */
  span?: GridSpan;
  /** Columns to span from the md breakpoint (768px). */
  md?: GridSpan;
  /** Columns to span from the lg breakpoint (1024px). */
  lg?: GridSpan;
}

const v = (s: GridSpan | undefined) => (s === 'full' ? 'var(--ds-grid-columns)' : s);

/** A cell of a Grid. Spans are clamped to the current column count, so a 6-span item never overflows a 4-column phone grid. */
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(function GridItem({ span = 'full', md, lg, style, ...rest }, ref) {
  const s = { ...style, '--ds-span-base': v(span), ...(md != null && { '--ds-span-md': v(md) }), ...(lg != null && { '--ds-span-lg': v(lg) }) } as CSSProperties;
  return <div ref={ref} data-ds-span="" {...(md != null && { 'data-ds-span-md': '' })} {...(lg != null && { 'data-ds-span-lg': '' })} style={s} {...rest} />;
});
