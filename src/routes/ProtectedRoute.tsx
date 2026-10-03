import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts";
import AppRoutes from "../AppRoutes";
import { PageLayout } from "../design/pages";
import { DialogAuthSteps } from "../modules/auth";
import { AtomService } from "../services";
import { StorageKeys } from "../constants";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const targetUrl = `${location.pathname}${location.search}`;
    AtomService.set(StorageKeys.CONTINUE_URL, targetUrl);
    return (
      <Navigate
        to={AppRoutes.buildDialogUrl(DialogAuthSteps.INITIAL)}
        replace
      />
    );
  }

  const isAdminPath = location.pathname.startsWith(
    AppRoutes.client.protected.admin.HOME,
  );

  return (
    <PageLayout isAdmin={isAdminPath}>
      <Outlet />
    </PageLayout>
  );
};

export default ProtectedRoute;
