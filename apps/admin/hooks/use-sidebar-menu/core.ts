/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Image, BrainCog, Cog, Mail, Users } from "lucide-react";
// plane imports
import { LockIcon, WorkspaceIcon } from "@plane/propel/icons";
// types
import type { TSidebarMenuItem } from "./types";

export type TCoreSidebarMenuKey =
  | "general"
  | "email"
  | "workspace"
  | "authentication"
  | "ai"
  | "image"
  | "team-activity";

// name/description hold translation keys, resolved by useSidebarMenu().
export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItem> = {
  general: {
    Icon: Cog,
    name: "admin.sidebar.general.name",
    description: "admin.sidebar.general.description",
    href: `/general/`,
  },
  "team-activity": {
    Icon: Users,
    name: "admin.sidebar.team_activity.name",
    description: "admin.sidebar.team_activity.description",
    href: `/team-activity/`,
  },
  email: {
    Icon: Mail,
    name: "admin.sidebar.email.name",
    description: "admin.sidebar.email.description",
    href: `/email/`,
  },
  workspace: {
    Icon: WorkspaceIcon,
    name: "admin.sidebar.workspaces.name",
    description: "admin.sidebar.workspaces.description",
    href: `/workspace/`,
  },
  authentication: {
    Icon: LockIcon,
    name: "admin.sidebar.authentication.name",
    description: "admin.sidebar.authentication.description",
    href: `/authentication/`,
  },
  ai: {
    Icon: BrainCog,
    name: "admin.sidebar.ai.name",
    description: "admin.sidebar.ai.description",
    href: `/ai/`,
  },
  image: {
    Icon: Image,
    name: "admin.sidebar.image.name",
    description: "admin.sidebar.image.description",
    href: `/image/`,
  },
};
