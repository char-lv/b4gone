import { isUuid } from "./uuid";

describe("isUuid", () => {
  it.each(["9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c", "9D7A1C52-0D6F-4F4E-8A9B-3C1E2F4A5B6C"])("accepts %s", (value) => {
    expect(isUuid(value)).toBe(true);
  });

  it.each(["", "not-a-uuid", "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6", " 9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c", "1 or 1=1"])(
    "rejects %j",
    (value) => {
      expect(isUuid(value)).toBe(false);
    },
  );
});
