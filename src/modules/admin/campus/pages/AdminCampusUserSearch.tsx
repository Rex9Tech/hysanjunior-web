import React, { useCallback, useEffect, useState } from "react";
import { SearchInput } from "../../../../design";
import { AppLocales, useTranslate } from "../../../../locales";
import UserController from "../../user/user.controller";
import type { IAdminUser } from "../../user/types";
import {
  ADMIN_CAMPUS_USER_SEARCH_LIMIT,
  ADMIN_CAMPUS_USER_SEARCH_MIN_LENGTH,
} from "../constants";

interface IAdminCampusUserSearchProps {
  label: string;
  selectedUser: IAdminUser | null;
  onSelect: (user: IAdminUser | null) => void;
  placeholder?: string;
}

export const AdminCampusUserSearch: React.FC<IAdminCampusUserSearchProps> = ({
  label,
  selectedUser,
  onSelect,
  placeholder,
}) => {
  const t = useTranslate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<IAdminUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = useCallback(async (search: string) => {
    setIsSearching(true);
    const result = await UserController.getUsers({
      search,
      limit: ADMIN_CAMPUS_USER_SEARCH_LIMIT,
    });
    setIsSearching(false);
    if (result.success) {
      setSuggestions(result.users);
    } else {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < ADMIN_CAMPUS_USER_SEARCH_MIN_LENGTH) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void searchUsers(trimmed);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, searchUsers]);

  if (selectedUser) {
    return (
      <div className="space-y-2">
        <p className="text-body-s font-medium text-base-content">{label}</p>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-base-300 bg-base-100 px-3 py-2">
          <div>
            <p className="font-medium text-base-content">
              {selectedUser.name || selectedUser.username}
            </p>
            <p className="text-caption text-base-content/60">
              {selectedUser.email}
              {selectedUser.username ? ` · @${selectedUser.username}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => onSelect(null)}
          >
            {t(AppLocales.Admin.Common.Actions.ClearAll)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-body-s font-medium text-base-content">{label}</p>
      <SearchInput
        placeholder={
          placeholder || t(AppLocales.Admin.Campuses.UserSearch.Placeholder)
        }
        searchableKeys={[
          t(AppLocales.Admin.Common.Detail.Name),
          t(AppLocales.Admin.Users.Table.Email),
        ]}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
      />
      {isSearching ? (
        <p className="text-caption text-base-content/60">
          {t(AppLocales.Admin.Campuses.UserSearch.Searching)}
        </p>
      ) : null}
      {suggestions.length > 0 ? (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-base-300 bg-base-100">
          {suggestions.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-base-200"
                onClick={() => {
                  onSelect(user);
                  setQuery("");
                  setSuggestions([]);
                }}
              >
                <span className="font-medium text-base-content">
                  {user.name || user.username}
                </span>
                <span className="text-caption text-base-content/60">
                  {user.email}
                  {user.username ? ` · @${user.username}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
