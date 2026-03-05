import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import CampaignForm from "@/components/campaigns/CampaignForm";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import { createCampaign } from "@/services/campaign.service";
import type { CreateCampaignPayload, UpdateCampaignPayload } from "@/types/campaign.types";

export default function CreateCampaignPage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload | UpdateCampaignPayload) =>
      createCampaign(payload as CreateCampaignPayload),
  });

  const handleSubmit = async (payload: CreateCampaignPayload | UpdateCampaignPayload) => {
    const toastId = toast.loading("Creating campaign...");
    try {
      const res = await createMutation.mutateAsync(payload);
      toast.success(getApiSuccessMessage(res, "Campaign created successfully"), { id: toastId });
      navigate("/campaigns");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create campaign"), { id: toastId });
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/campaigns")}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Create Campaign</h1>
            <p className="text-xs text-muted-foreground">
              Configure campaign details, schedule, and execution metadata.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <CampaignForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Create Campaign"
          onCancel={() => navigate("/campaigns")}
        />
      </div>
    </div>
  );
}
