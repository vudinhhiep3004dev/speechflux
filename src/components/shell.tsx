import { cn } from "@/lib/utils";

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Shell({
  children,
  className,
  ...props
}: ShellProps) {
  return (
    <div
      className={cn(
        "container flex flex-col gap-4 py-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 