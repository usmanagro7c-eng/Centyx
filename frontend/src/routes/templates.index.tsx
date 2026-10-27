import { createFileRoute } from "@tanstack/react-router";
import { TemplatesMarketplace } from "@/components/templates/templates-marketplace";

export const Route = createFileRoute("/templates/")({
  head: () => ({
    meta: [
      { title: "Browse Templates — Aether" },
      { name: "description", content: "Professionally designed templates for stores, portfolios and brands." },
    ],
  }),
  component: TemplatesMarketplace,
});
