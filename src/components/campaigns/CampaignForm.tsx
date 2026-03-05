import { useEffect, useMemo, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/utils/api-response";
import { listGroups } from "@/services/contact.service";
import { listTemplates } from "@/services/template.service";
import type { CreateCampaignPayload, UpdateCampaignPayload } from "@/types/campaign.types";
import type { ContactGroup } from "@/types/contact.types";
import type { Template } from "@/types/template.types";

const NO_TEMPLATE_VALUE = "__none_template__";
const NO_GROUP_VALUE = "__none_group__";

const campaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Campaign name is required"),
    description: z.string().optional(),
    templateId: z.string().optional(),
    groupId: z.string().optional(),
    scheduledAt: z.string().optional(),
    metadataJson: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.groupId && value.groupId.trim() && value.groupId !== NO_GROUP_VALUE) {
      const numeric = Number(value.groupId);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["groupId"],
          message: "Group ID must be a positive number",
        });
      }
    }

    if (value.scheduledAt && value.scheduledAt.trim()) {
      const ts = new Date(value.scheduledAt).getTime();
      if (!Number.isFinite(ts)) {
        ctx.addIssue({
          code: "custom",
          path: ["scheduledAt"],
          message: "Invalid schedule date/time",
        });
      }
    }

    if (value.metadataJson && value.metadataJson.trim()) {
      try {
        const parsed = JSON.parse(value.metadataJson);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          ctx.addIssue({
            code: "custom",
            path: ["metadataJson"],
            message: "Metadata must be a JSON object",
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["metadataJson"],
          message: "Metadata must be valid JSON",
        });
      }
    }
  });

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

interface CampaignFormProps {
  defaultValues?: Partial<CampaignFormValues>;
  onSubmit: (payload: CreateCampaignPayload | UpdateCampaignPayload) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  isUpdate?: boolean;
}

const toDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";

  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

