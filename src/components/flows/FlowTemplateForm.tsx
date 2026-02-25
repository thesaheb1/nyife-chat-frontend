import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  Battery,
  Check,
  ChevronLeft,
  CheckCircle2,
  Eye,
  Moon,
  GripVertical,
  Signal,
  Sun,
  Wifi,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  FLOW_ACTION_TYPES,
  FLOW_CATEGORIES,
  FLOW_COMPONENT_TYPES,
  type CreateFlowPayload,
  type FlowCategory,
  type FlowActionType,
  type FlowComponentType,
  type UpdateFlowPayload,
} from "@/types/flow.types";

const KEY_REGEX = /^[a-z][a-z0-9_]{1,62}$/;

const parseOptions = (value?: string): Array<{ label: string; value: string }> => {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, right] = line.split("|").map((s) => s.trim());
      if (!right) {
        return {
          label: left,
          value: left.toLowerCase().replace(/\s+/g, "_"),
        };
      }
      return { label: left, value: right };
    });
};

const toTitle = (category: FlowCategory): string =>
  category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const toTemplateKey = (category: FlowCategory): string => `${category.toLowerCase()}_flow_v1`;

type CategoryPresetField = {
  key: string;
  type: FlowComponentType;
  label: string;
  variable_key?: string;
  placeholder?: string;
  required?: boolean;
  options_text?: string;
  helper_text?: string;
};

type CategoryPresetSpec = {
  description: string;
  startTitle: string;
  reviewText: string;
  fields: CategoryPresetField[];
};

