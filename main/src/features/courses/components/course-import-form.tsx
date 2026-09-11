"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/admin/alert";
import { Button } from "@/components/ui/admin/button";
import { Label } from "@/components/ui/admin/label";
import { Textarea } from "@/components/ui/admin/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { SectionCard } from "@/components/shared/admin/editor-shell";
import { DataCard, Muted } from "@/components/shared/admin/list-ui";
import { importCourses, previewCourseImport, type PreviewRow } from "@/features/courses/actions";

type Problem = { row: number; message: string };

export function CourseImportForm({ columns, separator }: { columns: string; separator: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [busy, setBusy] = useState(false);

  // The import actions answer with a list of numbered problems rather than field errors, so the
  // outcome is toasted here instead of through the shared action hook.
  const check = async () => {
    setBusy(true);
    const result = await previewCourseImport({ csv });
    setBusy(false);
    if (!result.ok) {
      setRows(null);
      setProblems(result.problems);
      toast.error("Couldn't read that file.", { description: result.error });
      return;
    }
    setRows(result.data.rows);
    setProblems([]);
    toast.success(`${result.data.rows.length} courses ready to import`);
  };

  const commit = async () => {
    setBusy(true);
    const result = await importCourses({ csv });
    setBusy(false);
    if (!result.ok) {
      setRows(null);
      setProblems(result.problems);
      toast.error("Nothing was imported.", { description: result.error });
      return;
    }
    setRows(null);
    setProblems([]);
    setCsv("");
    toast.success(`${result.data.created} courses imported as drafts`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <SectionCard title="The file">
        <div className="space-y-2">
          <Label htmlFor="course-csv">Paste the spreadsheet</Label>
          <Textarea
            id="course-csv"
            rows={12}
            value={csv}
            className="font-mono text-xs"
            placeholder={columns}
            onChange={(event) => {
              setCsv(event.target.value);
              setRows(null);
              setProblems([]);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Save the sheet as CSV and paste everything, headings included. The first line has to
            read exactly: {columns}. Several intake months go in one cell separated by {separator},
            like February{separator}July.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={busy || !csv.trim()} onClick={check}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            {busy ? "Reading..." : "Check the file"}
          </Button>
          {rows && rows.length > 0 ? (
            <Button type="button" disabled={busy} onClick={commit}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              Import {rows.length} {rows.length === 1 ? "course" : "courses"}
            </Button>
          ) : null}
        </div>
      </SectionCard>

      {problems.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Nothing was imported</AlertTitle>
          <AlertDescription>
            <p>One bad line stops the whole file. Fix these and check it again.</p>
            <ul className="list-disc space-y-1 pl-4">
              {problems.map((problem) => (
                <li key={`${problem.row}-${problem.message}`}>{problem.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {rows && rows.length > 0 ? (
        <SectionCard
          title="Preview"
          description={`${rows.length} ${rows.length === 1 ? "course" : "courses"}, all imported as drafts.`}
          contentClassName="p-0"
        >
          <DataCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead className="hidden md:table-cell">Qualification</TableHead>
                  <TableHead className="hidden md:table-cell">Subject area</TableHead>
                  <TableHead className="hidden lg:table-cell">Length</TableHead>
                  <TableHead className="hidden lg:table-cell">Intakes</TableHead>
                  <TableHead className="hidden lg:table-cell">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.row}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.institution}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.qualificationLevel ?? <Muted>Not set</Muted>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.categorySlug ?? <Muted>Not set</Muted>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {row.durationLabel || (row.durationMonths ? `${row.durationMonths} months` : <Muted>Not set</Muted>)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {row.intakes.join(", ") || <Muted>None</Muted>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {row.tuitionFeeMin || row.tuitionFeeMax ? (
                        `${row.tuitionCurrency} ${row.tuitionFeeMin || "?"} to ${row.tuitionFeeMax || "?"}`
                      ) : (
                        <Muted>Not set</Muted>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataCard>
        </SectionCard>
      ) : null}
    </div>
  );
}
