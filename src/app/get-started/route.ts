import { marketingPage } from "../../lib/yotion-marketing-page";

export const dynamic = "force-static";

const onboardingEmail = `mailto:hello@yotion.co.uk?subject=${encodeURIComponent("Yotion website onboarding")}&body=${encodeURIComponent(
  "Email used at Stripe checkout:\nDriving school name:\nMain teaching area:\nLesson types and prices:\nDomain or current website (if you have one):\nBrand colours (optional):\n"
)}`;

export function GET() {
  return marketingPage({
    title: "Get started with Yotion",
    breadcrumb: "Get started",
    metadata: '<meta name="robots" content="noindex">',
    body: `<section class="onboarding">
      <h1>Tell us about your driving school</h1>
      <p>After paying through Stripe, email us your school details using the address you paid with. We’ll match your email to your payment and prepare your website for you to review before it goes live.</p>
      <ul><li>School name, teaching areas, lesson types and prices</li><li>Your domain or current website, if you have one</li><li>Your brand colours and logo, if available</li></ul>
      <p><a class="report-button" href="${onboardingEmail}">Email my school details</a></p>
      <p>You can also email <a href="mailto:hello@yotion.co.uk">hello@yotion.co.uk</a> directly. Attach your logo if you have one.</p>
    </section>`,
    pageStyles: ".onboarding{max-width:42rem}.onboarding li{margin-block:.35rem}",
  });
}
