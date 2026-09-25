import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ground flex items-center justify-center p-4">
      <div className="bg-surface max-w-md w-full rounded-panel border border-line p-6 shadow-panel text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-danger/10 text-danger mx-auto flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-ink">Page Not Found</h1>
          <p className="text-xs text-mutedText mt-1">
            The page or resource you requested could not be located in Command Center.
          </p>
        </div>
        <Link
          href="/console"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Console</span>
        </Link>
      </div>
    </div>
  );
}
