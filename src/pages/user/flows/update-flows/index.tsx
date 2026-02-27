import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import FlowTemplateForm from "@/components/flows/FlowTemplateForm";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import { getFlow, updateFlow } from "@/services/flow.service";
import type { CreateFlowPayload, FlowTemplate, UpdateFlowPayload } from "@/types/flow.types";

export default function UpdateFlows() {
  const navigate = useNavigate();
  const { flowId, id } = useParams<{ flowId?: string; id?: string }>();
  const resolvedFlowId = (flowId || id || "").trim();

  const flowQuery = useQuery({
    queryKey: ["flow", resolvedFlowId],
    enabled: Boolean(resolvedFlowId),
    queryFn: async () => {
      if (!resolvedFlowId) throw new Error("Missing flow id");
      const res = await getFlow(resolvedFlowId);
      return res.data.flow;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateFlowPayload | UpdateFlowPayload) => {
      if (!resolvedFlowId) throw new Error("Missing flow id");
      return updateFlow(resolvedFlowId, payload as UpdateFlowPayload);
    },
  });

  const handleSubmit = async (payload: CreateFlowPayload | UpdateFlowPayload) => {
    const toastId = toast.loading("Saving flow...");
    try {
      const res = await updateMutation.mutateAsync(payload as UpdateFlowPayload);
      toast.success(getApiSuccessMessage(res, "Flow updated successfully"), { id: toastId });
      navigate("/flows");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update flow"), { id: toastId });
    }
  };

  const mapDefaultValues = (flow: FlowTemplate) => ({
    name: flow.name,
    template_key: flow.template_key,
    description: flow.description || "",
    category: flow.category,
    webhook_mapping_json: flow.webhook_mapping ? JSON.stringify(flow.webhook_mapping, null, 2) : "",
    screens: (flow.screens || []).map((screen: any) => ({
      key: screen.key,
      title: screen.title,
      is_entry_point: screen.is_entry_point ?? screen.isEntryPoint,
      components: (screen.components || []).map((component: any) => ({
        key: component.key,
        type: component.type,
        label: component.label,
        variable_key: component.variable_key ?? component.variableKey,
        placeholder: component.placeholder,
        required: component.required,
        helper_text: component.helper_text ?? component.helperText,
        options_text: component.options?.map((opt: any) => `${opt.label}|${opt.value}`).join("\n") || "",
        min_length:
          typeof component.min_length === "number" && component.min_length > 0
            ? component.min_length
            : typeof component.minLength === "number" && component.minLength > 0
              ? component.minLength
              : undefined,
        max_length:
          typeof component.max_length === "number" && component.max_length > 0
            ? component.max_length
            : typeof component.maxLength === "number" && component.maxLength > 0
              ? component.maxLength
              : undefined,
        min_value: component.min_value ?? component.minValue,
        max_value: component.max_value ?? component.maxValue,
      })),
      actions: (screen.actions || []).map((action: any) => ({
        key: action.key,
        type: action.type,
        label: action.label,
        target_screen_key: action.target_screen_key ?? action.targetScreenKey,
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
            key={flowQuery.data.id || resolvedFlowId}
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
