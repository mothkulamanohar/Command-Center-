declare module "ipaddr.js" {
  export interface IPv4 {
    kind(): "ipv4";
    match(cidr: [IPv4, number]): boolean;
    toByteArray(): number[];
    toString(): string;
  }

  export interface IPv6 {
    kind(): "ipv6";
    match(cidr: [IPv6, number]): boolean;
    toByteArray(): number[];
    toString(): string;
    isIPv4MappedAddress(): boolean;
    toIPv4Address(): IPv4;
  }

  export type IP = IPv4 | IPv6;

  export function parse(string: string): IP;
  export function parseCIDR(string: string): [IP, number];
  export function isValid(string: string): boolean;
  export function process(string: string): IP;
}