const CATEGORY_PRESET_SPECS: Record<FlowCategory, CategoryPresetSpec> = {
  LEAD_GENERATION: {
    description: "Capture new prospect information and intent quickly.",
    startTitle: "Lead Information",
    reviewText: "Review lead details before submission.",
    fields: [
      { key: "full_name", type: "input", label: "Full Name", variable_key: "full_name", placeholder: "Enter full name", required: true },
      { key: "email", type: "email", label: "Email Address", variable_key: "email", placeholder: "name@example.com", required: true },
      { key: "service_interest", type: "select", label: "Interested Service", variable_key: "service_interest", options_text: "Marketing|marketing\nSales|sales\nSupport|support", required: true },
      { key: "city", type: "input", label: "City", variable_key: "city", placeholder: "Enter city" },
    ],
  },
  LEAD_QUALIFICATION: {
    description: "Qualify incoming leads by intent, budget, and timeline.",
    startTitle: "Lead Qualification",
    reviewText: "Confirm qualification details before submission.",
    fields: [
      { key: "company_name", type: "input", label: "Company Name", variable_key: "company_name", placeholder: "Enter company name", required: true },
      { key: "budget_range", type: "select", label: "Budget Range", variable_key: "budget_range", options_text: "Below $1,000|lt_1000\n$1,000 - $5,000|1000_5000\nAbove $5,000|gt_5000", required: true },
      { key: "decision_timeline", type: "select", label: "Decision Timeline", variable_key: "decision_timeline", options_text: "This week|this_week\nThis month|this_month\nLater|later", required: true },
      { key: "is_decision_maker", type: "radio", label: "Are you the decision maker?", variable_key: "is_decision_maker", options_text: "Yes|yes\nNo|no", required: true },
    ],
  },
  APPOINTMENT_BOOKING: {
    description: "Book appointments by collecting date, time, and purpose.",
    startTitle: "Appointment Details",
    reviewText: "Verify appointment details before submission.",
    fields: [
      { key: "customer_name", type: "input", label: "Customer Name", variable_key: "customer_name", placeholder: "Enter full name", required: true },
      { key: "appointment_date", type: "date", label: "Preferred Date", variable_key: "appointment_date", required: true },
      { key: "appointment_time", type: "time", label: "Preferred Time", variable_key: "appointment_time", required: true },
      { key: "visit_reason", type: "select", label: "Reason for Appointment", variable_key: "visit_reason", options_text: "Consultation|consultation\nDemo|demo\nSupport|support", required: true },
    ],
  },
  SLOT_BOOKING: {
    description: "Book predefined slots with service and timing selection.",
    startTitle: "Slot Details",
    reviewText: "Check selected slot details before submission.",
    fields: [
      { key: "service_type", type: "select", label: "Service Type", variable_key: "service_type", options_text: "Installation|installation\nRepair|repair\nPickup|pickup", required: true },
      { key: "preferred_date", type: "date", label: "Preferred Date", variable_key: "preferred_date", required: true },
      { key: "preferred_slot", type: "select", label: "Preferred Slot", variable_key: "preferred_slot", options_text: "09:00 - 11:00|slot_1\n11:00 - 13:00|slot_2\n14:00 - 16:00|slot_3", required: true },
      { key: "notes", type: "textarea", label: "Notes", variable_key: "notes", placeholder: "Any additional details" },
    ],
  },
  ORDER_PLACEMENT: {
    description: "Place new customer orders with item and delivery details.",
    startTitle: "Order Details",
    reviewText: "Review order details before placing the order.",
    fields: [
      { key: "customer_name", type: "input", label: "Customer Name", variable_key: "customer_name", placeholder: "Enter customer name", required: true },
      { key: "product_name", type: "select", label: "Product", variable_key: "product_name", options_text: "Product A|product_a\nProduct B|product_b\nProduct C|product_c", required: true },
      { key: "quantity", type: "number", label: "Quantity", variable_key: "quantity", placeholder: "1", required: true },
      { key: "delivery_address", type: "textarea", label: "Delivery Address", variable_key: "delivery_address", placeholder: "Enter full address", required: true },
    ],
  },
  RE_ORDERING: {
    description: "Allow customers to reorder from previous purchases.",
    startTitle: "Re-order Details",
    reviewText: "Confirm re-order details before submission.",
    fields: [
      { key: "customer_phone", type: "phone", label: "Customer Phone", variable_key: "customer_phone", placeholder: "+14155552671", required: true },
      { key: "last_order_id", type: "input", label: "Last Order ID", variable_key: "last_order_id", placeholder: "ORD-100245", required: true },
      { key: "items_to_reorder", type: "textarea", label: "Items to Re-order", variable_key: "items_to_reorder", placeholder: "List item names and quantity", required: true },
      { key: "delivery_window", type: "select", label: "Delivery Window", variable_key: "delivery_window", options_text: "Morning|morning\nAfternoon|afternoon\nEvening|evening", required: true },
    ],
  },
  CUSTOMER_SUPPORT: {
    description: "Capture support requests with issue details and urgency.",
    startTitle: "Support Request",
    reviewText: "Review support issue details before submission.",
    fields: [
      { key: "customer_name", type: "input", label: "Customer Name", variable_key: "customer_name", placeholder: "Enter customer name", required: true },
      { key: "issue_type", type: "select", label: "Issue Type", variable_key: "issue_type", options_text: "Technical|technical\nBilling|billing\nGeneral|general", required: true },
      { key: "reference_id", type: "input", label: "Reference ID", variable_key: "reference_id", placeholder: "Order/Ticket ID" },
      { key: "issue_details", type: "textarea", label: "Issue Details", variable_key: "issue_details", placeholder: "Describe the issue", required: true },
    ],
  },
  TICKET_CREATION: {
    description: "Create support tickets with structured issue information.",
    startTitle: "Ticket Details",
    reviewText: "Review ticket details before creating the ticket.",
    fields: [
      { key: "ticket_subject", type: "input", label: "Subject", variable_key: "ticket_subject", placeholder: "Short subject", required: true },
      { key: "priority", type: "select", label: "Priority", variable_key: "priority", options_text: "Low|low\nMedium|medium\nHigh|high\nCritical|critical", required: true },
      { key: "contact_email", type: "email", label: "Contact Email", variable_key: "contact_email", placeholder: "name@example.com", required: true },
      { key: "ticket_description", type: "textarea", label: "Description", variable_key: "ticket_description", placeholder: "Describe the issue in detail", required: true },
    ],
  },
  PAYMENTS: {
    description: "Collect payment details and preferred payment method.",
    startTitle: "Payment Details",
    reviewText: "Verify payment details before submission.",
    fields: [
      { key: "payer_name", type: "input", label: "Payer Name", variable_key: "payer_name", placeholder: "Enter payer name", required: true },
      { key: "invoice_number", type: "input", label: "Invoice Number", variable_key: "invoice_number", placeholder: "INV-12004", required: true },
      { key: "amount", type: "number", label: "Amount", variable_key: "amount", placeholder: "100.00", required: true },
      { key: "payment_method", type: "select", label: "Payment Method", variable_key: "payment_method", options_text: "UPI|upi\nCard|card\nBank Transfer|bank_transfer\nCash|cash", required: true },
    ],
  },
  COLLECTIONS: {
    description: "Track pending collections and promise-to-pay commitments.",
    startTitle: "Collections Details",
    reviewText: "Confirm collection details before submission.",
    fields: [
      { key: "customer_name", type: "input", label: "Customer Name", variable_key: "customer_name", placeholder: "Enter customer name", required: true },
      { key: "due_amount", type: "number", label: "Due Amount", variable_key: "due_amount", placeholder: "250.00", required: true },
      { key: "due_date", type: "date", label: "Due Date", variable_key: "due_date", required: true },
      { key: "promise_to_pay_date", type: "date", label: "Promise to Pay Date", variable_key: "promise_to_pay_date" },
    ],
  },
  REGISTRATIONS: {
    description: "Register users for events, programs, or services.",
    startTitle: "Registration Details",
    reviewText: "Confirm registration details before submission.",
    fields: [
      { key: "full_name", type: "input", label: "Full Name", variable_key: "full_name", placeholder: "Enter full name", required: true },
      { key: "email", type: "email", label: "Email", variable_key: "email", placeholder: "name@example.com", required: true },
      { key: "phone", type: "phone", label: "Phone", variable_key: "phone", placeholder: "+14155552671", required: true },
      { key: "registration_type", type: "select", label: "Registration Type", variable_key: "registration_type", options_text: "Individual|individual\nTeam|team\nCorporate|corporate", required: true },
    ],
  },
  APPLICATIONS: {
    description: "Collect application details for internal review.",
    startTitle: "Application Details",
    reviewText: "Review application information before submission.",
    fields: [
      { key: "applicant_name", type: "input", label: "Applicant Name", variable_key: "applicant_name", placeholder: "Enter full name", required: true },
      { key: "application_type", type: "select", label: "Application Type", variable_key: "application_type", options_text: "Job|job\nLoan|loan\nService|service", required: true },
      { key: "experience_years", type: "number", label: "Experience (Years)", variable_key: "experience_years", placeholder: "2" },
      { key: "application_notes", type: "textarea", label: "Application Notes", variable_key: "application_notes", placeholder: "Any additional details" },
    ],
  },
  DELIVERY_UPDATES: {
    description: "Collect delivery update data and expected timeline.",
    startTitle: "Delivery Update",
    reviewText: "Review delivery update before submission.",
    fields: [
      { key: "order_id", type: "input", label: "Order ID", variable_key: "order_id", placeholder: "ORD-100245", required: true },
      { key: "status", type: "select", label: "Current Status", variable_key: "status", options_text: "Packed|packed\nShipped|shipped\nOut for delivery|out_for_delivery\nDelivered|delivered", required: true },
      { key: "expected_delivery_date", type: "date", label: "Expected Delivery Date", variable_key: "expected_delivery_date" },
      { key: "update_note", type: "textarea", label: "Update Note", variable_key: "update_note", placeholder: "Provide update details" },
    ],
  },
  ADDRESS_CAPTURE: {
    description: "Capture complete delivery or service address details.",
    startTitle: "Address Details",
    reviewText: "Verify address details before submission.",
    fields: [
      { key: "recipient_name", type: "input", label: "Recipient Name", variable_key: "recipient_name", placeholder: "Enter recipient name", required: true },
      { key: "phone", type: "phone", label: "Phone Number", variable_key: "phone", placeholder: "+14155552671", required: true },
      { key: "address_line", type: "textarea", label: "Address", variable_key: "address_line", placeholder: "House no, street, area", required: true },
      { key: "postal_code", type: "input", label: "Postal Code", variable_key: "postal_code", placeholder: "10001", required: true },
    ],
  },
  FEEDBACK: {
    description: "Gather customer feedback about service experience.",
    startTitle: "Feedback Details",
    reviewText: "Review feedback responses before submission.",
    fields: [
      { key: "recommendation", type: "radio", label: "Would you recommend us?", variable_key: "recommendation", options_text: "Yes|yes\nNo|no", required: true },
      { key: "rating", type: "select", label: "Overall Rating", variable_key: "rating", options_text: "5 - Excellent|5\n4 - Good|4\n3 - Average|3\n2 - Poor|2\n1 - Bad|1", required: true },
      { key: "improvement_note", type: "textarea", label: "How can we improve?", variable_key: "improvement_note", placeholder: "Share your feedback" },
      { key: "contact_for_followup", type: "checkbox", label: "Follow-up Consent", variable_key: "contact_for_followup", options_text: "You can contact me for follow-up|yes" },
    ],
  },
  SURVEYS: {
    description: "Run structured surveys with multiple response types.",
    startTitle: "Survey Questions",
    reviewText: "Review survey responses before submission.",
    fields: [
      { key: "service_usage", type: "radio", label: "How often do you use our service?", variable_key: "service_usage", options_text: "Daily|daily\nWeekly|weekly\nMonthly|monthly\nRarely|rarely", required: true },
      { key: "satisfaction_score", type: "select", label: "Satisfaction Score", variable_key: "satisfaction_score", options_text: "5|5\n4|4\n3|3\n2|2\n1|1", required: true },
      { key: "favorite_feature", type: "input", label: "Favorite Feature", variable_key: "favorite_feature", placeholder: "Enter feature name" },
      { key: "survey_comment", type: "textarea", label: "Additional Comments", variable_key: "survey_comment", placeholder: "Share your thoughts" },
    ],
  },
  OTHER: {
    description: "Custom flow for business-specific use cases.",
    startTitle: "Custom Form Details",
    reviewText: "Review custom form details before submission.",
    fields: [
      { key: "request_title", type: "input", label: "Request Title", variable_key: "request_title", placeholder: "Enter title", required: true },
      { key: "request_type", type: "select", label: "Request Type", variable_key: "request_type", options_text: "General|general\nUrgent|urgent\nEscalation|escalation", required: true },
      { key: "details", type: "textarea", label: "Details", variable_key: "details", placeholder: "Describe your request", required: true },
      { key: "contact_preference", type: "select", label: "Preferred Contact", variable_key: "contact_preference", options_text: "WhatsApp|whatsapp\nCall|call\nEmail|email", required: true },
    ],
  },
};

