import type {WebsiteConfig} from "./yotion-website-config";
export type KnowledgeEntry={question:string;answer:string;href:string;source:string};
export function websiteKnowledge(c:WebsiteConfig):KnowledgeEntry[]{
 return [
  ...(c.assistant.knowledge||[]).filter(x=>x.approved).map(x=>({question:x.question,answer:x.answer,href:"",source:"Approved knowledge: "+x.topic})),
  ...c.faq.items.map(x=>({question:x.question,answer:x.answer,href:"#questions",source:"Website FAQ"})),
  {question:"What lessons do you offer?",answer:c.lessons.items.map(x=>x.title+(x.price?" — "+x.price:"")+(x.description?". "+x.description:"")).join(" ")||c.lessons.intro,href:"#lessons",source:"Website lessons"},
  {question:"Where do you teach?",answer:c.teachingAreas.areas.join(", ")||"Please contact the instructor to confirm teaching areas.",href:"#lessons",source:"Website teaching areas"},
  {question:"How do I enquire?",answer:"Use the contact form on this page. During this demonstration, it shows a confirmation rather than sending your details.",href:"#enquire",source:"Website contact"}
 ];
}
/** Pure and browser-safe: serialized into the customer and admin pages. */
export function matchKnowledge(query:string,entries:KnowledgeEntry[]):{entry:KnowledgeEntry|null;reason:string}{
 const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
 const q=normalize(query);
 if(!q)return {entry:null,reason:"empty"};
 const exact=entries.find(e=>normalize(e.question)===q);
 if(exact)return {entry:exact,reason:"exact"};
 const stop=new Set(["what","where","when","which","who","how","does","do","can","could","would","will","you","your","the","are","for","and","about","with","have","there","please","tell","me","is","it","a","an"]);
 const tokens=(s:string)=>normalize(s).split(" ").filter(w=>w.length>2&&!stop.has(w));
 const words=new Set(tokens(q));
 if(!words.size)return {entry:null,reason:"no meaningful terms"};
 const scored=entries.map(e=>{const terms=new Set(tokens(e.question));const overlap=[...words].filter(w=>terms.has(w)).length;return {entry:e,overlap,score:overlap/Math.max(words.size,terms.size,1)};}).sort((a,b)=>b.score-a.score);
 const best=scored[0],second=scored[1];
 if(!best||best.overlap<2||best.score<0.6||(second&&second.score===best.score))return {entry:null,reason:"no confident match"};
 return {entry:best.entry,reason:"keyword match"};
}
