/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useDepartment } from "@/hooks/store/use-department";

type Props = {
  departmentId: string | null | undefined;
  workspaceSlug: string;
};

/** Shows which department granted a project membership */
export const DepartmentSourceBadge = observer(function DepartmentSourceBadge(props: Props) {
  const { departmentId, workspaceSlug } = props;
  const { t } = useTranslation();
  const { fetchedMap, getDepartmentById, fetchDepartments } = useDepartment();

  useEffect(() => {
    if (departmentId && workspaceSlug && !fetchedMap[workspaceSlug]) void fetchDepartments(workspaceSlug);
  }, [departmentId, workspaceSlug, fetchedMap, fetchDepartments]);

  const department = getDepartmentById(departmentId);
  if (!department) return null;

  return (
    <Tooltip tooltipContent={t("workspace_settings.settings.departments.via_department_tooltip")}>
      <span className="inline-flex max-w-32 flex-shrink-0 items-center gap-1 rounded-sm bg-layer-2 px-1.5 py-0.5 text-caption-sm-medium text-secondary">
        <span
          className="size-1.5 flex-shrink-0 rounded-full bg-layer-3"
          style={department.color ? { backgroundColor: department.color } : undefined}
        />
        <span className="truncate">
          {t("workspace_settings.settings.departments.via_department", { name: department.name })}
        </span>
      </span>
    </Tooltip>
  );
});
