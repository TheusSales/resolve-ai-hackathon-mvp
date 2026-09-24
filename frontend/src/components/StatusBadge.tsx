import { STATUS_ROTULOS } from "../constants";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_ROTULOS[status] || status}
    </span>
  );
}
