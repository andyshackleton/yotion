import {test,expect} from "@playwright/test";

const requestId=process.env.YOTION_TEST_REQUEST_ID;
const storageState=process.env.YOTION_ADMIN_STORAGE_STATE;
const allowWrites=process.env.YOTION_TEST_ALLOW_WRITES==="true";

test("dedicated admin test request persists draft, approval, and deletion",async({browser})=>{
 test.skip(!requestId||!storageState||!allowWrites,"Requires explicit opt-in and dedicated test request; never write to a customer demo");
 const context=await browser.newContext({storageState,baseURL:"https://yotion.co.uk"});
 const marker="Yotion automated knowledge test "+Date.now();
 const question="Can I ask about "+marker+"?";
 const answer="Please contact the school for details about "+marker+".";
 try{
  const page=await context.newPage();
  const url="/admin/requests/"+encodeURIComponent(requestId!);
  await page.goto(url);
  await expect(page.locator("#knowledge-list")).toBeVisible();
  const add=page.locator("#knowledge-add");
  await add.click();
  let entry=page.locator(".knowledge-entry").last();
  await entry.locator('[name="knowledge_topic"]').fill("Automated test");
  await entry.locator('[name="knowledge_question"]').fill(question);
  await entry.locator('[name="knowledge_answer"]').fill(answer);
  await page.locator('form[action$="/config"] button[type="submit"]').click();
  await expect(page).toHaveURL(/config=saved/);
  entry=page.locator(".knowledge-entry").filter({has:page.locator('[name="knowledge_question"][value="'+question+'"]')});
  await expect(entry).toHaveCount(1);
  await expect(entry.locator('[name^="knowledge_approved_"]')).not.toBeChecked();
  await entry.locator('[name^="knowledge_approved_"]').check();
  await page.locator('form[action$="/config"] button[type="submit"]').click();
  await expect(page).toHaveURL(/config=saved/);
  entry=page.locator(".knowledge-entry").filter({has:page.locator('[name="knowledge_question"][value="'+question+'"]')});
  await expect(entry.locator('[name^="knowledge_approved_"]')).toBeChecked();
  await entry.locator(".knowledge-remove").click();
  await page.locator('form[action$="/config"] button[type="submit"]').click();
  await expect(page).toHaveURL(/config=saved/);
  await expect(page.locator('[name="knowledge_question"][value="'+question+'"]')).toHaveCount(0);
 }finally{await context.close()}
});
