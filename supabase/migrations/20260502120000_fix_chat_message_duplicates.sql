-- Add client_message_id column to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS client_message_id TEXT;

-- Backfill only one row per existing client message ID.
-- If production already has duplicates in metadata, keep the first row mapped
-- and leave duplicate historical rows with NULL client_message_id.
WITH ranked_metadata_ids AS (
  SELECT
    id,
    metadata->>'client_message_id' AS metadata_client_message_id,
    row_number() OVER (
      PARTITION BY session_id, metadata->>'client_message_id'
      ORDER BY created_at, id
    ) AS rn
  FROM public.chat_messages
  WHERE client_message_id IS NULL
    AND metadata->>'client_message_id' IS NOT NULL
)
UPDATE public.chat_messages AS message
SET client_message_id = ranked.metadata_client_message_id
FROM ranked_metadata_ids AS ranked
WHERE message.id = ranked.id
  AND ranked.rn = 1;

-- Create a unique constraint to prevent future duplicates within a session.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.chat_messages'::regclass
      AND conname = 'chat_messages_session_client_id_key'
  ) THEN
    EXECUTE $constraint$
      ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_session_client_id_key
      UNIQUE (session_id, client_message_id)
    $constraint$;
  END IF;
END $$;

-- Add UPDATE policy for chat_messages if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname = 'Users can update messages in their own sessions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update messages in their own sessions"
      ON public.chat_messages
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.chat_sessions
          WHERE id = chat_messages.session_id
            AND user_id = auth.uid()
        )
      )
    $policy$;
  END IF;
END $$;

-- Add DELETE policy for chat_messages if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname = 'Users can delete messages in their own sessions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can delete messages in their own sessions"
      ON public.chat_messages
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.chat_sessions
          WHERE id = chat_messages.session_id
            AND user_id = auth.uid()
        )
      )
    $policy$;
  END IF;
END $$;