const buildCategoryPreset = (category: FlowCategory): FlowTemplateFormValues => {
  const title = toTitle(category);
  const prefix = category.toLowerCase();
  const spec = CATEGORY_PRESET_SPECS[category];

  return {
    name: `${title} Flow`,
    template_key: toTemplateKey(category),
    description: spec.description,
    category,
    webhook_mapping_json: JSON.stringify(
      {
        organizationId: "{{tenant.organization_id}}",
        flowId: "{{flow.id}}",
        phone: "{{user_phone}}",
        category,
        answers: "{{answers}}",
      },
      null,
      2
    ),
    screens: [
      {
        key: `${prefix}_start`,
        title: spec.startTitle,
        is_entry_point: true,
        components: spec.fields,
        actions: [
          {
            key: "go_review",
            type: "next_screen",
            label: "Continue",
            target_screen_key: `${prefix}_review`,
          },
        ],
      },
      {
        key: `${prefix}_review`,
        title: "Review & Submit",
        is_entry_point: false,
        components: [
          {
            key: "summary",
            type: "summary",
            label: spec.reviewText,
          },
          {
            key: "consent",
            type: "checkbox",
            label: "Consent",
            variable_key: "consent",
            options_text: "I confirm the details are correct|accepted",
            required: true,
          },
        ],
        actions: [
          {
            key: "back",
            type: "previous_screen",
            label: "Back",
            target_screen_key: `${prefix}_start`,
          },
          {
            key: "submit",
            type: "submit",
            label: "Submit",
          },
        ],
      },
    ],
  };
};

const componentSchema = z
  .object({
    key: z.string().min(2).max(63).regex(KEY_REGEX, "Use snake_case: full_name"),
    type: z.enum(FLOW_COMPONENT_TYPES),
    label: z.string().max(120).optional(),
    variable_key: z.string().max(100).optional(),
    placeholder: z.string().max(160).optional(),
    required: z.boolean().optional(),
    helper_text: z.string().max(240).optional(),
    options_text: z.string().optional(),
    min_length: z.coerce.number().optional(),
    max_length: z.coerce.number().optional(),
    min_value: z.coerce.number().optional(),
    max_value: z.coerce.number().optional(),
  })
  .superRefine((val, ctx) => {
    const needsVariable = [
      "input",
      "email",
      "textarea",
      "phone",
      "number",
      "date",
      "time",
      "select",
      "radio",
      "checkbox",
    ] as const;

    if ((needsVariable as readonly string[]).includes(val.type) && (!val.variable_key || !KEY_REGEX.test(val.variable_key))) {
      ctx.addIssue({
        code: "custom",
        path: ["variable_key"],
        message: "Variable key is required in snake_case.",
      });
    }

    if (["select", "radio", "checkbox"].includes(val.type)) {
      const options = parseOptions(val.options_text);
      if (options.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options_text"],
          message: "Add at least one option.",
        });
      }
    }

    if (typeof val.min_length === "number" && typeof val.max_length === "number" && val.min_length > val.max_length) {
      ctx.addIssue({
        code: "custom",
        path: ["max_length"],
        message: "max_length must be greater than or equal to min_length.",
      });
    }

    if (typeof val.min_value === "number" && typeof val.max_value === "number" && val.min_value > val.max_value) {
      ctx.addIssue({
        code: "custom",
        path: ["max_value"],
        message: "max_value must be greater than or equal to min_value.",
      });
    }
  });

const actionSchema = z
  .object({
    key: z.string().min(2).max(63).regex(KEY_REGEX, "Use snake_case key"),
    type: z.enum(FLOW_ACTION_TYPES),
    label: z.string().max(120).optional(),
    target_screen_key: z.string().max(63).optional(),
    url: z.string().optional(),
    phone: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if ((val.type === "next_screen" || val.type === "previous_screen") && !val.target_screen_key) {
      ctx.addIssue({
        code: "custom",
        path: ["target_screen_key"],
        message: "Target screen is required for screen navigation actions.",
      });
    }

    if (val.type === "open_url") {
      if (!val.url) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "URL is required." });
      } else {
        try {
          new URL(val.url);
        } catch {
          ctx.addIssue({ code: "custom", path: ["url"], message: "Enter a valid URL." });
        }
      }
    }

    if (val.type === "call_phone" && (!val.phone || !/^\+[1-9]\d{6,14}$/.test(val.phone.replace(/\s/g, "")))) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Use E.164 phone format, e.g. +14155552671" });
    }
  });

const screenSchema = z
  .object({
    key: z.string().min(2).max(63).regex(KEY_REGEX, "Use snake_case: basic_info"),
    title: z.string().min(2).max(80),
    is_entry_point: z.boolean().optional(),
    components: z.array(componentSchema).min(1, "At least one component is required per screen."),
    actions: z.array(actionSchema).min(1, "At least one action is required per screen."),
  })
  .superRefine((screen, ctx) => {
    const uniqueKeys = new Set<string>();
    screen.components.forEach((c, index) => {
      if (uniqueKeys.has(c.key)) {
        ctx.addIssue({
          code: "custom",
          path: ["components", index, "key"],
          message: "Component keys must be unique inside a screen.",
        });
      }
      uniqueKeys.add(c.key);
    });
  });

export const flowFormSchema = z
  .object({
    name: z.string().min(2).max(120),
    template_key: z
      .string()
      .min(2)
      .max(120)
      .regex(KEY_REGEX, "Use snake_case template key"),
    description: z.string().max(500).optional(),
    category: z.enum(FLOW_CATEGORIES),
    webhook_mapping_json: z.string().optional(),
    screens: z.array(screenSchema).min(1),
  })
  .superRefine((val, ctx) => {
    const entryCount = val.screens.filter((s) => s.is_entry_point).length;
    if (entryCount !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["screens"],
        message: "Exactly one screen must be marked as entry point.",
      });
    }

    const screenKeys = val.screens.map((s) => s.key);
    if (new Set(screenKeys).size !== screenKeys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["screens"],
        message: "Screen keys must be unique.",
      });
    }

    val.screens.forEach((s, sIndex) => {
      s.actions.forEach((action, aIndex) => {
        if (
          (action.type === "next_screen" || action.type === "previous_screen") &&
          action.target_screen_key &&
          !screenKeys.includes(action.target_screen_key)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["screens", sIndex, "actions", aIndex, "target_screen_key"],
            message: "Target screen does not exist.",
          });
        }
      });
    });

    if (val.webhook_mapping_json?.trim()) {
      try {
        JSON.parse(val.webhook_mapping_json);
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["webhook_mapping_json"],
          message: "Webhook mapping must be valid JSON.",
        });
      }
    }
  });

