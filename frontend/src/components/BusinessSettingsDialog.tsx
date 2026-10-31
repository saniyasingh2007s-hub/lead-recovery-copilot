import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateBusiness } from "@/lib/leads";
import type { Business } from "@/lib/types";

// Ready-made presets so the app can be rebranded for any service business in one click.
const PRESETS: { label: string; name: string; tagline: string; services: string[] }[] = [
  {
    label: "Hair & beauty salon",
    name: "Glow Hair Studio",
    tagline: "Hair, colour and bridal styling — book your slot today.",
    services: ["Haircut & Styling", "Balayage Colour", "Bridal Makeup", "Keratin Treatment", "Facial & Cleanup"],
  },
  {
    label: "Dental clinic",
    name: "BrightSmile Dental Care",
    tagline: "Gentle, modern dentistry for the whole family.",
    services: ["Checkup & Cleaning", "Root Canal Consultation", "Teeth Whitening", "Braces Consultation", "Emergency Toothache"],
  },
  {
    label: "Coaching centre",
    name: "Apex Coaching Hub",
    tagline: "Small-batch coaching with weekly progress updates.",
    services: ["SAT Maths Prep", "Physics Tuition", "Spoken English", "Weekly Mock Test", "Parent Consultation"],
  },
];

const joinServices = (services: string[]) => services.join(", ");
const splitServices = (value: string) =>
  value
    .split(",")
    .map((service) => service.trim())
    .filter(Boolean);

export function BusinessSettingsDialog({
  business,
  open,
  onOpenChange,
}: {
  business: Business | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateBusiness = useUpdateBusiness();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [servicesText, setServicesText] = useState("");

  useEffect(() => {
    if (!open || !business) return;
    setName(business.name);
    setTagline(business.tagline);
    setServicesText(joinServices(business.services));
  }, [open, business]);

  const handleSave = () => {
    const services = splitServices(servicesText);
    if (name.trim().length < 2) return;
    updateBusiness.mutate(
      { name: name.trim(), tagline: tagline.trim(), services },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="business-settings-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-[#14261C]">
            Rebrand for your business
          </DialogTitle>
          <DialogDescription className="text-sm text-[#4B6354]">
            This name, tagline and service list are what customers see on the public enquiry form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setName(preset.name);
                  setTagline(preset.tagline);
                  setServicesText(joinServices(preset.services));
                }}
                data-testid={`button-preset-${preset.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-name">Business name</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              data-testid="input-business-name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="business-tagline">Tagline</Label>
            <Input
              id="business-tagline"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              data-testid="input-business-tagline"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="business-services">Services (comma separated)</Label>
            <Textarea
              id="business-services"
              rows={3}
              value={servicesText}
              onChange={(event) => setServicesText(event.target.value)}
              data-testid="textarea-business-services"
            />
            <p className="text-xs text-[#4B6354]">
              These appear in the dropdown on the public enquiry form.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateBusiness.isPending || name.trim().length < 2}
            data-testid="button-save-business"
          >
            Save business profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
