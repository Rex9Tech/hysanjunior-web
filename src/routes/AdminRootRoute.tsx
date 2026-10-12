import React from "react";
import { Outlet } from "react-router-dom";
import { NotFoundPage } from "../design/pages";
import { usePermissions } from "../hooks";
import type { AdminAction, AdminResource } from "../modules/admin/role";
import { AdminLayout } from "../modules/admin/components/AdminLayout";

interface IAdminRootRouteProps {
  action: AdminAction;
  resource: AdminResource;
  superAdminOnly?: boolean;
  /** Allow any admin (skip resource permission). For client-only mock modules. */
  adminOnly?: boolean;
}

export const AdminRootRoute: React.FC<IAdminRootRouteProps> = ({
  action,
  resource,
  superAdminOnly = false,
  adminOnly = false,
}) => {
  const { can, isAdmin, isLoading, isSuperAdmin } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100 text-base-content">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  const isAllowed = adminOnly
    ? isAdmin
    : superAdminOnly
      ? isSuperAdmin
      : isAdmin && can(action, resource);

  return isAllowed ? (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ) : (
    <NotFoundPage />
  );
};