export type FlowTemplateFormValues = z.infer<typeof flowFormSchema>;

interface FlowTemplateFormProps {
  defaultValues?: Partial<FlowTemplateFormValues>;
  onSubmit: (payload: CreateFlowPayload | UpdateFlowPayload) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  isUpdate?: boolean;
}

const DEFAULT_VALUES: FlowTemplateFormValues = buildCategoryPreset("LEAD_QUALIFICATION");

const componentTypeLabels: Record<FlowComponentType, string> = {
  input: "Text Input",
  email: "Email",
  textarea: "Textarea",
  phone: "Phone",
  number: "Number",
  date: "Date",
  time: "Time",
  select: "Select Dropdown",
  radio: "Radio Group",
  checkbox: "Checkbox",
  summary: "Summary",
  text: "Text Block",
};

const actionTypeLabels: Record<FlowActionType, string> = {
  next_screen: "Next Screen",
  previous_screen: "Previous Screen",
  submit: "Submit",
  open_url: "Open URL",
  call_phone: "Call Phone",
};

type PreviewTheme = "dark" | "light";

const PREVIEW_THEMES = {
  dark: {
    phoneBg: "#111b21",
    phoneBorder: "#2a3942",
    statusText: "#ffffff",
    appHeaderBg: "#1f2c34",
    appHeaderText: "#ffffff",
    appHeaderSub: "#8696a0",
    chatBg: "#0b141a",
    bubbleBg: "#202c33",
    bodyText: "#e9edef",
    headingText: "#f5f7f8",
    subtleText: "#8696a0",
    buttonColor: "#00a5f4",
    dividerColor: "#2a3942",
    fieldBg: "#2a3942",
    fieldBorder: "#314148",
    fieldText: "#d1d5db",
    controlBg: "#1f2c34",
    controlBorder: "#2a3942",
    controlText: "#cbd5e1",
    requiredMark: "#f87171",
    wallpaperDot: "rgba(255,255,255,0.04)",
  },
  light: {
    phoneBg: "#111b21",
    phoneBorder: "#2a3942",
    statusText: "#ffffff",
    appHeaderBg: "#008069",
    appHeaderText: "#ffffff",
    appHeaderSub: "#d1f4ec",
    chatBg: "#efeae2",
    bubbleBg: "#d9fdd3",
    bodyText: "#111b21",
    headingText: "#0f172a",
    subtleText: "#667781",
    buttonColor: "#008069",
    dividerColor: "#d7e2da",
    fieldBg: "#ffffff",
    fieldBorder: "#e2e8f0",
    fieldText: "#57636c",
    controlBg: "#f8fafc",
    controlBorder: "#d7e2da",
    controlText: "#475569",
    requiredMark: "#dc2626",
    wallpaperDot: "rgba(0,0,0,0.05)",
  },
} as const;

