import { Sport } from "@/lib/types";

export const sports: Record<string, Sport> = {
  football: { id: "football", name: "Football", icon: "Circle" },
  basketball: { id: "basketball", name: "Basketball", icon: "Circle" },
  tennis: { id: "tennis", name: "Tennis", icon: "Circle" },
  baseball: { id: "baseball", name: "Baseball", icon: "Circle" },
  hockey: { id: "hockey", name: "Hockey", icon: "Circle" },
  mma: { id: "mma", name: "MMA", icon: "Circle" },
  boxing: { id: "boxing", name: "Boxing", icon: "Circle" },
  cricket: { id: "cricket", name: "Cricket", icon: "Circle" },
};

export function getSport(id: string): Sport {
  return sports[id] ?? { id, name: id.charAt(0).toUpperCase() + id.slice(1), icon: "Circle" };
}
