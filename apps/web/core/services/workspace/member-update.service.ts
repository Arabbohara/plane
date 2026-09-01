/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// services
import { API_BASE_URL } from "@plane/constants";
import type { TMemberUpdate } from "@plane/types";
import { APIService } from "@/services/api.service";

export class MemberUpdateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getMemberUpdates(workspaceSlug: string): Promise<TMemberUpdate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/member-updates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createMemberUpdate(workspaceSlug: string, data: Partial<TMemberUpdate>): Promise<TMemberUpdate> {
    return this.post(`/api/workspaces/${workspaceSlug}/member-updates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateMemberUpdate(
    workspaceSlug: string,
    updateId: string,
    data: Partial<TMemberUpdate>
  ): Promise<TMemberUpdate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/member-updates/${updateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteMemberUpdate(workspaceSlug: string, updateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/member-updates/${updateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
