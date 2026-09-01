# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import MemberUpdate

from .base import BaseSerializer
from .user import UserLiteSerializer


class MemberUpdateSerializer(BaseSerializer):
    member_detail = UserLiteSerializer(source="member", read_only=True)

    class Meta:
        model = MemberUpdate
        fields = ["id", "content", "member", "member_detail", "workspace_id", "created_at", "updated_at"]
        read_only_fields = ["id", "member", "workspace_id", "created_at", "updated_at"]

    def validate_content(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Content cannot be empty.")
        return value
