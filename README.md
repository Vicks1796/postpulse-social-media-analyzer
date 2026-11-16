# PostPulse — Social Media Analyzer

A serverless web app that analyzes a social media post (tweet, caption, thread) and returns sentiment, named entities, key phrases, and readability statistics. Built for **CS 524 – Cloud Computing** at Stevens Institute of Technology (Spring 2026).

## Features
- Sentiment scoring (positive / negative / neutral / mixed) with percentage breakdown
- Entity extraction (hashtags, mentions, and more)
- Key phrase extraction
- Text statistics and readability metrics
- Analysis results stored in Amazon S3

## Architecture
```
Browser (HTML/CSS/JS)  --POST-->  AWS Lambda (Function URL, Python)  -->  Amazon S3 (stored results)
```
- **Frontend:** static HTML/CSS/vanilla JavaScript (`frontend/`)
- **Backend:** Python AWS Lambda with a custom NLP engine, using `boto3` for S3 (`backend/lambda_function.py`)
- **Diagram:** `docs/architecture-diagram.drawio` (open with diagrams.net)

## Setup
1. Create an S3 bucket and set `BUCKET_NAME` in `backend/lambda_function.py`.
2. Create a Lambda function (Python 3.x), upload `lambda_function.py`, and attach an IAM role that allows `s3:PutObject` on your bucket.
3. Enable a **Function URL** for the Lambda and configure CORS as needed.
4. Set `API_URL` in `frontend/script.js` to your Function URL.
5. Serve the `frontend/` folder with any static host (S3 static website, nginx, or `python -m http.server`).

## Security notes
- No credentials are stored in this repo. Use IAM roles, not access keys.
- Restrict CORS (`Access-Control-Allow-Origin`) to your frontend's domain in production instead of `*`.
- Consider adding auth or throttling on the Function URL to prevent abuse.

## My role
- Deployed the app on AWS: configured the Lambda function, Function URL, S3 bucket, and IAM permissions
- Connected the frontend to the serverless backend and tested the end-to-end flow
- Documented the architecture and security considerations (CORS, least-privilege IAM, Function URL abuse)

## Author
Vignesh Prasad — M.S. Cybersecurity, Stevens Institute of Technology
