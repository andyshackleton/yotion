import {test,expect} from "@playwright/test";

test("shared website has the Sample's required sections",async({page})=>{
 await page.goto("/");
 await expect(page.locator("#lessons")).toBeVisible();
 await expect(page.locator("#lessons h2")).toHaveText("Simple lessons. Clear prices.");
 await expect(page.locator("#lessons .outcome")).toHaveCount(3);
 await expect(page.locator("#instructor")).toBeVisible();
 await expect(page.locator("#instructor .instructor-portrait")).toBeVisible();
 await expect(page.locator("#instructor .journey-stage")).toHaveCount(3);
 await expect(page.locator("#questions")).toBeVisible();
 await expect(page.locator("#enquire")).toBeVisible();
});

test("chatbot greets visitors and preserves the conversation",async({page})=>{
 await page.goto("/");
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
