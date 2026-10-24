import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows the B4Gone heading and a setup message", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "B4Gone" })).toBeInTheDocument();
    expect(screen.getByText(/project setup is complete/i)).toBeInTheDocument();
  });
});
