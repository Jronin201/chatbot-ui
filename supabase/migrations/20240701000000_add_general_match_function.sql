-- Add general match_file_items function that defaults to OpenAI embeddings
-- This function is used by /api/retrieval/process/route.ts

create or replace function match_file_items (
  query_embedding vector(1536),
  match_threshold double precision DEFAULT 0.25,
  match_count int DEFAULT 6,
  file_id_filter UUID DEFAULT null
) returns table (
  id UUID,
  file_id UUID,
  content TEXT,
  tokens INT,
  similarity float,
  source TEXT
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    file_items.id,
    file_items.file_id,
    file_items.content,
    file_items.tokens,
    1 - (file_items.openai_embedding <=> query_embedding) as similarity,
    file_items.file_id::text as source
  from file_items
  where 
    -- Filter by file_id if provided
    (file_id_filter IS NULL OR file_items.file_id = file_id_filter)
    -- Only match items that have embeddings
    AND file_items.openai_embedding IS NOT NULL
    -- Filter by similarity threshold
    AND (1 - (file_items.openai_embedding <=> query_embedding)) >= match_threshold
  order by file_items.openai_embedding <=> query_embedding
  limit match_count;
end;
$$;
