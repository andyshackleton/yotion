/** Demo links remain private bearer-token URLs; never log or expose their tokens. */
export const DEMO_HOST="demo.yotion.co.uk";
export const DEVELOPMENT_DEMO_ORIGIN="https://yotion-kappa.vercel.app";
export function demoOrigin():string{
 const raw=process.env.YOTION_DEMO_BASE_URL?.trim()||DEVELOPMENT_DEMO_ORIGIN;
 const u=new URL(raw);
 if(u.protocol!=="https:"||u.username||u.password||u.pathname!=="/"||u.search||u.hash||![DEMO_HOST,"yotion-kappa.vercel.app"].includes(u.hostname))throw Error("Invalid YOTION_DEMO_BASE_URL");
 return u.origin;
}
export function parseDemoLink(raw:string):{slug:string;token:string}|null{
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash)return null;
  if(![DEMO_HOST,"yotion-kappa.vercel.app"].includes(u.hostname))return null;
  const parts=u.pathname.split("/").filter(Boolean);
  const segments=u.hostname===DEMO_HOST?parts:parts[0]==="demo"?parts.slice(1):[];
  if(segments.length!==2||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segments[0])||!/^[A-Za-z0-9_-]{32}$/.test(segments[1]))return null;
  return {slug:segments[0],token:segments[1]};
 }catch{return null}
}
export function demoLink(slug:string,token:string):string{
 const origin=demoOrigin();
 const prefix=new URL(origin).hostname===DEMO_HOST?"":"/demo";
 return origin+prefix+"/"+encodeURIComponent(slug)+"/"+encodeURIComponent(token);
}
export function previewDemoLink(raw:string):string{
 const parsed=parseDemoLink(raw);
 return parsed?demoLink(parsed.slug,parsed.token):"";
}
