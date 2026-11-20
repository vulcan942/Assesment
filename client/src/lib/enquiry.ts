export interface EnquiryPayload {
  name: string
  email: string
  phone?: string
  message: string
  product?: { id: string | number; title: string; price?: number }
}

// Resolves when the enquiry was delivered, rejects when it was not.
export type SubmitEnquiry = (payload: EnquiryPayload) => Promise<void>
