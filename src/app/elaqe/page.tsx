import { Container } from "@/components/Container";

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-72px)] py-10">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl font-bold">Bu səhifə hazırlanır</h1>
          <p className="mt-3 text-slate-700">Məzmunu sonradan əlavə edəcəyik.</p>
        </div>
      </Container>
    </main>
  );
}
