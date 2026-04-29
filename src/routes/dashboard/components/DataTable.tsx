// src/core/ui/components/DataTable.tsx
import React from "react";
import "../../../style/table.css";
export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  getRowKey?: (item: T, index: number) => React.Key;
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  return (
    <table className="pg-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key as string} style={{ width: col.width }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.length === 0 && (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: "center", padding: "12px" }}>
              No data found
            </td>
          </tr>
        )}

        {data.map((item, idx) => {
          const rowKey = getRowKey ? getRowKey(item, idx) : idx;
          const clickable = !!onRowClick;

          return (
            <tr
              key={rowKey}
              className={clickable ? "pg-table-row pg-table-row--clickable" : "pg-table-row"}
              onClick={clickable ? () => onRowClick?.(item) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key as string}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}