import type { SubmitEnquiry } from './enquiry'

// Stub: nothing is delivered. Swap this one function to change how enquiries are sent.
export const sendEnquiry: SubmitEnquiry = async (payload) => {
  console.info('Enquiry (stub, not sent)', payload.product?.title)
}
