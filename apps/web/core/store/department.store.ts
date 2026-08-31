/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, sortBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { TDepartment } from "@plane/types";
// services
import { DepartmentService } from "@/services/project";
// store
import type { CoreRootStore } from "./root.store";

export interface IDepartmentStore {
  fetchedMap: Record<string, boolean>;
  departmentMap: Record<string, TDepartment>;
  workspaceDepartments: TDepartment[] | undefined;
  getDepartmentById: (departmentId: string | undefined | null) => TDepartment | undefined;
  fetchDepartments: (workspaceSlug: string) => Promise<TDepartment[]>;
  createDepartment: (workspaceSlug: string, data: Partial<TDepartment>) => Promise<TDepartment>;
  updateDepartment: (workspaceSlug: string, departmentId: string, data: Partial<TDepartment>) => Promise<TDepartment>;
  deleteDepartment: (workspaceSlug: string, departmentId: string) => Promise<void>;
}

export class DepartmentStore implements IDepartmentStore {
  rootStore;
  departmentMap: Record<string, TDepartment> = {};
  fetchedMap: Record<string, boolean> = {};
  departmentService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      departmentMap: observable,
      fetchedMap: observable,
      workspaceDepartments: computed,
      fetchDepartments: action,
      createDepartment: action,
      updateDepartment: action,
      deleteDepartment: action,
    });

    this.rootStore = _rootStore;
    this.departmentService = new DepartmentService();
  }

  get workspaceDepartments() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails || !this.fetchedMap[currentWorkspaceDetails.slug]) return undefined;
    return sortBy(
      Object.values(this.departmentMap).filter((department) => department.workspace_id === currentWorkspaceDetails.id),
      "sort_order"
    );
  }

  getDepartmentById = computedFn((departmentId: string | undefined | null) =>
    departmentId ? this.departmentMap[departmentId] : undefined
  );

  fetchDepartments = async (workspaceSlug: string) =>
    await this.departmentService.getDepartments(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((department) => {
          set(this.departmentMap, [department.id], department);
        });
        set(this.fetchedMap, workspaceSlug, true);
      });
      return response;
    });

  createDepartment = async (workspaceSlug: string, data: Partial<TDepartment>) =>
    await this.departmentService.createDepartment(workspaceSlug, data).then((response) => {
      runInAction(() => {
        set(this.departmentMap, [response.id], response);
      });
      return response;
    });

  updateDepartment = async (workspaceSlug: string, departmentId: string, data: Partial<TDepartment>) => {
    const original = this.departmentMap[departmentId];
    try {
      runInAction(() => {
        set(this.departmentMap, [departmentId], { ...original, ...data });
      });
      return await this.departmentService.updateDepartment(workspaceSlug, departmentId, data);
    } catch (error) {
      runInAction(() => {
        set(this.departmentMap, [departmentId], original);
      });
      throw error;
    }
  };

  deleteDepartment = async (workspaceSlug: string, departmentId: string) => {
    await this.departmentService.deleteDepartment(workspaceSlug, departmentId);
    runInAction(() => {
      delete this.departmentMap[departmentId];
    });
  };
}
