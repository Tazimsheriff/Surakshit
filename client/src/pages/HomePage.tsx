import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";
import { analyzeMessage } from "../lib/api";
import { splitHighlight } from "../lib/highlight";
import type { AnalysisResult } from "../types";

const display = { fontFamily: 'Epilogue, "Noto Sans Tamil", sans-serif' } as const;

const samples = {
  en: [
    { label: "A notice", text: "SBI alert: your account will be blocked within 2 hours. Share the OTP sent to your phone immediately." },
    { label: "A prize", text: "You have won a lottery prize of Rs 50,000. Pay the processing fee of Rs 499 to claim it." },
    { label: "Ordinary", text: "Hi, the study group will meet at 4 pm in the library. Please bring your notes." },
  ],
  ta: [
    { label: "அறிவிப்பு", text: "உங்கள் வங்கிக் கணக்கு உடனடியாக முடக்கப்படும். OTP-ஐ இந்த எண்ணுக்கு அனுப்புங்கள்." },
    { label: "பரிசு", text: "உங்களுக்கு ரூ. 50,000 பரிசு கிடைத்துள்ளது. பெற ரூ. 499 கட்டணம் செலுத்துங்கள்." },
    { label: "சாதாரணம்", text: "வணக்கம், படிப்புக் குழு மாலை 4 மணிக்கு நூலகத்தில் சந்திக்கும். குறிப்புகளைக் கொண்டு வாருங்கள்." },
  ],
} as const;

