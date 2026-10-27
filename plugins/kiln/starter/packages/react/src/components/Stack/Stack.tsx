import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../cx';
import styles from './Stack.module.css';

export type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** `column` (default) stacks vertically; `row` lays out inline and wraps. */
  direction?: 'column' | 'row';
  /** Space between children. xs is 4px, sm 8, md 16 (the default), lg 24 and xl 32. */
  gap?: StackGap;
  /** Cross-axis alignment. */
  align?: 'start' | 'center' | 'end' | 'stretch';
}

/** One-dimensional layout with a token gap — the spacing between things, never margins on the things. */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack({ direction = 'column', gap = 'md', align = 'stretch', className, ...rest }, ref) {
  return <div ref={ref} data-component="Stack" className={cx(styles.root, styles[direction], styles[`g-${gap}`], styles[`a-${align}`], className)} {...rest} />;
});
