import { nip19 } from "nostr-tools";
const npub = "npub1kshusngqftrxmretf8srftd28xnsaznz8sla8r5m5az7twgetztq7svd39";
const { type, data } = nip19.decode(npub);
console.log(`Hex: ${data}`);
