import React from "react";
import {
  MessageSquare,
  ShieldCheck,
  LayoutGrid,
  Zap,
  ChevronRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Template type definitions ─────────────────────────────────
export type TemplateTypeId = "standard" | "authentication" | "carousel" | "flow";

export interface TemplateTypeDefinition {
  id: TemplateTypeId;
  label: string;
  tagline: string;
  description: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  categoryLabel: string;
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
  borderAccent: string;
  bgLight: string;
  useCases: string[];
  features: string[];
  popular?: boolean;
  complexity: "Easy" | "Medium" | "Advanced";
  complexityColor: string;
  example: string;
}

export const TEMPLATE_TYPES: TemplateTypeDefinition[] = [
  {
    id: "standard",
    label: "Standard",
    tagline: "Text + Media + Buttons",
    description:
      "The most versatile template. Send messages with a header (text, image, video or document), a body with your main content, an optional footer, and up to 3 action buttons.",
    category: "MARKETING",
    categoryLabel: "Marketing / Utility",
    icon: MessageSquare,
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "text-blue-600",
    borderAccent: "border-blue-200 hover:border-blue-400",
    bgLight: "bg-blue-50",
    useCases: [
      "🛍️ Product promotions & offers",
      "📦 Order & shipping updates",
      "📅 Appointment reminders",
      "📢 Announcements",
    ],
    features: [
      "Optional image / video / document header",
      "Rich body text with dynamic variables",
      "Footer disclaimer text",
      "Up to 3 buttons (URL, call, quick reply)",
    ],
    popular: true,
    complexity: "Easy",
    complexityColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    example: '"Hi {{1}}, your order #{{2}} has shipped! Track it here 👉"',
  },
  {
    id: "authentication",
    label: "Authentication",
    tagline: "One-Time Password (OTP)",
    description:
      "Specifically designed for sending verification codes and OTPs. WhatsApp auto-formats the code prominently, making it impossible for users to miss. Includes a built-in security disclaimer.",
    category: "AUTHENTICATION",
    categoryLabel: "Authentication",
    icon: ShieldCheck,
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "text-emerald-600",
    borderAccent: "border-emerald-200 hover:border-emerald-400",
    bgLight: "bg-emerald-50",
    useCases: [
      "🔐 Login verification codes",
      "✅ Account registration OTP",
      "💳 Payment confirmation codes",
      "🔑 Password reset codes",
    ],
    features: [
      "Auto-formatted OTP display",
      "Built-in 'Do not share' security warning",
      "One-tap copy button for the code",
      "Compliant with WhatsApp auth policies",
    ],
    complexity: "Easy",
    complexityColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    example: '"123456 is your verification code. Do not share it with anyone."',
  },
  {
    id: "carousel",
    label: "Carousel",
    tagline: "Horizontal Scrolling Cards",
    description:
      "Showcase multiple items as swipeable cards inside a single message. Each card has its own image, description text, and action buttons. Perfect for catalogs and menus.",
    category: "MARKETING",
    categoryLabel: "Marketing",
    icon: LayoutGrid,
    gradient: "from-violet-500 to-purple-600",
    accentColor: "text-violet-600",
    borderAccent: "border-violet-200 hover:border-violet-400",
    bgLight: "bg-violet-50",
    useCases: [
      "🏪 Product catalog browsing",
      "🍽️ Restaurant menu showcase",
      "🏨 Hotel room options",
      "📱 App feature highlights",
    ],
    features: [
      "Up to 10 swipeable cards",
      "Each card has its own image",
      "Per-card text and buttons",
      "Intro body message above cards",
    ],
    complexity: "Medium",
    complexityColor: "text-amber-600 bg-amber-50 border-amber-200",
    example: '"Check out our latest collection 👇"  [Card 1] [Card 2] ...',
  },
  {
    id: "flow",
    label: "Flow",
    tagline: "Interactive Multi-Step Form",
    description:
      "Launch a WhatsApp Flow — an interactive form that opens inside WhatsApp. Users fill it out without leaving the chat. Ideal for collecting detailed info through a guided experience.",
    category: "UTILITY",
    categoryLabel: "Utility",
    icon: Zap,
    gradient: "from-orange-500 to-amber-500",
    accentColor: "text-orange-600",
    borderAccent: "border-orange-200 hover:border-orange-400",
    bgLight: "bg-orange-50",
    useCases: [
      "📋 Lead capture forms",
      "📝 Customer surveys",
      "🗓️ Appointment booking",
      "🎫 Event registration",
    ],
    features: [
      "Opens a multi-step form in WhatsApp",
      "Collects structured data from users",
      "No app download needed",
      "Requires a Flow created in Meta",
    ],
    complexity: "Advanced",
    complexityColor: "text-rose-600 bg-rose-50 border-rose-200",
    example: '"Hi {{1}}, please complete your profile to get started."',
  },
];

// ── Component ─────────────────────────────────────────────────
interface TemplateTypeSelectorProps {
  selected: TemplateTypeId | null;
  onSelect: (type: TemplateTypeId) => void;
}

export default function TemplateTypeSelector({
  selected,
  onSelect,
}: TemplateTypeSelectorProps) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight">
          What kind of template do you want to create?
        </h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto">
          Choose the template type that matches your goal. Don't worry — you
          can see a live WhatsApp preview of your message as you build it.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TEMPLATE_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`
                relative flex flex-col text-left rounded-2xl border-2 p-5 transition-all duration-200 group
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${
                  isSelected
                    ? `border-primary bg-primary/5 shadow-lg shadow-primary/10`
                    : `bg-card border-border ${type.borderAccent} hover:shadow-md hover:shadow-black/5`
                }
              `}
            >
              {/* Selected tick */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                </div>
              )}

              {/* Popular badge */}
              {type.popular && !isSelected && (
                <div className="absolute top-3 right-3">
                  <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-200 gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    Popular
                  </Badge>
                </div>
              )}

              {/* Icon */}
              <div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105
                  bg-gradient-to-br ${type.gradient}
                `}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Title & tagline */}
              <div className="mb-3">
                <h3 className="font-bold text-base leading-tight">{type.label}</h3>
                <p className={`text-xs font-medium mt-0.5 ${type.accentColor}`}>
                  {type.tagline}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
                {type.description}
              </p>

              {/* Complexity badge */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${type.complexityColor}`}
                >
                  {type.complexity}
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border">
                  {type.categoryLabel}
                </span>
              </div>

              {/* Use cases */}
              <div className="space-y-1 mb-4">
                {type.useCases.slice(0, 3).map((uc) => (
                  <p key={uc} className="text-[11px] text-muted-foreground">
                    {uc}
                  </p>
                ))}
              </div>

              {/* CTA */}
              <div
                className={`
                  flex items-center gap-1 text-xs font-semibold transition-all duration-200 mt-auto pt-3 border-t
                  ${isSelected ? "text-primary border-primary/20" : `${type.accentColor} border-border`}
                `}
              >
                {isSelected ? "Selected ✓" : "Select this type"}
                {!isSelected && (
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Help note */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        💡 Not sure which to pick?{" "}
        <span className="font-medium text-foreground">Standard</span> works for
        90% of use cases. You can always create more templates later.
      </p>
    </div>
  );
}
