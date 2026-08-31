# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .base import BaseModel


class Department(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_department")
    name = models.CharField(max_length=255)
    prefix = models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=255, blank=True)
    sort_order = models.FloatField(default=65535)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workspace_department_name_when_not_deleted",
            ),
        ]
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        db_table = "departments"
        ordering = ("sort_order", "name")

    def save(self, *args, **kwargs):
        if self._state.adding:
            last_id = Department.objects.filter(workspace=self.workspace).aggregate(largest=models.Max("sort_order"))[
                "largest"
            ]
            if last_id is not None:
                self.sort_order = last_id + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.name)
