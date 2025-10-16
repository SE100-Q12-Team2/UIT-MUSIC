import { Injectable } from '@nestjs/common';
import env from 'src/shared/config';
import { createSign } from 'crypto';

type SignUrlParams = { url: string; expiresInSec: number };

@Injectable()
export class PlaybackService {
  // ký URL CloudFront dạng canned policy
  signUrl({ url, expiresInSec }: SignUrlParams) {
    const expires = Math.floor(Date.now() / 1000) + expiresInSec;
    const policy = `{"Statement":[{"Resource":"${url}","Condition":{"DateLessThan":{"AWS:EpochTime":${expires}}}}]}`;
    const signer = createSign('RSA-SHA1'); 
    signer.update(policy);
    const signature = signer.sign(env.CF_PRIVATE_KEY).toString('base64')
      .replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');

    const kp = env.CF_KEY_PAIR_ID;
    const signed = `${url}${url.includes('?') ? '&' : '?'}Expires=${expires}&Signature=${signature}&Key-Pair-Id=${kp}`;
    return signed;
  }
}
