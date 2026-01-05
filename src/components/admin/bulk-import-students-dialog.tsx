"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// CSV column headers mapping
const COLUMN_MAP: Record<string, keyof ParsedStudentRow> = {
  "full name": "firstName", // Will be split
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
  const [importResult, setImportResult] = useState<BulkImportResult | null>(
    null,
  );
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
    if (!newOpen) {
      resetState();
    }
  };

  const parseCSV = (
    content: string,
  ): Omit<ParsedStudentRow, "errors" | "isValid">[] => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Parse header to find column indices
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/["']/g, ""));

    // Build column index map
    const columnIndices: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mappedKey = COLUMN_MAP[header];
      if (mappedKey) {
        columnIndices[mappedKey] = index;
      }
    });

    // Check for "Full Name" column (needs special handling)
    const fullNameIdx = headers.findIndex((h) => h === "full name");
    const hasFullName = fullNameIdx >= 0;

    return lines
      .slice(1)
      .map((line, index) => {
        // Handle CSV with quoted values containing commas
        const cols: string[] = [];
        let current = "";
        let inQuotes = false;

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            cols.push(current.trim().replace(/^["']|["']$/g, ""));
            current = "";
          } else {
            current += char;
          }
        }
        cols.push(current.trim().replace(/^["']|["']$/g, ""));

        // Parse full name if present
        let firstName = "";
        let lastName = "";

        if (hasFullName && cols[fullNameIdx]) {
          const fullName = cols[fullNameIdx];
          // Check if it's in "last_name, first_name" format
          if (fullName.includes(",")) {
            const parts = fullName.split(",").map((p) => p.trim());
            lastName = parts[0] || "";
            firstName = parts[1] || "";
          } else {
            // "first_name last_name" format
            const parts = fullName.split(/\s+/);
            firstName = parts[0] || "";
            lastName = parts.slice(1).join(" ") || "";
          }
        } else {
          firstName =
            columnIndices.firstName !== undefined
              ? cols[columnIndices.firstName] || ""
              : "";
          lastName =
            columnIndices.lastName !== undefined
              ? cols[columnIndices.lastName] || ""
              : "";
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
      })
      .filter((row) => row.email || row.firstName || row.lastName);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedClassId) {
      toast.error("Please select a class first");
      return;
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
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

      // Validate against database
      const validatedRows = await validateBulkStudentData(
        rows.map((r) => ({ ...r, errors: [], isValid: false })),
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
      "Full Name",
      "Father's Name",
      "Mother's Name",
      "Gender",
      "Date of Birth",
      "Blood Group",
      "Primary Email",
      "Alternate Email",
      "Primary Mobile",
      "Alternate Mobile",
      "Batch",
      "Academic Session",
      "Admission Date",
      "Address Line 1",
      "Address Line 2",
      "City / District",
      "State",
      "Country",
      "Postal Code",
    ].join(",");

    const sampleRow = [
      "Doe, John",
      "Robert Doe",
      "Jane Doe",
      "Male",
      "15/06/2000",
      "O+",
      "john.doe@example.com",
      "john.alt@example.com",
      "9876543210",
      "9876543211",
      "2024",
      "2024-25",
      "01/08/2024",
      "123 Main Street",
      "Apt 4B",
      "Mumbai",
      "Maharashtra",
      "India",
      "400001",
    ].join(",");

    const template = `${headers}\n${sampleRow}`;
    const blob = new Blob([template], { type: "text/csv" });
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
        (r) =>
          `${r.email},${r.studentId || ""},${r.success ? "success" : "failed"},${r.tempPassword || ""},${r.error || ""}`,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Import Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple student accounts with profiles.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
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

            <div className="space-y-4 rounded-lg border-2 border-dashed p-8 text-center">
              <FileSpreadsheet className="text-muted-foreground mx-auto h-12 w-12" />
              <div>
                <p className="font-medium">Upload CSV File</p>
                <p className="text-muted-foreground text-sm">
                  Required: Full Name (or First/Last Name), Primary Email
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  disabled={isValidating}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <label>
                  <Button asChild disabled={!selectedClassId || isValidating}>
                    <span>
                      {isValidating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
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
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>
                    Full Name can be &quot;Last, First&quot; or &quot;First
                    Last&quot;
                  </li>
                  <li>Date format: DD/MM/YYYY or YYYY-MM-DD</li>
                  <li>Gender: Male, Female, or Other</li>
                  <li>Blood Group: A+, A-, B+, B-, AB+, AB-, O+, O-</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Total: {parsedRows.length} rows
              </p>
            </div>

            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      className={!row.isValid ? "bg-destructive/10" : ""}
                    >
                      <TableCell className="font-mono text-xs">
                        {row.rowNumber}
                      </TableCell>
                      <TableCell>
                        {row.firstName} {row.lastName}
                      </TableCell>
                      <TableCell className="text-sm">{row.email}</TableCell>
                      <TableCell className="text-sm">
                        {row.primaryMobile || "-"}
                      </TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Valid
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            {row.errors.map((err, i) => (
                              <Badge
                                key={i}
                                variant="destructive"
                                className="text-xs"
                              >
                                {err}
                              </Badge>
                            ))}
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
                  {invalidCount} row(s) have errors and will be skipped during
                  import.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-6 py-12">
            <div className="space-y-2 text-center">
              <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
              <p className="font-medium">Creating student accounts...</p>
              <p className="text-muted-foreground text-sm">
                This may take a moment for large imports.
              </p>
            </div>
            <Progress value={importProgress} className="w-full" />
          </div>
        )}

        {step === "results" && importResult && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {importResult.totalProcessed}
                </p>
                <p className="text-muted-foreground text-sm">Total Processed</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                <p className="text-2xl font-bold text-green-600">
                  {importResult.successCount}
                </p>
                <p className="text-muted-foreground text-sm">Successful</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-950">
                <p className="text-2xl font-bold text-red-600">
                  {importResult.failedCount}
                </p>
                <p className="text-muted-foreground text-sm">Failed</p>
              </div>
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Temp Password</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResult.results.map((result, i) => (
                    <TableRow key={i}>
                      <TableCell>{result.email}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {result.studentId || "-"}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Created
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            {result.error}
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
              <AlertDescription>
                Download the results to save temporary passwords. Students need
                these for first login.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
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
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || isImporting}
              >
                Import {validCount} Students
              </Button>
            </>
          )}

          {step === "results" && (
            <>
              <Button variant="outline" onClick={downloadResults}>
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
