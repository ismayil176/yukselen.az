import { Container } from "@/components/Container";

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-72px)] py-10">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl font-extrabold">Fəaliyyətimiz</h1>

          <p className="mt-4 text-slate-700">
            Yüksələn.az saytı öz fəaliyyətinə 2026-cı ilin mart ayında başlamışdır. Platforma “Basharzaman Academy” və bilavasitə Elcan
            Bəşərzaman tərəfindən ərsəyə gətirilmişdir.
          </p>

          <p className="mt-4 text-slate-700">
            Layihənin məqsədi Yüksəliş Müsabiqəsində iştirak edəcək namizədlərə analoji sınaq imtahanları vasitəsilə dəstək olmaqdır.
          </p>

          <p className="mt-4 text-slate-700">
            Saytda yerləşdirilən bütün sınaqlar Yüksəliş Müsabiqəsinin imtahanlarında istifadə edilmiş suallara əsaslanaraq tərtib edilmişdir.
          </p>
        </div>
      </Container>
    </main>
  );
}
