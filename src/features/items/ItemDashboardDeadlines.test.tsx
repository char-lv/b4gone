import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { Item } from "./item-repository";
import { ItemDashboardDeadlines } from "./ItemDashboardDeadlines";

// Today is Nov 5, 2026 in the test time zone (America/New_York).
const NOW = new Date("2026-11-05T17:00:00Z");
const COAT: Item = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Wool coat",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: "2026-12-05",
  status: "active",
};

function lines(): string[] {
  return screen.queryAllByRole("listitem").map((item) => item.textContent ?? "");
}

describe("ItemDashboardDeadlines", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("lists the item's deadlines in the next 30 days with text for how soon they are", () => {
    render(<ItemDashboardDeadlines item={COAT} />);

    expect(screen.getByRole("heading", { level: 2, name: "On the dashboard" })).toBeInTheDocument();
    expect(lines()).toEqual([
      "Return deadline: Nov 8, 2026 (In 3 days)",
      "Warranty expiration: Dec 5, 2026 (In 30 days)",
    ]);
  });

  it("includes today and leaves out past dates and day 31", () => {
    render(<ItemDashboardDeadlines item={{ ...COAT, returnDeadline: "2026-11-05", warrantyExpiration: "2026-12-06" }} />);

    expect(lines()).toEqual(["Return deadline: Nov 5, 2026 (Due today)"]);
  });

  it("says when none of the dates are in the next 30 days", () => {
    render(<ItemDashboardDeadlines item={{ ...COAT, returnDeadline: "2026-11-04", warrantyExpiration: null }} />);

    expect(screen.getByText("None of this item’s dates fall in the next 30 days.")).toBeInTheDocument();
    expect(lines()).toEqual([]);
  });

  it("explains that a returned item has no dashboard deadlines", () => {
    render(<ItemDashboardDeadlines item={{ ...COAT, status: "returned" }} />);

    expect(
      screen.getByText(
        "Returned items don’t create dashboard deadlines. Undo the return to restore any of its dates that fall within the next 30 days.",
      ),
    ).toBeInTheDocument();
    expect(lines()).toEqual([]);
  });

  it("renders no dates on the server, which does not know the user's time zone", () => {
    const html = renderToString(<ItemDashboardDeadlines item={COAT} />);

    expect(html).toContain("On the dashboard");
    expect(html).toContain("Checking dates…");
    expect(html).not.toContain("Nov 8, 2026");
  });

  it("moves to the new day when the page stays open across local midnight", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    // 23:59 on Nov 7, 2026 in New York.
    vi.setSystemTime(new Date("2026-11-08T04:59:00Z"));
    render(<ItemDashboardDeadlines item={{ ...COAT, returnDeadline: "2026-11-08", warrantyExpiration: "2026-11-07" }} />);
    expect(lines()).toEqual([
      "Warranty expiration: Nov 7, 2026 (Due today)",
      "Return deadline: Nov 8, 2026 (Due tomorrow)",
    ]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    });

    expect(lines()).toEqual(["Return deadline: Nov 8, 2026 (Due today)"]);
  });
});
