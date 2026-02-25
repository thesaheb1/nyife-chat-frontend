import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import FlowTemplateForm from "@/components/flows/FlowTemplateForm";
import { getFlow, updateFlow } from "@/services/flow.service";
import type { CreateFlowPayload, FlowTemplate, UpdateFlowPayload } from "@/types/flow.types";

export default function UpdateFlows() {
  const navigate = useNavigate();
  const { flowId } = useParams<{ flowId: string }>();

  const flowQuery = useQuery({
    queryKey: ["flow", flowId],
    enabled: Boolean(flowId),
    queryFn: async () => {
      if (!flowId) throw new Error("Missing flow id");
      const res = await getFlow(flowId);
      return res.data.flow;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateFlowPayload | UpdateFlowPayload) => {
      if (!flowId) throw new Error("Missing flow id");
      return updateFlow(flowId, payload as UpdateFlowPayload);
    },
  });

  const handleSubmit = async (payload: CreateFlowPayload | UpdateFlowPayload) => {
    const toastId = toast.loading("Saving flow...");
    try {
      await updateMutation.mutateAsync(payload as UpdateFlowPayload);
      toast.success("Flow updated successfully", { id: toastId });
      navigate("/flows");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update flow", { id: toastId });
    }
  };

  const mapDefaultValues = (flow: FlowTemplate) => ({
    name: flow.name,
    template_key: flow.template_key,
    description: flow.description || "",
    category: flow.category,
    webhook_mapping_json: flow.webhook_mapping ? JSON.stringify(flow.webhook_mapping, null, 2) : "",
    screens: flow.screens.map((screen) => ({
      key: screen.key,
      title: screen.title,
      is_entry_point: screen.is_entry_point,
      components: screen.components.map((component) => ({
        key: component.key,
        type: component.type,
        label: component.label,
        variable_key: component.variable_key,
        placeholder: component.placeholder,
        required: component.required,
        helper_text: component.helper_text,
        options_text: component.options?.map((opt) => `${opt.label}|${opt.value}`).join("\n") || "",
        min_length: component.min_length,
        max_length: component.max_length,
        min_value: component.min_value,
        max_value: component.max_value,
      })),
      actions: screen.actions.map((action) => ({
        key: action.key,
        type: action.type,
        label: action.label,
        target_screen_key: action.target_screen_key,
        url: action.url,
        phone: action.phone,
      })),
    })),
  });

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/flows")}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Update Flow Template</h1>
            <p className="text-xs text-muted-foreground">Edit screens, components and actions safely.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {flowQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {flowQuery.isError && (
          <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="size-4" />
            <AlertDescription>{(flowQuery.error as Error)?.message || "Failed to load flow"}</AlertDescription>
          </Alert>
        )}

        {flowQuery.data && (
          <FlowTemplateForm
            defaultValues={mapDefaultValues(flowQuery.data)}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            submitLabel="Save Changes"
            onCancel={() => navigate("/flows")}
            isUpdate
          />
        )}
      </div>
    </div>
  );
}
