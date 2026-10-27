import { LoaderCircle } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex h-64 items-center justify-center" aria-busy="true" aria-label="Loading">
      <LoaderCircle className="h-6 w-6 animate-spin text-gold" />
    </div>
  );
}
