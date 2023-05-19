import * as puppeteer from "puppeteer";
import fs from "fs";
require("dotenv").config();

const url: string = "https://hr.talenta.co/employee/dashboard";
const liveAttendanceURL: string = "https://hr.talenta.co/live-attendance";
const singOutURL: string = "https://hr.talenta.co/site/sign-out";
//selector
const emailSelector: string = "#user_email";
const passwordSelector: string = "#user_password";
const loginBtn: string = "#new-signin-button";
const clockInBtn: string =
  "#tl-live-attendance-index > div > div.tl-content-max__600.my-3.my-md-5.mx-auto.px-3.px-md-0 > div.tl-card.hide-box-shadow-on-mobile.hide-border-on-mobile.text-center.p-0 > div.d-block.p-4.px-0-on-mobile > div > div:nth-child(1) > button";
const clockOutBtn: string =
  "#tl-live-attendance-index > div > div.tl-content-max__600.my-3.my-md-5.mx-auto.px-3.px-md-0 > div.tl-card.hide-box-shadow-on-mobile.hide-border-on-mobile.text-center.p-0 > div.d-block.p-4.px-0-on-mobile > div > div:nth-child(2) > button";
const clockInSuccessSelector: string =
  "#tl-live-attendance-index > div > div.tl-content-max__600.my-3.my-md-5.mx-auto.px-3.px-md-0 > div.mt-5 > ul > li > div > p";
const clockOutSuccessSelector: string =
  "#tl-live-attendance-index > div > div.tl-content-max__600.my-3.my-md-5.mx-auto.px-3.px-md-0 > div.mt-5 > ul > li:nth-child(2) > div > p";

const clockOutTime: number = 3600 * 17 + 30 * 60;

const run = async (absenBtn: string, successSelector: string) => {
  let browser: puppeteer.Browser | null = null;
  let page: puppeteer.Page | null = null;
  try {
    if (
      typeof process.env.EMAIL === "undefined" ||
      typeof process.env.PASSWORD === "undefined" ||
      typeof process.env.LATITUDE === "undefined" ||
      typeof process.env.LONGITUDE === "undefined"
    )
      throw new Error("check your .env file ples");
    const email: string = process.env.EMAIL;
    const password: string = process.env.PASSWORD;
    const latitude: string = process.env.LATITUDE;
    const longitude: string = process.env.LONGITUDE;

    browser = await puppeteer.launch({ headless: "new" });
    page = await browser.newPage();

    await page.goto(url);
    await page.waitForSelector(emailSelector);
    console.log("login page");
    await page.type(emailSelector, email);
    await page.type(passwordSelector, password);
    await page.click(loginBtn);
    const res: puppeteer.HTTPResponse | null = await page.waitForNavigation();
    console.log("logged in!");
    await page.setGeolocation({
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(liveAttendanceURL, ["geolocation"]);
    if (!res || res.status() !== 200) throw new Error("Login Failed");
    await page.goto(liveAttendanceURL);
    console.log("absen page");
    await page.waitForSelector(absenBtn);
    const checker: puppeteer.ElementHandle<Element> | null = await page.$(
      successSelector
    );
    if (checker) throw new Error("udah clockin/clockout");
    await page.click(absenBtn);
    await page.waitForSelector(successSelector);
    const result: string | null = await page.$eval(
      successSelector,
      (el) => el.textContent
    );
    if (!result) throw new Error("clock in/out gagal");
    console.log(`${result} success`);

    //testing
    // const test: Buffer = await page.screenshot({ type: "png" });
    // fs.writeFileSync("test.png", test);
    await page.goto(singOutURL);
    console.log("signed out!");
  } catch (err) {
    console.error(err);
  } finally {
    await browser?.close();
  }
};

// console.log(arg);
try {
  let absenBtn: string = clockInBtn;
  let successSelector: string = clockInSuccessSelector;
  const today: Date = new Date();
  const now: number = today.getHours() * 3600 + 60 * today.getMinutes();
  if (now < 5 * 3600) throw new Error("kepagian");
  if (now > clockOutTime) {
    absenBtn = clockOutBtn;
    successSelector = clockOutSuccessSelector;
  }
  run(absenBtn, successSelector);
} catch (err) {
  console.error(err);
}
