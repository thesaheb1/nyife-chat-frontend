import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Info,
  X,
  Image as ImageIcon,
  Film,
  FileText as FileIcon,
  CheckCircle2,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import WhatsAppPreview from "./WhatsAppPreview";
import type {
  TemplateComponent,
  TemplateCategory,
} from "@/types/template.types";

// ── Zod Schema ──────────────────────────────────────────────
const buttonSchema = z.object({
  type: z.enum(["URL", "PHONE_NUMBER", "QUICK_REPLY", "OTP", "FLOW"]),
  text: z.string().min(1, "Button text required"),
  url: z.string().optional(),
  phone_number: z.string().optional(),
  otp_type: z.enum(["COPY_CODE", "ONE_TAP", "ZERO_TAP"]).optional(),
  flow_id: z.string().optional(),
});

const componentSchema = z.object({
  type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS", "CAROUSEL"]),
  format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional(),
  text: z.string().optional(),
  add_security_recommendation: z.boolean().optional(),
  buttons: z.array(buttonSchema).optional(),
  header_handle: z.string().optional(),
});

export const templateFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(512)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, digits, and underscores"),
  category: z.enum(["MARKETING", "AUTHENTICATION", "UTILITY"]),
  language: z.string().min(1, "Language is required"),
  components: z.array(componentSchema).min(1, "At least one component required"),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

// ── Media preview state per component index ──────────────────
interface MediaPreviewState {
  objectUrl: string;   // blob URL for rendering
  mimeType: string;    // e.g. "image/jpeg"
  fileName: string;    // original filename
}

