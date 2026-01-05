"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

export interface ExportColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
  format?: (value: unknown) => string;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

// ============================================
// CSV EXPORT
// ============================================

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions = {},
): void {
  const { filename = "export", includeHeaders = true } = options;

  const rows: string[] = [];

  // Add headers
  if (includeHeaders) {
    rows.push(columns.map((col) => escapeCSVValue(col.header)).join(","));
  }

  // Add data rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = col.accessor(row);
      const formatted = col.format ? col.format(value) : value;
      return escapeCSVValue(formatted);
    });
    rows.push(values.join(","));
  });

  const csvContent = rows.join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, `${filename}.csv`);
}

// ============================================
// EXCEL EXPORT (XLSX format using simple XML)
// ============================================

function escapeXML(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions = {},
): void {
  const {
    filename = "export",
    sheetName = "Sheet1",
    includeHeaders = true,
  } = options;

  // Build XML spreadsheet
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += `  <Worksheet ss:Name="${escapeXML(sheetName)}">\n`;
  xml += "    <Table>\n";

  // Add headers
  if (includeHeaders) {
    xml += "      <Row>\n";
    columns.forEach((col) => {
      xml += `        <Cell><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>\n`;
    });
    xml += "      </Row>\n";
  }

  // Add data rows
  data.forEach((row) => {
    xml += "      <Row>\n";
    columns.forEach((col) => {
      const value = col.accessor(row);
      const formatted = col.format ? col.format(value) : value;
      const type = typeof formatted === "number" ? "Number" : "String";
      xml += `        <Cell><Data ss:Type="${type}">${escapeXML(formatted)}</Data></Cell>\n`;
    });
    xml += "      </Row>\n";
  });

  xml += "    </Table>\n";
  xml += "  </Worksheet>\n";
  xml += "</Workbook>";

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  downloadBlob(blob, `${filename}.xls`);
}

// ============================================
// JSON EXPORT
// ============================================

export function exportToJSON<T>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions = {},
): void {
  const { filename = "export" } = options;

  const exportData = data.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = col.accessor(row);
      obj[col.key] = col.format ? col.format(value) : value;
    });
    return obj;
  });

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });

  downloadBlob(blob, `${filename}.json`);
}

// ============================================
// DOWNLOAD HELPER
// ============================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// EXPORT BUTTON COMPONENT
// ============================================

interface DataExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  formats?: ("csv" | "excel" | "json")[];
  disabled?: boolean;
  className?: string;
}

export function DataExportButton<T>({
  data,
  columns,
  filename = "export",
  formats = ["csv", "excel"],
  disabled = false,
  className,
}: DataExportButtonProps<T>) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (format: "csv" | "excel" | "json") => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const exportFilename = `${filename}_${timestamp}`;

      switch (format) {
        case "csv":
          exportToCSV(data, columns, { filename: exportFilename });
          toast.success(`Exported ${data.length} rows to CSV`);
          break;
        case "excel":
          exportToExcel(data, columns, { filename: exportFilename });
          toast.success(`Exported ${data.length} rows to Excel`);
          break;
        case "json":
          exportToJSON(data, columns, { filename: exportFilename });
          toast.success(`Exported ${data.length} rows to JSON`);
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const formatLabels = {
    csv: { label: "CSV", icon: FileText },
    excel: { label: "Excel", icon: FileSpreadsheet },
    json: { label: "JSON", icon: FileText },
  };

  if (formats.length === 1) {
    const format = formats[0];
    const { label, icon: Icon } = formatLabels[format];

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport(format)}
        disabled={disabled || isExporting || data.length === 0}
        className={className}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="mr-2 h-4 w-4" />
        )}
        Export {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || data.length === 0}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => {
          const { label, icon: Icon } = formatLabels[format];
          return (
            <DropdownMenuItem key={format} onClick={() => handleExport(format)}>
              <Icon className="mr-2 h-4 w-4" />
              Export as {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// HELPER TO CREATE EXPORT COLUMNS FROM TABLE COLUMNS
// ============================================

export function createExportColumns<T>(
  columns: Array<{
    id: string;
    header: string;
    accessorKey?: keyof T;
    accessorFn?: (row: T) => unknown;
  }>,
): ExportColumn<T>[] {
  return columns
    .filter((col) => col.accessorKey || col.accessorFn)
    .map((col) => ({
      key: col.id,
      header: col.header,
      accessor: (row: T) => {
        if (col.accessorFn) {
          const value = col.accessorFn(row);
          return value as string | number | boolean | null | undefined;
        }
        if (col.accessorKey) {
          return row[col.accessorKey] as
            | string
            | number
            | boolean
            | null
            | undefined;
        }
        return null;
      },
    }));
}