const fromDateTimeLocal = (value?: string): string | undefined => {
  if (!value || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
};

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

export default function CampaignForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Campaign",
  onCancel,
  isUpdate = false,
}: CampaignFormProps) {
  const templatesQuery = useQuery({
    queryKey: ["campaign-form-templates"],
    queryFn: () => listTemplates({ limit: 200, offset: 0, status: "APPROVED" }),
    staleTime: 5 * 60 * 1000,
  });

  const groupsQuery = useQuery({
    queryKey: ["campaign-form-groups"],
    queryFn: () => listGroups(),
    staleTime: 5 * 60 * 1000,
  });

  const templates = templatesQuery.data?.data || [];
  const groups = groupsQuery.data?.data || [];

  const normalizedDefaults = useMemo<CampaignFormValues>(
    () => ({
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      templateId: defaultValues?.templateId || NO_TEMPLATE_VALUE,
      groupId: defaultValues?.groupId || NO_GROUP_VALUE,
      scheduledAt: defaultValues?.scheduledAt || "",
      metadataJson: defaultValues?.metadataJson || "",
    }),
    [defaultValues]
  );

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: normalizedDefaults,
  });

  const templateIdValue = form.watch("templateId") || NO_TEMPLATE_VALUE;
  const groupIdValue = form.watch("groupId") || NO_GROUP_VALUE;

  const templateOptions = useMemo(() => {
    const optionMap = new Map<string, { value: string; label: string }>();

    templates.forEach((template: Template) => {
      const value = String(template.uuid || template.id || "").trim();
      if (!value) return;

      optionMap.set(value, {
        value,
        label: template.name || value,
      });
    });

    return Array.from(optionMap.values()).sort((left, right) =>
      left.label.localeCompare(right.label, "en", { sensitivity: "base" })
    );
  }, [templateIdValue, templates]);

  useEffect(() => {
    if (!templateOptions.length) return;
    if (templateIdValue === NO_TEMPLATE_VALUE) return;

    const existsInApprovedList = templateOptions.some((option) => option.value === templateIdValue);
    if (!existsInApprovedList) {
      form.setValue("templateId", NO_TEMPLATE_VALUE, { shouldDirty: true });
    }
  }, [form, templateIdValue, templateOptions]);

  const groupOptions = useMemo(() => {
    const optionMap = new Map<string, { value: string; label: string }>();

    groups.forEach((group: ContactGroup) => {
      const value = String(group.id || "").trim();
      if (!value) return;

      const countText = typeof group.contactCount === "number" ? ` • ${group.contactCount} contacts` : "";
      optionMap.set(value, {
        value,
        label: `${group.name || `Group ${value}`}${countText}`,
      });
    });

    if (
      groupIdValue &&
      groupIdValue !== NO_GROUP_VALUE &&
      !optionMap.has(groupIdValue)
    ) {
      optionMap.set(groupIdValue, {
        value: groupIdValue,
        label: `Current Group (ID: ${groupIdValue})`,
      });
    }

    return Array.from(optionMap.values()).sort((left, right) =>
      left.label.localeCompare(right.label, "en", { sensitivity: "base" })
    );
  }, [groupIdValue, groups]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const description = values.description?.trim() || undefined;
    const templateId =
      values.templateId?.trim() && values.templateId !== NO_TEMPLATE_VALUE
        ? values.templateId.trim()
        : undefined;
    const groupId =
      values.groupId?.trim() && values.groupId !== NO_GROUP_VALUE
        ? Number(values.groupId)
        : undefined;
    const scheduledAt = fromDateTimeLocal(values.scheduledAt);
    const isScheduled = Boolean(scheduledAt);

    const metadata =
      values.metadataJson && values.metadataJson.trim()
        ? (JSON.parse(values.metadataJson) as Record<string, unknown>)
        : undefined;

    const payload: CreateCampaignPayload | UpdateCampaignPayload = {
      name: values.name.trim(),
      description,
      templateId,
      groupId,
      ...(!isUpdate ? { status: isScheduled ? "scheduled" : "draft" } : {}),
      ...(isUpdate
        ? { scheduledAt: scheduledAt || null }
        : { ...(scheduledAt ? { scheduledAt } : {}) }),
      ...(metadata ? { metadata } : {}),
    };

    await onSubmit(payload);
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormSection title="Basic Details" subtitle="Name and describe the campaign.">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Campaign Name</Label>
          <Input
            id="campaign-name"
            placeholder="Welcome Campaign"
            {...form.register("name")}
            disabled={isLoading}
          />
          <FieldError message={form.formState.errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-description">Description</Label>
          <Textarea
            id="campaign-description"
            rows={3}
            placeholder="Send onboarding messages to new customers"
            {...form.register("description")}
            disabled={isLoading}
          />
          <FieldError message={form.formState.errors.description?.message} />
        </div>
      </FormSection>

      <FormSection
        title="Template & Audience"
        subtitle="Connect the campaign to a template and contact group."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select
              value={templateIdValue}
              onValueChange={(next) => form.setValue("templateId", next, { shouldDirty: true })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEMPLATE_VALUE}>No Template</SelectItem>
                {templateOptions.map((templateOption) => (
                  <SelectItem key={templateOption.value} value={templateOption.value}>
                    {templateOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templatesQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading templates...</p>
            ) : null}
            {templatesQuery.isError ? (
              <p className="text-xs text-destructive">
                {getApiErrorMessage(templatesQuery.error, "Failed to load templates")}
              </p>
            ) : null}
            <FieldError message={form.formState.errors.templateId?.message} />
          </div>

          <div className="space-y-1.5">
            <Label>Group</Label>
            <Select
              value={groupIdValue}
              onValueChange={(next) => form.setValue("groupId", next, { shouldDirty: true })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GROUP_VALUE}>No Group</SelectItem>
                {groupOptions.map((groupOption) => (
                  <SelectItem key={groupOption.value} value={groupOption.value}>
                    {groupOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {groupsQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading groups...</p>
            ) : null}
            {groupsQuery.isError ? (
              <p className="text-xs text-destructive">
                {getApiErrorMessage(groupsQuery.error, "Failed to load groups")}
              </p>
            ) : null}
            <FieldError message={form.formState.errors.groupId?.message} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Scheduling"
        subtitle="Set optional execution schedule. Runtime status is controlled by backend."
      >
        <div className="space-y-1.5">
          <Label htmlFor="campaign-scheduled-at">Scheduled At</Label>
          <Input
            id="campaign-scheduled-at"
            type="datetime-local"
            value={toDateTimeLocal(form.watch("scheduledAt"))}
            onChange={(event) => form.setValue("scheduledAt", event.target.value, { shouldDirty: true })}
            disabled={isLoading}
          />
          <FieldError message={form.formState.errors.scheduledAt?.message} />
          <p className="text-xs text-muted-foreground">
            Campaign status will be set automatically (`draft` or `scheduled`) and updated by backend during execution.
          </p>
        </div>
      </FormSection>

      <FormSection
        title="Metadata"
        subtitle="Optional JSON payload forwarded for WhatsApp template parameters."
      >
        <div className="space-y-1.5">
          <Label htmlFor="campaign-metadata">Metadata JSON</Label>
          <Textarea
            id="campaign-metadata"
            rows={9}
            placeholder={JSON.stringify(
              {
                wabaId: "waba_id_here",
                phoneNumberId: "phone_number_id_here",
                bodyParameters: { "1": "Welcome!" },
              },
              null,
              2
            )}
            {...form.register("metadataJson")}
            disabled={isLoading}
            className="font-mono text-xs"
          />
          <FieldError message={form.formState.errors.metadataJson?.message} />
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
