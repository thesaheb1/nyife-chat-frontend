import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TemplateForm from "@/components/templates/TemplateForm";
import TemplateStatusBadge from "@/components/templates/TemplateStatusBadge";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import { getTemplate, updateTemplate, validateTemplatePayload } from "@/services/template.service";
import type { Template, TemplateComponent } from "@/types/template.types";
import type { TemplateFormValues } from "@/components/templates/TemplateForm";
import type { TemplateTypeId } from "@/components/templates/TemplateTypeSelector";

// Infer the TemplateTypeId from the existing template's components/category
function inferTypeId(template: Template): TemplateTypeId {
  if (template.category === "AUTHENTICATION") return "authentication";
  const hasCarousel = template.components.some((c) => c.type === "CAROUSEL");
  if (hasCarousel) return "carousel";
  const hasFlowBtn = template.components.some(
    (c) => c.type === "BUTTONS" && c.buttons?.some((b) => b.type === "FLOW")
  );
  if (hasFlowBtn) return "flow";
  return "standard";
}

export default function UpdateTemplatePage() {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();

  const {
    data: template,
    isLoading: isLoadingTemplate,
    error: loadError,
  } = useQuery<Template>({
    queryKey: ["template", uuid],
    enabled: Boolean(uuid),
    queryFn: async () => {
      if (!uuid) {
        throw new Error("Template ID is missing.");
      }
      const res = await getTemplate(uuid);
      const t = (res?.data as any)?.template ?? (res?.data as unknown as Template);
      return t;
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      values,
      components,
    }: {
      values: TemplateFormValues;
      components: TemplateComponent[];
    }) => {
      if (!uuid) {
        throw new Error("Template ID is missing.");
      }

      const validationPayload = {
        name: values.name,
        category: values.category,
        language: values.language,
        components,
      };

      const validation = await validateTemplatePayload(validationPayload);
      const result = validation?.data;
      if (result?.valid === false) {
        const firstIssue = result.errors?.[0]?.message || "Template payload failed validation.";
        throw new Error(firstIssue);
      }

      return updateTemplate(uuid, { category: values.category, components });
    },
  });

  const handleSubmit = async (
    values: TemplateFormValues,
    components: TemplateComponent[]
  ) => {
    const toastId = toast.loading("Saving changes…");
    try {
      const res = await updateTemplateMutation.mutateAsync({ values, components });
      toast.success(getApiSuccessMessage(res, "Template updated successfully!"), { id: toastId });
      navigate("/templates");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update template"), { id: toastId });
    }
  };

  // Map existing template data into form values
  const buildDefaultValues = (t: Template): Partial<TemplateFormValues> => ({
    name: t.name,
    category: t.category,
    language: t.language,
    components: t.components.map((c) => ({
      type: c.type,
      format: c.format,
      text: c.text || "",
      add_security_recommendation: c.add_security_recommendation,
      buttons: c.buttons?.map((b) => ({
        type: b.type,
        text: b.text,
        url: b.url,
        phone_number: b.phone_number,
        otp_type: b.otp_type,
        flow_id: b.flow_id,
        flow_action: b.flow_action,
        navigate_screen: b.navigate_screen,
      })),
      carousel_cards_json: c.cards ? JSON.stringify(c.cards) : undefined,
    })) as TemplateFormValues["components"],
  });

  const typeId = template ? inferTypeId(template) : undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/templates")}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">
                {isLoadingTemplate
                  ? "Edit Template"
                  : `Edit: ${template?.name}`}
              </h1>
              {template && <TemplateStatusBadge status={template.status} />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update the content of your template. Template name and language cannot be changed.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {isLoadingTemplate ? (
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : loadError ? (
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{(loadError as Error)?.message || "Failed to load template"}</AlertDescription>
          </Alert>
        ) : template ? (
          <>
            {/* Rejection reason alert */}
            {template.status === "REJECTED" && template.rejection_reason && (
              <Alert variant="destructive" className="mb-5 max-w-3xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Rejected by Meta:</strong> {template.rejection_reason}
                  <br />
                  <span className="text-xs opacity-80 mt-1 block">
                    Fix the issue below and resubmit. Common reasons: prohibited content, missing variables in examples, policy violations.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <TemplateForm
              key={template.uuid}
              defaultValues={buildDefaultValues(template)}
              defaultTypeId={typeId}
              onSubmit={handleSubmit}
              isLoading={updateTemplateMutation.isPending}
              submitLabel="Save Changes"
              isUpdate={true}
              onCancel={() => navigate("/templates")}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
