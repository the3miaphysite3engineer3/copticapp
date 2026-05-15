import { cx } from "@/lib/classes";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "animate-pulse rounded-lg border border-line/60 bg-elevated/80 dark:bg-elevated/60",
        className,
      )}
    />
  );
}
