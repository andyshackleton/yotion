import {test,expect} from "@playwright/test";

const requestId=process.env.YOTION_TEST_REQUEST_ID;
const storageState=process.env.YOTION_ADMIN_STORAGE_STATE;
test("authenticated knowledge editor adds, filters, and removes entries without saving",async({browser})=>{
 test.skip(!requestId||!storageState,"Requires a dedicated test request and authenticated admin storage state");
 const context=await browser.newContext({storageState,baseURL:"https://yotion.co.uk"});
 try{
  const page=await context.newPage();
  await page.goto("/admin/requests/"+encodeURIComponent(requestId!));
  await expect(page.locator("#knowledge-list")).toBeVisible();
  const entries=page.locator("#knowledge-list .knowledge-entry");
  const before=await entries.count();
  await page.locator("#knowledge-add").click();
  await expect(entries).toHaveCount(before+1);
  const added=entries.last();
  await added.locator('[name="knowledge_topic"]').fill("Test policy");
  await added.locator('[name="knowledge_question"]').fill("Can I reschedule a test lesson?");
  await added.locator('[name="knowledge_answer"]').fill("Contact the instructor to discuss rescheduling.");
  await expect(page.locator("#knowledge-summary")).toContainText("draft");
  await added.locator('[name^="knowledge_approved_"]').check();
  await expect(page.locator("#knowledge-summary")).toContainText("approved");
  await page.locator("#knowledge-status-filter").selectOption("draft");
  await expect(added).toBeHidden();
  await page.locator("#knowledge-status-filter").selectOption("all");
  await added.locator(".knowledge-remove").click();
  await expect(entries).toHaveCount(before);
  // Deliberately do not submit: this verifies UI controls without modifying customer data.
 }finally{await context.close()}
});
