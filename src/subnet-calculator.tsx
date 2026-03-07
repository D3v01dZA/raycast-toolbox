import { Action, ActionPanel, List } from "@raycast/api";
import { useEffect, useState } from "react";

interface Result {
  label: string;
  value: string;
}

function ipToNum(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function numToIp(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
}

function numToBin(n: number): string {
  return [24, 16, 8, 0].map((s) => ((n >>> s) & 0xff).toString(2).padStart(8, "0")).join(".");
}

function maskBitsFromDotted(mask: string): number | null {
  const n = ipToNum(mask);
  // Verify it's a valid contiguous mask
  const inverted = (~n >>> 0) >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;
  let bits = 0;
  let v = n;
  while (v) {
    bits += v & 1;
    v >>>= 1;
  }
  return bits;
}

function ipClass(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (Multicast)";
  return "E (Reserved)";
}

function parseSubnetInput(text: string): { ip: number; cidr: number } | null {
  const t = text.trim();

  // CIDR notation: 192.168.1.0/24
  const cidrMatch = t.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (cidrMatch) {
    const cidr = parseInt(cidrMatch[2]);
    if (cidr > 32) return null;
    return { ip: ipToNum(cidrMatch[1]), cidr };
  }

  // IP + dotted mask: 192.168.1.0 255.255.255.0
  const maskMatch = t.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (maskMatch) {
    const bits = maskBitsFromDotted(maskMatch[2]);
    if (bits === null) return null;
    return { ip: ipToNum(maskMatch[1]), cidr: bits };
  }

  // Plain IP: 192.168.1.1
  const plainMatch = t.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (plainMatch) {
    return { ip: ipToNum(plainMatch[1]), cidr: 32 };
  }

  return null;
}

function calculateSubnet(ip: number, cidr: number): Result[] {
  const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  const wildcard = (~mask >>> 0) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2;
  const firstHost = cidr >= 31 ? network : (network + 1) >>> 0;
  const lastHost = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
  const firstOctet = (ip >>> 24) & 0xff;

  return [
    { label: "Network Address", value: numToIp(network) },
    { label: "Broadcast Address", value: numToIp(broadcast) },
    { label: "First Usable Host", value: numToIp(firstHost) },
    { label: "Last Usable Host", value: numToIp(lastHost) },
    { label: "Subnet Mask", value: numToIp(mask) },
    { label: "Wildcard Mask", value: numToIp(wildcard) },
    { label: "CIDR Notation", value: "/" + cidr },
    { label: "Total Addresses", value: totalHosts.toLocaleString() },
    { label: "Usable Hosts", value: usableHosts.toLocaleString() },
    { label: "IP Class", value: ipClass(firstOctet) },
    { label: "Binary Subnet Mask", value: numToBin(mask) },
  ];
}

export default function Command() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (text === "") {
      setResults([]);
      return;
    }
    const parsed = parseSubnetInput(text);
    if (!parsed) {
      setResults([]);
      return;
    }
    setResults(calculateSubnet(parsed.ip, parsed.cidr));
  }, [text]);

  return (
    <List onSearchTextChange={setText} searchBarPlaceholder="Enter IP/CIDR (e.g. 192.168.1.0/24)" throttle>
      {results.map((result) => (
        <List.Item
          key={result.label}
          title={result.label}
          accessories={[{ text: result.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={result.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
