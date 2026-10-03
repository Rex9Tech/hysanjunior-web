// src/modules/auth/helpers/authRedirect.helper.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getSafeContinueUrl,
  navigateContinueURL,
} from "./authRedirect.helper";
import AppRoutes from "../../../AppRoutes";
import AtomService from "../../../services/atom.service";
import { StorageKeys } from "../../../constants/storageKeys";

describe("authRedirect.helper", () => {
  beforeEach(() => {
    AtomService.remove(StorageKeys.CONTINUE_URL);
  });

  describe("getSafeContinueUrl", () => {
    it("returns null when no continue URL is stored", () => {
      expect(getSafeContinueUrl()).toBeNull();
    });

    it("returns and consumes valid internal relative routes", () => {
      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.protected.AI);
      expect(getSafeContinueUrl()).toBe(AppRoutes.client.protected.AI);
      // Must be consumed (cleared) immediately
      expect(getSafeContinueUrl()).toBeNull();
    });

    it("handles internal routes with query params", () => {
      const target = `${AppRoutes.client.protected.AI}?room=123&mode=dark`;
      AtomService.set(StorageKeys.CONTINUE_URL, target);
      expect(getSafeContinueUrl()).toBe(target);
    });

    it("handles admin routes", () => {
      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.protected.admin.USERS);
      expect(getSafeContinueUrl()).toBe(AppRoutes.client.protected.admin.USERS);
    });

    it("rejects external URLs (open redirect protection)", () => {
      AtomService.set(StorageKeys.CONTINUE_URL, "https://evil.com/hack");
      expect(getSafeContinueUrl()).toBeNull();
    });

    it("rejects protocol-relative URLs (open redirect protection)", () => {
      AtomService.set(StorageKeys.CONTINUE_URL, "//evil.com/hack");
      expect(getSafeContinueUrl()).toBeNull();
    });

    it("rejects public auth routes to prevent circular auth loops", () => {
      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.public.SIGN_IN);
      expect(getSafeContinueUrl()).toBeNull();

      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.public.SIGN_UP);
      expect(getSafeContinueUrl()).toBeNull();

      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.protected.SIGN_OUT);
      expect(getSafeContinueUrl()).toBeNull();

      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.public.RESET_PASSWORD);
      expect(getSafeContinueUrl()).toBeNull();

      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.public.CONFIRM_EMAIL);
      expect(getSafeContinueUrl()).toBeNull();
    });
  });

  describe("navigateContinueURL", () => {
    it("redirects to stored continue URL when present", () => {
      AtomService.set(StorageKeys.CONTINUE_URL, AppRoutes.client.protected.AI);
      const mockNavigate = vi.fn();

      navigateContinueURL(mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith(AppRoutes.client.protected.AI, {
        replace: true,
      });
      expect(AtomService.get<string>(StorageKeys.CONTINUE_URL)).toBeUndefined();
    });

    it("defaults to AppRoutes.client.protected.HOME when no continue URL is stored", () => {
      const mockNavigate = vi.fn();

      navigateContinueURL(mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith(
        AppRoutes.client.protected.HOME,
        { replace: true },
      );
    });
  });
});
