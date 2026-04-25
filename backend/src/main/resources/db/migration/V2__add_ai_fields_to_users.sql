-- AI usage tracking: free-tier counter + optional user-supplied API key
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_requests_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_api_key       VARCHAR(500);
