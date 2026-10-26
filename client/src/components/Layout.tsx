import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";
import { useTheme } from "./Theme";

const links = [
  ["/", "home", true],
  ["/analyze", "analyze", false],
  ["/learn", "learn", false],
  ["/dashboard", "dashboard", false],
  ["/about", "about", false],
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggle } = useTheme();
  const home = useLocation().pathname === "/";
  const [open, setOpen] = useState(false);

  const languageButtons = (
    <div className="flex items-center gap-1" role="group" aria-label={t.language.label}>
      <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")} className={`min-h-11 rounded-md px-3 text-sm font-medium ${language === "en" ? "bg-[#2a2a26] text-[#ddd6c6] dark:bg-white dark:text-[#111]" : ""}`}>
        {t.language.en}
      </button>
      <button type="button" aria-pressed={language === "ta"} onClick={() => setLanguage("ta")} className={`min-h-11 rounded-md px-3 text-sm font-medium ${language === "ta" ? "bg-[#2a2a26] text-[#ddd6c6] dark:bg-white dark:text-[#111]" : ""}`}>
        {t.language.ta}
      </button>
    </div>
  );

  if (home) {
    return (
      <div className="min-h-svh bg-[#ddd6c6] text-[#2a2a26] dark:bg-[#111] dark:text-[#f4f1ea]">
        <a href="#main" className="skip-link rounded-md bg-[#2a2a26] px-3 py-2 text-sm font-semibold text-[#ddd6c6]">{t.skip}</a>
        <header className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 pt-5">
          <Link to="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Epilogue, "Noto Sans Tamil", sans-serif' }}>{t.brand}</Link>
          <nav aria-label={t.nav.label} className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            {links.map(([to, key, end]) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `min-h-11 py-2 text-base ${isActive ? "font-semibold" : "text-[#6b5b51] dark:text-[#b4b4b4]"}`}>
                {t.nav[key]}
              </NavLink>
            ))}
          </nav>
          {languageButtons}
          <button type="button" onClick={toggle} className="min-h-11 px-2 text-sm" aria-label={theme === "dark" ? t.theme.toLight : t.theme.toDark}>
            {theme === "dark" ? t.theme.light : t.theme.dark}
          </button>
        </header>
        <main id="main">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[#ddd6c6] text-[#2a2a26] dark:bg-[#111] dark:text-[#f4f1ea]">
      <a href="#main" className="skip-link rounded-md bg-[#2a2a26] px-3 py-2 text-sm font-semibold text-[#ddd6c6]">{t.skip}</a>
      <div className="md:grid md:min-h-svh md:grid-cols-[228px_minmax(0,1fr)]">
        <aside className="hidden flex-col px-4 py-5 md:flex">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">{t.brand}</Link>
          <nav aria-label={t.nav.label} className="mt-8 flex flex-col gap-1">
            {links.map(([to, key, end]) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center rounded-md px-3 text-sm ${isActive ? "bg-[#ddd8ce] font-medium dark:bg-[#262626]" : ""}`}>
                {t.nav[key]}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-3 pt-8">
            {languageButtons}
            <p className="text-sm leading-5 text-[#6b5b51] dark:text-[#b4b4b4]">{t.footer.helpline}</p>
          </div>
        </aside>
        <div className="flex min-h-svh flex-col md:py-2 md:pr-2">
          <div className="flex h-12 items-center gap-3 px-4 md:px-2">
            <button type="button" className="min-h-11 px-1 text-sm font-medium md:hidden" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              {t.nav.label}
            </button>
            <Link to="/" className="font-display font-bold md:hidden">{t.brand}</Link>
            <div className="ml-auto flex items-center gap-2">
              <span className="md:hidden">{languageButtons}</span>
              <button type="button" onClick={toggle} className="min-h-11 px-2 text-sm" aria-label={theme === "dark" ? t.theme.toLight : t.theme.toDark}>
                {theme === "dark" ? t.theme.light : t.theme.dark}
              </button>
            </div>
          </div>
          {open ? (
            <nav aria-label={t.nav.label} className="grid gap-1 px-4 pb-3 md:hidden">
              {links.map(([to, key, end]) => (
                <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className="flex min-h-11 items-center text-base">
                  {t.nav[key]}
                </NavLink>
              ))}
            </nav>
          ) : null}
          <main id="main" className="app-sheet mx-4 mb-4 flex-1 rounded-2xl border border-[#e4e0d8] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] md:mx-0 md:mb-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
