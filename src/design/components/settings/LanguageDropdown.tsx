import { useAtom } from "jotai";
import { i18n } from "../../../locales";
import { Dropdown } from "../form/Dropdown";
import atoms from "../../../atoms";
import { cn } from "../../helpers";

export interface ILanguageDropdownProps {
  className?: string;
}

export const LanguageDropdown = ({ className }: ILanguageDropdownProps) => {
  const [locale, setLocale] = useAtom(atoms.localeAtom);

  const languageOptions = [
    { value: "en", label: "🇺🇸 English" },
    { value: "my", label: "🇲🇲 မြန်မာ" },
  ];

  const handleLanguageChange = (value: string) => {
    setLocale(value);
    i18n.changeLanguage(value);
  };

  return (
    <Dropdown
      options={languageOptions}
      value={locale}
      onValueChange={handleLanguageChange}
      fullWidth={false}
      className={cn("min-w-36", className)}
    />
  );
};
