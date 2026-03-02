import Link from "next/link";
import { Container } from "@/components/Container";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[url('/homepage-bg.avif')] bg-cover bg-center bg-no-repeat">
      <div className="relative min-h-[calc(100vh-72px)]">
        {/* subtle overlay for readability while keeping the image visible */}
        <div className="pointer-events-none absolute inset-0 bg-white/65 backdrop-blur-[2px]" />
        <Container>
          {/* hero content position */}
          <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-32 text-center sm:pt-40 md:pt-48">
              <h1 className="text-xl font-extrabold uppercase tracking-wide text-purple-950 sm:text-2xl md:text-3xl">
                Yüksəliş Müsabiqəsinə hazırlıq
              </h1>
              <p className="mt-3 text-lg font-semibold text-purple-900/70 sm:text-2xl">Onlayn İmtahan Platforması</p>
              <div className="mt-10 flex justify-center">
                <Link
                  href="/start"
                  className="rounded-2xl bg-white px-10 py-4 text-base font-bold text-purple-950 shadow-lg shadow-black/10 hover:bg-white"
                >
                  Sınağa başla
                </Link>
              </div>
          </div>
        </Container>
      </div>
    </main>
  );
}
