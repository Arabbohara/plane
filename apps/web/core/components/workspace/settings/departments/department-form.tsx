/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TDepartment } from "@plane/types";
import { Input } from "@plane/ui";
import { generateRandomColor, hslToHex } from "@plane/utils";

type Props = {
  department?: TDepartment;
  onSubmit: (data: Pick<TDepartment, "name" | "prefix" | "color">) => Promise<void>;
  onCancel: () => void;
};

/** Inline form used to create a department or edit its name, prefix and color */
export function DepartmentForm(props: Props) {
  const { department, onSubmit, onCancel } = props;
  const { t } = useTranslation();
  const [name, setName] = useState(department?.name ?? "");
  const [prefix, setPrefix] = useState(department?.prefix ?? "");
  const [color, setColor] = useState(department?.color || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        prefix: prefix.trim().toUpperCase(),
        color: color || hslToHex(generateRandomColor(trimmedName)),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-md border border-subtle px-4 py-3"
    >
      <input
        type="color"
        value={color || "#8b8d98"}
        onChange={(e) => setColor(e.target.value)}
        aria-label={t("workspace_settings.settings.departments.color")}
        title={t("workspace_settings.settings.departments.color")}
        className="size-7 flex-shrink-0 cursor-pointer rounded-sm border border-subtle bg-transparent p-0.5"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("workspace_settings.settings.departments.name_placeholder")}
        className="min-w-40 flex-1 text-13"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
      <Input
        value={prefix}
        onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 10))}
        placeholder={t("workspace_settings.settings.departments.prefix_placeholder")}
        className="w-36 text-13 uppercase placeholder:normal-case"
      />
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="lg" type="button" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={!name.trim()}>
          {department ? t("save") : t("add")}
        </Button>
      </div>
    </form>
  );
}
