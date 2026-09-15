const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function isValidTronAddress(value: string): boolean {
  const address = value.trim();
  if (address.length !== 34) return false;
  if (!address.startsWith("T")) return false;
  for (let i = 0; i < address.length; i += 1) {
    if (!BASE58.includes(address[i])) return false;
  }
  return true;
}

export function validateTronAddress(value: string): string | null {
  const address = value.trim();
  if (!address) return "请输入 TRON 地址";
  if (!address.startsWith("T")) return "TRON 地址必须以 T 开头";
  if (address.length !== 34) return `地址长度必须为 34 位，当前为 ${address.length} 位`;
  if ([...address].some((ch) => !BASE58.includes(ch))) {
    return "地址包含非法字符，需为 Base58（不含 0/O/I/l）";
  }
  return null;
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
