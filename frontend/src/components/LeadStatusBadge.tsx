import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlarmClockCheck,
  BookmarkCheck,
  ClipboardCopy,
  MessageCircle,
  Smartphone,
  XCircle,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { buildAckMessage, contactIsEmail, copyText, phoneDigits, smsLink, whatsappLink } from "@/lib/ack";
import { formatDateTime, followUpState, isoFromNow, isoTomorrowMorning, toDatetimeLocalValue } from "@/lib/format";
import { useUpdateLead } from "@/lib/leads";
import { LEAD_STATUSES } from "@/lib/types";
import type { Lead, LeadStatus } from "@/lib/types";

export function LeadActionModal({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateLead = useUpdateLead();
  const [followUpInput, setFollowUpInput] = useState("");

  useEffect(() => {
    setFollowUpInput(toDatetimeLocalValue(lead?.follow_up_at ?? null));
  }, [lead?.id, lead?.follow_up_at]);

  if (!lead) return null;

  const ackMessage = buildAckMessage(lead.name.replace(/^DEMO - /, ""), lead.service);
  const emailContact = contactIsEmail(lead.contact);
  const state = followUpState(lead);
  const isInactive = lead.status === "Booked" || lead.status === "Closed";

  const handleCopy = async () => {
    const ok = await copyText(ackMessage);
    if (ok) toast.success("Acknowledgement message copied.");
    else toast.error("Copying failed — please select the message text and copy it manually.");
  };

  const handleStatusChange = (value: string) => {
    updateLead.mutate({ id: lead.id, payload: { status: value as LeadStatus } });
  };

  const handleSaveFollowUp = () => {
    if (!followUpInput) {
      toast.error("Pick a date and time for the follow-up first.");
      return;
    }
    const parsed = new Date(followUpInput);
    if (Number.isNaN(parsed.getTime())) {
      toast.error("That follow-up time could not be read. Please pick it again.");
      return;
    }
    updateLead.mutate({ id: lead.id, payload: { follow_up_at: parsed.toISOString() } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl" data-testid="lead-action-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-[#14261C]">
            {lead.name.replace(/^DEMO - /, "")}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#4B6354]">
            Enquiry about <strong>{lead.service}</strong> · received {formatDateTime(lead.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {lead.is_demo ? (
            <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs font-medium text-[#92400E]">
              This is fictional DEMO data for testing — not a real customer.
            </p>
          ) : null}

          <div className="grid gap-3 rounded-xl border border-[#E1EBE4] bg-[#F4F8F5] p-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4B6354]">
                Contact
              </span>
              <span className="text-sm font-medium text-[#14261C]" data-testid="text-lead-contact">
                {lead.contact}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4B6354]">
                Next action
              </span>
              <span
                className={`text-sm font-medium ${state.overdue ? "text-[#B91C1C]" : "text-[#14261C]"}`}
                data-testid="text-lead-next-action"
              >
                {state.text}
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4B6354]">
                Enquiry message
              </span>
              <p className="text-sm leading-relaxed text-[#14261C]" data-testid="text-lead-message">
                {lead.message}
              </p>
            </div>
          </div>

          {/* Acknowledgement — copying only, nothing is sent from this app */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-[#4B6354]">
                Acknowledgement message
              </h3>
              <LeadStatusBadge status={lead.status} testId="badge-lead-status-dialog" />
            </div>
            <p
              className="rounded-xl border border-[#E1EBE4] bg-white p-4 text-sm leading-relaxed text-[#14261C]"
              data-testid="text-acknowledgement-message"
            >
              {ackMessage}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleCopy} data-testid="button-copy-acknowledgement">
                <ClipboardCopy className="size-4" />
                Copy message
              </Button>
              {emailContact ? (
                <a
                  href={`mailto:${lead.contact}?subject=${encodeURIComponent(
                    "Re: your enquiry",
                  )}&body=${encodeURIComponent(ackMessage)}`}
                  className={buttonVariants({ variant: "outline" })}
                  data-testid="button-email-acknowledgement"
                >
                  <MessageCircle className="size-4" />
                  Open in email
                </a>
              ) : (
                <>
                  <a
                    href={whatsappLink(lead.contact, ackMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "outline" })}
                    data-testid="button-whatsapp-acknowledgement"
                  >
                    <MessageCircle className="size-4" />
                    Open in WhatsApp
                  </a>
                  <a
                    href={smsLink(lead.contact, ackMessage)}
                    className={buttonVariants({ variant: "outline" })}
                    data-testid="button-sms-acknowledgement"
                  >
                    <Smartphone className="size-4" />
                    Open in SMS
                  </a>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[#4B6354]">
              These buttons only copy the message or open it in your own phone/app —
              <strong> nothing is sent automatically</strong>. No SMS, WhatsApp or email is delivered
              by this app. {lead.contact.includes("@") ? "" : `Number used: ${phoneDigits(lead.contact)}.`}
            </p>
          </section>

          {/* Status */}
          <section className="flex flex-col gap-2">
            <Label htmlFor="lead-status">Status</Label>
            <Select value={lead.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="lead-status" className="w-full" data-testid="select-lead-status">
                <SelectValue>{(value) => String(value ?? lead.status)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("Booked")}
                data-testid="button-quick-mark-booked"
              >
                <BookmarkCheck className="size-4" />
                Mark as Booked
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("Closed")}
                data-testid="button-quick-mark-closed"
              >
                <XCircle className="size-4" />
                Mark as Closed
              </Button>
            </div>
          </section>

          {/* Follow-up scheduling */}
          <section className="flex flex-col gap-3 rounded-xl border border-[#E1EBE4] p-4">
            <h3 className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-[#4B6354]">
              Follow-up reminder
            </h3>
            {isInactive ? (
              <p className="text-sm leading-relaxed text-[#4B6354]">
                This lead is <strong>{lead.status}</strong>, so it is not shown as an active
                follow-up. Change the status to schedule a reminder again.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-[#4B6354]">
                Set a time and it appears in the dashboard reminder list. Overdue reminders are
                highlighted.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="follow-up-at">Follow-up date &amp; time</Label>
              <Input
                id="follow-up-at"
                type="datetime-local"
                value={followUpInput}
                onChange={(event) => setFollowUpInput(event.target.value)}
                data-testid="input-followup-datetime"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFollowUpInput(toDatetimeLocalValue(isoFromNow(2)))}
                data-testid="button-followup-preset-2h"
              >
                +2 hours
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFollowUpInput(toDatetimeLocalValue(isoFromNow(24)))}
                data-testid="button-followup-preset-tomorrow"
              >
                In 24 hours
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFollowUpInput(toDatetimeLocalValue(isoTomorrowMorning()))}
                data-testid="button-followup-preset-tomorrow-10am"
              >
                Tomorrow 10 AM
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleSaveFollowUp}
                disabled={updateLead.isPending}
                data-testid="button-save-followup"
              >
                <AlarmClockCheck className="size-4" />
                Save follow-up
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFollowUpInput("");
                  updateLead.mutate({ id: lead.id, payload: { clear_follow_up: true } });
                }}
                data-testid="button-clear-followup"
              >
                Clear follow-up
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
