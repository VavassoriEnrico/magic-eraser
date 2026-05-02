import { beforeEach, describe, expect, it as test, vi } from "vitest";
import { deleteImage, getProjectImages, uploadImage, uploadImageFromUrl } from "./images";
import { request } from "./client";

vi.mock("./client", () => ({
    request: vi.fn(),
}));


describe("images api", () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });


    //test getProjectImages calls request with the correct path
    test("calls request with the correct path for getProjectImages", async () => {
        vi.mocked(request).mockResolvedValueOnce([]);

        await getProjectImages("42");

        expect(request).toHaveBeenCalledWith("/projects/42/images");
    });



    //test uploadImage calls request with the correct path and options
    test("calls request with POST and FormData for uploadImage", async () => {
        vi.mocked(request).mockResolvedValueOnce({ id: 1 });

        const file = new File(["hello"], "beautiful_image.png", { type: "image/png" });

        await uploadImage("5", file);

        expect(request).toHaveBeenCalledTimes(1);

        const [path, options] = vi.mocked(request).mock.calls[0];

        expect(path).toBe("/projects/5/images/upload");
        expect(options?.method).toBe("POST");
        expect(options?.body).toBeInstanceOf(FormData);

        const formData = options?.body as FormData;
        expect(formData.get("file")).toBe(file);
    });



    //test uploadImageFromUrl calls request with the correct path and options
    test("calls request with POST and JSON body for uploadImageFromUrl", async () => {
        vi.mocked(request).mockResolvedValueOnce({ id: 1 });

        await uploadImageFromUrl("3", "https://sandro.com/summer.png", "summer.png");

        expect(request).toHaveBeenCalledWith("/projects/3/images/from-url", {
            method: "POST",
            body: JSON.stringify({
                image_url: "https://sandro.com/summer.png",
                file_name: "summer.png",
            }),
        });
    });


    //test deleteImage calls request with the correct path and options
    test("calls request with DELETE for deleteImage", async () => {
        vi.mocked(request).mockResolvedValueOnce({ message: "Image deleted" });

        await deleteImage("7");

        expect(request).toHaveBeenCalledWith("/images/7", {
            method: "DELETE",
        });
    });



});
