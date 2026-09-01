/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type { TMemberUpdate } from "@plane/types";
// services
import { MemberUpdateService } from "@/services/workspace/member-update.service";
// store
import type { CoreRootStore } from "./root.store";

export interface IMemberUpdateStore {
  fetchedMap: Record<string, boolean>;
  memberUpdateMap: Record<string, TMemberUpdate>;
  workspaceMemberUpdates: TMemberUpdate[] | undefined;
  fetchMemberUpdates: (workspaceSlug: string) => Promise<TMemberUpdate[]>;
  createMemberUpdate: (workspaceSlug: string, data: Partial<TMemberUpdate>) => Promise<TMemberUpdate>;
  updateMemberUpdate: (workspaceSlug: string, updateId: string, data: Partial<TMemberUpdate>) => Promise<TMemberUpdate>;
  deleteMemberUpdate: (workspaceSlug: string, updateId: string) => Promise<void>;
}

export class MemberUpdateStore implements IMemberUpdateStore {
  rootStore;
  memberUpdateMap: Record<string, TMemberUpdate> = {};
  fetchedMap: Record<string, boolean> = {};
  memberUpdateService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      memberUpdateMap: observable,
      fetchedMap: observable,
      workspaceMemberUpdates: computed,
      fetchMemberUpdates: action,
      createMemberUpdate: action,
      updateMemberUpdate: action,
      deleteMemberUpdate: action,
    });

    this.rootStore = _rootStore;
    this.memberUpdateService = new MemberUpdateService();
  }

  get workspaceMemberUpdates() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails || !this.fetchedMap[currentWorkspaceDetails.slug]) return undefined;
    return (
      Object.values(this.memberUpdateMap)
        .filter((update) => update.workspace_id === currentWorkspaceDetails.id)
        .slice()
        // oxlint-disable-next-line unicorn/no-array-sort
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    );
  }

  fetchMemberUpdates = async (workspaceSlug: string) =>
    await this.memberUpdateService.getMemberUpdates(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((update) => {
          set(this.memberUpdateMap, [update.id], update);
        });
        set(this.fetchedMap, workspaceSlug, true);
      });
      return response;
    });

  createMemberUpdate = async (workspaceSlug: string, data: Partial<TMemberUpdate>) =>
    await this.memberUpdateService.createMemberUpdate(workspaceSlug, data).then((response) => {
      runInAction(() => {
        set(this.memberUpdateMap, [response.id], response);
      });
      return response;
    });

  updateMemberUpdate = async (workspaceSlug: string, updateId: string, data: Partial<TMemberUpdate>) => {
    const original = this.memberUpdateMap[updateId];
    try {
      runInAction(() => {
        set(this.memberUpdateMap, [updateId], { ...original, ...data });
      });
      return await this.memberUpdateService.updateMemberUpdate(workspaceSlug, updateId, data);
    } catch (error) {
      runInAction(() => {
        set(this.memberUpdateMap, [updateId], original);
      });
      throw error;
    }
  };

  deleteMemberUpdate = async (workspaceSlug: string, updateId: string) => {
    await this.memberUpdateService.deleteMemberUpdate(workspaceSlug, updateId);
    runInAction(() => {
      delete this.memberUpdateMap[updateId];
    });
  };
}
