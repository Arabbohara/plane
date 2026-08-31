# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import DepartmentSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import Department, Workspace


class DepartmentViewSet(BaseViewSet):
    serializer_class = DepartmentSerializer
    model = Department

    def get_queryset(self):
        return Department.objects.filter(workspace__slug=self.kwargs.get("slug"))

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = DepartmentSerializer(data=request.data, context={"workspace_id": workspace.id})
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk=None):
        workspace = Workspace.objects.get(slug=slug)
        department = self.get_queryset().get(pk=pk)
        serializer = DepartmentSerializer(
            department,
            data=request.data,
            partial=True,
            context={"workspace_id": workspace.id},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk=None):
        department = self.get_queryset().get(pk=pk)
        department.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
