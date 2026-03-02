import type { CategoryKey } from "@/lib/exams";

export function getExamMeta(_category: CategoryKey) {
  // Bu məlumatlar kateqoriya kartlarının altında göstərilməməlidir.
  // Təlimat səhifəsində də boş saxlanılır.
  return {
    durationLabel: "",
    examCountLabel: "",
  };
}
