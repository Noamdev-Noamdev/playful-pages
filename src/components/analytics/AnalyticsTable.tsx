import React, { useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Column<T> {
  key: keyof T;
  label: string;
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right";
}

interface AnalyticsTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pageSize?: number;
}

export function AnalyticsTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  pageSize = 20,
}: AnalyticsTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: "asc" | "desc" } | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);

  const safeData = Array.isArray(data) ? data : [];

  const sortedData = React.useMemo(() => {
    if (!sortConfig || !safeData.length) return safeData;
    return [...safeData].sort((a, b) => {
      const valA = a[sortConfig.key] ?? "";
      const valB = b[sortConfig.key] ?? "";
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [safeData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: keyof T) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-foreground rounded-2xl overflow-hidden shadow-[4px_4px_0_0_var(--foreground)] bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-foreground uppercase border-b-2 border-foreground">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "px-6 py-4 font-bold tracking-wider",
                      col.align === "right" ? "text-right" : "text-left",
                      col.sortable && "cursor-pointer hover:bg-muted/80 group",
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        col.align === "right" && "justify-end",
                      )}
                    >
                      {col.label}
                      {col.sortable &&
                        sortConfig?.key === col.key &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                      {col.sortable && sortConfig?.key !== col.key && (
                        <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-20" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-foreground/10 animate-pulse">
                    {columns.map((col, j) => (
                      <td key={j} className="px-6 py-4">
                        <div
                          className={cn(
                            "h-4 bg-foreground/10 rounded w-1/2",
                            col.align === "right" && "ml-auto",
                          )}
                        ></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-8 text-center text-muted-foreground font-medium"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-foreground/10 last:border-0 hover:bg-muted/50 transition-colors odd:bg-background even:bg-muted/20"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          "px-6 py-4 font-medium",
                          col.align === "right" ? "text-right" : "text-left",
                        )}
                      >
                        {col.format
                          ? col.format(row[col.key], row)
                          : row[col.key] != null
                          ? String(row[col.key])
                          : "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && safeData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-sm font-semibold text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, safeData.length)} of {safeData.length} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-2 border-foreground rounded-xl shadow-[2px_2px_0_0_var(--foreground)]"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-2 border-foreground rounded-xl shadow-[2px_2px_0_0_var(--foreground)]"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
