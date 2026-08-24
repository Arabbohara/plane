/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance, initPromise } from "../core";

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  // Not seeded from i18nInstance.isInitialized: that flag flips true as soon as
  // i18next's core init resolves, which happens *before* the chained
  // loadNamespaces(NAMESPACES) call in initPromise finishes fetching every
  // namespace. Starting from it let children render while some namespaces were
  // still loading, surfacing raw keys (e.g. "project_cycles.status.yet_to_start")
  // that never got a chance to re-render once the namespace arrived, since
  // useTranslation() here doesn't bind those fallback namespaces directly.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initPromise
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("Failed to initialize i18n:", err);
        setIsReady(true);
      });
  }, []);

  if (!isReady) return null;
  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
