/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDownIcon, ChevronRightIcon, Pencil, Plus, Trash2 } from "lucide-react";
// plane imports
import { ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TDepartment, TDepartmentMember } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";
import { AlertModalCore, Avatar, CustomMenu, CustomSelect } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks
import { useDepartment } from "@/hooks/store/use-department";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
// local imports
import { DepartmentForm } from "./department-form";

const DEPARTMENT_ROLES = [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST];

type TConfirmAction = { type: "leave" } | { type: "delete" } | { type: "remove"; departmentMember: TDepartmentMember };

type Props = {
  department: TDepartment;
  workspaceSlug: string;
  /** Workspace admin: manage members and delete the department */
  isAdmin: boolean;
  /** Workspace admin or member: rename the department and join it */
  canEdit: boolean;
};

export const DepartmentListItem = observer(function DepartmentListItem(props: Props) {
  const { department, workspaceSlug, isAdmin, canEdit } = props;
  // states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [confirmAction, setConfirmAction] = useState<TConfirmAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getDepartmentMembers,
    getCurrentUserDepartmentMember,
    updateDepartment,
    deleteDepartment,
    addDepartmentMembers,
    updateDepartmentMember,
    removeDepartmentMember,
    joinDepartment,
    leaveDepartment,
  } = useDepartment();
  const {
    getUserDetails,
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  // derived values
  const departmentMembers = getDepartmentMembers(department.id);
  const currentUserDepartmentMember = getCurrentUserDepartmentMember(department.id);
  const departmentMemberIds = new Set(departmentMembers.map((departmentMember) => departmentMember.member_id));
  const addableMemberIds = (workspaceMemberIds ?? []).filter(
    (memberId) => !departmentMemberIds.has(memberId) && getWorkspaceMemberDetails(memberId)?.is_active !== false
  );
  const roleLabel = (role: number) => t(ROLE_DETAILS[role as EUserWorkspaceRoles]?.i18n_title ?? "");
  const accessLabel = (fullAccess: boolean) =>
    fullAccess
      ? t("workspace_settings.settings.departments.access_all")
      : t("workspace_settings.settings.departments.access_public");
  const memberName = (memberId: string) => {
    const user = getUserDetails(memberId);
    if (!user) return "";
    return user.first_name || user.last_name
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : user.display_name;
  };

  const showError = (error: unknown) => {
    const message = (error as { error?: string; name?: string[] } | undefined)?.error;
    const fieldMessage = (error as { name?: string[]; prefix?: string[] } | undefined)?.name?.[0];
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("error"),
      message: message ?? fieldMessage ?? t("something_went_wrong_please_try_again"),
    });
  };

  const showSuccess = (message: string) => setToast({ type: TOAST_TYPE.SUCCESS, title: t("success"), message });

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinDepartment(workspaceSlug, department.id);
      showSuccess(t("workspace_settings.settings.departments.joined_toast", { name: department.name }));
    } catch (error) {
      showError(error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleUpdate = async (data: Pick<TDepartment, "name" | "prefix" | "color">) => {
    try {
      await updateDepartment(workspaceSlug, department.id, data);
      setIsEditing(false);
      showSuccess(t("workspace_settings.settings.departments.updated_toast"));
    } catch (error) {
      showError(error);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    if (memberIds.length === 0) return;
    try {
      await addDepartmentMembers(
        workspaceSlug,
        department.id,
        memberIds.map((memberId) => {
          // Default to the workspace role so admins stay admins and guests stay guests
          const workspaceRole = getWorkspaceMemberDetails(memberId)?.role;
          return { member_id: memberId, role: Number(workspaceRole ?? EUserWorkspaceRoles.MEMBER) };
        })
      );
      showSuccess(t("workspace_settings.settings.departments.members_added_toast"));
    } catch (error) {
      showError(error);
    }
  };

  const handleMemberUpdate = async (
    departmentMember: TDepartmentMember,
    data: Partial<Pick<TDepartmentMember, "role" | "full_access">>
  ) => {
    try {
      await updateDepartmentMember(workspaceSlug, department.id, departmentMember.id, data);
      showSuccess(t("workspace_settings.settings.departments.member_updated_toast"));
    } catch (error) {
      showError(error);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setIsConfirming(true);
    try {
      if (confirmAction.type === "leave") {
        await leaveDepartment(workspaceSlug, department.id);
        showSuccess(t("workspace_settings.settings.departments.left_toast", { name: department.name }));
      } else if (confirmAction.type === "remove") {
        await removeDepartmentMember(workspaceSlug, department.id, confirmAction.departmentMember.id);
        showSuccess(t("workspace_settings.settings.departments.member_removed_toast"));
      } else {
        await deleteDepartment(workspaceSlug, department.id);
        showSuccess(t("workspace_settings.settings.departments.deleted_toast"));
      }
      setConfirmAction(null);
    } catch (error) {
      showError(error);
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmContent = (() => {
    if (!confirmAction) return null;
    if (confirmAction.type === "leave")
      return {
        title: t("workspace_settings.settings.departments.leave_title"),
        content: t("workspace_settings.settings.departments.leave_description", { name: department.name }),
        primaryButtonText: { loading: t("leaving"), default: t("leave") },
      };
    if (confirmAction.type === "remove")
      return {
        title: t("workspace_settings.settings.departments.remove_title"),
        content: t("workspace_settings.settings.departments.remove_description", {
          name: memberName(confirmAction.departmentMember.member_id),
        }),
        primaryButtonText: { loading: t("removing"), default: t("remove") },
      };
    return {
      title: t("workspace_settings.settings.departments.delete_title"),
      content: t("workspace_settings.settings.departments.delete_description", { name: department.name }),
      primaryButtonText: { loading: t("deleting"), default: t("delete") },
    };
  })();

  if (isEditing) {
    return <DepartmentForm department={department} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="rounded-md border border-subtle">
      {confirmContent && (
        <AlertModalCore
          isOpen={!!confirmAction}
          handleClose={() => !isConfirming && setConfirmAction(null)}
          handleSubmit={handleConfirm}
          isSubmitting={isConfirming}
          title={confirmContent.title}
          content={confirmContent.content}
          primaryButtonText={confirmContent.primaryButtonText}
          secondaryButtonText={t("cancel")}
        />
      )}

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-4 flex-shrink-0 text-tertiary" />
          ) : (
            <ChevronRightIcon className="size-4 flex-shrink-0 text-tertiary" />
          )}
          <span
            className="size-2.5 flex-shrink-0 rounded-full bg-layer-3"
            style={department.color ? { backgroundColor: department.color } : undefined}
          />
          <span className="truncate text-body-sm-medium text-primary">{department.name}</span>
          {department.prefix && <span className="text-body-xs-regular text-tertiary">{department.prefix}</span>}
          <span className="ml-2 flex-shrink-0 text-body-xs-regular text-tertiary">
            {t("workspace_settings.settings.departments.projects_count", { count: department.project_count ?? 0 })}
            {" · "}
            {t("workspace_settings.settings.departments.members_count", { count: departmentMembers.length })}
          </span>
        </button>
        <div className="flex flex-shrink-0 items-center gap-2">
          {currentUserDepartmentMember && !currentUserDepartmentMember.full_access && (
            <span className="text-body-xs-regular text-tertiary">{accessLabel(false)}</span>
          )}
          {currentUserDepartmentMember ? (
            <Button variant="secondary" size="sm" onClick={() => setConfirmAction({ type: "leave" })}>
              {t("workspace_settings.settings.departments.leave")}
            </Button>
          ) : (
            canEdit && (
              <Button variant="primary" size="sm" onClick={handleJoin} loading={isJoining}>
                {t("workspace_settings.settings.departments.join")}
              </Button>
            )
          )}
          {canEdit && (
            <CustomMenu ellipsis placement="bottom-end" buttonClassName="p-1" optionsClassName="p-1">
              <CustomMenu.MenuItem onClick={() => setIsEditing(true)}>
                <span className="flex items-center gap-2">
                  <Pencil className="size-3.5" />
                  {t("edit")}
                </span>
              </CustomMenu.MenuItem>
              {isAdmin && (
                <CustomMenu.MenuItem onClick={() => setConfirmAction({ type: "delete" })}>
                  <span className="flex items-center gap-2 text-danger-primary">
                    <Trash2 className="size-3.5" />
                    {t("delete")}
                  </span>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-subtle px-4 py-3">
          {departmentMembers.length === 0 ? (
            <p className="py-1 text-body-xs-regular text-tertiary">
              {t("workspace_settings.settings.departments.no_members")}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {departmentMembers.map((departmentMember) => {
                const user = getUserDetails(departmentMember.member_id);
                const isCurrentUser = departmentMember.member_id === currentUser?.id;
                return (
                  <li
                    key={departmentMember.id}
                    className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-sm px-1 py-1.5 hover:bg-layer-1"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar
                        name={user?.display_name}
                        src={user?.avatar_url ? getFileURL(user.avatar_url) : undefined}
                        size="md"
                      />
                      <span className="truncate text-body-xs-regular text-primary">
                        {memberName(departmentMember.member_id)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin ? (
                        <>
                          <CustomSelect
                            value={departmentMember.full_access}
                            onChange={(fullAccess: boolean) =>
                              handleMemberUpdate(departmentMember, { full_access: fullAccess })
                            }
                            label={<span>{accessLabel(departmentMember.full_access)}</span>}
                            buttonClassName="!px-2 border-none hover:bg-surface-1"
                            className="w-44 rounded-md p-0"
                            input
                          >
                            {[true, false].map((fullAccess) => (
                              <CustomSelect.Option key={String(fullAccess)} value={fullAccess}>
                                {accessLabel(fullAccess)}
                              </CustomSelect.Option>
                            ))}
                          </CustomSelect>
                          <CustomSelect
                            value={departmentMember.role}
                            onChange={(role: number) => handleMemberUpdate(departmentMember, { role })}
                            label={<span>{roleLabel(departmentMember.role)}</span>}
                            buttonClassName="!px-2 border-none hover:bg-surface-1"
                            className="w-28 rounded-md p-0"
                            input
                          >
                            {DEPARTMENT_ROLES.map((role) => (
                              <CustomSelect.Option key={role} value={role}>
                                {roleLabel(role)}
                              </CustomSelect.Option>
                            ))}
                          </CustomSelect>
                        </>
                      ) : (
                        <>
                          {!departmentMember.full_access && (
                            <span className="px-2 text-body-xs-regular text-tertiary">{accessLabel(false)}</span>
                          )}
                          <span className="w-28 px-2 text-body-xs-regular text-secondary">
                            {roleLabel(departmentMember.role)}
                          </span>
                        </>
                      )}
                      {(isAdmin || isCurrentUser) && (
                        <button
                          type="button"
                          className="grid size-6 place-items-center rounded-sm text-tertiary opacity-0 group-hover:opacity-100 hover:bg-layer-2 hover:text-primary focus:opacity-100"
                          onClick={() =>
                            isCurrentUser
                              ? setConfirmAction({ type: "leave" })
                              : setConfirmAction({ type: "remove", departmentMember })
                          }
                          aria-label={t("workspace_settings.settings.departments.remove_member")}
                          title={t("workspace_settings.settings.departments.remove_member")}
                        >
                          <CloseIcon className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {isAdmin && addableMemberIds.length > 0 && (
            <div className="mt-2">
              <MemberDropdown
                multiple
                value={[]}
                memberIds={addableMemberIds}
                onChange={handleAddMembers}
                buttonVariant="transparent-with-text"
                button={
                  <span className="flex items-center gap-1 rounded-sm px-1 py-1 text-body-xs-medium text-accent-primary hover:bg-layer-1">
                    <Plus className="size-3.5" />
                    {t("workspace_settings.settings.departments.add_members")}
                  </span>
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
