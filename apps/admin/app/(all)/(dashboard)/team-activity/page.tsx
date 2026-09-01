/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { TeamActivityService } from "@plane/services";
import { Avatar, Loader } from "@plane/ui";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";

const teamActivityService = new TeamActivityService();

const TeamActivityPage = observer(function TeamActivityPage(_props: Route.ComponentProps) {
  const { data: members, isLoading } = useSWR("INSTANCE_TEAM_ACTIVITY", () => teamActivityService.list());

  return (
    <PageWrapper
      header={{
        title: "Team activity",
        description: "See who's on what project, their progress, and their latest update — in one place.",
      }}
    >
      {isLoading ? (
        <Loader className="space-y-4">
          <Loader.Item height="80px" width="100%" />
          <Loader.Item height="80px" width="100%" />
          <Loader.Item height="80px" width="100%" />
        </Loader>
      ) : (
        <div className="flex flex-col gap-3">
          {(members ?? []).map((row) => (
            <div key={row.member.id} className="rounded-md border border-subtle p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={row.member.display_name}
                    src={getFileURL(row.member.avatar_url ?? "")}
                    size={32}
                    shape="circle"
                  />
                  <div>
                    <div className="text-14 font-medium text-primary">{row.member.display_name}</div>
                    <div className="text-12 text-tertiary">{row.member.email}</div>
                  </div>
                </div>
                <div className="text-12 text-tertiary">
                  {row.projects.length} project{row.projects.length === 1 ? "" : "s"}
                </div>
              </div>

              {row.latest_update && (
                <div className="mt-3 rounded-sm bg-surface-1 p-2.5">
                  <div className="text-11 text-tertiary">{calculateTimeAgo(row.latest_update.created_at)}</div>
                  <p className="mt-0.5 text-13 whitespace-pre-wrap text-secondary">{row.latest_update.content}</p>
                </div>
              )}

              {row.projects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-2 rounded-full border border-subtle px-2.5 py-1 text-12 text-secondary"
                    >
                      <span>{project.name}</span>
                      {project.department && <span className="text-tertiary">· {project.department}</span>}
                      <span className="text-tertiary">{project.progress}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {members && members.length === 0 && (
            <div className="py-12 text-center text-13 text-tertiary">No workspace members yet.</div>
          )}
        </div>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Team Activity - God Mode" }];

export default TeamActivityPage;
