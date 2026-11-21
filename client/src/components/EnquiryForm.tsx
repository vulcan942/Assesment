import { AlertCircle, CircleCheck } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EnquiryPayload, SubmitEnquiry } from '@/lib/enquiry'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/product'

interface EnquiryFormProps {
  product?: Product
  currency?: string
  onSubmit: SubmitEnquiry
  onDone: () => void
  onCancel: () => void
}

type Status = 'idle' | 'sending' | 'success' | 'error'
type Field = 'name' | 'email' | 'message'
type Errors = Partial<Record<Field, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELD_ORDER: Field[] = ['name', 'email', 'message']

function validate(name: string, email: string, message: string): Errors {
  const errors: Errors = {}
  if (!name.trim()) errors.name = 'Enter your name.'
  if (!EMAIL.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (!message.trim()) errors.message = 'Enter a message.'
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-center gap-1 text-sm leading-5 text-destructive">
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

export function EnquiryForm({ product, currency, onSubmit, onDone, onCancel }: EnquiryFormProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (key: string) => String(data.get(key) ?? '')
    const name = text('name')
    const email = text('email')
    const message = text('message')

    const found = validate(name, email, message)
    setErrors(found)
    const firstInvalid = FIELD_ORDER.find((f) => found[f])
    if (firstInvalid) {
      const target = { name: nameRef, email: emailRef, message: messageRef }[firstInvalid]
      target.current?.focus()
      return
    }

    // A filled honeypot is a bot: look successful, send nothing.
    if (text('website')) {
      setStatus('success')
      return
    }

    const phone = text('phone').trim()
    const payload: EnquiryPayload = {
      name: name.trim(),
      email: email.trim(),
      ...(phone && { phone }),
      message: message.trim(),
      ...(product && { product: { id: product.id, title: product.title, price: product.price } }),
    }

    setStatus('sending')
    try {
      await onSubmit(payload)
      setStatus('success')
    } catch (error) {
      console.error('Enquiry failed', error)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">
          <CircleCheck />
          <AlertTitle>Enquiry sent</AlertTitle>
          <AlertDescription>Thank you. We will reply by email.</AlertDescription>
        </Alert>
        <Button onClick={onDone}>Back to products</Button>
      </div>
    )
  }

  const sending = status === 'sending'

  return (
    <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-4">
      {product && (
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm leading-5 font-semibold wrap-anywhere">{product.title}</p>
          {product.category && <p className="text-xs leading-4 text-muted-foreground">{product.category}</p>}
          {product.price !== undefined && (
            <p className="text-lg leading-6 font-semibold">{formatPrice(product.price, currency)}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="enquiry-name">Your name</Label>
        <Input
          id="enquiry-name"
          name="name"
          ref={nameRef}
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'enquiry-name-error' : undefined}
        />
        <FieldError id="enquiry-name-error" message={errors.name} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="enquiry-email">Email</Label>
        <Input
          id="enquiry-email"
          name="email"
          type="email"
          ref={emailRef}
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'enquiry-email-error' : undefined}
        />
        <FieldError id="enquiry-email-error" message={errors.email} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="enquiry-phone">
          Phone <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="enquiry-phone" name="phone" type="tel" autoComplete="tel" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="enquiry-message">Message</Label>
        <Textarea
          id="enquiry-message"
          name="message"
          ref={messageRef}
          defaultValue={product ? `I am interested in ${product.title}.` : ''}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'enquiry-message-error' : undefined}
        />
        <FieldError id="enquiry-message-error" message={errors.message} />
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Enquiry not sent</AlertTitle>
          <AlertDescription>Your enquiry was not sent. Check your connection and try again.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-2 min-[600px]:flex-row min-[600px]:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={sending}>
          Cancel
        </Button>
        <Button type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send enquiry'}
        </Button>
      </div>
    </form>
  )
}
