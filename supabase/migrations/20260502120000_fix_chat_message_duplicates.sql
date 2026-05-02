-- Add client_message_id column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS client_message_id TEXT;

-- Create a unique constraint to prevent duplicates within a session
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_session_client_id_key 
UNIQUE (session_id, client_message_id);

-- Backfill client_message_id from metadata if it exists
UPDATE public.chat_messages
SET client_message_id = metadata->>'client_message_id'
WHERE client_message_id IS NULL AND metadata->>'client_message_id' IS NOT NULL;

-- Add UPDATE and DELETE policies for chat_messages (missing from original migration)
CREATE POLICY "Users can update messages in their own sessions" 
    ON public.chat_messages FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.chat_sessions 
        WHERE id = chat_messages.session_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can delete messages in their own sessions" 
    ON public.chat_messages FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.chat_sessions 
        WHERE id = chat_messages.session_id AND user_id = auth.uid()
    ));
