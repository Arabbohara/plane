/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
// local imports
import { coreSidebarMenuLinks } from "./core";
import type { TSidebarMenuItem } from "./types";

export function useSidebarMenu(): TSidebarMenuItem[] {
  const { t } = useTranslation();

  return [
    coreSidebarMenuLinks.general,
    coreSidebarMenuLinks["team-activity"],
    coreSidebarMenuLinks.email,
    coreSidebarMenuLinks.authentication,
    coreSidebarMenuLinks.workspace,
    coreSidebarMenuLinks.ai,
    coreSidebarMenuLinks.image,
  ].map((item) => ({
    Icon: item.Icon,
    href: item.href,
    name: t(item.name),
    description: t(item.description),
  }));
}
