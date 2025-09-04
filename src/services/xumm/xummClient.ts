import { XummSdk } from 'xumm-sdk';

// configurando sdk
export const xumm = new XummSdk(process.env.XUMM_API_KEY!, process.env.XUMM_API_SECRET!);