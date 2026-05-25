import { cn } from '../../lib/utils'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  stickyHeader?: boolean
}

export function Table({ className, stickyHeader, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-border bg-white">
      <table className={cn('w-full border-collapse text-sm', stickyHeader && '[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-canvas text-xs font-medium uppercase text-ink-3', className)} {...props} />
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('border-b border-border px-3 py-2 text-left font-medium', className)} {...props} />
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-border px-3 py-3 text-ink-2', className)} {...props} />
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('bg-white transition-colors hover:bg-subtle', className)} {...props} />
}

export default Table
