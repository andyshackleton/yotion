/**
 * Yotion's reusable driving-school website configuration contract.
 * Content is managed by Yotion admins, not by instructors.
 * This is the first extraction milestone; the existing Greenlight sample remains unchanged.
 */
export type BrandColour = "green"|"blue"|"purple"|"charcoal"|"emerald"|"red"|"orange"|"amber"|"pink"|"burgundy"|"navy";
export type WebsiteStatus = "draft"|"published";
export interface WebsiteConfig {
 version: 1;
 branding: {schoolName:string;colour:BrandColour;logoUrl?:string;};
 hero: {eyebrow:string;headline:string;headlineAccent?:string;description:string;primaryCtaLabel:string;primaryCtaTarget:"#enquire";imageUrl?:string;};
 lessons: {heading:string;intro:string;items:Array<{id:string;title:string;description:string;price?:string}>;};
 instructor: {heading:string;name?:string;biography:string;photoUrl?:string;profileNoteHeading?:string;profileNote?:string;};
 teachingAreas: {heading:string;areas:string[];schedule?:string;};
 reviews: {heading:string;items:Array<{id:string;quote:string;attribution:string}>;};
 faq: {heading:string;items:Array<{id:string;question:string;answer:string}>;};
 contact: {heading:string;description:string;email:string;phone?:string;whatsapp?:string;};
 assistant: {enabled:boolean;welcomeMessage?:string;knowledge?:Array<{id:string;topic:string;question:string;answer:string;approved:boolean}>;fallbackMessage?:string;unansweredQuestions?:string[];};
}
export const BRAND_COLOURS:readonly BrandColour[]=["green","blue","purple","charcoal","emerald","red","orange","amber","pink","burgundy","navy"];
export function starterWebsiteConfig(input:{schoolName:string;colour?:string;email:string;location?:string;transmission?:"manual"|"automatic"|"both"}):WebsiteConfig {
 const colour=BRAND_COLOURS.includes(input.colour as BrandColour)?input.colour as BrandColour:"green";
 const lessonLabel=input.transmission==="both"?"Manual and automatic":input.transmission==="manual"?"Manual":"Automatic";
 return {
  version:1,
  branding:{schoolName:input.schoolName,colour},
  hero:{eyebrow:lessonLabel.toUpperCase()+" DRIVING LESSONS",headline:"Your road to feeling confident.",description:"A calm start. A clear plan. Lessons that move at your pace.",primaryCtaLabel:"Ask about your first lesson",primaryCtaTarget:"#enquire"},
  lessons:{heading:"Driving lessons",intro:input.transmission?lessonLabel+" driving lessons. Enquire to discuss availability.":"Replace these example services with the instructor's confirmed lesson options.",items:[]},
  instructor:{heading:"Meet your instructor",biography:"Example: patient, supportive tuition with a clear plan at your own pace. Replace with the instructor's actual biography."},
  teachingAreas:{heading:"Where we teach",areas:input.location?[input.location]:[]},
  reviews:{heading:"What learners say",items:[]},
  faq:{heading:"Common questions",items:[{id:"sample-faq-1",question:"I'm nervous. Can I take things slowly?",answer:"Example answer: lessons can be planned around your confidence and experience. Confirm with the instructor."},{id:"sample-faq-2",question:"Do you teach manual?",answer:input.transmission?lessonLabel+" driving lessons are offered. Enquire to discuss availability.":"Example answer: this template is for automatic lessons. Confirm the instructor's actual transmission options."}]},
  contact:{heading:"Get in touch",description:"Ask about lesson availability and next steps.",email:input.email},
  assistant:{enabled:false,knowledge:[],unansweredQuestions:[],fallbackMessage:"I don’t have a confirmed answer to that question. Please use the enquiry form to ask the instructor."}
 };
}
export function isWebsiteConfig(value:unknown):value is WebsiteConfig {
 if(!value||typeof value!=="object")return false;
 const v=value as Partial<WebsiteConfig>;
 return v.version===1&&!!v.branding&&typeof v.branding.schoolName==="string"&&BRAND_COLOURS.includes(v.branding.colour)&&!!v.hero&&typeof v.hero.headline==="string"&&!!v.lessons&&Array.isArray(v.lessons.items)&&!!v.instructor&&!!v.teachingAreas&&Array.isArray(v.teachingAreas.areas)&&!!v.reviews&&Array.isArray(v.reviews.items)&&!!v.faq&&Array.isArray(v.faq.items)&&!!v.contact&&typeof v.contact.email==="string"&&!!v.assistant;
}
