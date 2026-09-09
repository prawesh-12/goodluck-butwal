"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importCourses, previewCourseImport, type PreviewRow } from "@/features/courses/actions";

type Problem = { row: number; message: string };

export function CourseImportForm({ columns, separator }: { columns: string; separator: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const check = async () => {
    setBusy(true);
    const result = await previewCourseImport({ csv });
    setBusy(false);
    setRows(result.ok ? result.data.rows : null);
    setProblems(result.ok ? [] : result.problems);
    setMessage(result.ok ? `${result.data.rows.length} courses ready to import.` : result.error);
  };

  const commit = async () => {
    setBusy(true);
    const result = await importCourses({ csv });
    setBusy(false);
    if (!result.ok) {
      setRows(null);
      setProblems(result.problems);
      setMessage(result.error);
      return;
    }
    setRows(null);
    setProblems([]);
    setCsv("");
    setMessage(`Imported ${result.data.created} courses as drafts.`);
    router.refresh();
  };

  return (
    <>
      <label className="admin-field">
        <span className="t-small">Paste the spreadsheet</span>
        <textarea
          rows={12}
          value={csv}
          onChange={(event) => {
            setCsv(event.target.value);
            setRows(null);
            setProblems([]);
            setMessage(null);
          }}
          placeholder={columns}
        />
        <span className="t-small admin-help">
          Save the sheet as CSV, open it in a text editor and paste everything here, headings
          included. The first line has to read exactly: {columns}. Put several intake months in one
          cell separated by {separator}, like February{separator}July.
        </span>
      </label>

      <div className="admin-actions">
        <button type="button" className="admin-btn" disabled={busy || !csv.trim()} onClick={check}>
          {busy ? "Reading" : "Check the file"}
        </button>
        {rows && rows.length > 0 ? (
          <button type="button" className="admin-btn" disabled={busy} onClick={commit}>
            Import {rows.length} {rows.length === 1 ? "course" : "courses"}
          </button>
        ) : null}
        {message ? <span className="t-small">{message}</span> : null}
      </div>

      {problems.length > 0 ? (
        <>
          <h2 className="t-h5 admin-subhead">Nothing was imported</h2>
          <p className="t-small admin-help">
            One bad row stops the whole file, so the catalogue is never half loaded. Fix these and
            check it again.
          </p>
          <ul className="admin-field">
            {problems.map((problem) => (
              <li key={`${problem.row}-${problem.message}`} className="admin-clash">
                {problem.message}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {rows && rows.length > 0 ? (
        <>
          <h2 className="t-h5 admin-subhead">Preview</h2>
          <p className="t-small admin-count">
            {rows.length} {rows.length === 1 ? "course" : "courses"}, all imported as drafts.
          </p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Course</th>
                <th>Institution</th>
                <th>Level</th>
                <th>Subject area</th>
                <th>Length</th>
                <th>Intakes</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.row}>
                  <td>{row.row}</td>
                  <td>{row.name}</td>
                  <td>{row.institution}</td>
                  <td>{row.qualificationLevel ?? "Not set"}</td>
                  <td>{row.categorySlug ?? "Not set"}</td>
                  <td>{row.durationLabel || (row.durationMonths ? `${row.durationMonths} months` : "Not set")}</td>
                  <td>{row.intakes.join(", ") || "None"}</td>
                  <td>
                    {row.tuitionFeeMin || row.tuitionFeeMax
                      ? `${row.tuitionCurrency} ${row.tuitionFeeMin || "?"} to ${row.tuitionFeeMax || "?"}`
                      : "Not set"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </>
  );
}
