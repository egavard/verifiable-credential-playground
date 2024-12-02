import { Injectable } from '@nestjs/common'

import { CompactSign, importPKCS8, KeyLike } from 'jose'
import { DateTime } from 'luxon'
import { ConfigService } from '@nestjs/config'
import VerifiableCredential from '../model/verifiable-credential'
import VerifiablePresentation from '../model/verifiable-presentation'
import { VcJwt } from '../model/vc-jwt'
import { VpJwt } from '../model/vp-jwt'

@Injectable()
export class SigningService {
  constructor(private readonly configService: ConfigService) {}

  async signDocument(
    document: VerifiableCredential | VerifiablePresentation,
    neverExpires: boolean
  ): Promise<VcJwt | VpJwt> {
    const didWeb: string = `did:web:${this.configService.get('DOMAIN', 'domain.com')}`
    const privateKey: KeyLike = await importPKCS8(
      this.configService.get('PRIVATE_KEY'),
      this.configService.get('PRIVATE_KEY_ALGORITHM', 'ES256')
    )

    document.issuer = didWeb
    document.validFrom = DateTime.now().toISO()

    if (neverExpires) {
      delete document.validUntil
    } else {
      document.validUntil = DateTime.now()
        .plus({ days: this.configService.get<number>('EXPIRATION_DAYS', 1) })
        .toISO()
    }

    return await new CompactSign(new TextEncoder().encode(JSON.stringify(document)))
      .setProtectedHeader({
        alg: `${this.configService.get('PRIVATE_KEY_ALGORITHM', 'ES256')}`,
        typ: 'vc+ld+json+jwt',
        cty: 'vc+ld+json',
        iss: didWeb,
        kid: didWeb + '#X509-JWK2020'
      })
      .sign(privateKey)
  }
}