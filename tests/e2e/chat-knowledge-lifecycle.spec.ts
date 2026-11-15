import {test,expect} from "@playwright/test";
import {starterWebsiteConfig} from "../../src/lib/yotion-website-config";
import {websiteKnowledge,matchKnowledge} from "../../src/lib/yotion-chat-knowledge";

test("draft, approval, and removal control customer-visible knowledge",()=>{
 const config=starterWebsiteConfig({schoolName:"Test School",email:"test@example.com"});
 config.faq.items=[];
 const question="What is the cancellation notice period?";
 const answer="Please give at least 48 hours notice.";
 config.assistant.knowledge=[{id:"policy-1",topic:"Policies",question,answer:"",approved:false}];
 expect(matchKnowledge(question,websiteKnowledge(config)).entry).toBeNull();

 // Admin supplies an answer but leaves the entry unapproved.
 config.assistant.knowledge[0].answer=answer;
 expect(matchKnowledge(question,websiteKnowledge(config)).entry).toBeNull();

 // Approval is the only point at which the answer becomes available.
 config.assistant.knowledge[0].approved=true;
 expect(matchKnowledge(question,websiteKnowledge(config)).entry?.answer).toBe(answer);

 // Revoking approval immediately excludes the answer.
 config.assistant.knowledge[0].approved=false;
 expect(matchKnowledge(question,websiteKnowledge(config)).entry).toBeNull();

 // Removing the entry cannot leak it through generated website knowledge.
 config.assistant.knowledge=[];
 expect(websiteKnowledge(config).some(x=>x.answer===answer)).toBe(false);
});

test("knowledge is isolated between school configurations",()=>{
 const first=starterWebsiteConfig({schoolName:"First School",email:"first@example.com"});
 const second=starterWebsiteConfig({schoolName:"Second School",email:"second@example.com"});
 first.faq.items=[];
 second.faq.items=[];
 first.assistant.knowledge=[{id:"1",topic:"Payment",question:"Do you accept bank transfer?",answer:"Yes, bank transfer.",approved:true}];
 expect(matchKnowledge("Do you accept bank transfer?",websiteKnowledge(first)).entry?.answer).toBe("Yes, bank transfer.");
 expect(matchKnowledge("Do you accept bank transfer?",websiteKnowledge(second)).entry).toBeNull();
});
