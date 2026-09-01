/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
// hooks
import { useDepartment } from "@/hooks/store/use-department";
import { useProject } from "@/hooks/store/use-project";
import { useDepartmentProjectGroups } from "@/hooks/use-department-project-groups";

export const ProjectDepartmentSummary = observer(function ProjectDepartmentSummary() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { filteredProjectIds } = useProject();
  const { fetchDepartments } = useDepartment();
  const [collapsedDepartments, setCollapsedDepartments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (workspaceSlug) fetchDepartments(workspaceSlug.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const departmentGroups = useDepartmentProjectGroups();

  const toggleDepartment = (departmentId: string) => {
    setCollapsedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  };

  if (departmentGroups.length <= 1) return null;

  const totalProjects = filteredProjectIds?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-page-x pt-page-y">
      <div className="rounded-md border border-subtle">
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <span className="text-14 font-medium text-primary">{t("project_departments.title")}</span>
          <span className="text-13 text-secondary">
            {t("project_departments.total_projects", { count: totalProjects })}
          </span>
        </div>
        <div className="divide-y divide-subtle">
          {departmentGroups.map(({ departmentId, departmentName, projects, averageProgress }) => {
            const isCollapsed = collapsedDepartments.has(departmentId);
            return (
              <div key={departmentId || "__no_department__"}>
                <button
                  type="button"
                  onClick={() => toggleDepartment(departmentId)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-surface-1"
                >
                  <span className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" />
                    ) : (
                      <ChevronDownIcon className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" />
                    )}
                    <span className="text-13 font-medium text-primary">{departmentName}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full bg-accent-primary"
                          style={{ width: `${averageProgress}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-12 text-secondary">{averageProgress}%</span>
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-12 text-secondary">
                      {t("project_departments.total_projects", { count: projects.length })}
                    </span>
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="pb-2">
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/${workspaceSlug}/projects/${project.id}/issues`}
                        className="flex items-center gap-2 py-1.5 pr-4 pl-10 text-13 text-secondary hover:bg-surface-1 hover:text-primary"
                      >
                        <Logo logo={project.logo_props} size={14} />
                        <span className="flex-1 truncate">{project.name}</span>
                        <span className="h-1.5 w-16 flex-shrink-0 overflow-hidden rounded-full bg-surface-2">
                          <span
                            className="block h-full rounded-full bg-accent-primary"
                            style={{ width: `${project.progress ?? 0}%` }}
                          />
                        </span>
                        <span className="w-8 flex-shrink-0 text-right text-12 text-secondary">
                          {project.progress ?? 0}%
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
