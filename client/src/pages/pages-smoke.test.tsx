/**
 * Pages Smoke Tests
 *
 * Basic smoke tests to ensure pages render without crashing.
 * These tests provide broad coverage of page components.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/test-utils";
import ApiDocs from "./api-docs";
import Conduct from "./conduct";
import Contact from "./contact";
import GettingStarted from "./getting-started";
import HelpCenter from "./help-center";
import Home from "./home";
import Landing from "./landing";
import NotFound from "./not-found";
import Privacy from "./privacy";

describe("Pages Smoke Tests", () => {
  describe("Home Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<Home />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Landing Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<Landing />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Not Found Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<NotFound />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Getting Started Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<GettingStarted />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Contact Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<Contact />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Privacy Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<Privacy />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Code of Conduct Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<Conduct />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Help Center Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<HelpCenter />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("API Docs Page", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<ApiDocs />);
      expect(container).toBeInTheDocument();
    });
  });
});
