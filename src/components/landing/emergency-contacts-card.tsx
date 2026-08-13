import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, PhoneCall, Pencil, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { contactsQuery } from "@/lib/api";

export function EmergencyContactsCard({ notified }: { notified?: boolean }) {
  const { user } = useAuth();
  const contacts = useQuery(contactsQuery(user?.id));
  const list = contacts.data ?? [];

  return (
    <section aria-label="Emergency contacts" className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="size-4 text-primary" aria-hidden="true" />
          Emergency contacts
        </h2>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
          <Link to="/profile">
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border/70 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {user ? "No trusted contacts saved yet." : "Sign in to load your trusted contacts."}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to={user ? "/profile" : "/auth"}>
              <UserPlus className="size-4" aria-hidden="true" />
              {user ? "Add contacts" : "Sign in"}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {list.slice(0, 3).map((contact, index) => (
            <motion.li
              key={contact.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{contact.name}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {contact.relationship} · {contact.phone}
                </p>
                <p
                  className={
                    notified
                      ? "mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-success"
                      : "mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                  }
                >
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  {notified ? "Notified" : "Standing by"}
                </p>
              </div>
              <Button
                asChild
                size="icon"
                variant="emergency"
                className="shrink-0"
                aria-label={`Call ${contact.name}`}
              >
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                  <PhoneCall className="size-4" />
                </a>
              </Button>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
