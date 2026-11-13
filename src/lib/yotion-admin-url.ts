/** Canonical browser origin for the Yotion administrator workspace. */
export function adminBaseUrl():URL {
 const configured=process.env.YOTION_ADMIN_BASE_URL?.trim()||"https://yotion-kappa.vercel.app";
 try {
  const url=new URL(configured);
  if(url.protocol!=="https:"||url.username||url.password||url.pathname!=="/"||url.search||url.hash)throw Error("Invalid admin URL");
  return url;
 } catch {
  throw new Error("YOTION_ADMIN_BASE_URL must be an HTTPS origin, for example https://yotion.co.uk");
 }
}
