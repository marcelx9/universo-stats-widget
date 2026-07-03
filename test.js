require("dotenv").config();
const { chromium } = require("playwright");

async function test() {
    const user = process.env.UNIVERSO_USER || "statss";
    const url = `https://stats.universocraft.com/jugador/${user}`;

    const browser = await chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    console.log("Abriendo:", url);

    await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await page.waitForTimeout(10000);

    console.log("URL final:", page.url());
    console.log("Título:", await page.title());

    const text = await page.locator("body").innerText();
    console.log("Texto:");
    console.log(text);

    await browser.close();
}

test().catch(console.error);