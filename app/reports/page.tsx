"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { savedReports, type SavedReport } from "@/lib/client";

export default function Reports() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  useEffect(() => setReports(savedReports()), []);

  return (
    <section className="narrow">
      <h1>My reports</h1>
      <p className="lead">Reports you started on this device. Anyone with a report&apos;s link can open it, so share links carefully.</p>
      {reports.length === 0 ? (
        <p className="panel">No reports on this device yet. <Link href="/new">Start a report</Link></p>
      ) : (
        <ul className="report-list">
          {reports.map((report) => (
            <li key={report.id}>
              <Link href={`/report/${report.id}#${report.token}`}>
                <strong>{report.category}</strong>
                <span>{report.priority} priority, saved {new Date(report.savedAt).toLocaleString("en-IN")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
