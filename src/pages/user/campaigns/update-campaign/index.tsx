import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import CampaignForm from "@/components/campaigns/CampaignForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import { getCampaign, updateCampaign } from "@/services/campaign.service";
import type { Campaign, CreateCampaignPayload, UpdateCampaignPayload } from "@/types/campaign.types";

export default function UpdateCampaignPage() {
  const navigate = useNavigate();
  const { campaignId, id } = useParams<{ campaignId?: string; id?: string }>();
  const resolvedCampaignId = (campaignId || id || "").trim();

  const campaignQuery = useQuery({
    queryKey: ["campaign", resolvedCampaignId],
    enabled: Boolean(resolvedCampaignId),
    queryFn: async () => {
      if (!resolvedCampaignId) throw new Error("Missing campaign id");
      const res = await getCampaign(resolvedCampaignId);
      return res.data.campaign;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload | UpdateCampaignPayload) => {
      if (!resolvedCampaignId) throw new Error("Missing campaign id");
      return updateCampaign(resolvedCampaignId, payload as UpdateCampaignPayload);
    },
  });

  const handleSubmit = async (payload: CreateCampaignPayload | UpdateCampaignPayload) => {
    const toastId = toast.loading("Saving campaign...");
    try {
      const res = await updateMutation.mutateAsync(payload as UpdateCampaignPayload);
      toast.success(getApiSuccessMessage(res, "Campaign updated successfully"), { id: toastId });
      navigate("/campaigns");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update campaign"), { id: toastId });
    }
  };

  const mapDefaultValues = (campaign: Campaign) => ({
    name: campaign.name || "",
    description: campaign.description || "",
    templateId: campaign.templateId || "",
    groupId: campaign.groupId ? String(campaign.groupId) : "",
    status: campaign.status,
    scheduledAt: campaign.scheduledAt || "",
    metadataJson: campaign.metadata ? JSON.stringify(campaign.metadata, null, 2) : "",
  });

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
            <h1 className="text-xl font-bold tracking-tight">Update Campaign</h1>
            <p className="text-xs text-muted-foreground">
              Edit campaign configuration, schedule and metadata safely.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {campaignQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {campaignQuery.isError && (
          <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="size-4" />
            <AlertDescription>{(campaignQuery.error as Error)?.message || "Failed to load campaign"}</AlertDescription>
          </Alert>
        )}

        {campaignQuery.data && (
          <CampaignForm
            key={campaignQuery.data.id || resolvedCampaignId}
            defaultValues={mapDefaultValues(campaignQuery.data)}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            submitLabel="Save Changes"
            onCancel={() => navigate("/campaigns")}
            isUpdate
          />
        )}
      </div>
    </div>
  );
}
