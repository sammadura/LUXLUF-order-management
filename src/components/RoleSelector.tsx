"use client";

import { useRouter } from "next/navigation";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/types";

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  hailey: "Create orders, manage all statuses, oversee operations",
  receptionist: "View orders, send hard announcements",
  designer: "View incoming orders, mark as in preparation",
  driver: "View assigned orders, confirm deliveries with photos",
};

export default function RoleSelector() {
  const router = useRouter();

  function selectRole(role: Role) {
    document.cookie = `luxluf-role=${role};path=/;max-age=${60 * 60 * 24 * 30}`;
    router.push("/dashboard");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ROLES.map((role) => (
        <button
          key={role}
          onClick={() => selectRole(role)}
          className="card text-left group hover:border-luxluf-500 hover:shadow-md transition-all duration-200"
        >
          <h3 className="font-serif text-lg text-luxluf-800 group-hover:text-luxluf-600 transition-colors">
            {ROLE_LABELS[role]}
          </h3>
          <p className="mt-2 text-sm text-luxluf-500 leading-relaxed">
            {ROLE_DESCRIPTIONS[role]}
          </p>
        </button>
      ))}
    </div>
  );
}
