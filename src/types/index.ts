import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type StatusLevel = "safe" | "active" | "warning" | "critical" | "offline";

export type FeaturePreview = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "info" | "alert" | "success";
};

export type StatPlaceholder = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export type Theme = "light" | "dark" | "system";
