import React, { useState } from "react";
import { iconsLib } from "../../../../assets";
import { Button, Image } from "../../../../design";
import { ButtonVariants, ComponentSizes } from "../../../../design/constants";
import { AppLocales, useTranslate } from "../../../../locales";
import {
  Dropdown,
  FormActionRow,
  FormContainer,
  TextInput,
} from "../../components";
import { ADMIN_ACTIONS } from "../../constants";
import { AdminAssetSelectDialog } from "../../asset/components/AdminAssetSelectDialog";
import { ASSET_FORMATS, ASSET_TYPES } from "../../asset/constants";
import { unwrapNested } from "../campus.helpers";
import { ADMIN_CAMPUS_STATUS_OPTIONS } from "../constants";
import {
  CAMPUS_STATUSES,
  type IAdminCampus,
  type IAdminCampusFormValues,
  type TCampusStatus,
} from "../types";

interface IAdminCampusFormProps {
  mode: typeof ADMIN_ACTIONS.CREATE | typeof ADMIN_ACTIONS.EDIT;
  campus?: IAdminCampus | null;
  onSubmit: (values: IAdminCampusFormValues) => void;
  onCancel: () => void;
}

interface IAdminCampusFormState {
  name: string;
  code: string;
  phone: string;
  location: string;
  status: TCampusStatus;
}

const emptyValues: IAdminCampusFormState = {
  name: "",
  code: "",
  phone: "",
  location: "",
  status: CAMPUS_STATUSES.ACTIVE,
};

const buildInitialValues = (
  campus?: IAdminCampus | null,
): IAdminCampusFormState => {
  if (!campus) return emptyValues;
  return {
    name: campus.name,
    code: campus.code ?? "",
    phone: campus.phone ?? "",
    location: campus.location ?? "",
    status: campus.status,
  };
};

export const AdminCampusForm: React.FC<IAdminCampusFormProps> = ({
  mode,
  campus,
  onSubmit,
  onCancel,
}) => {
  const t = useTranslate();
  const [values, setValues] = useState<IAdminCampusFormState>(() =>
    buildInitialValues(campus),
  );
  const [nameError, setNameError] = useState("");
  const image = unwrapNested(campus?.image);
  const [imageAssetId, setImageAssetId] = useState<string | null>(
    campus?.image_asset_id ?? image?.id ?? null,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(image?.url ?? null);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

  const updateValue = <K extends keyof IAdminCampusFormState>(
    field: K,
    value: IAdminCampusFormState[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim()) {
      setNameError(t(AppLocales.Admin.Campuses.Form.NameError));
      return;
    }
    setNameError("");

    onSubmit({
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      location: values.location.trim() || null,
      image_asset_id: imageAssetId,
      ...(mode === ADMIN_ACTIONS.EDIT
        ? { code: values.code.trim() || null }
        : {}),
      status: values.status,
    });
  };

  const statusOptions = ADMIN_CAMPUS_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: t(AppLocales.Admin.Campuses.Status[status]),
  }));

  return (
    <FormContainer onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-base-200 bg-base-100">
        <div className="w-28 h-20 rounded-lg overflow-hidden border border-base-300 bg-base-200 shrink-0 flex items-center justify-center">
          <Image
            src={imageUrl || ""}
            alt={values.name || "Campus"}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <span className="text-sm font-semibold text-base-content block">
            {t(AppLocales.Admin.Campuses.Form.ImageLabel)}
          </span>
          <span className="text-xs text-base-content/60 block">
            {t(AppLocales.Admin.Campuses.Form.ImageHelper)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={ButtonVariants.SECONDARY}
            size={ComponentSizes.SM}
            onClick={() => setIsAssetPickerOpen(true)}
          >
            <iconsLib.photo className="w-4 h-4 mr-1.5" />
            {t(AppLocales.Admin.Campuses.Form.ChooseImage)}
          </Button>
          {imageAssetId || imageUrl ? (
            <Button
              variant={ButtonVariants.TERTIARY}
              size={ComponentSizes.SM}
              className="text-error hover:bg-error/10"
              onClick={() => {
                setImageAssetId("");
                setImageUrl(null);
              }}
            >
              <iconsLib.trash className="w-4 h-4 mr-1" />
              {t(AppLocales.Admin.Campuses.Form.RemoveImage)}
            </Button>
          ) : null}
        </div>
      </div>

      <AdminAssetSelectDialog
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        assetType={ASSET_TYPES.GENERAL}
        format={ASSET_FORMATS.IMAGE}
        selectedAssetId={imageAssetId}
        title={t(AppLocales.Admin.Campuses.Form.PickerTitle)}
        onSelect={(asset) => {
          setImageAssetId(asset.id);
          setImageUrl(asset.url);
          setIsAssetPickerOpen(false);
        }}
      />

      <TextInput
        label={t(AppLocales.Admin.Campuses.Form.NameLabel)}
        placeholder={t(AppLocales.Admin.Campuses.Form.NamePlaceholder)}
        value={values.name}
        onChange={(e) => updateValue("name", e.target.value)}
        error={nameError}
        required
      />

      {mode === ADMIN_ACTIONS.EDIT ? (
        <TextInput
          label={t(AppLocales.Admin.Campuses.Form.CodeLabel)}
          placeholder={t(AppLocales.Admin.Campuses.Form.CodePlaceholder)}
          value={values.code}
          onChange={(e) => updateValue("code", e.target.value)}
        />
      ) : null}

      <TextInput
        label={t(AppLocales.Admin.Campuses.Form.PhoneLabel)}
        placeholder={t(AppLocales.Admin.Campuses.Form.PhonePlaceholder)}
        value={values.phone}
        onChange={(e) => updateValue("phone", e.target.value)}
      />

      <TextInput
        label={t(AppLocales.Admin.Campuses.Form.LocationLabel)}
        placeholder={t(AppLocales.Admin.Campuses.Form.LocationPlaceholder)}
        value={values.location}
        onChange={(e) => updateValue("location", e.target.value)}
      />

      <Dropdown
        label={t(AppLocales.Admin.Campuses.Form.StatusLabel)}
        value={values.status}
        onValueChange={(value) => updateValue("status", value as TCampusStatus)}
        options={statusOptions}
        placeholder={t(AppLocales.Admin.Campuses.Form.StatusLabel)}
      />

      <FormActionRow
        onCancel={onCancel}
        cancelLabel={t(AppLocales.Admin.Common.Actions.Cancel)}
        submitLabel={
          mode === ADMIN_ACTIONS.CREATE
            ? t(AppLocales.Admin.Campuses.Form.CreateCampus)
            : t(AppLocales.Admin.Campuses.Form.SaveCampus)
        }
      />
    </FormContainer>
  );
};
