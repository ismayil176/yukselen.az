import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { getExam } from "@/lib/exams";
import { RunClient } from "./run-client";

export default async function RunPage({ params }: { params: { examId: string } }) {
  const exam = await getExam(params.examId);
  if (!exam) return notFound();

  // Ümumi biliklər blokları arasında 6 dəq. fasilə
  const breakSeconds = exam.category === "general" ? 6 * 60 : 0;

  return (
    <main className="py-10">
      <Container>
        <RunClient exam={exam} breakSeconds={breakSeconds} />
      </Container>
    </main>
  );
}
