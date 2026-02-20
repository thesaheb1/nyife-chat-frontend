import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
    const toastId = toast.loading("Submitting template to Meta for approval…");
    try {
      await createTemplate({
        name: values.name,
        category: values.category,
        language: values.language,
        components,
      });
      toast.success(
        "Template submitted! Meta usually approves within a few minutes.",
        { id: toastId }
      );
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
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/templates")}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Create New Template</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Build a WhatsApp message template and submit it for Meta's approval
            </p>
          </div>
        </div>

        {/* Process steps */}
        <div className="flex items-center gap-0 mt-4 overflow-x-auto pb-1">
          {[
            { n: "1", label: "Choose template type" },
            { n: "2", label: "Build your content" },
            { n: "3", label: "Submit to Meta" },
            { n: "4", label: "Approved & live 🎉" },
          ].map((s, i, arr) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold">
                  {s.n}
                </div>
                <span className="whitespace-nowrap">{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <svg className="w-4 h-4 text-border mx-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <TemplateForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Submit for Approval"
          onCancel={() => navigate("/templates")}
        />
      </div>
    </div>
  );
}
