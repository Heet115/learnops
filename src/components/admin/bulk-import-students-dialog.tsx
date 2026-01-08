"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  validateBulkStudentData,
  bulkCreateStudents,
} from "@/lib/actions/bulk-import.actions";
import {
  ParsedStudentRow,
  BulkImportResult,
} from "@/lib/validations/bulk-import.validation";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  Users,
  GraduationCap,
  ArrowRight,
  FileUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ClassOption {
  _id: string;
  name: string;
  academicYear: string;
  semesterId: {
    name: string;
    number: number;
    courseId: {
      name: string;
      code: string;
      departmentId: {
        name: string;
        code: string;
      };
    };
  };
}

interface BulkImportStudentsDialogProps {
  classes: ClassOption[];
}

type Step = "upload" | "preview" | "importing" | "results";

const COLUMN_MAP: Record<string, keyof ParsedStudentRow> = {
  "full name": "firstName",
  first_name: "firstName",
  firstname: "firstName",
  "first name": "firstName",
  last_name: "lastName",
  lastname: "lastName",
  "last name": "lastName",
  "father's name": "fatherName",
  fathername: "fatherName",
  "father name": "fatherName",
  "mother's name": "motherName",
  mothername: "motherName",
  "mother name": "motherName",
  gender: "gender",
  "date of birth": "dateOfBirth",
  dob: "dateOfBirth",
  dateofbirth: "dateOfBirth",
  "blood group": "bloodGroup",
  bloodgroup: "bloodGroup",
  "primary email": "email",
  email: "email",
  primaryemail: "email",
  "alternate email": "alternateEmail",
  alternateemail: "alternateEmail",
  "primary mobile": "primaryMobile",
  primarymobile: "primaryMobile",
  mobile: "primaryMobile",
  phone: "primaryMobile",
  "alternate mobile": "alternateMobile",
  alternatemobile: "alternateMobile",
  batch: "batch",
  "academic session": "academicSession",
  academicsession: "academicSession",
  session: "academicSession",
  "admission date": "admissionDate",
  admissiondate: "admissionDate",
  "address line 1": "addressLine1",
  addressline1: "addressLine1",
  address1: "addressLine1",
  "address line 2": "addressLine2",
  addressline2: "addressLine2",
  address2: "addressLine2",
  "city / district": "city",
  city: "city",
  district: "city",
  state: "state",
  country: "country",
  "postal code": "postalCode",
  postalcode: "postalCode",
  pincode: "postalCode",
  zip: "postalCode",
};

