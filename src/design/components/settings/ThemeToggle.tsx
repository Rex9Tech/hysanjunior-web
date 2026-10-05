// src/design/components/settings/ThemeToggle.tsx

import { FC } from "react";
import { useAtom } from "jotai";
import { Button } from "../button";
import { ButtonVariants, ThemeVariants } from "../../constants";
import atoms from "../../../atoms";
import { iconsLib } from "../../../assets";
import { cn } from "../../helpers";

export interface IThemeToggleProps {
  className?: string;
}

export const ThemeToggle: FC<IThemeToggleProps> = ({ className }) => {
  const [theme, setTheme] = useAtom(atoms.themeAtom);
  const resolvedTheme =
    theme === ThemeVariants.NIGHT ? ThemeVariants.NIGHT : ThemeVariants.DAY;

  const toggleTheme = () => {
    const newTheme =
      resolvedTheme === ThemeVariants.DAY
        ? ThemeVariants.NIGHT
        : ThemeVariants.DAY;
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <Button
      variant={ButtonVariants.TERTIARY}
      onClick={toggleTheme}
      className={cn(
        "w-10 h-10 p-0 flex items-center justify-center rounded-full hover:bg-base-200 transition-colors",
        className,
      )}
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {resolvedTheme === ThemeVariants.NIGHT ? (
          <iconsLib.sun />
        ) : (
          <iconsLib.moon />
        )}
      </span>
    </Button>
  );
};

export default ThemeToggle;
