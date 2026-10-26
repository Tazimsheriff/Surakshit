import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Ui";
import { fill } from "../i18n/en";
import { useI18n } from "../i18n/I18nProvider";
import { loadModules } from "../lib/content";
import { writeQuiz } from "../lib/quizStorage";
import type { LearningModule } from "../types";
import { localText } from "./LearnPage";

export default function ModulePage() {
  const { moduleId } = useParams();
  const { t, language } = useI18n();
  const [module, setModule] = useState<LearningModule | null | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let active = true;
    loadModules()
      .then((items) => {
        if (!active) return;
        setModule(items.find((item) => item.id === moduleId) ?? null);
      })
      .catch(() => {
        if (active) setModule(null);
      });
    return () => {
      active = false;
    };
  }, [moduleId]);

  useEffect(() => {
    if (module) document.title = `${localText(module.title, language)} · ${t.brand}`;
  }, [module, language, t.brand]);

  if (module === undefined) return <p>{t.analyze.loading}</p>;
  if (!module) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t.learn.notFound}</h1>
        <Link to="/learn" className="mt-4 inline-flex min-h-11 items-center font-semibold underline">{t.learn.back}</Link>
      </div>
    );
  }

  const question = module.quiz[index];
  const finishedScore = finished ? correctCount : 0;

  function reveal() {
    if (selected === null || revealed || !question) return;
    if (selected === question.correctIndex) setCorrectCount((count) => count + 1);
    setRevealed(true);
  }

  function next() {
    if (!module) return;
    if (index + 1 >= module.quiz.length) {
      const score = correctCount;
      writeQuiz(module.id, score, module.quiz.length);
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
  }

  function retry() {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setFinished(false);
  }

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <p><Link to="/learn" className="text-sm font-semibold text-teal-800 hover:underline dark:text-teal-300">{t.learn.back}</Link></p>
      <header>
        <h1 className="text-3xl font-bold">{localText(module.title, language)}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{fill(t.learn.minutes, { n: module.minutes })}</p>
        <p className="mt-4 leading-7">{localText(module.explanation, language)}</p>
      </header>
      <section>
        <h2 className="text-xl font-bold">{t.learn.warningSigns}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          {module.warningSigns.map((sign) => <li key={localText(sign, "en")}>{localText(sign, language)}</li>)}
        </ul>
      </section>
      <section className="rounded-xl bg-slate-100 p-4 dark:bg-navy-800">
        <h2 className="font-bold">{t.learn.example}</h2>
        <p className="mt-2 text-sm leading-6">{localText(module.example, language)}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t.learn.actions}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          {module.safeActions.map((action) => <li key={localText(action, "en")}>{localText(action, language)}</li>)}
        </ul>
      </section>
      <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
        <h2 className="text-xl font-bold">{t.learn.quiz}</h2>
        {finished ? (
          <div className="mt-4 space-y-3">
            <p className="text-lg font-bold">{fill(t.quiz.score, { score: finishedScore, total: module.quiz.length })}</p>
            <p className="text-sm">{t.quiz.saved}</p>
            <Button variant="secondary" onClick={retry}>{t.quiz.retry}</Button>
          </div>
        ) : question ? (
          <fieldset className="mt-4 space-y-3" disabled={revealed}>
            <legend className="text-sm font-semibold text-slate-500">{fill(t.quiz.progress, { current: index + 1, total: module.quiz.length })}</legend>
            <p className="font-semibold">{localText(question.prompt, language)}</p>
            {question.choices.map((choice, choiceIndex) => (
              <label key={localText(choice, "en")} className="flex items-start gap-3 text-sm leading-6">
                <input
                  type="radio"
                  name={question.id}
                  className="mt-1"
                  checked={selected === choiceIndex}
                  onChange={() => setSelected(choiceIndex)}
                />
                <span>{localText(choice, language)}</span>
              </label>
            ))}
            {!revealed ? (
              <Button onClick={reveal} disabled={selected === null}>{t.quiz.check}</Button>
            ) : null}
          </fieldset>
        ) : null}
        {revealed && question && !finished ? (
          <div className="mt-4 space-y-3" role="status">
            <p className="font-bold">{selected === question.correctIndex ? t.quiz.correct : t.quiz.incorrect}</p>
            <p className="text-sm leading-6">{localText(question.explanation, language)}</p>
            <Button onClick={next}>{index + 1 >= module.quiz.length ? t.quiz.results : t.quiz.next}</Button>
          </div>
        ) : null}
      </section>
    </article>
  );
}