export function BulkImportStudentsDialog({
  classes,
}: BulkImportStudentsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const resetState = useCallback(() => {
    setStep("upload");
    setSelectedClassId("");
    setParsedRows([]);
    setImportResult(null);
    setIsValidating(false);
    setIsImporting(false);
    setImportProgress(0);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetState();
  };

  const parseCSV = (content: string): Omit<ParsedStudentRow, "errors" | "isValid">[] => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
    const columnIndices: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mappedKey = COLUMN_MAP[header];
      if (mappedKey) columnIndices[mappedKey] = index;
    });

    const fullNameIdx = headers.findIndex((h) => h === "full name");
    const hasFullName = fullNameIdx >= 0;

    return lines.slice(1).map((line, index) => {
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === "," && !inQuotes) {
          cols.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else current += char;
      }
      cols.push(current.trim().replace(/^["']|["']$/g, ""));

      let firstName = "";
      let lastName = "";

      if (hasFullName && cols[fullNameIdx]) {
        const fullName = cols[fullNameIdx];
        if (fullName.includes(",")) {
          const parts = fullName.split(",").map((p) => p.trim());
          lastName = parts[0] || "";
          firstName = parts[1] || "";
        } else {
          const parts = fullName.split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || "";
        }
      } else {
        firstName = columnIndices.firstName !== undefined ? cols[columnIndices.firstName] || "" : "";
        lastName = columnIndices.lastName !== undefined ? cols[columnIndices.lastName] || "" : "";
      }

      const getValue = (key: keyof ParsedStudentRow): string => {
        const idx = columnIndices[key];
        return idx !== undefined ? cols[idx] || "" : "";
      };

      return {
        rowNumber: index + 2,
        email: getValue("email"),
        firstName,
        lastName,
        classId: selectedClassId,
        fatherName: getValue("fatherName"),
        motherName: getValue("motherName"),
        gender: getValue("gender"),
        dateOfBirth: getValue("dateOfBirth"),
        bloodGroup: getValue("bloodGroup"),
        alternateEmail: getValue("alternateEmail"),
        primaryMobile: getValue("primaryMobile"),
        alternateMobile: getValue("alternateMobile"),
        batch: getValue("batch"),
        academicSession: getValue("academicSession"),
        admissionDate: getValue("admissionDate"),
        addressLine1: getValue("addressLine1"),
        addressLine2: getValue("addressLine2"),
        city: getValue("city"),
        state: getValue("state"),
        country: getValue("country"),
        postalCode: getValue("postalCode"),
      };
    }).filter((row) => row.email || row.firstName || row.lastName);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedClassId) {
      toast.error("Please select a class first");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsValidating(true);

    try {
      const content = await file.text();
      const rows = parseCSV(content);

      if (rows.length === 0) {
        toast.error("No valid data found in file");
        setIsValidating(false);
        return;
      }

      const validatedRows = await validateBulkStudentData(
        rows.map((r) => ({ ...r, errors: [], isValid: false }))
      );

      setParsedRows(validatedRows);
      setStep("preview");
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file");
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setStep("importing");
    setIsImporting(true);
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await bulkCreateStudents({
        students: validRows.map((r) => ({
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          classId: r.classId!,
          fatherName: r.fatherName,
          motherName: r.motherName,
          gender: r.gender,
          dateOfBirth: r.dateOfBirth,
          bloodGroup: r.bloodGroup,
          alternateEmail: r.alternateEmail,
          primaryMobile: r.primaryMobile,
          alternateMobile: r.alternateMobile,
          batch: r.batch,
          academicSession: r.academicSession,
          admissionDate: r.admissionDate,
          addressLine1: r.addressLine1,
          addressLine2: r.addressLine2,
          city: r.city,
          state: r.state,
          country: r.country,
          postalCode: r.postalCode,
        })),
        generatePasswords: true,
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setStep("results");

      if (result.successCount > 0) {
        toast.success(`Successfully created ${result.successCount} students`);
        router.refresh();
      }
      if (result.failedCount > 0) {
        toast.error(`Failed to create ${result.failedCount} students`);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed");
      setStep("preview");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Full Name", "Father's Name", "Mother's Name", "Gender", "Date of Birth",
      "Blood Group", "Primary Email", "Alternate Email", "Primary Mobile",
      "Alternate Mobile", "Batch", "Academic Session", "Admission Date",
      "Address Line 1", "Address Line 2", "City / District", "State", "Country", "Postal Code",
    ].join(",");

    const sampleRow = [
      "Doe, John", "Robert Doe", "Jane Doe", "Male", "15/06/2000", "O+",
      "john.doe@example.com", "john.alt@example.com", "9876543210", "9876543211",
      "2024", "2024-25", "01/08/2024", "123 Main Street", "Apt 4B", "Mumbai",
      "Maharashtra", "India", "400001",
    ].join(",");

    const blob = new Blob([`${headers}\n${sampleRow}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!importResult) return;
    const csv = [
      "email,student_id,status,temporary_password,error",
      ...importResult.results.map(
        (r) => `${r.email},${r.studentId || ""},${r.success ? "success" : "failed"},${r.tempPassword || ""},${r.error || ""}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const getClassLabel = (cls: ClassOption) => {
    const dept = cls.semesterId?.courseId?.departmentId?.code || "";
    const course = cls.semesterId?.courseId?.code || "";
    const sem = cls.semesterId?.name || "";
    return `${dept} - ${course} - ${sem} - ${cls.name} (${cls.academicYear})`;
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Bulk Import Students</SheetTitle>
              <SheetDescription>
                Upload a CSV file to create multiple student accounts
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-3">
          {["upload", "preview", "results"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  step === s || (step === "importing" && s === "preview")
                    ? "bg-primary text-primary-foreground"
                    : ["preview", "importing", "results"].indexOf(step) > ["upload", "preview", "results"].indexOf(s)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className="hidden text-sm sm:inline">
                {s === "upload" ? "Upload" : s === "preview" ? "Preview" : "Results"}
              </span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <Separator />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-3.5">
          {step === "upload" && (
            <div className="space-y-6 p-1 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Select Class
                </Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class for all students" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {getClassLabel(cls)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 rounded-xl border-2 border-dashed bg-muted/30 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <FileSpreadsheet className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Upload CSV File</p>
                  <p className="text-sm text-muted-foreground">
                    Required: Full Name (or First/Last Name), Primary Email
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={isValidating}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <label>
                    <Button size="sm" asChild disabled={!selectedClassId || isValidating}>
                      <span>
                        {isValidating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileUp className="mr-2 h-4 w-4" />
                        )}
                        {isValidating ? "Validating..." : "Choose File"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={!selectedClassId || isValidating}
                    />
                  </label>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>CSV Format Guide</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    <li>Full Name: &quot;Last, First&quot; or &quot;First Last&quot;</li>
                    <li>Date format: DD/MM/YYYY or YYYY-MM-DD</li>
                    <li>Gender: Male, Female, or Other</li>
                    <li>Blood Group: A+, A-, B+, B-, AB+, AB-, O+, O-</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4 p-1 py-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Badge variant="default" className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="gap-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      {invalidCount} Invalid
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: {parsedRows.length} rows
                </p>
              </div>

              <ScrollArea className="h-[calc(100vh-380px)] rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <TableRow
                        key={row.rowNumber}
                        className={!row.isValid ? "bg-destructive/5" : ""}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row.rowNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.firstName} {row.lastName}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">
                          {row.email}
                        </TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              {row.errors.slice(0, 2).map((err, i) => (
                                <Badge key={i} variant="destructive" className="text-xs">
                                  {err}
                                </Badge>
                              ))}
                              {row.errors.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{row.errors.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidCount} row(s) have errors and will be skipped during import.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-12">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="font-medium">Creating student accounts...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a moment for large imports
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">{importProgress}%</p>
              </div>
            </div>
          )}

          {step === "results" && importResult && (
            <div className="space-y-4 p-1 py-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-2xl font-bold">{importResult.totalProcessed}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{importResult.successCount}</p>
                  <p className="text-xs text-muted-foreground">Success</p>
                </div>
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.failedCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-420px)] rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.results.map((result, i) => (
                      <TableRow key={i}>
                        <TableCell className="max-w-[150px] truncate text-sm">
                          {result.email}
                        </TableCell>
                        <TableCell>
                          {result.success ? (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Created
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {result.tempPassword || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription className="text-sm">
                  Download results to save temporary passwords for student login.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="flex-row justify-end gap-2 pt-2">
          {step === "upload" && (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={resetState}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0 || isImporting}>
                <Users className="mr-2 h-4 w-4" />
                Import {validCount}
              </Button>
            </>
          )}

          {step === "results" && (
            <>
              <Button variant="outline" onClick={downloadResults}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
