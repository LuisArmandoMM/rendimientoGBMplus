import { CsvUploader } from "@/components/csv-uploader";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard de Finanzas Personales
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Sprint 1 · Sube el estado de cuenta (CSV) de tu broker para
          comenzar. Este prototipo aún no calcula rendimiento, comisiones ni
          diversificación — eso llega en los siguientes sprints.
        </p>
      </div>

      <div className="mt-10">
        <CsvUploader />
      </div>
    </main>
  );
}
