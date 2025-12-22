import express from 'express';
import cors from 'cors';
import serverlessExpress from '@vendia/serverless-express';
import { generatePresignedUrl } from './handlers/s3';
import * as examRepo from './repositories/examRepository';
import { analyzeExamPaper } from './services/bedrockService';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// S3 Presigned URL
app.post('/api/upload-url', async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const result = await generatePresignedUrl(filename, contentType);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Analyze Exam Paper (Bedrock)
app.post('/api/analyze-paper', async (req, res) => {
  try {
    const { s3Key, subject } = req.body;
    if (!s3Key) {
      res.status(400).json({ error: 's3Key is required' });
      return;
    }
    const questions = await analyzeExamPaper(s3Key, subject);
    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze exam paper' });
  }
});

// Exam Papers
app.get('/api/exampapers', async (req, res) => {
  try {
    const papers = await examRepo.listExamPapers();
    res.json({ datas: papers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to list exam papers' });
  }
});

app.post('/api/exampapers', async (req, res) => {
  try {
    const paper = await examRepo.createExamPaper(req.body);
    res.json(paper);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create exam paper' });
  }
});

// Exam Results
app.get('/api/examresults', async (req, res) => {
  try {
    const results = await examRepo.listExamResults();
    res.json({ datas: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to list exam results' });
  }
});

app.post('/api/examresults', async (req, res) => {
  try {
    const result = await examRepo.createExamResult(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create exam result' });
  }
});

export const handler = serverlessExpress({ app });
