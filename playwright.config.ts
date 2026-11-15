import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./tests/e2e",
 timeout:30000,
 expect:{timeout:10000},
 retries:process.env.CI?2:0,
 reporter:process.env.CI?"github":"list",
 use:{baseURL:process.env.YOTION_TEST_BASE_URL||"https://greenlight-driving.yotion.co.uk",trace:"retain-on-failure",screenshot:"only-on-failure"},
 projects:[{name:"desktop-chromium",use:{...devices["Desktop Chrome"]}},{name:"mobile-chromium",use:{...devices["iPhone 13"],defaultBrowserType:"chromium"}}]
});
