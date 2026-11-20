import { marketingPage } from "../../lib/yotion-marketing-page";

export const dynamic = "force-static";

const body = "<div class=\"privacy-copy\"><h1>Privacy information</h1><p>When you request a personalised Yotion demonstration, we use the information you provide to review your enquiry, contact you and prepare a relevant demonstration.</p><section><h2>Information collected</h2><p>Your name, driving school name, email address, main teaching area and the types of lessons you offer. You can also share your current website and what you’d like to change, a preferred colour and any other details you choose to provide.</p></section><section><h2>How we use it</h2><p>We send your enquiry to our business email through Resend, our email delivery provider. We use the information to respond to your request and discuss the Yotion service. We do not use a demo enquiry to sign you up for marketing emails.</p></section><section><h2>Retention and your choices</h2><p>We retain enquiry correspondence only as long as reasonably needed for the enquiry and associated business records. You can ask us to access or delete your enquiry information, subject to applicable legal requirements.</p></section><section><h2>Contact</h2><p>For privacy enquiries, email <a href=\"mailto:hello@yotion.co.uk\">hello@yotion.co.uk</a>.</p><p>This is an initial privacy notice for the demo request process and will be reviewed before broader public launch.</p></section></div>";
const pageStyles = "";
const metadata = "";

export function GET() {
  return marketingPage({ title: "Privacy", breadcrumb: "Privacy", body, pageStyles, metadata });
}
