# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations


def migrate_department_strings_to_fk(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    Department = apps.get_model("db", "Department")

    projects = Project.objects.exclude(department__isnull=True).exclude(department="")
    department_cache = {}
    for project in projects:
        key = (project.workspace_id, project.department)
        department = department_cache.get(key)
        if department is None:
            department, _ = Department.objects.get_or_create(
                workspace_id=project.workspace_id,
                name=project.department,
            )
            department_cache[key] = department
        project.department_fk_id = department.id
        project.save(update_fields=["department_fk"])


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0124_department'),
    ]

    operations = [
        migrations.RunPython(migrate_department_strings_to_fk, reverse_code=migrations.RunPython.noop),
    ]
