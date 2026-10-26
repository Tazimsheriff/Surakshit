import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./components/Theme";
import { useI18n, I18nProvider } from "./i18n/I18nProvider";
import HomePage from "./pages/HomePage";

const AnalyzePage = lazy(() => import("./pages/AnalyzePage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const ModulePage = lazy(() => import("./pages/ModulePage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageFallback() {
  const { t } = useI18n();
  return <p>{t.analyze.loading}</p>;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <I18nProvider>
          <Layout>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/learn/:moduleId" element={<ModulePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Layout>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
