/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TTeamActivityMember } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for the instance-admin team activity overview
 * @extends {APIService}
 */
export class TeamActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(): Promise<TTeamActivityMember[]> {
    return this.get("/api/instances/team-activity/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
