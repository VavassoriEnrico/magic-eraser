import { beforeEach, describe, expect, it as test, vi } from "vitest";
import { request } from "./client";


//THIS TESTS 'client.ts' file

//mock global fetch function
describe("request", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    //if response is ok with status 200, return JSON
    test("return JSON when response is ok with 200", async () => {
        //this is a fake http fetch response (thats why we use spyOn)
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const result = await request<{ ok: boolean }>("/test");

        expect(result).toEqual({ ok: true });
    });

    //if response is not ok, throw error with status and statusText
    test("throw error when response is not ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            new Response("Error", {
                status: 500,
                statusText: "Internal Server Error",
            })
        );

        await expect(request("/test")).rejects.toThrow(
            "500 Internal Server Error"
        );
    });

    //if response is ok with status 204, return null
    test("returns null when response is ok with 204", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            new Response(null, { status: 204, })
        );
        const result = await request("/test");
        expect(result).toBeNull();
    });



    //if body is JSON, set Content-Type to application/json (row 9 of client.ts)
    test("sets Content-Type to application/json for JSON bodies", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await request("/test", {
            method: "POST",
            body: JSON.stringify({ name: "Luca" }),
        });

        expect(fetchSpy).toHaveBeenCalledWith(
            expect.stringContaining("/test"),
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            }),
        );
    });


    //if body is FormData, do not set Content-Type (row 9 of client.ts)
    test("does not force Content-Type for FormData bodies", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const formData = new FormData();
        formData.append("file", new Blob(["hello"]), "test.txt");

        await request("/test", {
            method: "POST",
            body: formData,
        });

        expect(fetchSpy).toHaveBeenCalledWith(
            expect.stringContaining("/test"),
            expect.objectContaining({
                method: "POST",
                headers: {},
            }),
        );
    });


});