// Extracting content at a same time
const express = require('express');
const multer = require('multer');
const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');

const app = express();
const PORT = 3000;

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const endpoint = 'https://goodspacedocumentintelligence.cognitiveservices.azure.com/';
const apiKey = 'a2d51a7da84f4cfda50281cf058477f7';
const modelId = 'prebuilt-read';

const formRecognizerClient = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

// Asynchronous document processing function
const processDocument = async (buffer) => {
  try {
    const poller = await formRecognizerClient.beginAnalyzeDocument(modelId, buffer, {
      onProgress: ({ status }) => {
        console.log(`Analysis status: ${status}`);
      },
    });

    // Waiting for the analysis to complete
    return await poller.pollUntilDone();
  } catch (error) {
    console.error('Error analyzing document:', error.message);
    throw error;
  }
};

app.post('/api/extract', upload.single('file'), async (req, res) => {
    try {
      // Process the document asynchronously
      const results = await processDocument(req.file.buffer);
  
      // Handle the extracted information as needed
      res.json(results);
    } catch (error) {
      console.error('Error processing document:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

// Endpoint to handle batch document extraction asynchronously - multiple document

app.post('/api/extract/batch', upload.array('files', 10), async (req, res) => {
  try {
    // Acknowledge the receipt of the documents
    res.status(200).json({ message: 'Documents received. Processing asynchronously.' });

    // Process the documents concurrently
    const results = await Promise.all(req.files.map(file => processDocument(file.buffer)));

    // Handle the extracted information as needed
    res.json(results);
  } catch (error) {
    console.error('Error processing documents:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Starting  the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