const LANGUAGES = [
  { value: "en_US", label: "English (US)" },
  { value: "en", label: "English (UK)" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
  { value: "es", label: "Spanish" },
  { value: "pt_BR", label: "Portuguese (BR)" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh_CN", label: "Chinese (Simplified)" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "ru", label: "Russian" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "vi", label: "Vietnamese" },
];

interface TemplateFormProps {
  defaultValues?: Partial<TemplateFormValues>;
  onSubmit: (values: TemplateFormValues, components: TemplateComponent[]) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  isUpdate?: boolean;
}

export default function TemplateForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Create Template",
  isUpdate = false,
}: TemplateFormProps) {
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  // Key: component field array index, Value: media preview state
  const [mediaPreviews, setMediaPreviews] = useState<Record<number, MediaPreviewState>>({});

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      category: "MARKETING",
      language: "en_US",
      components: [{ type: "BODY", text: "" }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const watchedComponents = form.watch("components");
  const watchedCategory = form.watch("category");
  const watchedName = form.watch("name");

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(mediaPreviews).forEach((m) => URL.revokeObjectURL(m.objectUrl));
    };
  }, []); // eslint-disable-line

  // ── Build TemplateComponent[] for the WhatsApp preview ──
  const buildPreviewComponents = (): TemplateComponent[] => {
    return watchedComponents.map((c) => ({
      type: c.type as TemplateComponent["type"],
      format: c.format as TemplateComponent["format"],
      text: c.text,
      add_security_recommendation: c.add_security_recommendation,
      buttons: c.buttons?.map((b) => ({
        type: b.type as TemplateButton["type"],
        text: b.text,
        url: b.url,
        phone_number: b.phone_number,
        otp_type: b.otp_type as TemplateButton["otp_type"],
        flow_id: b.flow_id,
      })),
    }));
  };

  // Find the HEADER component index (for media preview lookup)
  const headerIndex = watchedComponents.findIndex((c) => c.type === "HEADER");
  const headerMediaPreview = headerIndex >= 0 ? mediaPreviews[headerIndex] : undefined;

  // ── Extract {{n}} variables from body ──
  const bodyText = watchedComponents.find((c) => c.type === "BODY")?.text || "";
  const variables = [
    ...new Set([...bodyText.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1])),
  ];

  // ── Handle file selection for media header ──
  const handleMediaUpload = (componentIndex: number, format: string) => {
    const accept =
      format === "IMAGE"
        ? "image/jpeg,image/png,image/webp,image/gif"
        : format === "VIDEO"
          ? "video/mp4,video/3gpp"
          : "*/*";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Revoke previous blob URL if any
      if (mediaPreviews[componentIndex]) {
        URL.revokeObjectURL(mediaPreviews[componentIndex].objectUrl);
      }

      // Create a local blob URL for preview (instant, no upload needed)
      const objectUrl = URL.createObjectURL(file);

      setMediaPreviews((prev) => ({
        ...prev,
        [componentIndex]: {
          objectUrl,
          mimeType: file.type,
          fileName: file.name,
        },
      }));

      // Also set a placeholder handle so the form knows media is selected
      // In production this would be replaced by the real handle from the upload API
      form.setValue(
        `components.${componentIndex}.header_handle`,
        `LOCAL:${file.name}`
      );
    };
    input.click();
  };

  const clearMedia = (componentIndex: number) => {
    if (mediaPreviews[componentIndex]) {
      URL.revokeObjectURL(mediaPreviews[componentIndex].objectUrl);
    }
    setMediaPreviews((prev) => {
      const next = { ...prev };
      delete next[componentIndex];
      return next;
    });
    form.setValue(`components.${componentIndex}.header_handle`, "");
  };

  // ── Form submit ──
  const handleFormSubmit = async (values: TemplateFormValues) => {
    const components: TemplateComponent[] = values.components.map((c) => {
      const comp: TemplateComponent = { type: c.type as TemplateComponent["type"] };
      if (c.format) comp.format = c.format as TemplateComponent["format"];
      if (c.text) comp.text = c.text;
      if (c.add_security_recommendation) comp.add_security_recommendation = true;
      if (c.buttons && c.buttons.length > 0) {
        comp.buttons = c.buttons.map((b) => ({
          type: b.type as TemplateButton["type"],
          text: b.text,
          ...(b.url ? { url: b.url } : {}),
          ...(b.phone_number ? { phone_number: b.phone_number } : {}),
          ...(b.otp_type ? { otp_type: b.otp_type as TemplateButton["otp_type"] } : {}),
          ...(b.flow_id ? { flow_id: b.flow_id } : {}),
        }));
      }
      if (c.header_handle && !c.header_handle.startsWith("LOCAL:")) {
        comp.example = { header_handle: [c.header_handle] };
      }
      return comp;
    });
    await onSubmit(values, components);
  };

  const addComponent = (type: string) => {
    const defaults: Record<string, Partial<TemplateFormValues["components"][0]>> = {
      HEADER: { type: "HEADER", format: "TEXT", text: "" },
      FOOTER: { type: "FOOTER", text: "" },
      BUTTONS: { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "" }] },
    };
    append(defaults[type] || { type: type as "BODY", text: "" });
  };

  const existingTypes = new Set(watchedComponents.map((c) => c.type));
  const addableComponents = ["HEADER", "FOOTER", "BUTTONS"].filter(
    (t) => !existingTypes.has(t as "HEADER" | "FOOTER" | "BUTTONS")
  );

  const isOpen = (id: string) => openSections[id] !== false;
  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !isOpen(id) }));

  return (
    <form
      onSubmit={form.handleSubmit(handleFormSubmit)}
      className="flex gap-6 h-full"
    >
      {/* ── Left: Form ── */}
      <div className="flex-1 min-w-0 space-y-5 overflow-y-auto pr-1 pb-4">

        {/* Meta fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Name */}
          <div className="sm:col-span-3 space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g. welcome_offer_v2"
              disabled={isUpdate}
              className={form.formState.errors.name ? "border-destructive" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Lowercase letters, digits and underscores only. Cannot be changed after creation.
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v === "AUTHENTICATION") {
                      form.setValue("components", [
                        { type: "BODY", add_security_recommendation: true },
                        {
                          type: "BUTTONS",
                          buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: "Copy code" }],
                        },
                      ]);
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Language */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm font-medium">
              Language <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="language"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Components */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Components</h3>

          {fields.map((field, index) => {
            const comp = watchedComponents[index];
            const sectionOpen = isOpen(field.id);
            const mediaPreview = mediaPreviews[index];
            const isMediaFormat =
              comp.type === "HEADER" &&
              ["IMAGE", "VIDEO", "DOCUMENT"].includes(comp.format || "");

            return (
              <Collapsible
                key={field.id}
                open={sectionOpen}
                onOpenChange={() => toggleSection(field.id)}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Section header */}
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">
                        {comp.type.toLowerCase()}
                        {comp.format && (
                          <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                            ({comp.format})
                          </span>
                        )}
                      </span>
                      {comp.type === "BODY" && (
                        <span className="text-xs text-muted-foreground">(Required)</span>
                      )}
                      {/* Media uploaded badge */}
                      {mediaPreview && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Media ready
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {comp.type !== "BODY" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Revoke blob URL if removing a media header
                            if (mediaPreviews[index]) {
                              URL.revokeObjectURL(mediaPreviews[index].objectUrl);
                              setMediaPreviews((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }
                            remove(index);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {sectionOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 py-3 space-y-3">

                    {/* HEADER */}
                    {comp.type === "HEADER" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Header Format</Label>
                          <Controller
                            control={form.control}
                            name={`components.${index}.format`}
                            render={({ field: f }) => (
                              <Select
                                value={f.value || "TEXT"}
                                onValueChange={(v) => {
                                  f.onChange(v);
                                  // Clear media preview when format changes
                                  clearMedia(index);
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TEXT">Text</SelectItem>
                                  <SelectItem value="IMAGE">Image</SelectItem>
                                  <SelectItem value="VIDEO">Video</SelectItem>
                                  <SelectItem value="DOCUMENT">Document</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        {/* TEXT header input */}
                        {(!comp.format || comp.format === "TEXT") && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Header Text</Label>
                            <Input
                              {...form.register(`components.${index}.text`)}
                              placeholder="Header text..."
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        {/* MEDIA header upload */}
                        {isMediaFormat && (
                          <div className="space-y-2">
                            <Label className="text-xs">Media File</Label>

                            {/* Uploaded file preview chip */}
                            {mediaPreview ? (
                              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60">
                                {/* Tiny thumbnail */}
                                <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-slate-200 flex items-center justify-center">
                                  {mediaPreview.mimeType.startsWith("image/") ? (
                                    <img
                                      src={mediaPreview.objectUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : mediaPreview.mimeType.startsWith("video/") ? (
                                    <Film className="w-5 h-5 text-slate-500" />
                                  ) : (
                                    <FileIcon className="w-5 h-5 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-emerald-800 truncate">
                                    {mediaPreview.fileName}
                                  </p>
                                  <p className="text-[10px] text-emerald-600 uppercase mt-0.5">
                                    {mediaPreview.mimeType.split("/")[1]}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-slate-400 hover:text-destructive"
                                  onClick={() => clearMedia(index)}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs shrink-0 gap-1"
                                  onClick={() => handleMediaUpload(index, comp.format || "")}
                                >
                                  <Upload className="w-3 h-3" />
                                  Change
                                </Button>
                              </div>
                            ) : (
                              /* Upload drop zone */
                              <button
                                type="button"
                                onClick={() => handleMediaUpload(index, comp.format || "")}
                                className="w-full border-2 border-dashed border-border rounded-lg py-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 group"
                              >
                                <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                  {comp.format === "IMAGE" && (
                                    <ImageIcon className="w-5 h-5" />
                                  )}
                                  {comp.format === "VIDEO" && (
                                    <Film className="w-5 h-5" />
                                  )}
                                  {comp.format === "DOCUMENT" && (
                                    <FileIcon className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-medium">
                                    Click to upload{" "}
                                    {comp.format === "IMAGE"
                                      ? "image"
                                      : comp.format === "VIDEO"
                                        ? "video"
                                        : "document"}
                                  </p>
                                  <p className="text-[10px] mt-0.5 opacity-70">
                                    {comp.format === "IMAGE"
                                      ? "JPG, PNG, WEBP up to 5MB"
                                      : comp.format === "VIDEO"
                                        ? "MP4, 3GP up to 16MB"
                                        : "PDF, DOC up to 100MB"}
                                  </p>
                                </div>
                              </button>
                            )}

                            {/* Manual handle input */}
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">
                                Or paste existing Media Handle
                              </Label>
                              <Input
                                {...form.register(`components.${index}.header_handle`)}
                                placeholder="4::aW1hZ2U6...  (from Meta upload)"
                                className="h-7 text-xs font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* BODY */}
                    {comp.type === "BODY" && (
                      <>
                        {watchedCategory === "AUTHENTICATION" ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Security Recommendation</Label>
                              <Controller
                                control={form.control}
                                name={`components.${index}.add_security_recommendation`}
                                render={({ field: f }) => (
                                  <Switch checked={!!f.value} onCheckedChange={f.onChange} />
                                )}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Appends "For your security, do not share this code."
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-xs">Body Text</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[200px]">
                                    Use {"{{"} 1 {"}}"}, {"{{"} 2 {"}}"} for dynamic variables
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Textarea
                              {...form.register(`components.${index}.text`)}
                              placeholder="Hello {{1}}, your order {{2}} is ready. Tap below to track."
                              rows={4}
                              className="text-sm resize-none"
                            />
                            {form.formState.errors.components?.[index]?.text && (
                              <p className="text-xs text-destructive">
                                {form.formState.errors.components[index].text?.message}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* FOOTER */}
                    {comp.type === "FOOTER" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Footer Text</Label>
                        <Input
                          {...form.register(`components.${index}.text`)}
                          placeholder="e.g. Reply STOP to unsubscribe"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}

                    {/* BUTTONS */}
                    {comp.type === "BUTTONS" && (
                      <ButtonsEditor
                        nestIndex={index}
                        form={form}
                        category={watchedCategory}
                      />
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* Add Component buttons */}
          {addableComponents.length > 0 && watchedCategory !== "AUTHENTICATION" && (
            <div className="flex flex-wrap gap-2 pt-1">
              {addableComponents.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 border-dashed"
                  onClick={() => addComponent(type)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add {type.charAt(0) + type.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Preview Variables */}
        {variables.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold">Preview Variables</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Fill sample values to see how your template looks
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label className="text-xs">{`{{${v}}}`}</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder={`Sample for {{${v}}}`}
                      value={previewVars[v] || ""}
                      onChange={(e) =>
                        setPreviewVars((prev) => ({ ...prev, [v]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isUpdate ? "Updating..." : "Creating..."}
              </span>
            ) : submitLabel}
          </Button>
        </div>
      </div>

      {/* ── Right: Live WhatsApp Preview ── */}
      <div className="w-[310px] shrink-0 hidden lg:block">
        <div className="sticky top-0 pt-1">
          <WhatsAppPreview
            name={watchedName || "Business"}
            components={buildPreviewComponents()}
            variables={previewVars}
            mediaPreviewUrl={headerMediaPreview?.objectUrl}
            mediaType={headerMediaPreview?.mimeType}
            mediaFileName={headerMediaPreview?.fileName}
            showThemeToggle={true}
          />
        </div>
      </div>
    </form>
  );
}

// ── Buttons Sub-Editor ────────────────────────────────────────
import type { UseFormReturn } from "react-hook-form";
import type { TemplateButton } from "@/types/template.types";

interface ButtonsEditorProps {
  nestIndex: number;
  form: UseFormReturn<TemplateFormValues>;
  category: TemplateCategory;
}

function ButtonsEditor({ nestIndex, form, category }: ButtonsEditorProps) {
  const buttons = form.watch(`components.${nestIndex}.buttons`) || [];

  const addButton = () => {
    const current = form.getValues(`components.${nestIndex}.buttons`) || [];
    if (current.length >= 3) return;
    form.setValue(`components.${nestIndex}.buttons`, [
      ...current,
      { type: "QUICK_REPLY", text: "" },
    ]);
  };

  const removeButton = (i: number) => {
    const current = form.getValues(`components.${nestIndex}.buttons`) || [];
    form.setValue(
      `components.${nestIndex}.buttons`,
      current.filter((_, idx) => idx !== i)
    );
  };

  const updateButton = (i: number, field: string, value: string) => {
    const current = [
      ...(form.getValues(`components.${nestIndex}.buttons`) || []),
    ];
    (current[i] as Record<string, string>)[field] = value;
    form.setValue(`components.${nestIndex}.buttons`, current);
  };

  return (
    <div className="space-y-3">
      {buttons.map((btn, i) => (
        <div
          key={i}
          className="border border-border rounded-lg p-3 space-y-2.5 bg-muted/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Button {i + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive hover:bg-destructive/10"
              onClick={() => removeButton(i)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={btn.type}
                onValueChange={(v) => updateButton(i, "type", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {category !== "AUTHENTICATION" ? (
                    <>
                      <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                      <SelectItem value="URL">URL</SelectItem>
                      <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                      <SelectItem value="FLOW">Flow</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="OTP">OTP</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Button Text</Label>
              <Input
                value={btn.text}
                onChange={(e) => updateButton(i, "text", e.target.value)}
                placeholder="Label"
                className="h-7 text-xs"
              />
            </div>
          </div>

          {btn.type === "URL" && (
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input
                value={btn.url || ""}
                onChange={(e) => updateButton(i, "url", e.target.value)}
                placeholder="https://example.com"
                className="h-7 text-xs"
              />
            </div>
          )}
          {btn.type === "PHONE_NUMBER" && (
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={btn.phone_number || ""}
                onChange={(e) => updateButton(i, "phone_number", e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="h-7 text-xs"
              />
            </div>
          )}
          {btn.type === "OTP" && (
            <div className="space-y-1">
              <Label className="text-xs">OTP Type</Label>
              <Select
                value={btn.otp_type || "COPY_CODE"}
                onValueChange={(v) => updateButton(i, "otp_type", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COPY_CODE">Copy Code</SelectItem>
                  <SelectItem value="ONE_TAP">One Tap</SelectItem>
                  <SelectItem value="ZERO_TAP">Zero Tap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {btn.type === "FLOW" && (
            <div className="space-y-1">
              <Label className="text-xs">Flow ID</Label>
              <Input
                value={btn.flow_id || ""}
                onChange={(e) => updateButton(i, "flow_id", e.target.value)}
                placeholder="Meta Flow ID"
                className="h-7 text-xs"
              />
            </div>
          )}
        </div>
      ))}

      {buttons.length < 3 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 w-full border-dashed"
          onClick={addButton}
        >
          <Plus className="w-3 h-3" />
          Add Button
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-1">
          Maximum 3 buttons
        </p>
      )}
    </div>
  );
}
