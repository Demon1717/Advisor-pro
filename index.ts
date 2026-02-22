import express from 'express';
import cors from 'cors';
import { calculatePremium } from './automation.ts';
import path from 'path';
import fs from 'fs';
import calculatePremiumHandler from './calculatePremium.ts';
import dotenv from 'dotenv';
import { query } from './db.ts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files (screenshots)
app.use('/screenshots', express.static(path.join(process.cwd(), 'public/screenshots')));

// --- Leads API Routes (PostgreSQL) ---

// POST /api/leads - Save lead data
app.post('/api/leads', async (req, res) => {
    try {
        const { leadName, pincode, members, advisorName } = req.body;
        console.log('Received lead data for:', leadName);

        const result = await query(
            `INSERT INTO leads (lead_name, pincode, advisor_name, members) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [leadName, pincode, advisorName || 'Unknown', JSON.stringify(members)]
        );
        
        const newLeadId = result.rows[0].id;
        console.log('Saved new lead with ID:', newLeadId);

        res.status(201).json({ 
            success: true, 
            message: 'Lead saved successfully',
            leadId: newLeadId
        });
    } catch (error) {
        console.error('Error saving lead:', error);
        res.status(500).json({ success: false, error: 'Failed to save lead' });
    }
});

// GET /api/leads - Retrieve all leads
app.get('/api/leads', async (req, res) => {
    try {
        console.log('Fetching all leads from DB...');
        const result = await query('SELECT * FROM leads ORDER BY created_at DESC');
        
        // Map DB columns to frontend expected format
        const leads = result.rows.map(row => ({
            id: row.id,
            lead_name: row.lead_name,
            pincode: row.pincode,
            members: row.members, // JSONB is automatically parsed by pg
            advisorName: row.advisor_name,
            createdAt: row.created_at
        }));

        res.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch leads' });
    }
});

// DELETE /api/leads/:id - Delete a lead
app.delete('/api/leads/:id', async (req, res) => {
    try {
        const rawId = req.params.id;
        const targetId = parseInt(rawId);
        console.log(`Request to delete lead with ID: "${targetId}"`);
        
        const result = await query('DELETE FROM leads WHERE id = $1 RETURNING id', [targetId]);
        
        if (result.rowCount === 0) {
            console.log(`Lead with ID ${targetId} not found.`);
            res.status(404).json({ success: false, error: `Lead not found` });
            return;
        }

        console.log(`Successfully deleted lead ${targetId}`);
        res.json({ success: true, message: 'Lead deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ success: false, error: `Failed to delete lead: ${error.message}` });
    }
});

// --- Existing Routes ---

app.post('/api/calculate-premium', async (req, res) => {
  try {
    const { planName, members, pincode } = req.body;
    console.log(`Calculating premium for ${planName} with members:`, members);

    const result = await calculatePremium(planName, members, pincode);
    
    res.json({ 
      success: true, 
      premium: result.premium, 
      screenshotUrl: result.screenshotPath 
    });
  } catch (error) {
    console.error('Error calculating premium:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate premium' });
  }
});

app.post('/api/get-premium-screenshot', async (req, res) => {
  try {
    const { policyName, members, pincode, selectedCoverage } = req.body;
    console.log(`Generating screenshot quote for ${policyName} (${selectedCoverage})`, members);

    let insurer = '';
    if (policyName.includes('HDFC')) insurer = 'HDFC';
    else if (policyName.includes('Care')) insurer = 'Care';
    else if (policyName.includes('Activ') || policyName.includes('Aditya')) insurer = 'AdityaBirla';

    // Transform payload for the new handler
    const transformedMembers = members.map((m: any) => ({
      type: m.relation || m.name, 
      age: m.age,
      gender: m.gender
    }));

    // Mock the request body for the handler
    req.body = {
      insurer,
      pincode,
      members: transformedMembers,
      sumInsured: selectedCoverage
    };

    // Call the handler
    await calculatePremiumHandler(req, res);

  } catch (error) {
    console.error('Error generating screenshot quote:', error);
    res.status(500).json({ success: false, error: 'Failed to generate quote' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
