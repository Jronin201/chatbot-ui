// supabase/types.ts  ── keep the rest of the file as-is
/* eslint-disable */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      /* … your existing table types … */
    }
    Views: {
      /* … */
    }
    /** ----------  ADD / MERGE THIS SECTION  ---------- */
    Functions: {
      /**  vector similarity search over file chunks  */
      match_file_items: {
        Args: {
          query_embedding: number[]          // vector(1536)
          match_threshold: number            // <= 1.0
          match_count: number                // top-k
          file_id_filter?: string | null      // optional uuid/text
        }
        Returns: {
          id: string
          file_id: string
          content: string
          similarity: number
          source: string
        }[]
      }
      // -- leave any other Functions that were already here
    }
    /** ---------------------------------------------- */
  }
  storage: {
    /* … */
  }
}
