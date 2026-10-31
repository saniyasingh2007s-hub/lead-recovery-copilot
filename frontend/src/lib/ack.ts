// The acknowledgement message and the "open on my device" links.
// Nothing here sends anything: copying and opening the customer's own
// WhatsApp/SMS app is the whole V1 behaviour.

export function buildAckMessage(name: string, service: string): string {
  return `Hi ${name}, thanks for enquiring about ${service}. We've received your enquiry and will get back to you shortly.`;
}

export function contactIsEmail(contact: string): boolean {
  return contact.includes("@");
}

export function phoneDigits(contact: string): string {
  return contact.replace(/\D/g, "");
}

/** wa.me needs digits only, no "+" or spaces. */
export function whatsappLink(contact: string, message: string): string {
  return `https://wa.me/${phoneDigits(contact)}?text=${encodeURIComponent(message)}`;
}

export function smsLink(contact: string, message: string): string {
  const local = contact.replace(/[^\d+]/g, "");
  return `sms:${local}?body=${encodeURIComponent(message)}`;
}

/** Clipboard write with a fallback for browsers without the async API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
