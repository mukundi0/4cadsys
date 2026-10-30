export {}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return response({ ResultCode: 1, ResultDesc: 'POST required.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || (keys ? JSON.parse(keys).default : undefined)
  const secret = Deno.env.get('DARAJA_CALLBACK_SECRET')
  if (!secret || new URL(req.url).searchParams.get('secret') !== secret) {
    return response({ ResultCode: 1, ResultDesc: 'Not authorized.' }, 401)
  }

  let data: any
  try { data = await req.json() } catch { return response({ ResultCode: 1, ResultDesc: 'Invalid callback JSON.' }, 400) }
  const callback = data?.Body?.stkCallback
  if (!callback?.CheckoutRequestID) return response({ ResultCode: 1, ResultDesc: 'Invalid callback payload.' }, 400)

  const items = Array.isArray(callback.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item : []
  const values = Object.fromEntries(items.map((item: any) => [item.Name, item.Value]))
  const rpc = await fetch(`${url}/rest/v1/rpc/process_mpesa_callback`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_checkout_id: String(callback.CheckoutRequestID),
      p_result_code: String(callback.ResultCode ?? ''),
      p_result_description: String(callback.ResultDesc || ''),
      p_receipt: values.MpesaReceiptNumber == null ? null : String(values.MpesaReceiptNumber),
      p_amount: values.Amount == null ? null : Number(values.Amount),
      p_phone: values.PhoneNumber == null ? null : String(values.PhoneNumber),
    }),
  })
  if (!rpc.ok) return response({ ResultCode: 1, ResultDesc: 'Callback processing failed; retry later.' }, 503)
  return response({ ResultCode: 0, ResultDesc: 'Accepted.' })
})
