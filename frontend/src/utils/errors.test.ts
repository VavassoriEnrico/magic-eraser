import { describe, expect, test } from "vitest";
import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {

    //test getErrorMessage returns the message when the input is an Error
    test("returns the message when the input is an Error", () => {
        const error = new Error("idk something went wrong went wrong");

        expect(getErrorMessage(error)).toBe("idk something went wrong went wrong");
    });

    //test getErrorMessage returns the message property when the input is an object with a message property
    test("returns Unknown error when the input is not an Error", () => {
        expect(getErrorMessage("not working")).toBe("Unknown error");
        expect(getErrorMessage(null)).toBe("Unknown error");
        expect(getErrorMessage(undefined)).toBe("Unknown error");
        expect(getErrorMessage({ message: "Not a real Error instance" })).toBe("Unknown error");
    });
});
