"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { createUser } from "@/lib/actions/admin.actions";
import { getAllDepartments } from "@/lib/actions/academic.actions";
import {
  Loader2,
  Plus,
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  Crown,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

const roleOptions = [
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    description: "Full system access",
    color: "text-red-600",
  },
  {
    value: "hod",
    label: "HOD",
    icon: Crown,
    description: "Department management",
    color: "text-purple-600",
  },
  {
    value: "professor",
    label: "Professor",
    icon: BookOpen,
    description: "Teaching & grading",
    color: "text-blue-600",
  },
  {
    value: "student",
    label: "Student",
    icon: GraduationCap,
    description: "Learning & submissions",
    color: "text-emerald-600",
  },
];

interface Department {
  _id: string;
  name: string;
  code: string;
}

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "" as "admin" | "hod" | "professor" | "student" | "",
    departmentId: "",
  });

  // Fetch departments when dialog opens
  useEffect(() => {
    if (open) {
      getAllDepartments().then((data) => {
        setDepartments(data || []);
      });
    }
  }, [open]);

  const needsDepartment = formData.role === "professor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.role) {
      setError("Please select a role");
      setIsLoading(false);
      return;
    }

    if (needsDepartment && !formData.departmentId) {
      setError("Please select a department");
      setIsLoading(false);
      return;
    }

    const result = await createUser({
      ...formData,
      role: formData.role as "admin" | "hod" | "professor" | "student",
      departmentId: needsDepartment ? formData.departmentId : undefined,
    });

    if (result.success) {
      toast.success("User created successfully");
      setOpen(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        role: "",
        departmentId: "",
      });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create user");
      setError(result.error || "Failed to create user");
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <UserPlus className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with login credentials
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name Fields */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <User className="text-muted-foreground h-4 w-4" />
                Full Name
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
                <Input
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Mail className="text-muted-foreground h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Lock className="text-muted-foreground h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            <Separator />

            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          role: role.value as typeof formData.role,
                          departmentId: "", // Reset department when role changes
                        })
                      }
                      disabled={isLoading}
                      className={`hover:bg-accent/50 flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "bg-muted/50 border-transparent"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isSelected ? "bg-primary/10" : "bg-background"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${role.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{role.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department Selection - shown for HOD and Professor */}
            {needsDepartment && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  Department
                </Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  The department this professor belongs to
                </p>
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.role}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
