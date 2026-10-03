// src/modules/auth/helpers/authRedirect.helper.ts

import AppRoutes from "../../../AppRoutes";
import { StorageKeys } from "../../../constants/storageKeys";
import AtomService from "../../../services/atom.service";

const EXCLUDED_AUTH_ROUTES: readonly string[] = [
  AppRoutes.client.public.SIGN_IN,
  AppRoutes.client.public.SIGN_UP,
  AppRoutes.client.public.CONFIRM_EMAIL,
  AppRoutes.client.public.FORGOT_PASSWORD,
  AppRoutes.client.public.RESET_PASSWORD,
  AppRoutes.client.protected.SIGN_OUT,
];

/**
 * Returns a validated internal relative continue URL from storage and purges it.
 * Protects against open-redirect attacks and circular auth redirect loops.
 */
export const getSafeContinueUrl = (): string | null => {
  const continueUrl = AtomService.get<string>(StorageKeys.CONTINUE_URL);
  if (!continueUrl || typeof continueUrl !== "string") {
    return null;
  }

  AtomService.remove(StorageKeys.CONTINUE_URL);

  const isInternal =
    continueUrl.startsWith(AppRoutes.client.public.ROOT) &&
    !continueUrl.startsWith(
      `${AppRoutes.client.public.ROOT}${AppRoutes.client.public.ROOT}`,
    );

  if (!isInternal) {
    return null;
  }

  const isExcluded = EXCLUDED_AUTH_ROUTES.some(
    (route) =>
      continueUrl === route ||
      continueUrl.startsWith(`${route}/`) ||
      continueUrl.startsWith(`${route}?`),
  );

  if (isExcluded) {
    return null;
  }

  return continueUrl;
};

/**
 * Automatically redirects to the persisted continue URL after successful auth,
 * falling back to the protected home dashboard if none was stored.
 */
export const navigateContinueURL = (
  navigate: (path: string, options?: { replace?: boolean }) => void,
  defaultPath: string = AppRoutes.client.protected.HOME,
): void => {
  const target = getSafeContinueUrl() || defaultPath;
  navigate(target, { replace: true });
};
