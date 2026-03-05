import { useMemo, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COUNTRY_CALLING_CODE_OPTIONS,
  getCallingCodeFromOptionValue,
  getOptionValueFromCallingCode,
} from "@/constants/countryCallingCodes";
import type {
  ContactGroup,
  CreateContactPayload,
  UpdateContactPayload,
} from "@/types/contact.types";

const GROUP_NONE_VALUE = "__none__";

const contactFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
    lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
    email: z.string().trim().min(1, "Email is required").email("Invalid email format"),
    phone: z.string().trim().min(1, "Phone is required"),
    countryCode: z
      .string()
      .trim()
      .min(1, "Country is required")
      .refine((value) => /^\+\d{1,4}$/.test(value), "Invalid country code"),
    company: z.string().trim().optional(),
    jobTitle: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    groupId: z.string().optional(),
    isFavorite: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!value.groupId || value.groupId === GROUP_NONE_VALUE) return;
    const numeric = Number(value.groupId);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["groupId"],
        message: "Please select a valid group",
      });
    }
  });

export type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  defaultValues?: Partial<ContactFormValues>;
  groups: ContactGroup[];
  onSubmit: (payload: CreateContactPayload | UpdateContactPayload) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export default function ContactForm({
  defaultValues,
  groups,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Contact",
  onCancel,
}: ContactFormProps) {
  const normalizedDefaults = useMemo<ContactFormValues>(
    () => ({
      firstName: defaultValues?.firstName || "",
      lastName: defaultValues?.lastName || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      countryCode: defaultValues?.countryCode || "+91",
      company: defaultValues?.company || "",
      jobTitle: defaultValues?.jobTitle || "",
      notes: defaultValues?.notes || "",
      groupId: defaultValues?.groupId || GROUP_NONE_VALUE,
      isFavorite: defaultValues?.isFavorite || false,
    }),
    [defaultValues]
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: normalizedDefaults,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const parsedGroupId =
      values.groupId && values.groupId !== GROUP_NONE_VALUE ? Number(values.groupId) : undefined;

    const payload: CreateContactPayload | UpdateContactPayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      countryCode: values.countryCode?.trim() || "+91",
      ...(values.company?.trim() ? { company: values.company.trim() } : {}),
      ...(values.jobTitle?.trim() ? { jobTitle: values.jobTitle.trim() } : {}),
      ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
      ...(typeof parsedGroupId === "number" ? { groupId: parsedGroupId } : { groupId: null }),
      isFavorite: values.isFavorite,
    };

    await onSubmit(payload);
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormSection title="Basic Details" subtitle="Personal details used in campaign targeting.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-first-name">First Name</Label>
            <Input
              id="contact-first-name"
              placeholder="Aarav"
              {...form.register("firstName")}
              disabled={isLoading}
            />
            <FieldError message={form.formState.errors.firstName?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-last-name">Last Name</Label>
            <Input
              id="contact-last-name"
              placeholder="Sharma"
              {...form.register("lastName")}
              disabled={isLoading}
            />
            <FieldError message={form.formState.errors.lastName?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="name@example.com"
              {...form.register("email")}
              disabled={isLoading}
            />
            <FieldError message={form.formState.errors.email?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              placeholder="9876543210"
              {...form.register("phone")}
              disabled={isLoading}
            />
            <FieldError message={form.formState.errors.phone?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Controller
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <Select
                  value={getOptionValueFromCallingCode(field.value || "+91")}
                  onValueChange={(value) => field.onChange(getCallingCodeFromOptionValue(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CALLING_CODE_OPTIONS.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.name} ({country.callingCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={form.formState.errors.countryCode?.message} />
          </div>

          <div className="space-y-1.5">
            <Label>Primary Group</Label>
            <Controller
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <Select
                  value={field.value || GROUP_NONE_VALUE}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GROUP_NONE_VALUE}>No Group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={form.formState.errors.groupId?.message} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Professional Details" subtitle="Optional business information for segmentation.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-company">Company</Label>
            <Input
              id="contact-company"
              placeholder="Nyife"
              {...form.register("company")}
              disabled={isLoading}
            />
            <FieldError message={form.formState.errors.company?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-job-title">Job Title</Label>
            <Input
              id="contact-job-title"
              placeholder="Marketing Manager"
              {...form.register("jobTitle")}
              disabled={isLoading}
            />
            <FieldError message={form.formState.errors.jobTitle?.message} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Notes & Flags" subtitle="Track context and mark important contacts.">
        <div className="space-y-1.5">
          <Label htmlFor="contact-notes">Notes</Label>
          <Textarea
            id="contact-notes"
            rows={4}
            placeholder="Additional context for this contact"
            {...form.register("notes")}
            disabled={isLoading}
          />
          <FieldError message={form.formState.errors.notes?.message} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Mark as Favorite</p>
            <p className="text-xs text-muted-foreground">Favorites can be filtered separately in list view.</p>
          </div>
          <Controller
            control={form.control}
            name="isFavorite"
            render={({ field }) => (
              <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isLoading} />
            )}
          />
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
