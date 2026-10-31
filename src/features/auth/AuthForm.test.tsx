import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./AuthForm";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  fetchMock.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AuthForm in sign-in mode", () => {
  it("shows labeled, required email and password fields and a sign-in button", () => {
    render(<AuthForm mode="sign-in" />);

    expect(screen.getByLabelText(/^email/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("type", "password");
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("shows field errors without calling the API and moves focus to the first invalid field", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(fetchMock).not.toHaveBeenCalled();
    const email = screen.getByLabelText(/^email/i);
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter your email address.");
    expect(screen.getByLabelText(/^password/i)).toHaveAccessibleDescription("Enter your password.");
    expect(email).toHaveFocus();
  });

  it("signs in, disables the button while waiting, and opens the requested page", async () => {
    let finish: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" next="/items" />);

    await user.type(screen.getByLabelText(/^email/i), " Jane@Example.com ");
    await user.type(screen.getByLabelText(/^password/i), "correct horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.click(screen.getByRole("button", { name: "Signing in…" }));

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "jane@example.com", password: "correct horse" }),
    });

    finish(jsonResponse(200, { user: { id: "u1", email: "jane@example.com" } }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/items"));
    expect(router.refresh).toHaveBeenCalled();
  });

  it("keeps what the user typed and shows an alert for wrong credentials", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: "invalid_credentials", message: "Invalid email or password." } }),
    );
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" />);

    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password/i), "wrong password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(/^password/i)).toHaveValue("wrong password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("offers a retry when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" />);

    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password/i), "correct horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't reach B4Gone. Check your connection and try again.",
    );
  });

  it("shows and hides the password", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("type", "password");
  });
});

describe("AuthForm in register mode", () => {
  it("asks for a new password with a length hint", () => {
    render(<AuthForm mode="register" />);

    const password = screen.getByLabelText(/^password/i);
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAccessibleDescription("At least 8 characters.");
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("applies the registration password rule before calling the API", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password/i), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^password/i)).toHaveAccessibleDescription(
      "Password must be at least 8 characters. At least 8 characters.",
    );
    expect(screen.getByLabelText(/^password/i)).toHaveFocus();
  });

  it("shows the server's field error when the email is already registered", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        error: {
          code: "email_taken",
          message: "Check the highlighted fields.",
          fields: { email: "An account with this email already exists. Sign in instead." },
        },
      }),
    );
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password/i), "correct horse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByLabelText(/^email/i)).toHaveAccessibleDescription(
        "An account with this email already exists. Sign in instead.",
      ),
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", expect.objectContaining({ method: "POST" }));
    expect(screen.getByLabelText(/^email/i)).toHaveFocus();
  });

  it("opens the dashboard after creating the account", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { user: { id: "u1", email: "jane@example.com" } }));
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password/i), "correct horse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
  });
});
