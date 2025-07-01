// Test file to understand correct Tables type usage
import { Database, Tables } from './supabase/types'

// Try different approaches to see which works
type TestProfile2 = Tables<"profiles", never>
type TestProfile3 = Database["public"]["Tables"]["profiles"]["Row"]

// Export for verification
export type { TestProfile2, TestProfile3 }
