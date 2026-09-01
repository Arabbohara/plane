/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useDepartment } from "@/hooks/store/use-department";
import { useDepartmentProjectGroups } from "@/hooks/use-department-project-groups";

export const HomeProjectProgressSummary = observer(function HomeProjectProgressSummary() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { fetchDepartments } = useDepartment();
  const departmentGroups = useDepartmentProjectGroups();

  useEffect(() => {
    if (workspaceSlug) fetchDepartments(workspaceSlug.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  if (departmentGroups.length === 0) return null;

  return (
    <div className="mb-4 rounded-md border border-subtle">
      <div className="border-b border-subtle px-4 py-2.5">
        <span className="text-13 font-medium text-primary">{t("home.project_progress.title")}</span>
      </div>
      <div className="divide-y divide-subtle">
        {departmentGroups.map(({ departmentId, departmentName, projects, averageProgress }) => (
          <div key={departmentId || "__no_department__"} className="flex items-center justify-between gap-3 px-4 py-2">
            <span className="truncate text-13 text-secondary">{departmentName}</span>
            <span className="flex flex-shrink-0 items-center gap-2">
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full bg-accent-primary"
                  style={{ width: `${averageProgress}%` }}
                />
              </span>
              <span className="w-9 text-right text-12 text-secondary">{averageProgress}%</span>
              <span className="w-10 text-right text-12 text-tertiary">
                {t("project_departments.total_projects", { count: projects.length })}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
