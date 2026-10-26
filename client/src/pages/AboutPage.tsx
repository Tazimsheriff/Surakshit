import { useEffect, useState } from "react";
import { Button } from "../components/Ui";
import { useI18n } from "../i18n/I18nProvider";
import { fetchHealth } from "../lib/api";
import { clearQuiz } from "../lib/quizStorage";
import type { HealthStatus } from "../types";

export default function AboutPage() {
  const { t, language, setLanguage } = useI18n();
  const [health, setHealth] = useState<HealthStatus | "error" | "loading">("loading");
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    document.title = `${t.about.title} · ${t.brand}`;
  }, [t.about.title, t.brand]);

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((status) => {
        if (active) setHealth(status);
      })
      .catch(() => {
        if (active) setHealth("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t.about.title}</h1>
        <p className="mt-3 leading-7">{t.about.intro}</p>
      </header>
      <section>
        <h2 className="text-xl font-bold">{t.about.languageTitle}</h2>
        <p className="mt-2 text-sm leading-6">{t.about.languageBody}</p>
        <div className="mt-3 flex gap-2" role="group" aria-label={t.language.label}>
          <Button variant={language === "en" ? "primary" : "secondary"} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>{t.language.en}</Button>
          <Button variant={language === "ta" ? "primary" : "secondary"} aria-pressed={language === "ta"} onClick={() => setLanguage("ta")}>{t.language.ta}</Button>
        </div>
      </section>
      <section id="privacy">
        <h2 className="text-xl font-bold">{t.about.privacyTitle}</h2>
        <p className="mt-2 text-sm leading-7">{t.about.privacyBody}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t.about.limitsTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          {Object.values(t.limitations).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t.about.methodTitle}</h2>
        <p className="mt-2 text-sm leading-7">{t.about.methodBody}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t.about.projectTitle}</h2>
        <p className="mt-2 text-sm leading-7">{t.about.projectBody}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t.about.licenseTitle}</h2>
        <p className="mt-2 text-sm leading-7">{t.about.licenseBody}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t.about.resourcesTitle}</h2>
        <p className="mt-2 text-sm leading-7">{t.about.resourcesBody}</p>
        <ul className="mt-3 space-y-2 text-sm font-semibold">
          <li><a className="underline" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer noopener">{t.about.portal}</a></li>
          <li><a className="underline" href="https://www.cert-in.org.in" target="_blank" rel="noreferrer noopener">{t.about.cert}</a></li>
          <li>{t.about.helpline}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t.about.statusTitle}</h2>
        {health === "loading" ? <p className="mt-2 text-sm">{t.analyze.loading}</p> : null}
        {health === "error" ? <p className="mt-2 text-sm" role="alert">{t.about.statusUnavailable}</p> : null}
        {health !== "loading" && health !== "error" ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            <li>{health.aiConfigured ? t.about.aiOn : t.about.aiOff}</li>
            <li>{health.persistence === "supabase" ? t.about.persistenceSupabase : t.about.persistenceMemory}</li>
          </ul>
        ) : null}
      </section>
      <section>
        <Button
          variant="secondary"
          onClick={() => {
            clearQuiz();
            setCleared(true);
          }}
        >
          {t.about.clearQuiz}
        </Button>
        {cleared ? <p role="status" className="mt-2 text-sm font-semibold">{t.about.quizCleared}</p> : null}
      </section>
    </div>
  );
}
