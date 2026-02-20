import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Plus,
  Upload,
  Info,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lightbulb,
  Sparkles,
  Image as ImageIcon,
  Film,
  FileText as FileIcon,
  Type,
  Link2,
  Phone,
  MessageCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  RotateCcw,
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import WhatsAppPreview from "./WhatsAppPreview";
import TemplateTypeSelector, {
  TEMPLATE_TYPES,
  type TemplateTypeId,
} from "./TemplateTypeSelector";
import type { TemplateComponent, TemplateCategory } from "@/types/template.types";
import type { UseFormReturn } from "react-hook-form";
import type { TemplateButton } from "@/types/template.types";

// ─────────────────────────────────────────────────────────────
// ZOD SCHEMA
// ─────────────────────────────────────────────────────────────
const MAX_BODY = 1024;
const MAX_HEADER_TEXT = 60;
const MAX_FOOTER = 60;
const MAX_BUTTON_TEXT = 25;
const MAX_URL_BUTTON_TEXT = 25;

const buttonSchema = z
  .object({
    type: z.enum(["URL", "PHONE_NUMBER", "QUICK_REPLY", "OTP", "FLOW"]),
    text: z
      .string()
      .min(1, "Button label is required")
      .max(MAX_BUTTON_TEXT, `Max ${MAX_BUTTON_TEXT} characters`),
    url: z.string().optional(),
    phone_number: z.string().optional(),
    otp_type: z.enum(["COPY_CODE", "ONE_TAP", "ZERO_TAP"]).optional(),
    flow_id: z.string().optional(),
  })
  .superRefine((btn, ctx) => {
    if (btn.type === "URL") {
      if (!btn.url || btn.url.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["url"], message: "URL is required for URL buttons" });
      } else {
        try {
          new URL(btn.url);
        } catch {
          ctx.addIssue({ code: "custom", path: ["url"], message: "Must be a valid URL (e.g. https://example.com)" });
        }
      }
    }
    if (btn.type === "PHONE_NUMBER") {
      if (!btn.phone_number || btn.phone_number.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["phone_number"], message: "Phone number is required" });
      } else if (!/^\+[1-9]\d{6,14}$/.test(btn.phone_number.replace(/\s/g, ""))) {
        ctx.addIssue({ code: "custom", path: ["phone_number"], message: "Use international format: +91XXXXXXXXXX" });
      }
    }
    if (btn.type === "FLOW") {
      if (!btn.flow_id || btn.flow_id.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["flow_id"], message: "Flow ID is required — get this from your Flows section" });
      }
    }
  });

const componentSchema = z.object({
  type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS", "CAROUSEL"]),
  format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional(),
  text: z.string().optional(),
  add_security_recommendation: z.boolean().optional(),
  buttons: z.array(buttonSchema).optional(),
  header_handle: z.string().optional(),
  // carousel cards stored as JSON string for simplicity
  carousel_cards_json: z.string().optional(),
});

export const templateFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Template name is required")
      .max(512, "Max 512 characters")
      .regex(
        /^[a-z0-9_]+$/,
        'Only lowercase letters (a-z), numbers (0-9), and underscores (_). Example: "order_update_v1"'
      ),
    category: z.enum(["MARKETING", "AUTHENTICATION", "UTILITY"]),
    language: z.string().min(1, "Please select a language"),
    components: z.array(componentSchema).min(1, "At least one component is required"),
  })
  .superRefine((data, ctx) => {
    const body = data.components.find((c) => c.type === "BODY");
    const header = data.components.find((c) => c.type === "HEADER");

    // Body is required unless authentication
    if (data.category !== "AUTHENTICATION") {
      if (!body || !body.text || body.text.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["components"],
          message: "Body text is required — this is the main content of your message",
        });
      } else if (body.text.length > MAX_BODY) {
        ctx.addIssue({
          code: "custom",
          path: ["components"],
          message: `Body text is too long (${body.text.length}/${MAX_BODY} characters)`,
        });
      }
    }

    // Header text length
    if (header?.format === "TEXT" && header.text && header.text.length > MAX_HEADER_TEXT) {
      ctx.addIssue({
        code: "custom",
        path: ["components"],
        message: `Header text is too long (max ${MAX_HEADER_TEXT} characters)`,
      });
    }

    // Validate variable sequence is consecutive starting at 1
    if (body?.text) {
      const vars = [...body.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
      const unique = [...new Set(vars)].sort((a, b) => a - b);
      for (let i = 0; i < unique.length; i++) {
        if (unique[i] !== i + 1) {
          ctx.addIssue({
            code: "custom",
            path: ["components"],
            message: `Variables must start at {{1}} and go in order. Found {{${unique[i]}}} but expected {{${i + 1}}}`,
          });
          break;
        }
      }
    }
  });

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

// ─────────────────────────────────────────────────────────────
// MEDIA PREVIEW STATE
// ─────────────────────────────────────────────────────────────
interface MediaState {
  objectUrl: string;
  mimeType: string;
  fileName: string;
}

// ─────────────────────────────────────────────────────────────
// LANGUAGES
// ─────────────────────────────────────────────────────────────
const LANGUAGES = [
  { value: "en_US", label: "🇺🇸 English (US)" },
  { value: "en", label: "🇬🇧 English (UK)" },
  { value: "hi", label: "🇮🇳 Hindi" },
  { value: "ar", label: "🇸🇦 Arabic" },
  { value: "es", label: "🇪🇸 Spanish" },
  { value: "pt_BR", label: "🇧🇷 Portuguese (Brazil)" },
  { value: "fr", label: "🇫🇷 French" },
  { value: "de", label: "🇩🇪 German" },
  { value: "it", label: "🇮🇹 Italian" },
  { value: "ja", label: "🇯🇵 Japanese" },
  { value: "ko", label: "🇰🇷 Korean" },
  { value: "zh_CN", label: "🇨🇳 Chinese (Simplified)" },
  { value: "id", label: "🇮🇩 Indonesian" },
  { value: "ms", label: "🇲🇾 Malay" },
  { value: "nl", label: "🇳🇱 Dutch" },
  { value: "pl", label: "🇵🇱 Polish" },
  { value: "ru", label: "🇷🇺 Russian" },
  { value: "th", label: "🇹🇭 Thai" },
  { value: "tr", label: "🇹🇷 Turkish" },
  { value: "vi", label: "🇻🇳 Vietnamese" },
];

