import { useMemo, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateGroupPayload, UpdateGroupPayload } from "@/types/contact.types";

const groupFormSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(100, "Group name is too long"),
  description: z.string().trim().optional(),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;

interface GroupFormProps {
  defaultValues?: Partial<GroupFormValues>;
  onSubmit: (payload: CreateGroupPayload | UpdateGroupPayload) => Promise<void> | void;
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

export default function GroupForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Group",
  onCancel,
}: GroupFormProps) {
  const normalizedDefaults = useMemo<GroupFormValues>(
    () => ({
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
    }),
    [defaultValues]
  );

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: normalizedDefaults,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateGroupPayload | UpdateGroupPayload = {
      name: values.name.trim(),
      ...(values.description?.trim() ? { description: values.description.trim() } : {}),
    };

    await onSubmit(payload);
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormSection title="Group Details" subtitle="Create and manage contact segments.">
        <div className="space-y-1.5">
          <Label htmlFor="group-name">Group Name</Label>
          <Input
            id="group-name"
            placeholder="VIP Customers"
            {...form.register("name")}
            disabled={isLoading}
          />
          <FieldError message={form.formState.errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="group-description">Description</Label>
          <Textarea
            id="group-description"
            rows={4}
            placeholder="Contacts segmented for high-priority campaign sends"
            {...form.register("description")}
            disabled={isLoading}
          />
          <FieldError message={form.formState.errors.description?.message} />
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
