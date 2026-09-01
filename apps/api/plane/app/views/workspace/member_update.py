# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import MemberUpdateSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import MemberUpdate, Workspace


class MemberUpdateViewSet(BaseViewSet):
    serializer_class = MemberUpdateSerializer
    model = MemberUpdate

    def get_queryset(self):
        return MemberUpdate.objects.filter(workspace__slug=self.kwargs.get("slug")).select_related(
            "member", "workspace"
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = MemberUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace_id=workspace.id, member=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def partial_update(self, request, slug, pk=None):
        update = self.get_queryset().get(pk=pk)
        if update.member_id != request.user.id:
            return Response({"error": "You can only edit your own updates."}, status=status.HTTP_403_FORBIDDEN)
        serializer = MemberUpdateSerializer(update, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def destroy(self, request, slug, pk=None):
        update = self.get_queryset().get(pk=pk)
        if update.member_id != request.user.id:
            return Response({"error": "You can only delete your own updates."}, status=status.HTTP_403_FORBIDDEN)
        update.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
