const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

// Serve index.html file
app.get('/', (req, res) => {
  fs.readFile('./index.html', (err, html) => {
    if (err) {
      res.status(500).send('Error loading index.html');
      return;
    }
    res.header('Content-Type', 'text/html');
    res.send(html);
  });
});

let browserInstance; // Keep track of the browser instance

app.post('/generate-pdf', async (req, res) => {
  try {
    const { htmlContent, options } = req.body;

    // Launch Puppeteer browser if not already launched
    if (!browserInstance) {
      browserInstance = await puppeteer.launch({
        product: 'firefox',
        protocol: 'webDriverBiDi'
      });
    }

    const page = await browserInstance.newPage();

    // Set HTML content
    await page.setContent(htmlContent);

    // Generate PDF as buffer
    const pdfBuffer = await page.pdf(options);

    // Encode PDF buffer as base64 data URI
    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    // Close the page after PDF generation
    await page.close();

    // Send the PDF as a base64 data URI in the response
    res.send({ pdfBase64 });
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
