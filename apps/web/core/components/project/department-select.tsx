/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSearchSelect, Input } from "@plane/ui";
import { cn, generateRandomColor, hslToHex } from "@plane/utils";
// hooks
import { useDepartment } from "@/hooks/store/use-department";

type Props = {
  value: string | null | undefined;
  onChange: (departmentId: string | null, prefix?: string) => void;
  disabled?: boolean;
  buttonClassName?: string;
};

export const DepartmentSelect = observer(function DepartmentSelect(props: Props) {
  const { value, onChange, disabled, buttonClassName } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { workspaceDepartments, fetchDepartments, createDepartment } = useDepartment();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspaceSlug) fetchDepartments(workspaceSlug.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const departments = workspaceDepartments ?? [];
  const selected = departments.find((department) => department.id === value);

  const options = departments.map((department) => ({
    value: department.id,
    query: department.name,
    content: <span className="truncate">{department.name}</span>,
  }));

  const handleCreate = async () => {
    if (!workspaceSlug || !newName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const department = await createDepartment(workspaceSlug.toString(), {
        name: newName.trim(),
        prefix: newPrefix.trim().toUpperCase(),
        color: hslToHex(generateRandomColor(newName.trim())),
      });
      onChange(department.id, department.prefix);
      setIsCreating(false);
      setNewName("");
      setNewPrefix("");
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: error?.name?.[0] ?? error?.prefix?.[0] ?? t("something_went_wrong"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomSearchSelect
      value={value ?? null}
      onChange={(val: string) => {
        const department = departments.find((d) => d.id === val);
        onChange(val, department?.prefix);
      }}
      options={options}
      label={
        selected ? (
          <span className="truncate">{selected.name}</span>
        ) : (
          <span className="text-placeholder">{t("common.project_department")}</span>
        )
      }
      buttonClassName={cn("rounded-md !border-subtle font-medium !shadow-none", buttonClassName)}
      input
      disabled={disabled}
      footerOption={
        <div className="mt-2 border-t border-subtle px-2 pt-2">
          {isCreating ? (
            <div className="flex flex-col gap-1.5">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("project_department_placeholder")}
                className="text-12"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              <Input
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="VGL"
                className="text-12 uppercase"
              />
              <div className="flex items-center gap-1.5">
                <Button size="sm" onClick={handleCreate} loading={isSubmitting} disabled={!newName.trim()}>
                  {t("add")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-1 rounded-sm px-1 py-1.5 text-13 text-secondary hover:bg-layer-transparent-hover"
              onClick={() => setIsCreating(true)}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t("add")} {t("common.project_department")}
            </button>
          )}
        </div>
      }
    />
  );
});
