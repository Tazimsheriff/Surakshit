import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Layout } from "../components/Layout";
import { HighlightedText } from "../components/RiskResult";
import { ThemeProvider } from "../components/Theme";
import { I18nProvider } from "../i18n/I18nProvider";
import AnalyzePage from "../pages/AnalyzePage";

function renderWithProviders(ui: ReactNode) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <I18nProvider>{ui}</I18nProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = "en";
});

describe("language selection", () => {
  it("switches navigation to Tamil and remembers the choice", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Layout>
        <p>content</p>
      </Layout>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "தமிழ்" }));
    expect(screen.getByRole("link", { name: "முகப்பு" })).toBeInTheDocument();
    expect(localStorage.getItem("surakshit.lang")).toBe("ta");
    expect(document.documentElement.lang).toBe("ta");
  });
});

describe("analyzer form", () => {
  it("asks for text before calling the API", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    vi.stubGlobal("fetch", (input: string) => {
      calls.push(String(input));
      return Promise.reject(new Error("should not fetch"));
    });
    renderWithProviders(<AnalyzePage />);
    await user.click(screen.getByRole("button", { name: "Analyze message" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter something to check.");
    expect(calls).toEqual([]);
    vi.unstubAllGlobals();
  });

  it("pastes a sample message into the field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnalyzePage />);
    await user.click(screen.getByRole("button", { name: "Paste sample message" }));
    const field = screen.getByLabelText("Message to check");
    expect(field).toHaveValue("Hi, the study group will meet at 4 pm in the library. Please bring your notes.");
  });
});

describe("rendered highlights", () => {
  it("does not create an image from untrusted text", () => {
    render(<HighlightedText text={'<img alt="bad" src="x"> share the OTP'} phrases={["share the OTP"]} />);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img/)).toBeInTheDocument();
  });
});
