import { describe, expect, test } from "vitest";
import { API_BASE_URL } from "../api/client";
import { toImageUrl } from "./images";

describe("toImageUrl", () => {



    test("returns an empty string when filePath is missing", () => {
        expect(toImageUrl()).toBe("");
        expect(toImageUrl(null)).toBe("");
        expect(toImageUrl("")).toBe("");
    });

    test("prefixes API_BASE_URL when path starts with /uploads/", () => {
        expect(toImageUrl("/uploads/image.png")).toBe(
            `${API_BASE_URL}/uploads/image.png`,
        );
    });

    test("extracts the /uploads/ part from a full path and prefixes API_BASE_URL", () => {
        expect(toImageUrl("http://localhost:8000/uploads/image.png")).toBe(
            `${API_BASE_URL}/uploads/image.png`,
        );
    });

    test("returns the original path when it does not contain /uploads/", () => {
        expect(toImageUrl("https://example.com/image.png")).toBe(
            "https://example.com/image.png",
        );
    });
});
