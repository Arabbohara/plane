# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re

from rest_framework import serializers

from plane.db.models import Department

from .base import BaseSerializer


class DepartmentSerializer(BaseSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "prefix", "color", "sort_order", "workspace_id"]
        read_only_fields = ["workspace_id"]

    def validate_prefix(self, value):
        value = value.strip().upper()
        if value and not re.match(r"^[A-Z0-9]+$", value):
            raise serializers.ValidationError("Prefix can only contain letters and numbers.")
        return value

    def validate_name(self, value):
        workspace_id = self.context.get("workspace_id")
        department_id = self.instance.id if self.instance else None

        department = Department.objects.filter(name=value, workspace_id=workspace_id)
        if department_id:
            department = department.exclude(id=department_id)

        if department.exists():
            raise serializers.ValidationError("Department with this name already exists.")

        return value
