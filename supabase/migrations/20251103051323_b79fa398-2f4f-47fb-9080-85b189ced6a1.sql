-- Enable real-time updates for tasks table
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

-- Add tasks table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;