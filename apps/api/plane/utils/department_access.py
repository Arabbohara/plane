# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Keeps project memberships in sync with department memberships.

A user who joins a department gets a ProjectMember row (tagged with
``source_department``) in the projects of that department. Members an admin
added (``full_access``) get every project; members who joined themselves only
get public projects, so joining never exposes a secret project.

Memberships added manually have ``source_department=None`` and are never touched
here, so leaving a department only removes the access that the department granted.
"""

# Django imports
from django.db import transaction

# Module imports
from plane.db.models import DepartmentMember, Project, ProjectMember, WorkspaceMember
from plane.db.models.project import ProjectNetwork

ADMIN = 20
MEMBER = 15
GUEST = 5


def resolve_project_role(department_role, workspace_role):
    """Mirror ProjectMemberViewSet rules: workspace admins are always project admins and guests stay guests."""
    if workspace_role == ADMIN:
        return ADMIN
    if workspace_role == GUEST:
        return GUEST
    return department_role


def _workspace_role(workspace_id, member_id):
    return (
        WorkspaceMember.objects.filter(workspace_id=workspace_id, member_id=member_id, is_active=True)
        .values_list("role", flat=True)
        .first()
    )


def _can_access(department_member, network):
    return department_member.full_access or network == ProjectNetwork.PUBLIC.value


def _is_sole_admin(project_member):
    return (
        project_member.role == ADMIN
        and not ProjectMember.objects.filter(project_id=project_member.project_id, role=ADMIN, is_active=True)
        .exclude(pk=project_member.pk)
        .exists()
    )


def _grant(project_ids, member_id, role, department_id, workspace_id, reactivate=True):
    """
    Give the member access to the projects. ``reactivate=False`` leaves deactivated rows alone so a
    project admin's manual removal survives role and access syncs.
    """
    existing = {
        str(project_member.project_id): project_member
        for project_member in ProjectMember.objects.filter(project_id__in=project_ids, member_id=member_id)
    }
    for project_id in project_ids:
        project_member = existing.get(str(project_id))
        if project_member is None:
            ProjectMember.objects.create(
                project_id=project_id,
                workspace_id=workspace_id,
                member_id=member_id,
                role=role,
                source_department_id=department_id,
            )
        elif not project_member.is_active:
            if reactivate:
                project_member.is_active = True
                project_member.role = role
                project_member.source_department_id = department_id
                project_member.save(update_fields=["is_active", "role", "source_department", "updated_at"])
        elif project_member.source_department_id is not None:
            # Refresh a membership the department owns, but never demote a project's only admin
            if role < project_member.role and _is_sole_admin(project_member):
                role_to_save = project_member.role
            else:
                role_to_save = role
            if role_to_save != project_member.role or project_member.source_department_id != department_id:
                project_member.role = role_to_save
                project_member.source_department_id = department_id
                project_member.save(update_fields=["role", "source_department", "updated_at"])
        # Active manual memberships are left untouched


def _revoke(project_members):
    for project_member in project_members:
        if _is_sole_admin(project_member):
            # Never leave a project without an admin; keep the access as a manual membership instead
            project_member.source_department = None
            project_member.save(update_fields=["source_department", "updated_at"])
        else:
            project_member.is_active = False
            project_member.source_department = None
            project_member.save(update_fields=["is_active", "source_department", "updated_at"])


def sync_department_member_access(department_member, reactivate=True):
    """
    Bring the member's project access in line with their department membership: grant the projects
    they may access with their current role, and revoke department access they may no longer have.
    """
    workspace_role = _workspace_role(department_member.workspace_id, department_member.member_id)
    if workspace_role is None:
        return

    projects = Project.objects.filter(department_id=department_member.department_id)
    if not department_member.full_access:
        projects = projects.filter(network=ProjectNetwork.PUBLIC.value)
    project_ids = list(projects.values_list("id", flat=True))

    with transaction.atomic():
        _grant(
            project_ids,
            department_member.member_id,
            resolve_project_role(department_member.role, workspace_role),
            department_member.department_id,
            department_member.workspace_id,
            reactivate=reactivate,
        )
        _revoke(
            ProjectMember.objects.filter(
                source_department_id=department_member.department_id,
                member_id=department_member.member_id,
                is_active=True,
            ).exclude(project_id__in=project_ids)
        )


def revoke_department_member_access(department_id, member_id):
    """Remove the project access a member received through the department."""
    with transaction.atomic():
        _revoke(
            ProjectMember.objects.filter(source_department_id=department_id, member_id=member_id, is_active=True)
        )


def sync_project_department_access(project, previous_department_id=None, previous_network=None):
    """Call after a project is created, or after its department or network changes."""
    department_changed = str(previous_department_id or "") != str(project.department_id or "")
    network_changed = previous_network is not None and previous_network != project.network
    if not department_changed and not network_changed:
        return

    with transaction.atomic():
        if department_changed and previous_department_id:
            _revoke(
                ProjectMember.objects.filter(
                    project_id=project.id, source_department_id=previous_department_id, is_active=True
                )
            )

        if not project.department_id:
            return

        workspace_roles = dict(
            WorkspaceMember.objects.filter(workspace_id=project.workspace_id, is_active=True).values_list(
                "member_id", "role"
            )
        )
        for department_member in DepartmentMember.objects.filter(department_id=project.department_id):
            workspace_role = workspace_roles.get(department_member.member_id)
            if workspace_role is None:
                continue
            if _can_access(department_member, project.network):
                # A department or network change is an explicit admin action, so restore access too
                _grant(
                    [project.id],
                    department_member.member_id,
                    resolve_project_role(department_member.role, workspace_role),
                    project.department_id,
                    project.workspace_id,
                )
            else:
                # The project became secret: self-joined members lose the access the department gave them
                _revoke(
                    ProjectMember.objects.filter(
                        project_id=project.id,
                        member_id=department_member.member_id,
                        source_department_id=project.department_id,
                        is_active=True,
                    )
                )


def resync_member_department_roles(workspace_id, member_id):
    """Call after a workspace role change so department-granted project roles follow it."""
    for department_member in DepartmentMember.objects.filter(workspace_id=workspace_id, member_id=member_id):
        sync_department_member_access(department_member, reactivate=False)


def remove_workspace_member_departments(workspace_id, member_id):
    """Drop department memberships when a user leaves or is removed from the workspace."""
    DepartmentMember.objects.filter(workspace_id=workspace_id, member_id=member_id).delete()
    ProjectMember.objects.filter(workspace_id=workspace_id, member_id=member_id, source_department__isnull=False).update(
        source_department=None
    )
