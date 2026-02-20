import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TemplateForm from "@/components/templates/TemplateForm";
import { createTemplate } from "@/services/template.service";
import type { TemplateFormValues } from "@/components/templates/TemplateForm";
import type { TemplateComponent } from "@/types/template.types";

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    values: TemplateFormValues,
    components: TemplateComponent[]
  ) => {
    setIsLoading(true);
    const toastId = toast.loading("Creating template...");
    try {
      await createTemplate({
        name: values.name,
        category: values.category,
        language: values.language,
        components,
      });
      toast.success("Template created successfully! Awaiting Meta approval.", {
        id: toastId,
      });
      navigate("/templates");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create template", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

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
        <div>
          <h1 className="text-lg font-bold tracking-tight">Create Template</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Build a new WhatsApp message template for Meta approval
          </p>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <TemplateForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Create Template"
        />
      </div>
    </div>
  );
}
