import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getSocketToast, SOCKET_MESSAGE_TYPES } from "../helpers/socket.helpers";
import { getUtcNowIso } from "../helpers";
import SocketService, { ISocketMessage } from "../services/socket.service";
import { NOTIFICATION_SOCKET_TYPES } from "../modules/notification";
import {
  LESSON_AI_PREVIEW_KINDS,
  writeLessonAiPreview,
} from "../helpers/lessonAiSocket";
import { ToastTypes } from "../constants";

const cacheLessonAiPreview = (message: ISocketMessage): void => {
  const data = message.data;
  if (!data || typeof data !== "object") return;
  const type = typeof data.type === "string" ? data.type : "";
  const lessonId = typeof data.lesson_id === "string" ? data.lesson_id : "";
  if (!lessonId) return;

  if (
    type === NOTIFICATION_SOCKET_TYPES.LESSON_STORY_ORDER_GENERATED &&
    Array.isArray(data.story_order)
  ) {
    writeLessonAiPreview(
      lessonId,
      LESSON_AI_PREVIEW_KINDS.STORY_ORDER,
      data.story_order,
    );
    return;
  }

  if (
    type === NOTIFICATION_SOCKET_TYPES.LESSON_WORD_FAMILIES_GENERATED &&
    Array.isArray(data.word_families)
  ) {
    writeLessonAiPreview(
      lessonId,
      LESSON_AI_PREVIEW_KINDS.WORD_FAMILIES,
      data.word_families,
    );
    return;
  }

  if (
    type === NOTIFICATION_SOCKET_TYPES.LESSON_BUILD_THE_SENTENCES_GENERATED &&
    Array.isArray(data.build_the_sentences)
  ) {
    writeLessonAiPreview(
      lessonId,
      LESSON_AI_PREVIEW_KINDS.BUILD_THE_SENTENCES,
      data.build_the_sentences,
    );
  }
};

export interface INotification {
  id: string;
  message: string;
  data: Record<string, unknown>;
  created_at: string;
}

export const useSocket = () => {
  const { token, isAuthenticated, refreshCurrentUser, signout } = useAuth();
  const { success, error, info, warning } = useToast();
  const [notifications, setNotifications] = useState<INotification[]>([]);

  useEffect(() => {
    if (isAuthenticated && token) {
      SocketService.connect(token);
    } else {
      SocketService.disconnect();
    }

    const handleNotification = (data: ISocketMessage) => {
      const payloadType = (data.data?.type as string) || data.type;

      // When IAM roles or access entitlements are revoked or changed, sign out so the user re-authenticates fresh
      if (
        payloadType === NOTIFICATION_SOCKET_TYPES.IAM_UPDATED ||
        payloadType === NOTIFICATION_SOCKET_TYPES.ACCESS_REVOKED ||
        payloadType === NOTIFICATION_SOCKET_TYPES.ACCESS_UPDATED ||
        payloadType === NOTIFICATION_SOCKET_TYPES.SESSION_EXPIRED ||
        payloadType === NOTIFICATION_SOCKET_TYPES.SESSION_INVALIDATED
      ) {
        signout();
        warning(data.message || "Your access has changed. Please sign in again.");
        return;
      }

      const isEntitlementEvent =
        payloadType === NOTIFICATION_SOCKET_TYPES.PAYMENT_SUCCESS ||
        payloadType === NOTIFICATION_SOCKET_TYPES.SUBSCRIPTION_CREATED ||
        payloadType === NOTIFICATION_SOCKET_TYPES.SUBSCRIPTION_RESUMED ||
        payloadType === NOTIFICATION_SOCKET_TYPES.SUBSCRIPTION_CANCELED;

      if (isEntitlementEvent) {
        void refreshCurrentUser();
      }

      cacheLessonAiPreview(data);

      const toast = getSocketToast(data);
      if (!toast) {
        return;
      }

      // Only accumulate in persistent notification state if payload is a domain notification
      if (data.type === SOCKET_MESSAGE_TYPES.NOTIFICATION && data.message) {
        const notif: INotification = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          message: data.message,
          data: data.data || {},
          created_at: data.created_at || getUtcNowIso(),
        };
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
      }

      if (toast.kind === ToastTypes.SUCCESS) {
        success(toast.message);
        return;
      }

      if (toast.kind === ToastTypes.ERROR) {
        error(toast.message);
        return;
      }

      if (toast.kind === ToastTypes.WARNING) {
        warning(toast.message);
        return;
      }

      info(toast.message);
    };

    SocketService.addListener(handleNotification);

    return () => {
      SocketService.removeListener(handleNotification);
      // Don't disconnect here - let the effect handle it
    };
  }, [token, isAuthenticated, success, error, info, warning]);

  const sendMessage = useCallback(
    (channel: string, message: string, data: Record<string, unknown> = {}) => {
      SocketService.sendMessage(channel, message, data);
    },
    [],
  );

  return {
    notifications,
    isConnected: SocketService.isConnectedToSocket(),
    sendMessage,
    SocketService,
  };
};
