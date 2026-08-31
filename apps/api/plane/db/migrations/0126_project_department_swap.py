# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0125_migrate_department_to_fk'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='department',
        ),
        migrations.RenameField(
            model_name='project',
            old_name='department_fk',
            new_name='department',
        ),
    ]
