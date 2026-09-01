/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Avatar, TextArea } from "@plane/ui";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// hooks
import { useMemberUpdate } from "@/hooks/store/use-member-update";
import { useUser } from "@/hooks/store/user";

export const HomeMemberUpdates = observer(function HomeMemberUpdates() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { workspaceMemberUpdates, fetchMemberUpdates, createMemberUpdate, deleteMemberUpdate } = useMemberUpdate();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspaceSlug) fetchMemberUpdates(workspaceSlug.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const handleSubmit = async () => {
    if (!workspaceSlug || !content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createMemberUpdate(workspaceSlug.toString(), { content: content.trim() });
      setContent("");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!workspaceSlug) return;
    try {
      await deleteMemberUpdate(workspaceSlug.toString(), updateId);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const updates = workspaceMemberUpdates ?? [];

  return (
    <div className="mb-4 rounded-md border border-subtle">
      <div className="border-b border-subtle px-4 py-2.5">
        <span className="text-13 font-medium text-primary">{t("home.member_updates.title")}</span>
      </div>
      <div className="flex flex-col gap-2 border-b border-subtle p-4">
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("home.member_updates.placeholder")}
          className="min-h-16 text-13"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit} loading={isSubmitting} disabled={!content.trim()}>
            {t("home.member_updates.post")}
          </Button>
        </div>
      </div>
      <div className="max-h-96 divide-y divide-subtle overflow-y-auto">
        {updates.length === 0 && (
          <div className="px-4 py-6 text-center text-13 text-tertiary">{t("home.member_updates.empty")}</div>
        )}
        {updates.map((update) => (
          <div key={update.id} className="flex items-start gap-3 px-4 py-3">
            <Avatar
              name={update.member_detail?.display_name}
              src={getFileURL(update.member_detail?.avatar_url ?? "")}
              size={28}
              shape="circle"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-13 font-medium text-primary">
                  {update.member_detail?.display_name ?? update.member_detail?.first_name}
                </span>
                <span className="text-12 text-tertiary">{calculateTimeAgo(update.created_at ?? null)}</span>
              </div>
              <p className="mt-0.5 text-13 whitespace-pre-wrap text-secondary">{update.content}</p>
            </div>
            {update.member === currentUser?.id && (
              <button
                type="button"
                onClick={() => handleDelete(update.id)}
                className="text-12 text-tertiary hover:text-danger-primary"
              >
                {t("delete")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
