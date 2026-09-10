import { statusTone } from "@/lib/utils";

export default function Badge({ status }: { status: string }) {
  return <span className={`badge ${statusTone(status)}`}>{status}</span>;
}
