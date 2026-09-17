"use client";

import { ADMIN_PERMISSION_KEYS, ADMIN_PERMISSION_LABELS, type AdminPermissions } from "@/lib/types";
import { updateAdminPermissionsAction } from "@/app/actions/committee";

export function AdminPermissionsForm({
  userId,
  permissions,
}: {
  userId: string;
  permissions: AdminPermissions;
}) {
  return (
    <form action={updateAdminPermissionsAction} className="mt-3 space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <div className="grid gap-2 sm:grid-cols-2">
        {ADMIN_PERMISSION_KEYS.map((key) => (
          <label
            key={key}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-1 text-sm font-semibold text-script"
          >
            <input
              type="checkbox"
              name={key}
              defaultChecked={permissions[key]}
              className="ui-checkbox"
            />
            {ADMIN_PERMISSION_LABELS[key]}
          </label>
        ))}
      </div>
      <button
        type="submit"
        className="ui-file-button"
      >
        Save tools
      </button>
    </form>
  );
}
