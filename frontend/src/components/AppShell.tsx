import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { ClipboardCheck, LayoutDashboard, LogIn, LogOut } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { endSession, useSession } from "@/lib/session";

// Header + main + toaster for every screen. Sign-out always goes through endSession().
export function AppShell({ children }: { children: ReactNode }) {
  const { owner } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await endSession();
    toast.success("Signed out.");
    navigate("/login");
  };

  return (
    <div className="flex min-h-svh flex-col bg-[#F8FAF8]">
      <header className="sticky top-0 z-30 border-b border-[#E2EBE5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#15803D] text-white">
              <ClipboardCheck className="size-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-extrabold tracking-[-0.02em] text-[#14261C] sm:text-base">
                Missed Lead Recovery
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.15em] text-[#4B6354] sm:block">
                Enquiry capture &amp; follow-up
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden text-sm font-medium text-[#4B6354] transition-colors hover:text-[#15803D] sm:inline"
              data-testid="nav-public-form-link"
            >
              Public enquiry form
            </Link>
            {owner ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2EBE5] px-3 text-sm font-medium text-[#14261C] transition-colors hover:bg-[#F4F8F5]"
                  data-testid="nav-dashboard-link"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  data-testid="button-owner-logout"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15803D] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#166534]"
                data-testid="nav-login-link"
              >
                <LogIn className="size-4" />
                Owner login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-[#E2EBE5] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-[#4B6354] sm:px-6">
          Missed Lead Recovery — V1. Customer contact details stay private; only the signed-in
          owner can see enquiries.
        </div>
      </footer>

      <Toaster richColors />
    </div>
  );
}
