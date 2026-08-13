import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CheckCircle2, Clock, LifeBuoy, Lock, ShieldX, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApprovalStatus } from "@/lib/access";

/**
 * Shown instead of a protected emergency feature while an account is awaiting
 * (or has been refused) administrator approval.
 */
export function ApprovalGate({ status }: { status: ApprovalStatus }) {
  const rejected = status === "rejected";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel mx-auto w-full max-w-2xl rounded-3xl p-7 text-center sm:p-10"
    >
      <span
        className={`mx-auto grid size-16 place-items-center rounded-3xl ${
          rejected ? "bg-alert/10 text-alert" : "bg-primary/10 text-primary"
        }`}
      >
        {rejected ? (
          <ShieldX className="size-8" aria-hidden="true" />
        ) : (
          <Lock className="size-8" aria-hidden="true" />
        )}
      </span>

      <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">
        {rejected ? "Registration not approved" : "Waiting for Admin Approval"}
      </h1>

      {rejected ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your registration request was not approved. Please contact the administrator if you
          believe this is an error.
        </p>
      ) : (
        <div className="mx-auto mt-4 max-w-md space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p className="flex items-center justify-center gap-2 font-medium text-foreground">
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            Your account has been created successfully.
          </p>
          <p className="flex items-center justify-center gap-2">
            <Clock className="size-4" aria-hidden="true" />
            Your account is currently awaiting administrator approval.
          </p>
          <p>You will receive access once approved.</p>
        </div>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-2xl">
          <Link to="/profile">
            <UserRound className="size-4" />
            Complete your profile
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link to="/support">
            <LifeBuoy className="size-4" />
            Contact support
          </Link>
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        While pending you can still use your profile, the About page and support. Emergency SOS,
        RESQ AI, RESQR ID and the other protected tools unlock the moment you are approved.
      </p>
    </motion.section>
  );
}
