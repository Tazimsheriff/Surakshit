import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider";

export default function NotFoundPage() {
  const { t } = useI18n();
  useEffect(() => {
    document.title = `${t.notFound.title} · ${t.brand}`;
  }, [t.notFound.title, t.brand]);
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold">{t.notFound.title}</h1>
      <p className="mt-3 leading-7">{t.notFound.body}</p>
      <div className="mt-5 flex gap-4 text-sm font-semibold">
        <Link className="underline" to="/">{t.notFound.home}</Link>
        <Link className="underline" to="/analyze">{t.nav.analyze}</Link>
      </div>
    </div>
  );
}
