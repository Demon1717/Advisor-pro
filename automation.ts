import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

interface Member {
  name: string;
  age: number;
  gender?: string;
}

export async function calculatePremium(planName: string, members: Member[], pincode: string) {
  const browser = await chromium.launch({ headless: false }); // Headless: false so user can see it running
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Determine search query based on plan and members
    const memberString = members.map(m => `${m.name} (${m.age})`).join(', ');
    const query = `Calculate premium for ${planName} insurance for ${memberString} in pincode ${pincode}`;

    console.log(`Navigating to search for: ${query}`);
    
    // As a placeholder for actual insurer portals (which require specific selectors),
    // we will visualize the calculation request via a search engine.
    await page.goto('https://www.google.com');

    // Wait for search box
    await page.waitForSelector('textarea[name="q"]', { state: 'visible' });
    await page.fill('textarea[name="q"]', query);
    await page.press('textarea[name="q"]', 'Enter');

    // Wait for results to load
    await page.waitForSelector('#search');
    
    // Simulate "processing" time
    await page.waitForTimeout(2000);

    // Generate a screenshot
    const timestamp = Date.now();
    const filename = `premium-${timestamp}.png`;
    const screenshotPath = path.join(process.cwd(), 'public/screenshots', filename);
    
    await page.screenshot({ path: screenshotPath });

    // In a real scenario, we would scrape the premium amount here.
    // For now, we return a mock value or "Calculated via Browser".
    const mockPremium = Math.floor(Math.random() * (50000 - 10000) + 10000); 

    await browser.close();

    return {
      premium: mockPremium,
      screenshotPath: `/screenshots/${filename}`
    };

  } catch (error) {
    console.error('Automation error:', error);
    await browser.close();
    throw error;
  }
}
