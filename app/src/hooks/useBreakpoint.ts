import { useWindowDimensions } from 'react-native';

/** Width breakpoints used across the app (web/tablet layouts). */
export const breakpoints = { wide: 900, desktop: 1200 } as const;

/** `{ width, isWide, isDesktop }` — `isWide` (≥ 900 px) switches to two-column layouts on web/tablets. */
export function useBreakpoint(): { width: number; height: number; isWide: boolean; isDesktop: boolean } {
  const { width, height } = useWindowDimensions();
  return { width, height, isWide: width >= breakpoints.wide, isDesktop: width >= breakpoints.desktop };
}
