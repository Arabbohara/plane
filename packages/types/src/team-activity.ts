/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TTeamActivityProject = {
  id: string;
  name: string;
  department: string | null;
  progress: number;
};

export type TTeamActivityMember = {
  member: {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  role: number;
  projects: TTeamActivityProject[];
  latest_update: {
    content: string;
    created_at: string;
  } | null;
};
