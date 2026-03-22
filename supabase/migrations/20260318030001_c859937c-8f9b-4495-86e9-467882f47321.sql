
SELECT cron.schedule(
  'follow-up-scheduler-every-30min',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/follow-up-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4"}'::jsonb,
        body:='{"time": "scheduled"}'::jsonb
    ) as request_id;
  $$
);
