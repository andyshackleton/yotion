import {test,expect} from "@playwright/test";

test("shared website has the Sample's required sections",async({page})=>{
 await page.goto("/");
 await expect(page.locator("#lessons")).toBeVisible();
 await expect(page.locator("#lessons h2")).toHaveText("Simple lessons. Clear prices.");
 await expect(page.locator("#lessons .outcome")).toHaveCount(3);
 await expect(page.locator("#lessons .outcome").nth(1)).toContainText("Where we teach");
 await expect(page.locator("#lessons .outcome").nth(2)).toContainText("When we teach");
 await expect(page.locator("#instructor")).toBeVisible();
 await expect(page.locator("#instructor .instructor-portrait")).toBeVisible();
 await expect(page.locator("#instructor .journey-stage")).toHaveCount(3);
 await expect(page.locator("#stories")).toBeVisible();
 await expect(page.locator("#stories .stories-heading")).toBeVisible();
 await expect(page.locator("#stories .stories-grid")).toBeVisible();
 await expect(page.locator("#questions")).toBeVisible();
 await expect(page.locator("#enquire")).toBeVisible();
});

test("chatbot greets visitors and preserves the conversation",async({page,isMobile})=>{
 await page.goto("/");
 if(isMobile)await page.locator(".site-menu-toggle").click();
 await page.locator(".nav-chat").first().click();
 await expect(page.locator("#chat-dialog")).toBeVisible();
 await page.locator("#chat-message").fill("hello");
 await page.locator("#chat-form button[type=submit]").click();
 await expect(page.locator("#chat-log")).toContainText("How can I help you today?");
 await page.locator("#chat-close").click();
 await expect(page.locator("#chat-dialog")).not.toBeVisible();
 await page.locator("#chat-launcher").click();
 await expect(page.locator("#chat-log")).toContainText("hello");
});

test("mobile hamburger menu opens and closes without changing header layout",async({page,isMobile})=>{
 test.skip(!isMobile,"Mobile-only regression");
 await page.goto("/");
 const toggle=page.locator(".site-menu-toggle");
 await expect(toggle).toBeVisible();
 await expect(page.locator("#customer-site-nav")).toBeHidden();
 const before=await toggle.boundingBox();
 await toggle.click();
 await expect(toggle).toHaveAttribute("aria-expanded","true");
 await expect(page.locator("#customer-site-nav")).toBeVisible();
 const after=await toggle.boundingBox();
 expect(before).not.toBeNull();
 expect(after).not.toBeNull();
 expect(Math.abs((before?.x||0)-(after?.x||0))).toBeLessThan(5);
 await toggle.click();
 await expect(page.locator("#customer-site-nav")).toBeHidden();
});

const SAMPLE_URL="https://sample.yotion.co.uk/";
const HARBOUR_PREVIEW="https://yotion.co.uk/admin/requests/fd855349-5a6a-42f2-aa3e-5d36a104b58e/preview";

test("customer site retains the approved Sample section structure",async({page})=>{
 await page.goto(SAMPLE_URL);
 const sample=await page.evaluate(()=>{
  const section=(id:string)=>document.querySelector(id);
  return {
   cards:section("#lessons")?.querySelectorAll(".outcome").length,
   journey:section("#instructor")?.querySelectorAll(".journey-stage").length,
   hasPortrait:!!section("#instructor")?.querySelector(".instructor-portrait"),
   hasStories:!!section("#stories .stories-heading"),
   hasFaq:!!section("#questions details"),
  };
 });
 await page.goto("/");
 const customer=await page.evaluate(()=>{
  const section=(id:string)=>document.querySelector(id);
  return {
   cards:section("#lessons")?.querySelectorAll(".outcome").length,
   journey:section("#instructor")?.querySelectorAll(".journey-stage").length,
   hasPortrait:!!section("#instructor")?.querySelector(".instructor-portrait"),
   hasStories:!!section("#stories .stories-heading"),
   hasFaq:!!section("#questions details"),
  };
 });
 expect(customer).toEqual(sample);
});

test("Harbour View uses the same customer template with its own content",async({browser})=>{
 test.skip(!process.env.YOTION_ADMIN_STORAGE_STATE,"Admin browser session is not configured for CI");
 const context=await browser.newContext({storageState:process.env.YOTION_ADMIN_STORAGE_STATE});
 try{
  const page=await context.newPage();
  await page.goto(HARBOUR_PREVIEW);
  await expect(page.locator("#lessons h2")).toHaveText("Simple lessons. Clear prices.");
  await expect(page.locator("#lessons .outcome")).toHaveCount(3);
  await expect(page.locator("#instructor .journey-stage")).toHaveCount(3);
  await expect(page.locator("#stories .stories-heading")).toBeVisible();
  await expect(page.locator("body")).toContainText("Harbour View Driving");
  await expect(page.locator("#lessons")).toContainText("Bootle");
  await expect(page.locator("#instructor")).not.toContainText("Hello, I'm Alex.");
 }finally{await context.close()}
});
