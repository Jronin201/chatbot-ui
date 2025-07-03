export * from "./csv"
export * from "./docx"
export * from "./json"
export * from "./md"
export * from "./pdf"
export * from "./txt"

// Increased chunk size for better context retention
// Especially important for legal documents and complex analysis
export const CHUNK_SIZE = 6000
export const CHUNK_OVERLAP = 400