export default function HomePage() {
  const { t, language } = useI18n();
  const lines = samples[language];
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const sample = lines[index] ?? lines[0];

  useEffect(() => {
    document.title = `${t.brand} · ${t.tagline}`;
  }, [t.brand, t.tagline]);

  useEffect(() => {
    let active = true;
    setResult(null);
    analyzeMessage({ text: sample.text, consentToAi: false, language })
      .then((body) => {
        if (active) setResult(body.result);
      })
      .catch(() => {
        if (active) setResult(null);
      });
    return () => {
      active = false;
    };
  }, [sample.text, language]);

  const parts = splitHighlight(sample.text, result?.highlightedPhrases ?? []);

  return (
    <div>
      <section className="grid items-end gap-10 px-6 pb-16 pt-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="text-[clamp(2.15rem,8.2vw,7.5rem)] font-black leading-[0.9] tracking-[-0.03em]" style={display}>
            <span className="block overflow-hidden whitespace-nowrap"><span className="rise block">{t.home.line1}</span></span>
            <span className="block overflow-hidden whitespace-nowrap"><span className="rise d1 block">{t.home.line2}</span></span>
          </h1>
          <p className="rise d2 mt-8 max-w-[34rem] text-[1.25rem] leading-8">{t.home.support}</p>
          <Link to="/analyze" className="rise d3 mt-6 inline-flex min-h-11 items-center bg-[#3f5a2a] px-5 text-base font-semibold text-white hover:bg-[#314820]">{t.home.primary}</Link>
        </div>
        <div className="min-h-[16rem] bg-[#d2cab8] p-6 lg:col-span-5" data-ui>
          <div className="flex flex-wrap gap-2">
            {lines.map((line, lineIndex) => (
              <button key={line.label} type="button" aria-pressed={lineIndex === index} onClick={() => setIndex(lineIndex)} className={`min-h-11 px-3 text-base ${lineIndex === index ? "bg-[#2a2a26] text-[#e5e1d8] dark:bg-white dark:text-[#111]" : "bg-[#dad5ca] dark:bg-[#262626]"}`}>
                {line.label}
              </button>
            ))}
          </div>
          <p className="mt-6 min-h-[8rem] text-base leading-7">
            {parts.map((part, partIndex) => part.match ? <mark key={partIndex} className="hit">{part.text}</mark> : <span key={partIndex}>{part.text}</span>)}
          </p>
          <p className="num mt-6 text-[clamp(2rem,4vw,3.5rem)] font-medium leading-none">
            {result ? result.score : "–"}
            <span className="ml-3 text-lg text-[#2a2a26] dark:text-[#d8d8d8]">{result ? t.categories[result.riskCategory].label : t.analyze.score}</span>
          </p>
          <p className="mt-3 text-base leading-7 text-[#2a2a26] dark:text-[#d8d8d8]">{t.home.resultNote}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <h2 className="rise text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.03em]" style={display}>{t.home.howTitle}</h2>
        <div className="mt-8 flex min-h-[14rem] flex-col md:flex-row" data-ui>
          {t.home.steps.map((step, stepIndex) => (
            <div key={step.title} className={`flex min-h-[5.5rem] flex-col justify-between p-5 text-[#ddd6c6] ${stepIndex === 1 ? "flex-[1.4] bg-[#3f5a2a]" : "flex-1 bg-[#2a2a26]"} ${stepIndex === 0 ? "" : "mt-1.5 md:ml-1.5 md:mt-0"}`}>
              <p className="text-xl">{step.title}</p>
              <p className="max-w-[22ch] text-base leading-6">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-24">
        <h2 className="rise text-[clamp(2.2rem,4vw,3rem)] font-black leading-none tracking-[-0.03em]" style={display}>{t.home.compareTitle}</h2>
        <div className="mt-10" data-ui>
          <div className="hidden grid-cols-12 gap-4 px-4 py-3 text-base font-medium md:grid">
            <span className="col-span-4" />
            <span className="col-span-4">{t.home.compareUsual}</span>
            <span className="col-span-4 bg-[#3f5a2a] px-3 py-2 text-white">{t.home.compareOurs}</span>
          </div>
          {t.home.compare.map((row, rowIndex) => (
            <div key={row.name} className={`rise grid gap-2 px-4 py-4 md:grid-cols-12 md:items-center ${rowIndex % 2 === 0 ? "bg-[#d2cab8] dark:bg-[#222]" : ""}`}>
              <p className="text-xl md:col-span-4">{row.name}</p>
              <p className="text-base md:col-span-4"><span className="md:hidden">{t.home.compareUsual}: </span>{row.usual}</p>
              <p className="bg-[#3f5a2a] px-3 py-3 text-base text-white md:col-span-4">{row.ours}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-24">
        <h2 className="rise text-[clamp(2.2rem,4vw,3rem)] font-black leading-none tracking-[-0.03em]" style={display}>{t.home.secondary}</h2>
        <div className="mt-8 grid min-h-[16rem] gap-8 bg-[#2a2a26] p-6 text-[#ddd6c6] md:grid-cols-2" data-ui>
          <p className="rise break-all text-[clamp(1.35rem,2vw,1.75rem)] leading-snug">http://203.0.113.50:8080/paypal-verify</p>
          <div className="rise">
            <p className="text-2xl">{t.analyze.host}: 203.0.113.50</p>
            <p className="mt-2 text-2xl">{t.analyze.port}: 8080</p>
            <p className="mt-6 text-xl leading-8">{t.analyze.notOpened}</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <h2 className="rise text-[clamp(2.2rem,4vw,3rem)] font-black leading-[0.95] tracking-[-0.03em]" style={display}>{t.home.privacyTitle}</h2>
        <p className="rise mt-8 columns-1 text-[clamp(1.25rem,2vw,1.7rem)] leading-snug md:columns-2 md:gap-10">{t.home.privacyBody}</p>
        <p className="mt-8 max-w-[40rem] bg-[#d7e4cc] px-3 py-2 text-xl leading-snug text-[#2a2a26]">
          <Link to="/about#privacy" className="underline decoration-2 underline-offset-4">{t.home.languageNote}</Link>
        </p>
      </section>

      <section>
        <Link to="/analyze" className="grid min-h-[46svh] content-between gap-8 bg-[#3f5a2a] px-6 py-8 text-white md:grid-cols-2 md:items-end">
          <p className="max-w-[28rem] text-xl leading-8">{t.home.ctaNote}</p>
          <h2 className="text-[clamp(4.5rem,12vw,11rem)] font-black leading-[0.8] tracking-[-0.04em] md:text-right" style={display}>{t.home.ctaWord}</h2>
        </Link>
      </section>

      <footer className="bg-[#2a2a26] px-6 py-16 text-[#e5e1d8]">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-base">{t.footer.blurb}</p>
          </div>
          <nav aria-label={t.footer.about} className="flex flex-col gap-2 text-base">
            <Link to="/learn">{t.footer.safety}</Link>
            <Link to="/about">{t.footer.about}</Link>
            <Link to="/about#privacy">{t.footer.privacy}</Link>
          </nav>
          <div className="text-base leading-7">
            <p>{t.footer.helpline}</p>
            <p className="mt-3 text-[#c8b8aa]">{t.footer.rights}</p>
          </div>
        </div>
        <p className="rise mt-16 text-[clamp(2.5rem,12vw,10rem)] font-black leading-[0.8] tracking-[-0.04em]" style={display}>{t.brand}</p>
      </footer>
    </div>
  );
}