// ─────────────────────────────────────────────────────────────
// SAMPLE CONTENT per template type
// ─────────────────────────────────────────────────────────────
const SAMPLES: Record<TemplateTypeId, Partial<TemplateFormValues>> = {
  standard: {
    name: "order_shipped_notification",
    category: "MARKETING",
    language: "en_US",
    components: [
      { type: "HEADER", format: "TEXT", text: "Your Order Shipped!" },
      {
        type: "BODY",
        text: "Hi {{1}}, great news! Your order #{{2}} has been shipped and is on its way.\n\nExpected delivery: {{3}}\n\nThank you for shopping with us! 🎉",
      },
      { type: "FOOTER", text: "Reply STOP to opt out" },
      {
        type: "BUTTONS",
        buttons: [
          { type: "URL", text: "Track Order", url: "https://example.com/track/{{1}}" },
          { type: "QUICK_REPLY", text: "Need Help?" },
        ],
      },
    ],
  },
  authentication: {
    name: "otp_login_verification",
    category: "AUTHENTICATION",
    language: "en_US",
    components: [
      { type: "BODY", add_security_recommendation: true },
      {
        type: "BUTTONS",
        buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: "Copy Code" }],
      },
    ],
  },
  carousel: {
    name: "product_catalog_showcase",
    category: "MARKETING",
    language: "en_US",
    components: [
      { type: "BODY", text: "Check out our latest collection! Swipe to explore." },
      {
        type: "CAROUSEL",
        carousel_cards_json: JSON.stringify([
          {
            components: [
              { type: "HEADER", format: "IMAGE" },
              { type: "BODY", text: "Premium Sneakers\nOnly ₹2,999" },
              { type: "BUTTONS", buttons: [{ type: "URL", text: "Shop Now", url: "https://example.com/p1" }] },
            ],
          },
          {
            components: [
              { type: "HEADER", format: "IMAGE" },
              { type: "BODY", text: "Leather Handbag\nOnly ₹4,499" },
              { type: "BUTTONS", buttons: [{ type: "URL", text: "Shop Now", url: "https://example.com/p2" }] },
            ],
          },
        ]),
      },
    ],
  },
  flow: {
    name: "lead_capture_form",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}! We'd love to learn more about you. Please tap below to fill out a quick form — it only takes 2 minutes!",
      },
      {
        type: "BUTTONS",
        buttons: [{ type: "FLOW", text: "Fill Out Form", flow_id: "" }],
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────
function CharCount({
  value,
  max,
  className = "",
}: {
  value: string;
  max: number;
  className?: string;
}) {
  const len = value?.length || 0;
  const pct = len / max;
  return (
    <span
      className={`text-[10px] font-mono tabular-nums ${pct >= 1
        ? "text-destructive"
        : pct >= 0.85
          ? "text-amber-500"
          : "text-muted-foreground"
        } ${className}`}
    >
      {len}/{max}
    </span>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5 mt-1">
      <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
      {children}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[11px] text-destructive flex items-start gap-1.5 mt-1 font-medium">
      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
      {message}
    </p>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  required,
  optional,
  children,
  className = "",
  defaultOpen = true,
  canRemove,
  onRemove,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`border border-border rounded-xl overflow-hidden ${className}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors select-none">
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{title}</span>
                  {required && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-600 bg-blue-50">
                      Required
                    </Badge>
                  )}
                  {optional && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                      Optional
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canRemove && onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
              {open ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT PROPS
// ─────────────────────────────────────────────────────────────
interface TemplateFormProps {
  defaultValues?: Partial<TemplateFormValues>;
  defaultTypeId?: TemplateTypeId;
  onSubmit: (values: TemplateFormValues, components: TemplateComponent[]) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  isUpdate?: boolean;
  onCancel?: () => void;
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function TemplateForm({
  defaultValues,
  defaultTypeId,
  onSubmit,
  isLoading,
  submitLabel = "Create Template",
  isUpdate = false,
  onCancel,
}: TemplateFormProps) {
  // Wizard phase: type selection → configure
  const [selectedType, setSelectedType] = useState<TemplateTypeId | null>(
    defaultTypeId ?? null
  );
  const [phase, setPhase] = useState<"select" | "configure">(
    defaultTypeId ? "configure" : "select"
  );
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [mediaPreviews, setMediaPreviews] = useState<Record<number, MediaState>>({});
  const configRef = useRef<HTMLDivElement>(null);

  const typeInfo = TEMPLATE_TYPES.find((t) => t.id === selectedType);

  // Build defaultValues when type selected
  const buildDefaults = (typeId: TemplateTypeId): TemplateFormValues => {
    const sample = SAMPLES[typeId];
    return {
      name: "",
      category: sample.category ?? "MARKETING",
      language: "en_US",
      components: sample.components as TemplateFormValues["components"] ?? [{ type: "BODY", text: "" }],
      ...(defaultValues ?? {}),
    };
  };

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: selectedType
      ? buildDefaults(selectedType)
      : {
        name: "",
        category: "MARKETING",
        language: "en_US",
        components: [{ type: "BODY", text: "" }],
        ...defaultValues,
      },
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const watchedComponents = form.watch("components");
  const watchedCategory = form.watch("category");
  const watchedName = form.watch("name");
  const watchedLanguage = form.watch("language");

  // When a type is confirmed, reset form to sample defaults
  const handleTypeConfirm = () => {
    if (!selectedType) return;
    const defaults = buildDefaults(selectedType);
    form.reset(defaults);
    setMediaPreviews({});
    setPhase("configure");
    setTimeout(() => configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  // Fill sample content
  const fillSampleContent = () => {
    if (!selectedType) return;
    const sample = SAMPLES[selectedType];
    if (sample.name) form.setValue("name", sample.name);
    if (sample.components) {
      replace(sample.components as TemplateFormValues["components"]);
    }
  };

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      Object.values(mediaPreviews).forEach((m) => URL.revokeObjectURL(m.objectUrl));
    };
  }, []); // eslint-disable-line

  // Build preview components
  const buildPreviewComponents = (): TemplateComponent[] => {
    return watchedComponents.map((c) => {
      const comp: TemplateComponent = { type: c.type as TemplateComponent["type"] };
      if (c.format) comp.format = c.format as TemplateComponent["format"];
      if (c.text) comp.text = c.text;
      if (c.add_security_recommendation) comp.add_security_recommendation = true;
      if (c.buttons) {
        comp.buttons = c.buttons.map((b) => ({
          type: b.type as TemplateButton["type"],
          text: b.text,
          url: b.url,
          phone_number: b.phone_number,
          otp_type: b.otp_type as TemplateButton["otp_type"],
          flow_id: b.flow_id,
        }));
      }
      if (c.carousel_cards_json) {
        try { comp.cards = JSON.parse(c.carousel_cards_json); } catch { }
      }
      return comp;
    });
  };

  // Media upload
  const handleMediaUpload = (componentIndex: number, format: string) => {
    const accept =
      format === "IMAGE" ? "image/jpeg,image/png,image/webp" :
        format === "VIDEO" ? "video/mp4,video/3gpp" : "*/*";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (mediaPreviews[componentIndex]) URL.revokeObjectURL(mediaPreviews[componentIndex].objectUrl);
      const objectUrl = URL.createObjectURL(file);
      setMediaPreviews((prev) => ({ ...prev, [componentIndex]: { objectUrl, mimeType: file.type, fileName: file.name } }));
      form.setValue(`components.${componentIndex}.header_handle`, `LOCAL:${file.name}`);
    };
    input.click();
  };

  const clearMedia = (i: number) => {
    if (mediaPreviews[i]) URL.revokeObjectURL(mediaPreviews[i].objectUrl);
    setMediaPreviews((prev) => { const n = { ...prev }; delete n[i]; return n; });
    form.setValue(`components.${i}.header_handle`, "");
  };

  // Body variables
  const bodyText = watchedComponents.find((c) => c.type === "BODY")?.text || "";
  const variables = [...new Set([...bodyText.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]))];

  // Header media
  const headerIndex = watchedComponents.findIndex((c) => c.type === "HEADER");
  const headerMedia = headerIndex >= 0 ? mediaPreviews[headerIndex] : undefined;

  // Existing component types
  const existingTypes = new Set(watchedComponents.map((c) => c.type));

  // Global form errors (from superRefine)
  const globalErrors = form.formState.errors.components;

  // Submit handler
  const handleFormSubmit = async (values: TemplateFormValues) => {
    const components: TemplateComponent[] = values.components.map((c) => {
      const comp: TemplateComponent = { type: c.type as TemplateComponent["type"] };
      if (c.format) comp.format = c.format as TemplateComponent["format"];
      if (c.text) comp.text = c.text;
      if (c.add_security_recommendation) comp.add_security_recommendation = true;
      if (c.buttons?.length) {
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
      if (c.carousel_cards_json) {
        try { comp.cards = JSON.parse(c.carousel_cards_json); } catch { }
      }
      return comp;
    });
    await onSubmit(values, components);
  };

  // ─────────────────────────────────────────────────────────
  // RENDER: PHASE 1 — TYPE SELECTION
  // ─────────────────────────────────────────────────────────
  if (phase === "select" && !isUpdate) {
    return (
      <div className="flex flex-col items-center py-6 px-2">
        <TemplateTypeSelector
          selected={selectedType}
          onSelect={setSelectedType}
        />
        {selectedType && (
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleTypeConfirm}
              className="gap-2 min-w-[200px]"
            >
              Continue with {typeInfo?.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: PHASE 2 — CONFIGURE
  // ─────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={300}>
      <div ref={configRef} className="w-full">
        {/* Type info banner (create mode only) */}
        {typeInfo && !isUpdate && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${typeInfo.bgLight} border-current`}
            style={{ borderColor: "transparent" }}
          >
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center flex-shrink-0`}
            >
              <typeInfo.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold">{typeInfo.label} Template</span>
                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${typeInfo.complexityColor}`}>
                  {typeInfo.complexity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {typeInfo.tagline} — {typeInfo.description.slice(0, 100)}…
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={fillSampleContent}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill example
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setPhase("select")}
              >
                <RotateCcw className="w-3 h-3" />
                Change type
              </Button>
            </div>
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex gap-6"
        >
          {/* ── LEFT: Form ── */}
          <div className="flex-1 min-w-0 space-y-5 pb-10">

            {/* ── Section 1: Basic Info ── */}
            <SectionCard
              title="Basic Information"
              subtitle="Name, category and language of your template"
              icon={<Type className="w-3.5 h-3.5 text-blue-500" />}
              required
            >
              {/* Template Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tpl-name" className="text-sm font-medium">
                    Template Name
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[240px] text-xs leading-relaxed">
                      This is a unique internal identifier, not visible to customers. Use snake_case like <code>order_update_v2</code>.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="tpl-name"
                    {...form.register("name")}
                    placeholder="e.g. order_shipped_notification"
                    disabled={isUpdate}
                    className={`pr-20 font-mono text-sm ${form.formState.errors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                      }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {watchedName && !form.formState.errors.name && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <CharCount value={watchedName} max={512} />
                  </div>
                </div>
                <FieldError message={form.formState.errors.name?.message} />
                <FieldHint>
                  Only lowercase letters, numbers and underscores.{" "}
                  <strong>Cannot be changed</strong> after creation. Good examples:{" "}
                  <code className="bg-muted px-1 rounded text-[10px]">welcome_offer_v2</code>,{" "}
                  <code className="bg-muted px-1 rounded text-[10px]">otp_login_2024</code>
                </FieldHint>
                {isUpdate && (
                  <Alert className="py-2 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs">
                      Template name cannot be changed after creation. You are updating the content only.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Category + Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-medium">Category</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                        <p><strong>Marketing</strong> — promotions, offers, announcements (requires opt-in)</p>
                        <p className="mt-1"><strong>Utility</strong> — transactional updates (orders, shipping)</p>
                        <p className="mt-1"><strong>Authentication</strong> — OTP codes only</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isUpdate && watchedCategory === "AUTHENTICATION"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKETING">📣 Marketing</SelectItem>
                          <SelectItem value="UTILITY">🔧 Utility</SelectItem>
                          <SelectItem value="AUTHENTICATION">🔐 Authentication</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldHint>
                    Affects approval time. Utility templates get approved faster.
                  </FieldHint>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Language</Label>
                  <Controller
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isUpdate}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldHint>
                    Must match the language your body text is written in.
                  </FieldHint>
                </div>
              </div>
            </SectionCard>

            {/* Global validation errors */}
            {globalErrors?.message && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {globalErrors.message}
                </AlertDescription>
              </Alert>
            )}

            {/* ── Section 2: Components (varies by type) ── */}
            {watchedCategory === "AUTHENTICATION" ? (
              <AuthenticationSection form={form} />
            ) : selectedType === "carousel" ? (
              <CarouselSection form={form} />
            ) : (
              <StandardSections
                form={form}
                fields={fields}
                append={append}
                remove={remove}
                existingTypes={existingTypes}
                mediaPreviews={mediaPreviews}
                handleMediaUpload={handleMediaUpload}
                clearMedia={clearMedia}
                selectedType={selectedType}
              />
            )}

            {/* ── Section 3: Preview Variables ── */}
            {variables.length > 0 && (
              <SectionCard
                title="Preview Variables"
                subtitle="Fill in sample values so the live preview looks realistic"
                icon={<Eye className="w-3.5 h-3.5 text-purple-500" />}
                optional
                defaultOpen
              >
                <Alert className="py-2 mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <AlertDescription className="text-xs">
                    These values are <strong>only for preview</strong>. Your actual messages will use real customer data from your system.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-3">
                  {variables.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-xs font-mono">{`{{${v}}}`}</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder={`Sample for {{${v}}} (e.g. John)`}
                        value={previewVars[v] || ""}
                        onChange={(e) =>
                          setPreviewVars((p) => ({ ...p, [v]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Submit ── */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {Object.keys(form.formState.errors).length > 0 ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Please fix the errors above before submitting
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Template looks good — ready to submit for Meta review
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[160px] gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {isUpdate ? "Saving…" : "Creating…"}
                    </>
                  ) : (
                    <>
                      {submitLabel}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Live Preview ── */}
          <div className="w-[310px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-0 pt-1">
              <WhatsAppPreview
                name={watchedName || typeInfo?.label || "Business"}
                components={buildPreviewComponents()}
                variables={previewVars}
                mediaPreviewUrl={headerMedia?.objectUrl}
                mediaType={headerMedia?.mimeType}
                mediaFileName={headerMedia?.fileName}
                showThemeToggle
              />
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION SECTION
// ─────────────────────────────────────────────────────────────
function AuthenticationSection({ form }: { form: UseFormReturn<TemplateFormValues> }) {
  const bodyIndex = form.watch("components").findIndex((c) => c.type === "BODY");
  const btnIndex = form.watch("components").findIndex((c) => c.type === "BUTTONS");
  const buttons = form.watch(`components.${btnIndex}.buttons`) || [];
  const otp = buttons[0];

  return (
    <div className="space-y-4">
      <Alert className="border-emerald-200 bg-emerald-50 py-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-xs text-emerald-800">
          <strong>Authentication templates are pre-configured by WhatsApp.</strong> The OTP code (e.g. "123456") will be injected automatically when you send the message via API. You don't write the code here.
        </AlertDescription>
      </Alert>

      {/* Security recommendation */}
      <SectionCard
        title="Security Recommendation"
        subtitle='Adds "For your security, do not share this code." to the message'
        icon={<MessageCircle className="w-3.5 h-3.5 text-emerald-500" />}
        required
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium">Include security warning</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              WhatsApp strongly recommends enabling this. It adds a visible lock icon and "Do not share" text below your OTP. This is shown to the customer and helps prevent phishing.
            </p>
          </div>
          <Controller
            control={form.control}
            name={`components.${bodyIndex}.add_security_recommendation`}
            render={({ field }) => (
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </SectionCard>

      {/* OTP Button type */}
      <SectionCard
        title="OTP Button"
        subtitle="How should the customer copy or use the code?"
        icon={<Zap className="w-3.5 h-3.5 text-emerald-500" />}
        required
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: "COPY_CODE",
                label: "Copy Code",
                desc: "Customer taps a button to copy the OTP to clipboard",
                emoji: "📋",
              },
              {
                value: "ONE_TAP",
                label: "One Tap",
                desc: "Customer confirms with one tap — auto-fills the OTP",
                emoji: "👆",
              },
              {
                value: "ZERO_TAP",
                label: "Zero Tap",
                desc: "Fully automatic — OTP filled without any tap needed",
                emoji: "⚡",
              },
            ].map((opt) => {
              const isSelected = otp?.otp_type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (btnIndex >= 0) {
                      form.setValue(`components.${btnIndex}.buttons.0.otp_type`, opt.value as "COPY_CODE" | "ONE_TAP" | "ZERO_TAP");
                    }
                  }}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-border hover:border-emerald-300"
                    }`}
                >
                  <div className="text-xl mb-1.5">{opt.emoji}</div>
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</div>
                </button>
              );
            })}
          </div>
          <FieldHint>
            <strong>Copy Code</strong> works for all devices. One Tap and Zero Tap require the WhatsApp Business API to include the app signature hash.
          </FieldHint>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CAROUSEL SECTION
// ─────────────────────────────────────────────────────────────
function CarouselSection({ form }: { form: UseFormReturn<TemplateFormValues> }) {
  const bodyIndex = form.watch("components").findIndex((c) => c.type === "BODY");
  const carouselIndex = form.watch("components").findIndex((c) => c.type === "CAROUSEL");
  const bodyText = form.watch(`components.${bodyIndex}.text`) || "";

  const [cards, setCards] = useState<Array<{
    bodyText: string;
    buttonText: string;
    buttonUrl: string;
  }>>(() => {
    try {
      const raw = form.watch(`components.${carouselIndex}.carousel_cards_json`);
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed.length > 0
        ? parsed.map((c: any) => ({
          bodyText: c.components?.find((x: any) => x.type === "BODY")?.text || "",
          buttonText: c.components?.find((x: any) => x.type === "BUTTONS")?.buttons?.[0]?.text || "",
          buttonUrl: c.components?.find((x: any) => x.type === "BUTTONS")?.buttons?.[0]?.url || "",
        }))
        : [{ bodyText: "", buttonText: "", buttonUrl: "" }];
    } catch {
      return [{ bodyText: "", buttonText: "", buttonUrl: "" }];
    }
  });

  const syncCards = useCallback(
    (updatedCards: typeof cards) => {
      const json = JSON.stringify(
        updatedCards.map((c) => ({
          components: [
            { type: "HEADER", format: "IMAGE" },
            { type: "BODY", text: c.bodyText },
            {
              type: "BUTTONS",
              buttons: [{ type: "URL", text: c.buttonText, url: c.buttonUrl }],
            },
          ],
        }))
      );
      if (carouselIndex >= 0) {
        form.setValue(`components.${carouselIndex}.carousel_cards_json`, json);
      }
    },
    [carouselIndex, form]
  );

  const updateCard = (i: number, field: string, value: string) => {
    const next = cards.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    setCards(next);
    syncCards(next);
  };

  const addCard = () => {
    if (cards.length >= 10) return;
    const next = [...cards, { bodyText: "", buttonText: "", buttonUrl: "" }];
    setCards(next);
    syncCards(next);
  };

  const removeCard = (i: number) => {
    if (cards.length <= 1) return;
    const next = cards.filter((_, idx) => idx !== i);
    setCards(next);
    syncCards(next);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-violet-200 bg-violet-50 py-3">
        <Lightbulb className="h-4 w-4 text-violet-600" />
        <AlertDescription className="text-xs text-violet-800">
          Carousel templates show horizontal scrollable cards inside WhatsApp. Add 2–10 cards. Each card needs an image, description, and a button.
        </AlertDescription>
      </Alert>

      {/* Intro body */}
      <SectionCard
        title="Intro Message"
        subtitle="Short text shown above the cards to introduce the carousel"
        icon={<MessageCircle className="w-3.5 h-3.5 text-violet-500" />}
        required
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Intro Text</Label>
            <CharCount value={bodyText} max={1024} />
          </div>
          <Textarea
            {...form.register(`components.${bodyIndex}.text`)}
            placeholder='e.g. "👀 Check out our latest collection! Swipe to explore."'
            rows={3}
            className="resize-none text-sm"
          />
          <FieldHint>Keep it short and enticing. This appears above the swipeable cards.</FieldHint>
        </div>
      </SectionCard>

      {/* Cards */}
      <SectionCard
        title={`Carousel Cards (${cards.length}/10)`}
        subtitle="Each card has an image, text and one action button"
        icon={<LayoutGridIcon />}
        required
      >
        <div className="space-y-4">
          {cards.map((card, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground">
                  Card {i + 1}
                </span>
                {cards.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCard(i)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="p-3 space-y-3">
                {/* Image placeholder note */}
                <div className="h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-400">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs">Image uploaded via Media Handle</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Card Text</Label>
                  <Textarea
                    value={card.bodyText}
                    onChange={(e) => updateCard(i, "bodyText", e.target.value)}
                    placeholder="e.g. Premium Sneakers — Only ₹2,999 🔥"
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Button Label</Label>
                    <Input
                      value={card.buttonText}
                      onChange={(e) => updateCard(i, "buttonText", e.target.value)}
                      placeholder="e.g. Shop Now"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Button URL</Label>
                    <Input
                      value={card.buttonUrl}
                      onChange={(e) => updateCard(i, "buttonUrl", e.target.value)}
                      placeholder="https://..."
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {cards.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs gap-1.5 border-dashed"
              onClick={addCard}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Card ({cards.length}/10)
            </Button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// tiny icon for carousel
function LayoutGridIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// STANDARD SECTIONS (Header / Body / Footer / Buttons)
// ─────────────────────────────────────────────────────────────
interface StandardSectionsProps {
  form: UseFormReturn<TemplateFormValues>;
  fields: ReturnType<typeof useFieldArray<TemplateFormValues, "components">>["fields"];
  append: ReturnType<typeof useFieldArray<TemplateFormValues, "components">>["append"];
  remove: ReturnType<typeof useFieldArray<TemplateFormValues, "components">>["remove"];
  existingTypes: Set<string>;
  mediaPreviews: Record<number, MediaState>;
  handleMediaUpload: (i: number, format: string) => void;
  clearMedia: (i: number) => void;
  selectedType: TemplateTypeId | null;
}

function StandardSections({
  form,
  fields,
  append,
  remove,
  existingTypes,
  mediaPreviews,
  handleMediaUpload,
  clearMedia,
  selectedType,
}: StandardSectionsProps) {
  const watchedComponents = form.watch("components");
  const watchedCategory = form.watch("category");

  const headerIdx = watchedComponents.findIndex((c) => c.type === "HEADER");
  const bodyIdx = watchedComponents.findIndex((c) => c.type === "BODY");
  const footerIdx = watchedComponents.findIndex((c) => c.type === "FOOTER");
  const buttonsIdx = watchedComponents.findIndex((c) => c.type === "BUTTONS");

  const addableComponents = ["HEADER", "FOOTER", "BUTTONS"].filter(
    (t) => !existingTypes.has(t)
  );

  return (
    <div className="space-y-4">
      {/* HEADER */}
      {headerIdx >= 0 && (
        <HeaderSectionCard
          form={form}
          index={headerIdx}
          mediaPreview={mediaPreviews[headerIdx]}
          onUpload={(fmt) => handleMediaUpload(headerIdx, fmt)}
          onClearMedia={() => clearMedia(headerIdx)}
          onRemove={() => remove(headerIdx)}
        />
      )}

      {/* BODY */}
      {bodyIdx >= 0 && (
        <BodySectionCard
          form={form}
          index={bodyIdx}
          category={watchedCategory}
        />
      )}

      {/* FOOTER */}
      {footerIdx >= 0 && (
        <FooterSectionCard
          form={form}
          index={footerIdx}
          onRemove={() => remove(footerIdx)}
        />
      )}

      {/* BUTTONS */}
      {buttonsIdx >= 0 && (
        <ButtonsSectionCard
          form={form}
          index={buttonsIdx}
          category={watchedCategory}
          selectedType={selectedType}
          onRemove={() => remove(buttonsIdx)}
        />
      )}

      {/* Add component buttons */}
      {addableComponents.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            ➕ Add more components (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {addableComponents.map((type) => {
              const config = {
                HEADER: { icon: <ImageIcon className="w-3.5 h-3.5" />, label: "Header", hint: "Add an image, video or text above your message", defaultVal: { type: "HEADER" as const, format: "TEXT" as const, text: "" } },
                FOOTER: { icon: <MessageCircle className="w-3.5 h-3.5" />, label: "Footer", hint: "Add small disclaimer text below your message", defaultVal: { type: "FOOTER" as const, text: "" } },
                BUTTONS: { icon: <Zap className="w-3.5 h-3.5" />, label: "Buttons", hint: "Add up to 3 action buttons", defaultVal: { type: "BUTTONS" as const, buttons: [{ type: "QUICK_REPLY" as const, text: "" }] } },
              }[type]!;
              return (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 border-dashed"
                      onClick={() => append(config.defaultVal as TemplateFormValues["components"][0])}
                    >
                      {config.icon}
                      Add {config.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{config.hint}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HEADER SECTION CARD
// ─────────────────────────────────────────────────────────────
function HeaderSectionCard({
  form,
  index,
  mediaPreview,
  onUpload,
  onClearMedia,
  onRemove,
}: {
  form: UseFormReturn<TemplateFormValues>;
  index: number;
  mediaPreview?: MediaState;
  onUpload: (format: string) => void;
  onClearMedia: () => void;
  onRemove: () => void;
}) {
  const format = form.watch(`components.${index}.format`) || "TEXT";
  const text = form.watch(`components.${index}.text`) || "";
  const isMedia = ["IMAGE", "VIDEO", "DOCUMENT"].includes(format);

  const formatIcons = {
    TEXT: <Type className="w-3.5 h-3.5 text-blue-500" />,
    IMAGE: <ImageIcon className="w-3.5 h-3.5 text-blue-500" />,
    VIDEO: <Film className="w-3.5 h-3.5 text-blue-500" />,
    DOCUMENT: <FileIcon className="w-3.5 h-3.5 text-blue-500" />,
  };

  return (
    <SectionCard
      title="Header"
      subtitle="Optional visual element displayed at the top of your message"
      icon={formatIcons[format as keyof typeof formatIcons] || <Type className="w-3.5 h-3.5 text-blue-500" />}
      optional
      canRemove
      onRemove={onRemove}
    >
      {/* Format selector */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Header Type</Label>
        <div className="grid grid-cols-4 gap-2">
          {([
            { value: "TEXT", icon: <Type className="w-4 h-4" />, label: "Text" },
            { value: "IMAGE", icon: <ImageIcon className="w-4 h-4" />, label: "Image" },
            { value: "VIDEO", icon: <Film className="w-4 h-4" />, label: "Video" },
            { value: "DOCUMENT", icon: <FileIcon className="w-4 h-4" />, label: "Document" },
          ] as const).map((opt) => {
            const isSelected = format === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  form.setValue(`components.${index}.format`, opt.value);
                  onClearMedia();
                }}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>
        <FieldHint>
          {format === "TEXT" && "A short bold title above your message (max 60 characters)"}
          {format === "IMAGE" && "A JPG/PNG/WEBP image displayed at the top (max 5MB)"}
          {format === "VIDEO" && "An MP4 video clip at the top of your message (max 16MB)"}
          {format === "DOCUMENT" && "A PDF or document attachment customers can download"}
        </FieldHint>
      </div>

      {/* Text input */}
      {format === "TEXT" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Header Text</Label>
            <CharCount value={text} max={MAX_HEADER_TEXT} />
          </div>
          <Input
            {...form.register(`components.${index}.text`)}
            placeholder='e.g. "🚀 Your Order Shipped!"'
            maxLength={MAX_HEADER_TEXT}
          />
          <FieldHint>Keep it short and impactful. Max {MAX_HEADER_TEXT} characters.</FieldHint>
        </div>
      )}

      {/* Media upload */}
      {isMedia && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Upload Media</Label>

          {mediaPreview ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-emerald-200 flex items-center justify-center">
                {mediaPreview.mimeType.startsWith("image/") ? (
                  <img src={mediaPreview.objectUrl} alt="" className="w-full h-full object-cover" />
                ) : mediaPreview.mimeType.startsWith("video/") ? (
                  <Film className="w-6 h-6 text-slate-500" />
                ) : (
                  <FileIcon className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-800 truncate">{mediaPreview.fileName}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5 uppercase">{mediaPreview.mimeType.split("/")[1]} · Ready for preview</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onUpload(format)}>
                  <Upload className="w-3 h-3 mr-1" /> Change
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onClearMedia}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onUpload(format)}
              className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2.5 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload {format.toLowerCase()}</p>
                <p className="text-xs mt-0.5 opacity-70">
                  {format === "IMAGE" && "JPG, PNG, WEBP — max 5MB"}
                  {format === "VIDEO" && "MP4, 3GP — max 16MB"}
                  {format === "DOCUMENT" && "PDF, DOC — max 100MB"}
                </p>
              </div>
              <p className="text-[11px] text-center opacity-60 max-w-[240px]">
                📸 Uploading here shows a real preview. The actual media handle is generated on the server when you submit.
              </p>
            </button>
          )}

          {/* Manual handle input */}
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1 select-none">
              <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
              Paste existing Media Handle instead
            </summary>
            <div className="mt-2">
              <Input
                {...form.register(`components.${index}.header_handle`)}
                placeholder="4::aW1hZ2Uv... (from Meta's media upload API)"
                className="h-7 text-xs font-mono"
              />
              <FieldHint>Use this if you already uploaded media to Meta via the API and have a handle.</FieldHint>
            </div>
          </details>
        </div>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────
// BODY SECTION CARD
// ─────────────────────────────────────────────────────────────
function BodySectionCard({
  form,
  index,
  category,
}: {
  form: UseFormReturn<TemplateFormValues>;
  index: number;
  category: string;
}) {
  const text = form.watch(`components.${index}.text`) || "";
  const [showVariableHelp, setShowVariableHelp] = useState(false);

  const insertVariable = () => {
    const vars = [...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    const next = vars.length > 0 ? Math.max(...vars) + 1 : 1;
    const newText = text + `{{${next}}}`;
    form.setValue(`components.${index}.text`, newText);
  };

  return (
    <SectionCard
      title="Message Body"
      subtitle="The main content of your WhatsApp message"
      icon={<MessageCircle className="w-3.5 h-3.5 text-green-500" />}
      required
    >
      {/* Body textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Body Text</Label>
            <button
              type="button"
              onClick={() => setShowVariableHelp((v) => !v)}
              className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
            >
              <Info className="w-3 h-3" /> Variable help
            </button>
          </div>
          <CharCount value={text} max={MAX_BODY} />
        </div>

        {showVariableHelp && (
          <Alert className="py-2.5 border-blue-200 bg-blue-50">
            <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800 space-y-1">
              <p><strong>Variables</strong> let you personalise each message. Use <code className="bg-blue-100 px-1 rounded">{"{{1}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{2}}"}</code>, etc.</p>
              <p>Example: <code className="bg-blue-100 px-1 rounded">{"Hi {{1}}, your order {{2}} is ready."}</code></p>
              <p>Variables <strong>must be consecutive</strong> starting at 1 ({"{{1}}"}, {"{{2}}"}, {"{{3}}"} — not {"{{1}}"}, {"{{3}}"}).</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Textarea
            {...form.register(`components.${index}.text`)}
            placeholder={
              'e.g. "Hi {{1}}, your order #{{2}} has shipped! 🚀\n\nExpected delivery: {{3}}\n\nThank you for your purchase!"'
            }
            rows={6}
            className="resize-none text-sm pr-2 pb-8"
            maxLength={MAX_BODY}
          />
          {/* Bottom bar inside textarea */}
          <div className="absolute bottom-2 left-0 right-0 px-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={insertVariable}
                className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded px-1.5 py-0.5 font-mono transition-colors"
              >
                + Add {"{{variable}}"}
              </button>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => form.setValue(`components.${index}.text`, text + " *bold*")} className="text-[10px] text-muted-foreground hover:text-foreground px-1 font-bold">B</button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Wrap with *asterisks* for bold</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => form.setValue(`components.${index}.text`, text + " _italic_")} className="text-[10px] text-muted-foreground hover:text-foreground px-1 italic">I</button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Wrap with _underscores_ for italic</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => form.setValue(`components.${index}.text`, text + " ~strikethrough~")} className="text-[10px] text-muted-foreground hover:text-foreground px-1 line-through">S</button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Wrap with ~tildes~ for strikethrough</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <FieldHint>
          Use <code className="bg-muted px-1 rounded text-[10px]">{"{{1}}"}</code> for personalisation. WhatsApp supports basic formatting: *bold*, _italic_, ~strikethrough~.
        </FieldHint>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER SECTION CARD
// ─────────────────────────────────────────────────────────────
function FooterSectionCard({
  form,
  index,
  onRemove,
}: {
  form: UseFormReturn<TemplateFormValues>;
  index: number;
  onRemove: () => void;
}) {
  const text = form.watch(`components.${index}.text`) || "";
  return (
    <SectionCard
      title="Footer"
      subtitle="Small disclaimer or note shown below the message in grey"
      icon={<MessageCircle className="w-3.5 h-3.5 text-slate-400" />}
      optional
      canRemove
      onRemove={onRemove}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Footer Text</Label>
          <CharCount value={text} max={MAX_FOOTER} />
        </div>
        <Input
          {...form.register(`components.${index}.text`)}
          placeholder='e.g. "Reply STOP to unsubscribe"'
          maxLength={MAX_FOOTER}
        />
        <FieldHint>Shown in grey below the body. Typically used for opt-out instructions or legal disclaimers. Max {MAX_FOOTER} characters.</FieldHint>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────
// BUTTONS SECTION CARD
// ─────────────────────────────────────────────────────────────
function ButtonsSectionCard({
  form,
  index,
  category,
  selectedType,
  onRemove,
}: {
  form: UseFormReturn<TemplateFormValues>;
  index: number;
  category: string;
  selectedType: TemplateTypeId | null;
  onRemove: () => void;
}) {
  const buttons = form.watch(`components.${index}.buttons`) || [];

  const addButton = (type: TemplateButton["type"]) => {
    if (buttons.length >= 3) return;
    const current = form.getValues(`components.${index}.buttons`) || [];
    form.setValue(`components.${index}.buttons`, [...current, { type, text: "" }]);
  };

  const removeButton = (i: number) => {
    const current = form.getValues(`components.${index}.buttons`) || [];
    form.setValue(`components.${index}.buttons`, current.filter((_, idx) => idx !== i));
  };

  const updateButton = (i: number, field: string, value: string) => {
    const current = [...(form.getValues(`components.${index}.buttons`) || [])];
    (current[i] as Record<string, string>)[field] = value;
    form.setValue(`components.${index}.buttons`, current);
  };

  const buttonTypeConfig = {
    QUICK_REPLY: {
      icon: <MessageCircle className="w-4 h-4 text-blue-500" />,
      label: "Quick Reply",
      desc: "A pre-written reply the customer can send with one tap",
      color: "bg-blue-50 border-blue-200",
    },
    URL: {
      icon: <Link2 className="w-4 h-4 text-green-500" />,
      label: "Visit URL",
      desc: "Opens a website or deep-link in the browser",
      color: "bg-green-50 border-green-200",
    },
    PHONE_NUMBER: {
      icon: <Phone className="w-4 h-4 text-purple-500" />,
      label: "Call Phone",
      desc: "Starts a phone call to the specified number",
      color: "bg-purple-50 border-purple-200",
    },
    FLOW: {
      icon: <Zap className="w-4 h-4 text-orange-500" />,
      label: "Open Flow",
      desc: "Opens an interactive WhatsApp Flow form",
      color: "bg-orange-50 border-orange-200",
    },
    OTP: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      label: "OTP",
      desc: "Authentication OTP button",
      color: "bg-emerald-50 border-emerald-200",
    },
  };

  return (
    <SectionCard
      title={`Buttons (${buttons.length}/3)`}
      subtitle="Action buttons displayed below your message"
      icon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
      optional
      canRemove={buttons.length === 0}
      onRemove={onRemove}
    >
      {/* Existing buttons */}
      <div className="space-y-3">
        {buttons.map((btn, i) => {
          const cfg = buttonTypeConfig[btn.type as keyof typeof buttonTypeConfig];
          const btnErrors = (form.formState.errors.components as any)?.[index]?.buttons?.[i];

          return (
            <div key={i} className={`rounded-xl border-2 overflow-hidden ${cfg?.color || ""}`}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-current/10">
                <div className="flex items-center gap-2">
                  {cfg?.icon}
                  <span className="text-xs font-semibold">{cfg?.label || btn.type} Button {i + 1}</span>
                  <span className="text-[10px] text-muted-foreground">— {cfg?.desc}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => removeButton(i)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="px-3 py-3 space-y-2.5 bg-background/60">
                {/* Type selector (only for non-OTP, non-FLOW) */}
                {category !== "AUTHENTICATION" && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16 flex-shrink-0">Type</Label>
                    <Select value={btn.type} onValueChange={(v) => updateButton(i, "type", v)}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                        <SelectItem value="URL">Visit URL</SelectItem>
                        <SelectItem value="PHONE_NUMBER">Call Phone</SelectItem>
                        {selectedType === "flow" && <SelectItem value="FLOW">Open Flow</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Button label */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-16 flex-shrink-0">Label</Label>
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        value={btn.text}
                        onChange={(e) => updateButton(i, "text", e.target.value)}
                        placeholder={
                          btn.type === "QUICK_REPLY" ? "e.g. Yes, I'm interested" :
                            btn.type === "URL" ? "e.g. Track Order" :
                              btn.type === "PHONE_NUMBER" ? "e.g. Call Us" :
                                btn.type === "FLOW" ? "e.g. Fill Out Form" :
                                  btn.type === "OTP" ? "e.g. Copy Code" : "Button label"
                        }
                        maxLength={MAX_BUTTON_TEXT}
                        className="h-7 text-xs pr-14"
                      />
                      <CharCount value={btn.text} max={MAX_BUTTON_TEXT} className="absolute right-2 top-1/2 -translate-y-1/2" />
                    </div>
                    <FieldError message={btnErrors?.text?.message} />
                  </div>
                </div>

                {/* URL */}
                {btn.type === "URL" && (
                  <div className="flex items-start gap-2">
                    <Label className="text-xs w-16 flex-shrink-0 pt-1.5">URL</Label>
                    <div className="flex-1">
                      <Input
                        value={btn.url || ""}
                        onChange={(e) => updateButton(i, "url", e.target.value)}
                        placeholder="https://example.com/track/{{1}}"
                        className="h-7 text-xs"
                      />
                      <FieldError message={btnErrors?.url?.message} />
                      <FieldHint>You can use {"{{1}}"} in the URL for dynamic links.</FieldHint>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {btn.type === "PHONE_NUMBER" && (
                  <div className="flex items-start gap-2">
                    <Label className="text-xs w-16 flex-shrink-0 pt-1.5">Phone</Label>
                    <div className="flex-1">
                      <Input
                        value={btn.phone_number || ""}
                        onChange={(e) => updateButton(i, "phone_number", e.target.value)}
                        placeholder="+91XXXXXXXXXX"
                        className="h-7 text-xs"
                      />
                      <FieldError message={btnErrors?.phone_number?.message} />
                      <FieldHint>Use international format starting with country code, e.g. +918800123456</FieldHint>
                    </div>
                  </div>
                )}

                {/* OTP type */}
                {btn.type === "OTP" && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16 flex-shrink-0">OTP Mode</Label>
                    <Select value={btn.otp_type || "COPY_CODE"} onValueChange={(v) => updateButton(i, "otp_type", v)}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COPY_CODE">📋 Copy Code</SelectItem>
                        <SelectItem value="ONE_TAP">👆 One Tap</SelectItem>
                        <SelectItem value="ZERO_TAP">⚡ Zero Tap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Flow ID */}
                {btn.type === "FLOW" && (
                  <div className="flex items-start gap-2">
                    <Label className="text-xs w-16 flex-shrink-0 pt-1.5">Flow ID</Label>
                    <div className="flex-1">
                      <Input
                        value={btn.flow_id || ""}
                        onChange={(e) => updateButton(i, "flow_id", e.target.value)}
                        placeholder="e.g. 1234567890 (from your Flows section)"
                        className="h-7 text-xs font-mono"
                      />
                      <FieldError message={btnErrors?.flow_id?.message} />
                      <FieldHint>Go to the Flows section → copy the Flow ID from there.</FieldHint>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add button pickers */}
      {buttons.length < 3 && category !== "AUTHENTICATION" && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Add a button:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["QUICK_REPLY", "URL", "PHONE_NUMBER", ...(selectedType === "flow" ? ["FLOW"] : [])] as TemplateButton["type"][]).map((type) => {
              const cfg = buttonTypeConfig[type as keyof typeof buttonTypeConfig];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addButton(type)}
                  className="flex flex-col items-center gap-1 py-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                >
                  {cfg?.icon}
                  <span className="text-[10px] font-medium">{cfg?.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            You can mix and match button types. Max 3 buttons total.
          </p>
        </div>
      )}

      {buttons.length >= 3 && (
        <Alert className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">
            Maximum 3 buttons reached. Remove a button to add a different type.
          </AlertDescription>
        </Alert>
      )}
    </SectionCard>
  );
}
