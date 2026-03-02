import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { getExam } from "@/lib/exams";
import { getExamMeta } from "@/lib/examMeta";

const backMap: Record<string, string> = {
  general: "umumi-bilikler",
  analytic: "analitik-tehlil",
  detail: "idareetme-bacariqlari",
};

export default async function InstructionsPage({ params }: { params: { category: string; examId: string } }) {
  const exam = await getExam(params.examId);
  if (!exam) return notFound();

  const meta = getExamMeta(exam.category);
  const back = backMap[exam.category] ?? params.category;

  return (
    <main className="py-10">
      <Container>
        <div className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-purple-950">Təlimat</h1>
          <p className="mt-2 text-slate-700">{exam.title}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info label="İmtahanın müddəti" value={meta.durationLabel} />
            <Info label="İmtahan sayı" value={meta.examCountLabel} />
            {/* Keçid balı göstərilmir */}
          </div>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
            <p>{exam.instructions}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/${exam.category}/${exam.id}/run`}
              className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white sm:w-auto"
            >
              İmtahana başla
            </Link>
            <Link
              href={`/start/${back}`}
              className="w-full rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white sm:w-auto"
            >
              Geri
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label}</div>
      <div className="mt-2 text-sm font-bold text-purple-950">{value}</div>
    </div>
  );
}
