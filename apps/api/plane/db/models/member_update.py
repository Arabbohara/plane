# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .base import BaseModel


class MemberUpdate(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_member_updates")
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_updates",
    )
    content = models.TextField()

    class Meta:
        verbose_name = "Member Update"
        verbose_name_plural = "Member Updates"
        db_table = "member_updates"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.member_id} @ {self.created_at:%Y-%m-%d}"
