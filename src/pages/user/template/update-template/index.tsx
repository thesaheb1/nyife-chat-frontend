import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TemplateForm from "@/components/templates/TemplateForm";
import TemplateStatusBadge from "@/components/templates/TemplateStatusBadge";
import { getTemplate, updateTemplate } from "@/services/template.service";
import type { Template, TemplateComponent } from "@/types/template.types";
import type { TemplateFormValues } from "@/components/templates/TemplateForm";

export default function UpdateTemplatePage() {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;
    setIsLoadingTemplate(true);
    getTemplate(uuid)
      .then((res) => {
        const t = res?.data?.template || (res?.data as unknown as Template);
        setTemplate(t);
      })
      .catch((err) => {
        setLoadError(err?.message || "Failed to load template");
      })
      .finally(() => setIsLoadingTemplate(false));
  }, [uuid]);

  const handleSubmit = async (
    values: TemplateFormValues,
    components: TemplateComponent[]
  ) => {
    if (!uuid) return;
    setIsSaving(true);
    const toastId = toast.loading("Updating template...");
    try {
      await updateTemplate(uuid, {
        category: values.category,
        components,
      });
      toast.success("Template updated successfully!", { id: toastId });
      navigate("/templates");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update template", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Build default values from existing template
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
      })),
    })) as TemplateFormValues["components"],
  });

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate("/templates")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">
              {isLoadingTemplate ? "Edit Template" : `Edit: ${template?.name}`}
            </h1>
            {template && <TemplateStatusBadge status={template.status} />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update template components. Name and language cannot be changed.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoadingTemplate ? (
          <div className="space-y-4 max-w-3xl">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : loadError ? (
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : template ? (
          <>
            {template.status === "REJECTED" && template.rejection_reason && (
              <Alert variant="destructive" className="mb-4 max-w-3xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Rejection Reason:</strong> {template.rejection_reason}
                </AlertDescription>
              </Alert>
            )}
            <TemplateForm
              key={template.uuid}
              defaultValues={buildDefaultValues(template)}
              onSubmit={handleSubmit}
              isLoading={isSaving}
              submitLabel="Save Changes"
              isUpdate={true}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
