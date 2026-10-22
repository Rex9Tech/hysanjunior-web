// src/modules/landing/pages/comparison.test.ts

import { describe, it, expect } from "vitest";
import AppRoutes from "../../../AppRoutes";
import { ALL_COMPETITORS, COMPARISON_DATA, COMPARISON_FAQS } from "./VsPage";
import { COMPETITORS } from "../components/ComparisonSection";
import { GENERAL_FAQS } from "../components/FaqSection";

describe("Comparison Routes & SEO Setup", () => {
  it("defines canonical public route for SaaS boilerplate comparisons", () => {
    expect(AppRoutes.client.public.VS).toBe("/vs");
  });

  it("ensures comparison routes are distinct from legal routes and root", () => {
    expect(AppRoutes.client.public.VS).not.toBe(AppRoutes.client.public.ROOT);
    expect(AppRoutes.client.public.VS).not.toBe(AppRoutes.client.public.TERMS_AND_CONDITIONS);
    expect(AppRoutes.client.public.VS).not.toBe(AppRoutes.client.public.PRIVACY_POLICY);
  });

  it("includes all 8 major competitors without leaving anyone behind", () => {
    const competitorIds = ALL_COMPETITORS.map((c) => c.id);
    expect(competitorIds).toContain("shipfast");
    expect(competitorIds).toContain("makerkit");
    expect(competitorIds).toContain("supastarter");
    expect(competitorIds).toContain("jumpstart");
    expect(competitorIds).toContain("saasPegasus");
    expect(competitorIds).toContain("bulletTrain");
    expect(competitorIds).toContain("larafast");
    expect(competitorIds).toContain("openSaas");
  });

  it("validates comparison section on landing page covers all competitors", () => {
    expect(COMPETITORS.length).toBeGreaterThanOrEqual(8);
  });

  it("ensures comparison rows evaluate key architectural criteria", () => {
    const features = COMPARISON_DATA.map((row) => row.feature);
    expect(features).toContain("Supported Platforms");
    expect(features).toContain("Pricing & License");
    expect(features).toContain("Native Mobile App");
    expect(features).toContain("AI Agent Constitution & Rules");
  });

  it("contains rich comparison FAQs answering high-intent search queries", () => {
    expect(COMPARISON_FAQS.length).toBeGreaterThanOrEqual(8);
    const questions = COMPARISON_FAQS.map((faq) => faq.question);
    expect(questions.some((q) => q.includes("ShipFast alternatives"))).toBe(true);
    expect(questions.some((q) => q.includes("Flutter 3"))).toBe(true);
    expect(questions.some((q) => q.includes("Redis hosting costs"))).toBe(true);
  });

  it("contains rich general platform FAQs for the landing page", () => {
    expect(GENERAL_FAQS.length).toBeGreaterThanOrEqual(8);
    const questions = GENERAL_FAQS.map((faq) => faq.question);
    expect(questions.some((q) => q.includes("Rails 8 API"))).toBe(true);
    expect(questions.some((q) => q.includes("Garage S3"))).toBe(true);
    expect(questions.some((q) => q.includes("Discipline-Driven Development"))).toBe(true);
  });
});
