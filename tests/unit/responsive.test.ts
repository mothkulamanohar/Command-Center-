import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Responsive Architecture & Layout Validation", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("exports a proper viewport configuration with cover and device-width in root layout", () => {
    const layoutPath = path.join(rootDir, "app/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");

    expect(content).toContain("export const viewport: Viewport");
    expect(content).toContain('width: "device-width"');
    expect(content).toContain("initialScale: 1");
    expect(content).toContain('viewportFit: "cover"');
  });

  it("globals.css implements 100dvh, safe-area insets, and independent scroll containers", () => {
    const cssPath = path.join(rootDir, "app/globals.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    // Dynamic viewport height
    expect(css).toContain("height: 100dvh");
    // Independent scroll containers
    expect(css).toContain(".sidebar");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain(".main-content");
    expect(css).toContain("overscroll-behavior: contain");
    expect(css).toContain("-webkit-overflow-scrolling: touch");
    // Safe area bottom navigation & padding
    expect(css).toContain("safe-area-inset-bottom");
    expect(css).toContain(".mobile-bottom-nav");
    // Word break and media responsiveness
    expect(css).toContain("overflow-wrap: break-word");
    expect(css).toContain("max-width: 100%");
  });

  it("Sidebar supports both desktop independent scroll and mobile navigation drawer", () => {
    const sidebarPath = path.join(rootDir, "components/shell/Sidebar.tsx");
    const content = fs.readFileSync(sidebarPath, "utf-8");

    // Desktop fixed sidebar
    expect(content).toContain("hidden md:flex");
    expect(content).toContain("sidebar");
    // Mobile navigation drawer
    expect(content).toContain("isMobileOpen");
    expect(content).toContain("open-mobile-sidebar");
    expect(content).toContain("close-mobile-sidebar");
    expect(content).toContain("Close navigation");
  });

  it("Header includes mobile drawer trigger and responsive search command bar", () => {
    const headerPath = path.join(rootDir, "components/shell/Header.tsx");
    const content = fs.readFileSync(headerPath, "utf-8");

    expect(content).toContain("open-mobile-sidebar");
    expect(content).toContain("Open mobile navigation menu");
    expect(content).toContain("md:hidden");
    expect(content).toContain("truncate sm:hidden");
  });

  it("AchievementCertificate is compact, scales rosette & ribbon, and links to college web application", () => {
    const certPath = path.join(rootDir, "components/certificates/AchievementCertificate.tsx");
    const content = fs.readFileSync(certPath, "utf-8");

    expect(content).toContain("grid-cols-2 sm:grid-cols-3 lg:grid-cols-6");
    expect(content).toContain("break-words");
    expect(content).toContain("collegeUrl");
    expect(content).toContain("displayCollegeHost");
  });

  it("BottomNav contains scrollable More Navigation sheet with safe-area support", () => {
    const navPath = path.join(rootDir, "components/shell/BottomNav.tsx");
    const content = fs.readFileSync(navPath, "utf-8");

    expect(content).toContain("mobile-bottom-nav");
    expect(content).toContain("overflow-y-auto");
    expect(content).toContain("More Navigation");
  });
});
