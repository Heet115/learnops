"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Clock, Moon, Save } from "lucide-react";
import { updateNotificationPreferences } from "@/lib/actions/notification-preferences.actions";
import { toast } from "sonner";

interface NotificationPreferencesFormProps {
  preferences: {
    newAla: boolean;
    deadlineReminder: boolean;
    submissionGraded: boolean;
    submissionRejected: boolean;
    systemNotifications: boolean;
    inApp: boolean;
    deadlineReminderHours: number;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
}

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [formData, setFormData] = useState(preferences);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = (key: keyof typeof formData) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateNotificationPreferences(formData);
      if (result.success) {
        toast.success("Preferences saved successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save preferences");
      }
    });
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(preferences);

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newAla">New ALA Posted</Label>
              <p className="text-muted-foreground text-sm">
                When a professor posts a new assignment
              </p>
            </div>
            <Switch
              id="newAla"
              checked={formData.newAla}
              onCheckedChange={() => handleToggle("newAla")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="deadlineReminder">Deadline Reminders</Label>
              <p className="text-muted-foreground text-sm">
                Reminders before assignment deadlines
              </p>
            </div>
            <Switch
              id="deadlineReminder"
              checked={formData.deadlineReminder}
              onCheckedChange={() => handleToggle("deadlineReminder")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="submissionGraded">Submission Graded</Label>
              <p className="text-muted-foreground text-sm">
                When your submission has been graded
              </p>
            </div>
            <Switch
              id="submissionGraded"
              checked={formData.submissionGraded}
              onCheckedChange={() => handleToggle("submissionGraded")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="submissionRejected">Submission Rejected</Label>
              <p className="text-muted-foreground text-sm">
                When your submission needs revision
              </p>
            </div>
            <Switch
              id="submissionRejected"
              checked={formData.submissionRejected}
              onCheckedChange={() => handleToggle("submissionRejected")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="systemNotifications">System Notifications</Label>
              <p className="text-muted-foreground text-sm">
                Important system announcements
              </p>
            </div>
            <Switch
              id="systemNotifications"
              checked={formData.systemNotifications}
              onCheckedChange={() => handleToggle("systemNotifications")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing Preferences
          </CardTitle>
          <CardDescription>
            Configure when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deadlineReminderHours">
              Deadline Reminder Timing
            </Label>
            <Select
              value={formData.deadlineReminderHours.toString()}
              onValueChange={(v) =>
                handleChange("deadlineReminderHours", parseInt(v))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 hours before</SelectItem>
                <SelectItem value="12">12 hours before</SelectItem>
                <SelectItem value="24">24 hours before</SelectItem>
                <SelectItem value="48">48 hours before</SelectItem>
                <SelectItem value="72">72 hours before</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              How early to remind you about upcoming deadlines
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quietHoursEnabled">Enable Quiet Hours</Label>
              <p className="text-muted-foreground text-sm">
                Notifications will be held during quiet hours
              </p>
            </div>
            <Switch
              id="quietHoursEnabled"
              checked={formData.quietHoursEnabled}
              onCheckedChange={() => handleToggle("quietHoursEnabled")}
            />
          </div>

          {formData.quietHoursEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quietHoursStart">Start Time</Label>
                  <Input
                    id="quietHoursStart"
                    type="time"
                    value={formData.quietHoursStart}
                    onChange={(e) =>
                      handleChange("quietHoursStart", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quietHoursEnd">End Time</Label>
                  <Input
                    id="quietHoursEnd"
                    type="time"
                    value={formData.quietHoursEnd}
                    onChange={(e) =>
                      handleChange("quietHoursEnd", e.target.value)
                    }
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Example: 22:00 to 08:00 for overnight quiet hours
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending || !hasChanges}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