export default function FlowTemplateForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Save Flow",
  onCancel,
  isUpdate = false,
}: FlowTemplateFormProps) {
  const form = useForm<FlowTemplateFormValues>({
    resolver: zodResolver(flowFormSchema) as any,
    mode: "onChange",
    defaultValues: {
      ...DEFAULT_VALUES,
      ...defaultValues,
      screens: defaultValues?.screens?.length ? defaultValues.screens : DEFAULT_VALUES.screens,
    },
  });

  const {
    fields: screenFields,
    append: appendScreen,
    remove: removeScreen,
    move: moveScreen,
  } = useFieldArray({
    control: form.control,
    name: "screens",
  });

  const watchedScreens = form.watch("screens");
  const watchedCategory = form.watch("category");
  const [previewScreenKey, setPreviewScreenKey] = useState<string>("");
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);
  const [activeEditorScreenIndex, setActiveEditorScreenIndex] = useState(0);
  const [draggedScreenIndex, setDraggedScreenIndex] = useState<number | null>(null);
  const [dragOverScreenIndex, setDragOverScreenIndex] = useState<number | null>(null);

  const applyCategoryPreset = (category: FlowCategory) => {
    const preset = buildCategoryPreset(category);
    form.reset(preset);
    const nextKey = preset.screens[0]?.key || "";
    setPreviewScreenKey(nextKey);
    setPreviewHistory(nextKey ? [nextKey] : []);
    setActiveEditorScreenIndex(0);
  };

  useEffect(() => {
    if (isUpdate) return;
    if (defaultValues?.name || defaultValues?.screens?.length) return;
    applyCategoryPreset(watchedCategory);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const screens = form.getValues("screens") || [];
    if (!screens.length) return;

    const exists = screens.some((s) => s.key === previewScreenKey);
    if (exists) return;

    const entry = screens.find((s) => s.is_entry_point)?.key;
    const nextKey = entry || screens[0]?.key || "";
    setPreviewScreenKey(nextKey);
    setPreviewHistory(nextKey ? [nextKey] : []);
  }, [form, previewScreenKey, watchedScreens]);

  useEffect(() => {
    const screens = form.getValues("screens") || [];
    if (!screens.length) return;
    if (activeEditorScreenIndex > screens.length - 1) {
      setActiveEditorScreenIndex(screens.length - 1);
    }
  }, [activeEditorScreenIndex, form, watchedScreens]);

  const handlePreviewNavigate = (action: FlowTemplateFormValues["screens"][number]["actions"][number]) => {
    if (action.type === "previous_screen") {
      handlePreviewBack();
      return;
    }

    if (action.type === "next_screen" && action.target_screen_key) {
      setPreviewScreenKey(action.target_screen_key);
      setPreviewHistory((prev) => [...prev, action.target_screen_key as string]);
    }
  };

  const handlePreviewBack = () => {
    setPreviewHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      const target = next[next.length - 1];
      if (target) {
        setPreviewScreenKey(target);
      }
      return next;
    });
  };

  const previewCanGoBack = previewHistory.length > 1;

  const previewScreen = useMemo(() => {
    return watchedScreens?.find((s) => s.key === previewScreenKey) || watchedScreens?.[0];
  }, [watchedScreens, previewScreenKey]);

  const handleSetEntryPoint = (index: number) => {
    const current = form.getValues("screens");
    const next = current.map((screen, i) => ({
      ...screen,
      is_entry_point: i === index,
    }));
    form.setValue("screens", next, { shouldValidate: true });
  };

  const handleAddScreen = () => {
    const index = screenFields.length + 1;
    appendScreen({
      key: `screen_${index}`,
      title: `Screen ${index}`,
      is_entry_point: false,
      components: [{ key: `field_${index}_1`, type: "input", label: "Field", variable_key: `field_${index}_1` }],
      actions: [{ key: `next_${index}`, type: "submit", label: "Submit" }],
    });
    setActiveEditorScreenIndex(screenFields.length);
  };

  const handleRemoveScreen = (index: number) => {
    if (screenFields.length <= 1) return;
    removeScreen(index);
    setActiveEditorScreenIndex((prev) => {
      if (prev === index) return Math.max(0, index - 1);
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleReorderScreens = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    moveScreen(fromIndex, toIndex);
    setActiveEditorScreenIndex((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < toIndex && prev > fromIndex && prev <= toIndex) return prev - 1;
      if (fromIndex > toIndex && prev >= toIndex && prev < fromIndex) return prev + 1;
      return prev;
    });
  };

  const submitHandler = async (values: FlowTemplateFormValues) => {
    const payload: CreateFlowPayload | UpdateFlowPayload = {
      name: values.name.trim(),
      template_key: values.template_key.trim(),
      description: values.description?.trim() || undefined,
      category: values.category,
      webhook_mapping: values.webhook_mapping_json?.trim()
        ? JSON.parse(values.webhook_mapping_json)
        : undefined,
      screens: values.screens.map((screen, sIndex) => ({
        key: screen.key.trim(),
        title: screen.title.trim(),
        is_entry_point: Boolean(screen.is_entry_point),
        components: screen.components.map((component) => ({
          key: component.key.trim(),
          type: component.type,
          label: component.label?.trim() || undefined,
          variable_key: component.variable_key?.trim() || undefined,
          placeholder: component.placeholder?.trim() || undefined,
          required: Boolean(component.required),
          helper_text: component.helper_text?.trim() || undefined,
          options: parseOptions(component.options_text),
          min_length: Number.isFinite(component.min_length) ? component.min_length : undefined,
          max_length: Number.isFinite(component.max_length) ? component.max_length : undefined,
          min_value: Number.isFinite(component.min_value) ? component.min_value : undefined,
          max_value: Number.isFinite(component.max_value) ? component.max_value : undefined,
        })),
        actions: screen.actions.map((action) => ({
          key: action.key.trim(),
          type: action.type,
          label: action.label?.trim() || undefined,
          target_screen_key:
            action.target_screen_key?.trim() ||
            (action.type === "previous_screen" && sIndex > 0 ? values.screens[sIndex - 1]?.key?.trim() : undefined),
          url: action.url?.trim() || undefined,
          phone: action.phone?.trim() || undefined,
        })),
      })),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={form.handleSubmit(submitHandler as any)} className="flex flex-col gap-6 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-6 pb-8">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Rocket className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Flow Basics</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Flow Name</Label>
              <Input {...form.register("name")} placeholder="Lead Qualification Form" />
              <InlineError message={form.formState.errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <Label>Template Key</Label>
              <Input
                {...form.register("template_key")}
                placeholder="lead_qualification_form"
                disabled={isUpdate}
                className="font-mono"
              />
              <InlineError message={form.formState.errors.template_key?.message} />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (!isUpdate) {
                        applyCategoryPreset(value as FlowCategory);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FLOW_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                {...form.register("description")}
                rows={3}
                placeholder="Collect lead profile and intent."
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Webhook Mapping JSON (optional)</Label>
              <Textarea
                {...form.register("webhook_mapping_json")}
                rows={4}
                placeholder='{"lead": {"name": "{{answers.full_name}}"}}'
                className="font-mono text-xs"
              />
              <InlineError message={form.formState.errors.webhook_mapping_json?.message} />
            </div>
          </div>
        </div>

        {form.formState.errors.screens?.message && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="size-4" />
            <AlertDescription>{form.formState.errors.screens?.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Screens</p>
              <Badge variant="outline">{screenFields.length}</Badge>
            </div>
            <div className="space-y-2 p-2">
              {screenFields.map((screen, index) => {
                const title = watchedScreens?.[index]?.title || `Screen ${index + 1}`;
                const key = watchedScreens?.[index]?.key || screen.id;
                const isEntry = Boolean(watchedScreens?.[index]?.is_entry_point);
                const isActive = index === activeEditorScreenIndex;
                const isDragged = draggedScreenIndex === index;
                const isDragOver = dragOverScreenIndex === index && draggedScreenIndex !== index;

                return (
                  <div
                    key={screen.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedScreenIndex(index);
                      setDragOverScreenIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverScreenIndex(index);
                    }}
                    onDragLeave={() => {
                      if (dragOverScreenIndex === index) {
                        setDragOverScreenIndex(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedScreenIndex !== null) {
                        handleReorderScreens(draggedScreenIndex, index);
                      }
                      setDraggedScreenIndex(null);
                      setDragOverScreenIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedScreenIndex(null);
                      setDragOverScreenIndex(null);
                    }}
                    className={`w-full rounded-lg border p-2.5 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/40"
                    } ${isDragged ? "opacity-60" : ""} ${isDragOver ? "ring-1 ring-primary/60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => setActiveEditorScreenIndex(index)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium">{title}</p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">{key}</p>
                        {isEntry ? <Badge variant="outline" className="mt-1 h-5 text-[10px]">Entry</Badge> : null}
                      </button>
                      <div className="flex items-center gap-1">
                        <span
                          className="inline-flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground"
                          aria-label={`Drag ${title}`}
                          title="Drag to reorder"
                        >
                          <GripVertical className="size-3.5" />
                        </span>
                        {screenFields.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveScreen(index)}
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${title}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {isDragOver ? (
                      <div className="mt-2 rounded border border-dashed border-primary/50 px-2 py-1 text-[10px] text-primary">
                        Drop here to reorder
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {draggedScreenIndex !== null && (
                <p className="px-1 text-[10px] text-muted-foreground">Release to place screen in new order.</p>
              )}

              <Button type="button" variant="outline" className="mt-1 w-full gap-2 border-dashed" onClick={handleAddScreen}>
                <Plus className="size-4" />
                Add Screen
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            {screenFields[activeEditorScreenIndex] ? (
              <ScreenEditor
                key={screenFields[activeEditorScreenIndex].id}
                form={form}
                control={form.control}
                index={activeEditorScreenIndex}
                onRemove={() => handleRemoveScreen(activeEditorScreenIndex)}
                canRemove={screenFields.length > 1}
                onSetEntryPoint={() => handleSetEntryPoint(activeEditorScreenIndex)}
                screenKeys={watchedScreens?.map((s) => s.key).filter(Boolean) || []}
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            {Object.keys(form.formState.errors).length ? (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertCircle className="size-3.5" />
                Fix validation errors before saving.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                Flow schema looks valid.
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="gap-2 min-w-[160px]">
              {isLoading ? "Saving..." : submitLabel}
              {!isLoading && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      <aside className="hidden xl:block xl:w-[360px] xl:shrink-0">
        <div className="sticky top-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">WhatsApp Flow Preview</h3>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {watchedScreens?.map((screen) => (
              <button
                type="button"
                key={screen.key}
                className={`rounded-md border px-2 py-1 text-[11px] ${previewScreen?.key === screen.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => {
                  setPreviewScreenKey(screen.key);
                  setPreviewHistory([screen.key]);
                }}
              >
                {screen.title || screen.key}
              </button>
            ))}
          </div>

          <FlowScreenPreview
            flowName={form.watch("name") || "Business"}
            category={watchedCategory}
            screen={previewScreen}
            onNavigate={handlePreviewNavigate}
            canGoBack={previewCanGoBack}
            onHeaderBack={handlePreviewBack}
            availableScreenKeys={new Set((watchedScreens || []).map((s) => s.key))}
          />
        </div>
      </aside>
    </form>
  );
}

function ScreenEditor({
  form,
  control,
  index,
  onRemove,
  canRemove,
  onSetEntryPoint,
  screenKeys,
}: {
  form: any;
  control: any;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  onSetEntryPoint: () => void;
  screenKeys: string[];
}) {
  const componentsArray = useFieldArray({
    control,
    name: `screens.${index}.components`,
  });

  const actionsArray = useFieldArray({
    control,
    name: `screens.${index}.actions`,
  });

  const isEntry = form.watch(`screens.${index}.is_entry_point`);
  const title = form.watch(`screens.${index}.title`) || `Screen ${index + 1}`;
  const componentErrors = (form.formState.errors.screens?.[index] as any)?.components;
  const actionErrors = (form.formState.errors.screens?.[index] as any)?.actions;

  const addComponent = () => {
    componentsArray.append({
      key: `field_${index + 1}_${componentsArray.fields.length + 1}`,
      type: "input",
      label: "New Field",
      variable_key: `field_${index + 1}_${componentsArray.fields.length + 1}`,
      required: false,
    });
  };

  const addAction = () => {
    actionsArray.append({
      key: `action_${index + 1}_${actionsArray.fields.length + 1}`,
      type: "next_screen",
      label: "Next",
      target_screen_key: "",
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <div className="mt-1 flex items-center gap-2">
            {isEntry && <Badge variant="outline">Entry Point</Badge>}
            <button type="button" className="text-xs text-primary underline" onClick={onSetEntryPoint}>
              Mark as entry
            </button>
          </div>
        </div>

        {canRemove && (
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onRemove}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        )}
      </header>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Screen Key</Label>
            <Input {...form.register(`screens.${index}.key`)} className="font-mono" />
            <InlineError message={form.formState.errors.screens?.[index]?.key?.message} />
          </div>
          <div className="space-y-1.5">
            <Label>Screen Title</Label>
            <Input {...form.register(`screens.${index}.title`)} />
            <InlineError message={form.formState.errors.screens?.[index]?.title?.message} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Components</h4>
            <Button type="button" variant="outline" size="sm" onClick={addComponent} className="gap-1.5">
              <Plus className="size-3.5" /> Add Component
            </Button>
          </div>

          {componentErrors?.message && <InlineError message={componentErrors?.message} />}

          {componentsArray.fields.map((component, cIndex) => {
            const type = form.watch(`screens.${index}.components.${cIndex}.type`) as FlowComponentType;
            const needsOptions = ["select", "radio", "checkbox"].includes(type);

            return (
              <div key={component.id} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Component {cIndex + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => componentsArray.remove(cIndex)}
                    disabled={componentsArray.fields.length <= 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Key</Label>
                    <Input {...form.register(`screens.${index}.components.${cIndex}.key`)} className="font-mono" />
                    <InlineError message={(componentErrors?.[cIndex] as any)?.key?.message} />
                  </div>

                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Controller
                      control={form.control}
                      name={`screens.${index}.components.${cIndex}.type`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FLOW_COMPONENT_TYPES.map((value) => (
                              <SelectItem key={value} value={value}>
                                {componentTypeLabels[value]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Label</Label>
                    <Input {...form.register(`screens.${index}.components.${cIndex}.label`)} />
                  </div>

                  <div className="space-y-1">
                    <Label>Variable Key</Label>
                    <Input {...form.register(`screens.${index}.components.${cIndex}.variable_key`)} className="font-mono" />
                    <InlineError message={(componentErrors?.[cIndex] as any)?.variable_key?.message} />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label>Placeholder</Label>
                    <Input {...form.register(`screens.${index}.components.${cIndex}.placeholder`)} />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label>Helper Text</Label>
                    <Input {...form.register(`screens.${index}.components.${cIndex}.helper_text`)} />
                  </div>

                  {needsOptions && (
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Options (one per line, format: Label|value)</Label>
                      <Textarea
                        rows={3}
                        className="font-mono text-xs"
                        {...form.register(`screens.${index}.components.${cIndex}.options_text`)}
                        placeholder={"High|high\nMedium|medium\nLow|low"}
                      />
                      <InlineError message={(componentErrors?.[cIndex] as any)?.options_text?.message} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <div className="space-y-1">
                      <Label>Min Length</Label>
                      <Input type="number" {...form.register(`screens.${index}.components.${cIndex}.min_length`)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Max Length</Label>
                      <Input type="number" {...form.register(`screens.${index}.components.${cIndex}.max_length`)} />
                      <InlineError message={(componentErrors?.[cIndex] as any)?.max_length?.message} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <div className="space-y-1">
                      <Label>Min Value</Label>
                      <Input type="number" {...form.register(`screens.${index}.components.${cIndex}.min_value`)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Max Value</Label>
                      <Input type="number" {...form.register(`screens.${index}.components.${cIndex}.max_value`)} />
                      <InlineError message={(componentErrors?.[cIndex] as any)?.max_value?.message} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Controller
                      control={form.control}
                      name={`screens.${index}.components.${cIndex}.required`}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={Boolean(field.value)}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4"
                        />
                      )}
                    />
                    <span className="text-xs text-muted-foreground">Required field</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Actions</h4>
            <Button type="button" variant="outline" size="sm" onClick={addAction} className="gap-1.5">
              <Plus className="size-3.5" /> Add Action
            </Button>
          </div>

          {actionErrors?.message && <InlineError message={actionErrors?.message} />}

          {actionsArray.fields.map((action, aIndex) => {
            const type = form.watch(`screens.${index}.actions.${aIndex}.type`) as FlowActionType;

            return (
              <div key={action.id} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Action {aIndex + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => actionsArray.remove(aIndex)}
                    disabled={actionsArray.fields.length <= 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Key</Label>
                    <Input {...form.register(`screens.${index}.actions.${aIndex}.key`)} className="font-mono" />
                    <InlineError message={(actionErrors?.[aIndex] as any)?.key?.message} />
                  </div>

                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Controller
                      control={form.control}
                      name={`screens.${index}.actions.${aIndex}.type`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FLOW_ACTION_TYPES.map((value) => (
                              <SelectItem key={value} value={value}>
                                {actionTypeLabels[value]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Label</Label>
                    <Input {...form.register(`screens.${index}.actions.${aIndex}.label`)} />
                  </div>

                  {(type === "next_screen" || type === "previous_screen") && (
                    <div className="space-y-1">
                      <Label>Target Screen</Label>
                      <Controller
                        control={form.control}
                        name={`screens.${index}.actions.${aIndex}.target_screen_key`}
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select screen" />
                            </SelectTrigger>
                            <SelectContent>
                              {screenKeys.map((key) => (
                                <SelectItem key={key} value={key}>
                                  {key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <InlineError message={(actionErrors?.[aIndex] as any)?.target_screen_key?.message} />
                    </div>
                  )}

                  {type === "open_url" && (
                    <div className="space-y-1 sm:col-span-2">
                      <Label>URL</Label>
                      <Input placeholder="https://example.com" {...form.register(`screens.${index}.actions.${aIndex}.url`)} />
                      <InlineError message={(actionErrors?.[aIndex] as any)?.url?.message} />
                    </div>
                  )}

                  {type === "call_phone" && (
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Phone</Label>
                      <Input placeholder="+14155552671" {...form.register(`screens.${index}.actions.${aIndex}.phone`)} />
                      <InlineError message={(actionErrors?.[aIndex] as any)?.phone?.message} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FlowScreenPreview({
  flowName,
  category,
  screen,
  onNavigate,
  canGoBack,
  onHeaderBack,
  availableScreenKeys,
}: {
  flowName: string;
  category: FlowCategory;
  screen?: FlowTemplateFormValues["screens"][number];
  onNavigate: (action: FlowTemplateFormValues["screens"][number]["actions"][number]) => void;
  canGoBack: boolean;
  onHeaderBack: () => void;
  availableScreenKeys: Set<string>;
}) {
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light");
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string | string[]>>({});
  const t = PREVIEW_THEMES[previewTheme];

  useEffect(() => {
    setIsFlowModalOpen(false);
    setSubmitted(false);
    setPreviewValues({});
  }, [category, flowName]);

  if (!screen) {
    return <p className="text-xs text-muted-foreground">No screen available for preview.</p>;
  }

  const setValue = (key: string | undefined, value: string | string[]) => {
    if (!key) return;
    setPreviewValues((prev) => ({ ...prev, [key]: value }));
  };

  const getStringValue = (key: string | undefined): string => {
    if (!key) return "";
    const val = previewValues[key];
    return Array.isArray(val) ? "" : (val ?? "");
  };

  const getArrayValue = (key: string | undefined): string[] => {
    if (!key) return [];
    const val = previewValues[key];
    return Array.isArray(val) ? val : [];
  };

  const runAction = (action: FlowTemplateFormValues["screens"][number]["actions"][number]) => {
    const targetExists = action.target_screen_key && availableScreenKeys.has(action.target_screen_key);
    const canNavigate = action.type === "previous_screen" || (action.type === "next_screen" && targetExists);

    if (canNavigate) {
      onNavigate(action);
      return;
    }
    if (action.type === "submit") {
      setSubmitted(true);
      return;
    }
    if (action.type === "open_url" && action.url) {
      window.open(action.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (action.type === "call_phone" && action.phone) {
      window.open(`tel:${action.phone}`, "_self");
    }
  };

  const renderInteractiveFlowDialog = () => {
    const primaryAction =
      screen.actions.find((action) => action.type === "next_screen" || action.type === "submit") || screen.actions[0];
    const secondaryActions = screen.actions.filter((action) => action.key !== primaryAction?.key);

    return (
      <div
        className="grid h-full w-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
        style={{ background: "#f3f3f3" }}
      >
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-3 py-2">
          {canGoBack ? (
            <button
              type="button"
              className="flex size-5 items-center justify-center text-[#111827]"
              onClick={onHeaderBack}
              aria-label="Go to previous screen"
            >
              <ChevronLeft className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              className="text-[18px] leading-none text-[#111827]"
              onClick={() => setIsFlowModalOpen(false)}
              aria-label="Close flow preview"
            >
              ×
            </button>
          )}
          <p className="max-w-[190px] truncate px-2 text-center text-[12px] font-medium text-[#111827]">
            {screen.title || flowName || "Flow Form"}
          </p>
          <span className="w-5" />
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto px-3 py-3">
          <p className="text-[10px] uppercase tracking-wide text-[#6b7280]">{category.replace(/_/g, " ")}</p>

          {screen.components.map((component) => {
            const label = component.label || component.key;
            const inputTypeMap: Partial<Record<FlowComponentType, string>> = {
              input: "text",
              email: "email",
              phone: "tel",
              number: "number",
              date: "date",
              time: "time",
              textarea: "text",
            };

            if (component.type === "text" || component.type === "summary") {
              return (
                <div key={component.key}>
                  <p className="text-[13px] font-semibold leading-snug text-[#111827]">{label}</p>
                </div>
              );
            }

            if (component.type === "radio") {
              const options = parseOptions(component.options_text);
              const selected = getStringValue(component.variable_key);
              return (
                <div key={component.key} className="space-y-2">
                  <p className="text-[13px] font-semibold text-[#111827]">
                    {label}
                    {component.required ? <span className="text-[#dc2626]"> *</span> : null}
                  </p>
                  <p className="text-[11px] text-[#4b5563]">Choose one</p>
                  {(options.length ? options : [{ label: "Option", value: "option" }]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue(component.variable_key, opt.value)}
                      className="flex w-full items-center justify-between py-1 text-[13px] text-[#111827]"
                    >
                      <span>{opt.label}</span>
                      <span className={`size-[14px] rounded-full border ${selected === opt.value ? "border-[#22c55e]" : "border-[#6b7280]"}`}>
                        {selected === opt.value ? <span className="m-[2px] block size-[8px] rounded-full bg-[#22c55e]" /> : null}
                      </span>
                    </button>
                  ))}
                </div>
              );
            }

            if (component.type === "checkbox") {
              const options = parseOptions(component.options_text);
              const selected = getArrayValue(component.variable_key);
              return (
                <div key={component.key} className="space-y-2">
                  <p className="text-[13px] font-semibold text-[#111827]">
                    {label}
                    {component.required ? <span className="text-[#dc2626]"> *</span> : null}
                  </p>
                  {(options.length ? options : [{ label: "Option", value: "option" }]).map((opt) => {
                    const checked = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const next = checked ? selected.filter((value) => value !== opt.value) : [...selected, opt.value];
                          setValue(component.variable_key, next);
                        }}
                        className="flex w-full items-center justify-between py-1 text-[13px] text-[#111827]"
                      >
                        <span>{opt.label}</span>
                        <span className={`flex size-[16px] items-center justify-center rounded border ${checked ? "border-[#22c55e] bg-[#22c55e]" : "border-[#6b7280]"}`}>
                          {checked ? <Check className="size-3 text-white" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            }

            if (component.type === "select") {
              const options = parseOptions(component.options_text);
              return (
                <div key={component.key} className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-[#111827]">
                    {label}
                    {component.required ? <span className="text-[#dc2626]"> *</span> : null}
                  </p>
                  <select
                    value={getStringValue(component.variable_key)}
                    onChange={(e) => setValue(component.variable_key, e.target.value)}
                    className="w-full rounded-[8px] border border-[#b7b7b7] bg-transparent px-3 py-3 text-[13px] text-[#111827] outline-none"
                  >
                    <option value="">{component.placeholder || "Select option"}</option>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (component.type === "textarea") {
              return (
                <div key={component.key} className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-[#111827]">
                    {label}
                    {component.required ? <span className="text-[#dc2626]"> *</span> : null}
                  </p>
                  <textarea
                    rows={4}
                    value={getStringValue(component.variable_key)}
                    onChange={(e) => setValue(component.variable_key, e.target.value)}
                    placeholder={component.placeholder || "Type here"}
                    className="w-full resize-none rounded-[8px] border border-[#22c55e] bg-transparent px-3 py-2 text-[13px] text-[#111827] outline-none"
                  />
                  <div className="text-right text-[10px] text-[#6b7280]">{`${getStringValue(component.variable_key).length} / 600`}</div>
                </div>
              );
            }

            const type = inputTypeMap[component.type] || "text";
            return (
              <div key={component.key} className="space-y-1.5">
                <p className="text-[13px] font-semibold text-[#111827]">
                  {label}
                  {component.required ? <span className="text-[#dc2626]"> *</span> : null}
                </p>
                <input
                  type={type}
                  value={getStringValue(component.variable_key)}
                  onChange={(e) => setValue(component.variable_key, e.target.value)}
                  placeholder={component.placeholder || componentTypeLabels[component.type]}
                  className="w-full rounded-[8px] border border-[#b7b7b7] bg-transparent px-3 py-2 text-[13px] text-[#111827] outline-none"
                />
              </div>
            );
          })}

          {secondaryActions.length > 0 ? (
            <div className="space-y-1 border-t border-[#e2e2e2] pt-2">
              {secondaryActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => runAction(action)}
                  className="text-xs font-medium text-[#0284c7]"
                >
                  {action.label || actionTypeLabels[action.type]}
                </button>
              ))}
            </div>
          ) : null}

          {submitted ? <p className="text-[11px] text-[#16a34a]">Flow submitted in preview mode.</p> : null}
        </div>

        <div className="border-t border-[#e0e0e0] bg-[#f3f3f3] px-3 py-2">
          <button
            type="button"
            onClick={() => primaryAction && runAction(primaryAction)}
            className="w-full rounded-full bg-[#22c55e] py-2.5 text-[13px] font-semibold text-white"
          >
            {primaryAction?.label || "Continue"}
          </button>
          <p className="mt-2 text-center text-[10px] text-[#6b7280]">
            Managed by the business. <span className="text-[#16a34a]">Learn more</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-3 flex w-70 items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</span>
        <button
          type="button"
          onClick={() => setPreviewTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          aria-label={`Switch to ${previewTheme === "dark" ? "light" : "dark"} mode`}
          className="group flex items-center gap-0 overflow-hidden rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          style={{ borderColor: previewTheme === "dark" ? "#2a3942" : "#d1e7dd" }}
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-all duration-300"
            style={{
              background: previewTheme === "dark" ? "#1e2d35" : "transparent",
              color: previewTheme === "dark" ? "#e9edef" : "#94a3b8",
            }}
          >
            <Moon className="size-3" />
            <span>Dark</span>
          </div>
          <div
            className="h-5 w-px transition-colors duration-300"
            style={{ background: previewTheme === "dark" ? "#2a3942" : "#d1e7dd" }}
          />
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-all duration-300"
            style={{
              background: previewTheme === "light" ? "#f0fdf4" : "transparent",
              color: previewTheme === "light" ? "#16a34a" : "#94a3b8",
            }}
          >
            <Sun className="size-3" />
            <span>Light</span>
          </div>
        </button>
      </div>

      <div
        className="w-70 rounded-[36px] p-3 shadow-2xl transition-colors duration-300"
        style={{
          background: t.phoneBg,
          border: `1.5px solid ${t.phoneBorder}`,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div className="mb-1.5 flex justify-center">
          <div className="h-[4px] w-14 rounded-full bg-slate-600 opacity-50" />
        </div>

        <div className="flex items-center justify-between px-3 pb-1.5">
          <span className="text-[10px] font-semibold" style={{ color: t.statusText }}>
            9:41
          </span>
          <div className="flex items-center gap-1" style={{ color: t.statusText }}>
            <Signal className="size-3" />
            <Wifi className="size-3" />
            <Battery className="size-3.5" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-300" style={{ background: t.appHeaderBg }}>
          <ChevronLeft className="size-4" style={{ color: t.appHeaderText }} />
          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
            {flowName ? flowName[0].toUpperCase() : "B"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold leading-tight" style={{ color: t.appHeaderText }}>
              {flowName || "Business"}
            </p>
            <p className="text-[9px]" style={{ color: t.appHeaderSub }}>
              Business Account
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3" style={{ color: t.appHeaderText }}>
            <svg className="h-[14px] w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg className="h-[14px] w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        </div>

        <div
          className={`relative h-95 transition-colors rounded-b-3xl duration-300 ${isFlowModalOpen ? "overflow-hidden p-0" : "overflow-y-auto px-3 pb-10 pt-3"
            }`}
          style={{
            background: t.chatBg,
            backgroundImage: `radial-gradient(${t.wallpaperDot} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        >
          <div className="ml-auto max-w-[95%]">
            <div
              className="overflow-hidden rounded-[10px] rounded-tr-[2px] shadow-[0_1px_1px_rgba(0,0,0,0.12)]"
              style={{ background: t.bubbleBg }}
            >
              <div className="px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.subtleText }}>
                  {category.replace(/_/g, " ")}
                </p>
                <p className="text-[13px] font-semibold" style={{ color: t.headingText }}>
                  {flowName || "Business Flow"}
                </p>
                <p className="text-[11px]" style={{ color: t.bodyText }}>
                  Tap below to open and interact with the flow.
                </p>
              </div>
              <div style={{ borderTop: `1px solid ${t.dividerColor}` }}>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 px-2 py-2 text-[12.5px] font-medium"
                  style={{ color: t.buttonColor }}
                  onClick={() => setIsFlowModalOpen(true)}
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Open Flow</span>
                </button>
              </div>
            </div>
          </div>

          {isFlowModalOpen && (
            <div
              className="absolute inset-0 z-40 overflow-hidden"
              style={{
                background: t.chatBg,
                backgroundImage: `radial-gradient(${t.wallpaperDot} 1px, transparent 1px)`,
                backgroundSize: "16px 16px",
              }}
            >
              <div className="h-full">
                <div className="h-full">{renderInteractiveFlowDialog()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
