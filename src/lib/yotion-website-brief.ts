type BriefField = {
  key: string;
  label: string;
  max: number;
  required?: boolean;
  multiline?: boolean;
  type?: "email" | "tel";
  help?: string;
};
type BriefSection = { id: string; title: string; intro: string; fields: BriefField[] };

export const briefSections: BriefSection[] = [
  {
    id: "school", title: "Your driving school",
    intro: "Give us the basics and a few words about what makes your school different.",
    fields: [
      { key: "school", label: "Driving school name", max: 140, required: true },
      { key: "school_intro", label: "What would you like learners to know about your school?", max: 1500, multiline: true,
        help: "A few rough notes are fine. For example, who you teach and how you help nervous beginners." },
    ],
  },
  {
    id: "instructor", title: "Meet your instructor",
    intro: "Tell us who learners will meet and what to expect in the car.",
    fields: [
      { key: "instructor_name", label: "Instructor name as it should appear on the website", max: 140 },
      { key: "instructor_intro", label: "Instructor introduction", max: 1500, multiline: true,
        help: "Share a few notes about your background, teaching style and any qualifications you’d like to mention." },
      { key: "instructor_photo", label: "Link to an instructor photo", max: 500, help: "Use a link Yotion can open. You can share a photo later." },
    ],
  },
  {
    id: "teaching", title: "Lessons, prices and areas",
    intro: "Help learners see if your lessons suit them and whether you cover their area.",
    fields: [
      { key: "lessons", label: "Lesson options and prices", max: 1500, required: true, multiline: true,
        help: "Include manual or automatic, hourly prices and any packages you want to advertise." },
      { key: "areas", label: "Teaching areas and pickup locations", max: 250, required: true },
      { key: "availability", label: "Typical teaching days and times", max: 500 },
    ],
  },
  {
    id: "contact", title: "Contact and social links",
    intro: "Add the details you want learners to see or use to enquire.",
    fields: [
      { key: "contact_preference", label: "How would you prefer learners to get in touch?", max: 250,
        help: "For example, enquiry form, phone, WhatsApp or email. Let us know if a number is WhatsApp only." },
      { key: "public_phone", label: "Public phone or WhatsApp number", max: 50, type: "tel" },
      { key: "public_email", label: "Public enquiry email", max: 254, type: "email" },
      { key: "facebook", label: "Facebook page link", max: 500 },
      { key: "instagram", label: "Instagram profile link", max: 500 },
      { key: "other_socials", label: "Other links", max: 1000, multiline: true, help: "For example, TikTok or your Google Business Profile." },
    ],
  },
  {
    id: "branding", title: "Branding and domain",
    intro: "Share what you already have. We can work through anything missing with you.",
    fields: [
      { key: "branding", label: "Brand colours or a link to your logo", max: 500 },
      { key: "domain", label: "Domain or current website address", max: 250 },
    ],
  },
  {
    id: "extras", title: "Reviews and anything else",
    intro: "Tell us what else you’d like learners to see on your website.",
    fields: [
      { key: "reviews", label: "Reviews you’d like to feature", max: 1500, multiline: true,
        help: "Paste reviews you have permission to use or share a link to them." },
      { key: "notes", label: "Other information or questions", max: 1500, multiline: true,
        help: "For example, an FAQ or something you would like us to check with you." },
    ],
  },
];

export const briefFields = briefSections.flatMap(section => section.fields);
