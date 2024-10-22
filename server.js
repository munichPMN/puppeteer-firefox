import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

const app = express();
const PORT = 3000;

// Middleware to parse JSON data
app.use(bodyParser.json());

// API endpoint to generate PDF from HTML content
app.post('/generate-pdf', async (req, res) => {
    const { htmlContent } = req.body;

    if (!htmlContent) {
        return res.status(400).json({ error: 'htmlContent is required' });
    }

    const browser = await puppeteer.launch({
        browser: 'firefox',
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate a random PDF filename
    const pdfFilename = `output-${randomUUID()}.pdf`;
    await page.pdf({
        path: pdfFilename,
        printBackground: true,
    });

    await browser.close();

    // Read the PDF file and convert to Base64
    try {
        const pdfBuffer = await fs.readFile(pdfFilename);
        const base64PDF = pdfBuffer.toString('base64');

        // Send the Base64 string and filename back as JSON
        res.json({
            message: 'PDF generated successfully!',
            filename: pdfFilename,
            base64PDF: base64PDF,
        });
        
        // Delete the PDF file after sending the response
        await fs.unlink(pdfFilename);
    } catch (error) {
        console.error('Error reading PDF file:', error);
        res.status(500).json({ error: 'Error generating PDF' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
