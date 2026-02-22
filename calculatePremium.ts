import { chromium, Browser, Page } from 'playwright';
// For Vercel deployment, you would use:
// import chromium from 'chrome-aws-lambda';
// import { chromium as playwrightCore } from 'playwright-core';

interface Member {
  type: string; // "Self", "Spouse", etc.
  age: number;
  gender: string;
}

interface RequestBody {
  insurer: string;
  pincode: string;
  members: Member[];
  sumInsured: string;
}

export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { insurer, pincode, members, sumInsured } = req.body as RequestBody;

  if (!insurer || !pincode || !members) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Local setup
    browser = await chromium.launch({ headless: true });

    // Vercel setup (Uncomment for deployment)
    /*
    browser = await playwrightCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    */

    const context = await browser.newContext();
    page = await context.newPage();

    console.log(`Processing request for ${insurer} in ${pincode}`);

    switch (insurer) {
      case 'HDFC':
        await page.goto('https://app.joinditto.in/health/fq/optima-secure?team=Falcon');
        // TODO: HDFC Selectors
        // Example:
        // await page.fill('input[name="pincode"]', pincode);
        // await page.click('button.submit');
        break;

      case 'Care':
        await page.goto('https://app.joinditto.in/health/fq/care-supreme?team=Falcon');
        // TODO: Care Selectors
        break;

      case 'AdityaBirla':
      case 'Aditya':
        await page.goto('https://app.joinditto.in/health/fq/activ-one?team=Falcon');
        // TODO: Aditya Selectors
        break;

      default:
        throw new Error(`Unsupported insurer: ${insurer}`);
    }

    // --- Placeholder Automation Steps ---
    // Since actual selectors are missing, we will simulate a wait and take a screenshot of the body
    // In a real implementation, you would:
    // 1. Fill the form using `members` and `sumInsured` data.
    // 2. Click Calculate.
    // 3. Wait for the result card selector.

    // Simulating "processing"
    await page.waitForTimeout(2000); 

    // TODO: Replace with the actual result card selector
    // const resultSelector = '.result-card'; 
    // await page.waitForSelector(resultSelector);
    // const element = await page.$(resultSelector);
    
    // For now, screenshot the full page or a generic element
    const element = await page.$('body'); 
    
    if (!element) {
        throw new Error('Could not find result element');
    }

    const screenshotBuffer = await element.screenshot();
    const base64Image = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    res.status(200).json({
      success: true,
      base64Image: base64Image
    });

  } catch (error: any) {
    console.error('Automation Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
