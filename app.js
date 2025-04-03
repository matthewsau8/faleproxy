const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to fetch and modify content
app.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Removed intentional failure

    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    function replaceYaleText(content) {
      return content.replace(/Yale|yale|YALE/g, (match) => {
        if (match === 'YALE') return 'FALE';
        if (match === 'Yale') return 'Fale';
        return 'fale';
      });
    }
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const originalText = $(this).text();
      const newText = replaceYaleText(originalText);
      if (originalText !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    let newTitle = replaceYaleText($('title').text());
    $('title').text(newTitle);
    
    return res.json({ 
      success: true, 
      content: $.html(),
      title: newTitle,
      originalUrl: url
    });
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({ 
      error: `Failed to fetch content: ${error.message}` 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
