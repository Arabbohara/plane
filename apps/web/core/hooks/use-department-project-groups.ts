/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
import type { TProject } from "@plane/types";
import { useDepartment } from "@/hooks/store/use-department";
import { useProject } from "@/hooks/store/use-project";

export type TDepartmentProjectGroup = {
  departmentId: string;
  departmentName: string;
  projects: TProject[];
  averageProgress: number;
};

export const averageProjectProgress = (projects: TProject[]) => {
  if (projects.length === 0) return 0;
  const total = projects.reduce((sum, project) => sum + (project.progress ?? 0), 0);
  return Math.round(total / projects.length);
};

export const useDepartmentProjectGroups = (): TDepartmentProjectGroup[] => {
  const { t } = useTranslation();
  const { filteredProjectIds, getProjectById } = useProject();
  const { getDepartmentById } = useDepartment();

  return useMemo(() => {
    const groups = new Map<string, TProject[]>();
    (filteredProjectIds ?? []).forEach((projectId) => {
      const project = getProjectById(projectId);
      if (!project) return;
      const departmentId = project.department ?? "";
      const existing = groups.get(departmentId);
      if (existing) existing.push(project);
      else groups.set(departmentId, [project]);
    });

    return (
      Array.from(groups.entries())
        .map(([departmentId, projects]) => ({
          departmentId,
          departmentName: departmentId ? (getDepartmentById(departmentId)?.name ?? departmentId) : t("no_department"),
          projects,
          averageProgress: averageProjectProgress(projects),
        }))
        .slice()
        // oxlint-disable-next-line unicorn/no-array-sort
        .sort((a, b) => b.projects.length - a.projects.length || a.departmentName.localeCompare(b.departmentName, "ja"))
    );
  }, [filteredProjectIds, getProjectById, getDepartmentById, t]);
};
