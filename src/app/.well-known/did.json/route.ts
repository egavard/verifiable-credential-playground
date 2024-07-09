import { createDidDocument } from '@gaia-x/did-web-generator'

export async function GET() {
  const didDocument = await createDidDocument(
    `https://${process.env.DOMAIN!}`,
    'x509Certificate.pem',
    process.env.CERTIFICATE!
  )

  return Response.json(didDocument)
}
