/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { NETWORK_CHOICES, ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IProject } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { getTabIndex } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { DepartmentSelect } from "@/components/project/department-select";
import { ProjectNetworkIcon } from "@/components/project/project-network-icon";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  isMobile?: boolean;
};

function ProjectAttributes(props: Props) {
  const { isMobile = false } = props;
  const { t } = useTranslation();
  const { control, setValue } = useFormContext<IProject>();
  const { totalProjectIds, getPartialProjectById } = useProject();
  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  const handleDepartmentChange = (departmentId: string | null, prefix?: string) => {
    setValue("department", departmentId);
    if (prefix) {
      const existingCount = (totalProjectIds ?? []).filter(
        (projectId) => getPartialProjectById(projectId)?.department === departmentId
      ).length;
      setValue("identifier", `${prefix}${existingCount + 1}`, { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="h-7 flex-shrink-0" tabIndex={getIndex("department")}>
        <Controller
          name="department"
          control={control}
          render={({ field: { value } }) => (
            <DepartmentSelect value={value} onChange={handleDepartmentChange} buttonClassName="h-full" />
          )}
        />
      </div>
      <Controller
        name="network"
        control={control}
        render={({ field: { onChange, value } }) => {
          const currentNetwork = NETWORK_CHOICES.find((n) => n.key === value);

          return (
            <div className="h-7 flex-shrink-0" tabIndex={getIndex("network")}>
              <CustomSelect
                value={value}
                onChange={onChange}
                label={
                  <div className="flex h-full items-center gap-1">
                    {currentNetwork ? (
                      <>
                        <ProjectNetworkIcon iconKey={currentNetwork.iconKey} />
                        {t(currentNetwork.i18n_label)}
                      </>
                    ) : (
                      <span className="text-placeholder">{t("select_network")}</span>
                    )}
                  </div>
                }
                placement="bottom-start"
                className="h-full"
                buttonClassName="h-full"
                noChevron
                tabIndex={getIndex("network")}
              >
                {NETWORK_CHOICES.map((network) => (
                  <CustomSelect.Option key={network.key} value={network.key}>
                    <div className="flex items-start gap-2">
                      <ProjectNetworkIcon iconKey={network.iconKey} className="h-3.5 w-3.5" />
                      <div className="-mt-1">
                        <p>{t(network.i18n_label)}</p>
                        <p className="text-11 text-placeholder">{t(network.description)}</p>
                      </div>
                    </div>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          );
        }}
      />
      <Controller
        name="project_lead"
        control={control}
        render={({ field: { value, onChange } }) => {
          if (value === undefined || value === null || typeof value === "string")
            return (
              <div className="h-7 flex-shrink-0" tabIndex={getIndex("lead")}>
                <MemberDropdown
                  value={value ?? null}
                  onChange={(lead) => onChange(lead === value ? null : lead)}
                  placeholder={t("lead")}
                  multiple={false}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("lead")}
                />
              </div>
            );
          else return <></>;
        }}
      />
    </div>
  );
}

export default ProjectAttributes;

export { ProjectAttributes };
