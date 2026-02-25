import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import FlowTemplateForm from "@/components/flows/FlowTemplateForm";
import { createFlow } from "@/services/flow.service";
import type { CreateFlowPayload, UpdateFlowPayload } from "@/types/flow.types";

export default function CreateFlows() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (payload: CreateFlowPayload | UpdateFlowPayload) => createFlow(payload as CreateFlowPayload),
  });

  const handleSubmit = async (payload: CreateFlowPayload | UpdateFlowPayload) => {
    const toastId = toast.loading("Creating flow...");
    try {
      await createMutation.mutateAsync(payload as CreateFlowPayload);
      toast.success("Flow created successfully", { id: toastId });
      navigate("/flows");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create flow", { id: toastId });
    }
  };

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
            <h1 className="text-xl font-bold tracking-tight">Create Flow Template</h1>
            <p className="text-xs text-muted-foreground">Build interactive WhatsApp flow forms with production validation.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <FlowTemplateForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Create Flow"
          onCancel={() => navigate("/flows")}
        />
      </div>
    </div>
  );
}
