import {
  CircleHelp,
  ContactRound,
  CreditCard,
  Form,
  LayoutDashboard,
  LayoutPanelTop,
  Megaphone,
  MessageSquareText,
  Settings,
  Users
} from "lucide-react";
import type { ReactNode } from "react";

export const RouteIcons: Record<string, ReactNode> = {
  Dashboard: <LayoutDashboard />,
  Templates: <LayoutPanelTop />,
  Flows: <Form />,
  Users: <Users />,
  Support: <CircleHelp />,
  "Subscription Plans": <CreditCard />,
  Settings: <Settings />,
  Chat: <MessageSquareText />,
  Contacts: <ContactRound />,
  Campaigns: <Megaphone />,
};
