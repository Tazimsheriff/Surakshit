import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { RiskResult } from "../components/RiskResult";
import { Button, Card } from "../components/Ui";
import { fill } from "../i18n/en";
import { useI18n } from "../i18n/I18nProvider";
import { analyzeMessage, analyzeUrl, ApiError } from "../lib/api";
import { messageSamples, urlSamples } from "../lib/content";
import { buildSummary, copyText } from "../lib/summary";
import type { AnalysisResult } from "../types";

const messageSchema = z.object({
  text: z.string().trim().min(1, "required").max(4000, "too_long"),
  consentToAi: z.boolean(),
});
const urlSchema = z.object({
  url: z.string().trim().min(1, "required").max(2048, "too_long"),
  consentToAi: z.boolean(),
});

type MessageForm = z.infer<typeof messageSchema>;
type UrlForm = z.infer<typeof urlSchema>;

export default function AnalyzePage() {
  const { t, language } = useI18n();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"message" | "url">(params.get("mode") === "url" ? "url" : "message");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [view, setView] = useState<{ result: AnalysisResult; text?: string } | null>(null);
  const messageSample = useRef(0);
  const urlSample = useRef(0);

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { text: "", consentToAi: false },
  });
  const urlForm = useForm<UrlForm>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "", consentToAi: false },
  });
  const messageText = useWatch({ control: messageForm.control, name: "text" });
  const urlText = useWatch({ control: urlForm.control, name: "url" });

  useEffect(() => {
    document.title = `${t.analyze.title} · ${t.brand}`;
  }, [t.analyze.title, t.brand]);

  useEffect(() => {
    setMode(params.get("mode") === "url" ? "url" : "message");
  }, [params]);

  function validationCopy(code?: string): string | null {
    if (code === "required") return t.analyze.required;
    if (code === "too_long") return t.analyze.tooLong;
    return null;
  }

  async function submitMessage(values: MessageForm) {
    setLoading(true);
    setErrorCode(null);
    setCopyState("idle");
    try {
      const response = await analyzeMessage({ text: values.text, consentToAi: values.consentToAi, language });
      setView({ result: response.result, text: values.text });
    } catch (error) {
      setView(null);
      setErrorCode(error instanceof ApiError ? error.code : "network");
    } finally {
      setLoading(false);
    }
  }

  async function submitUrl(values: UrlForm) {
    setLoading(true);
    setErrorCode(null);
    setCopyState("idle");
    try {
      const response = await analyzeUrl({ url: values.url, consentToAi: values.consentToAi, language });
      setView({ result: response.result });
    } catch (error) {
      setView(null);
      setErrorCode(error instanceof ApiError ? error.code : "network");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!view) return;
    const ok = await copyText(buildSummary(view.result, t));
    setCopyState(ok ? "copied" : "failed");
  }

  function reset() {
    setView(null);
    setErrorCode(null);
    setCopyState("idle");
    if (mode === "message") messageForm.setFocus("text");
    else urlForm.setFocus("url");
  }

  const messageError = validationCopy(messageForm.formState.errors.text?.message);
  const urlError = validationCopy(urlForm.formState.errors.url?.message);
  const requestError = errorCode ? t.analyze.errors[errorCode as keyof typeof t.analyze.errors] ?? t.analyze.errors.server_error : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.analyze.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">{t.analyze.intro}</p>
      </div>
      <div role="tablist" aria-label={t.analyze.title} className="flex gap-2">
        <button type="button" role="tab" id="tab-message" aria-selected={mode === "message"} aria-controls="panel-message" className={`min-h-11 rounded-md px-4 text-sm font-semibold ${mode === "message" ? "bg-navy-900 text-white dark:bg-white dark:text-navy-950" : "bg-slate-100 dark:bg-navy-800"}`} onClick={() => setMode("message")}>
          {t.analyze.messageTab}
        </button>
        <button type="button" role="tab" id="tab-url" aria-selected={mode === "url"} aria-controls="panel-url" className={`min-h-11 rounded-md px-4 text-sm font-semibold ${mode === "url" ? "bg-navy-900 text-white dark:bg-white dark:text-navy-950" : "bg-slate-100 dark:bg-navy-800"}`} onClick={() => setMode("url")}>
          {t.analyze.urlTab}
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div>
          <Card className={mode === "message" ? "" : "hidden"} hidden={mode !== "message"} id="panel-message" role="tabpanel" aria-labelledby="tab-message">
            <form className="space-y-4" onSubmit={messageForm.handleSubmit(submitMessage)} noValidate>
              <div>
                <label htmlFor="message-text" className="text-sm font-bold">{t.analyze.messageLabel}</label>
                <textarea
                  id="message-text"
                  rows={8}
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 dark:border-slate-600 dark:bg-navy-950"
                  aria-invalid={Boolean(messageError)}
                  aria-describedby="message-hint message-error"
                  {...messageForm.register("text")}
                />
                <div className="mt-1 flex justify-between gap-3 text-xs text-slate-500">
                  <p id="message-hint">{t.analyze.messageHint}</p>
                  <p>{fill(t.analyze.count, { used: messageText.length, max: 4000 })}</p>
                </div>
                {messageError ? <p id="message-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">{messageError}</p> : <p id="message-error" className="sr-only" />}
              </div>
              <Consent name="consentToAi" form={messageForm} label={t.analyze.consent} detail={t.analyze.consentDetail} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>{loading && mode === "message" ? t.analyze.loading : t.analyze.analyzeMessage}</Button>
                <Button variant="secondary" onClick={() => { const next = messageSamples[messageSample.current % messageSamples.length] ?? ""; messageSample.current += 1; messageForm.setValue("text", next, { shouldValidate: true }); }}>{t.analyze.pasteMessage}</Button>
                <Button variant="ghost" onClick={() => messageForm.reset({ text: "", consentToAi: messageForm.getValues("consentToAi") })}>{t.analyze.clear}</Button>
              </div>
            </form>
          </Card>

          <Card className={mode === "url" ? "" : "hidden"} hidden={mode !== "url"} id="panel-url" role="tabpanel" aria-labelledby="tab-url">
            <form className="space-y-4" onSubmit={urlForm.handleSubmit(submitUrl)} noValidate>
              <div>
                <label htmlFor="url-text" className="text-sm font-bold">{t.analyze.urlLabel}</label>
                <input
                  id="url-text"
                  spellCheck={false}
                  autoComplete="off"
                  inputMode="url"
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-sm dark:border-slate-600 dark:bg-navy-950"
                  aria-invalid={Boolean(urlError)}
                  aria-describedby="url-hint url-error"
                  {...urlForm.register("url")}
                />
                <div className="mt-1 flex justify-between gap-3 text-xs text-slate-500">
                  <p id="url-hint">{t.analyze.urlHint}</p>
                  <p>{fill(t.analyze.count, { used: urlText.length, max: 2048 })}</p>
                </div>
                {urlError ? <p id="url-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">{urlError}</p> : <p id="url-error" className="sr-only" />}
              </div>
              <Consent name="consentToAi" form={urlForm} label={t.analyze.consent} detail={t.analyze.consentDetail} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>{loading && mode === "url" ? t.analyze.loading : t.analyze.analyzeUrl}</Button>
                <Button variant="secondary" onClick={() => { const next = urlSamples[urlSample.current % urlSamples.length] ?? ""; urlSample.current += 1; urlForm.setValue("url", next, { shouldValidate: true }); }}>{t.analyze.pasteUrl}</Button>
                <Button variant="ghost" onClick={() => urlForm.reset({ url: "", consentToAi: urlForm.getValues("consentToAi") })}>{t.analyze.clear}</Button>
              </div>
            </form>
          </Card>
        </div>

        <Card>
          <div aria-live="polite">
            {requestError ? <p role="alert" className="mb-4 text-sm font-semibold text-red-700">{requestError}</p> : null}
            {view ? (
              <div className="space-y-4">
                <RiskResult result={view.result} sourceText={view.text} t={t} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => void copySummary()}>{t.analyze.copy}</Button>
                  <Button variant="ghost" onClick={reset}>{t.analyze.another}</Button>
                </div>
                {copyState === "copied" ? <p role="status" className="text-sm font-semibold text-teal-800 dark:text-teal-300">{t.analyze.copied}</p> : null}
                {copyState === "failed" ? <p role="status" className="text-sm">{t.analyze.copyFailed}</p> : null}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold">{t.analyze.emptyTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{t.analyze.emptyBody}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Consent({
  form,
  name,
  label,
  detail,
}: {
  form: { register: (name: "consentToAi") => object };
  name: "consentToAi";
  label: string;
  detail: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm leading-6">
      <input type="checkbox" className="mt-1 h-4 w-4" {...form.register(name)} />
      <span>
        <span className="font-semibold">{label}</span>
        <span className="mt-1 block text-slate-600 dark:text-slate-300">{detail}</span>
      </span>
    </label>
  );
}
