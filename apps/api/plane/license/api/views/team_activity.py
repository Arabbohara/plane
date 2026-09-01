# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import WorkspaceMember, ProjectMember, MemberUpdate


class TeamActivityEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        workspace_members = (
            WorkspaceMember.objects.filter(is_active=True, member__is_bot=False)
            .select_related("member", "workspace")
            .order_by("member__first_name", "member__last_name")
        )

        member_ids = [wm.member_id for wm in workspace_members]

        project_memberships = (
            ProjectMember.objects.filter(member_id__in=member_ids, is_active=True)
            .select_related("project", "project__department")
            .order_by("project__name")
        )
        projects_by_member: dict = {}
        for pm in project_memberships:
            projects_by_member.setdefault(pm.member_id, []).append(
                {
                    "id": str(pm.project_id),
                    "name": pm.project.name,
                    "department": pm.project.department.name if pm.project.department else None,
                    "progress": pm.project.progress,
                }
            )

        latest_updates: dict = {}
        for update in MemberUpdate.objects.filter(member_id__in=member_ids).order_by("member_id", "-created_at"):
            if update.member_id not in latest_updates:
                latest_updates[update.member_id] = {
                    "content": update.content,
                    "created_at": update.created_at,
                }

        results = []
        for wm in workspace_members:
            results.append(
                {
                    "member": {
                        "id": str(wm.member_id),
                        "display_name": wm.member.display_name,
                        "first_name": wm.member.first_name,
                        "last_name": wm.member.last_name,
                        "email": wm.member.email,
                        "avatar_url": wm.member.avatar_url,
                    },
                    "workspace": {"id": str(wm.workspace_id), "name": wm.workspace.name, "slug": wm.workspace.slug},
                    "role": wm.role,
                    "projects": projects_by_member.get(wm.member_id, []),
                    "latest_update": latest_updates.get(wm.member_id),
                }
            )

        return Response(results)
