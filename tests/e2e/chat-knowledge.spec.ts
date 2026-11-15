import {test,expect} from "@playwright/test";
import {starterWebsiteConfig} from "../../src/lib/yotion-website-config";
import {matchKnowledge,websiteKnowledge} from "../../src/lib/yotion-chat-knowledge";

const config=starterWebsiteConfig({schoolName:"Test School",email:"test@example.com"});
config.lessons.items=[{id:"1",title:"Manual lessons",price:"£35 / hour",description:"One-to-one tuition"}];
config.teachingAreas.areas=["Liverpool","Bootle"];
config.faq.items=[{id:"1",question:"Can I book an intensive driving course?",answer:"Please enquire about intensive courses."}];
config.assistant.knowledge=[
 {id:"1",topic:"Payments",question:"Can I pay by bank transfer?",answer:"Bank transfer is accepted.",approved:true},
 {id:"2",topic:"Payments",question:"Can I pay with cash?",answer:"Cash is accepted.",approved:false},
 {id:"3",topic:"Policies",question:"What is your cancellation policy?",answer:"Please give 48 hours notice.",approved:true}
];
const entries=websiteKnowledge(config);
test("exact approved knowledge answer includes source",()=>{
 const match=matchKnowledge("Can I pay by bank transfer?",entries);
 expect(match.reason).toBe("exact");
 expect(match.entry?.answer).toBe("Bank transfer is accepted.");
 expect(match.entry?.source).toBe("Approved knowledge: Payments");
});
test("alternative wording with shared meaningful terms",()=>{
 const match=matchKnowledge("What is the cancellation policy?",entries);
 expect(match.entry?.answer).toBe("Please give 48 hours notice.");
 expect(match.reason).toBe("keyword match");
});
test("unapproved knowledge is not exposed",()=>{
 expect(entries.some(e=>e.answer==="Cash is accepted.")).toBe(false);
 expect(matchKnowledge("Can I pay with cash?",entries).entry).toBeNull();
});
test("unknown and ambiguous questions use fallback",()=>{
 expect(matchKnowledge("Do you offer motorway tuition?",entries).entry).toBeNull();
 expect(matchKnowledge("How can I pay?",entries).entry).toBeNull();
});
test("website lessons and areas are included automatically",()=>{
 expect(entries.find(e=>e.source==="Website lessons")?.answer).toContain("£35 / hour");
 expect(entries.find(e=>e.source==="Website teaching areas")?.answer).toContain("Bootle");
});
