export const courseEditorMessages: Record<string, string> = {
  course_created: "Kurs został utworzony. Możesz teraz dodać pierwszy moduł.",
  course_updated: "Zmiany w kursie zostały zapisane.",
  course_archived: "Kurs został usunięty ze strony.",
  module_created: "Moduł został dodany. Możesz teraz dodać do niego lekcję.",
  module_updated: "Zmiany w module zostały zapisane.",
  module_deleted: "Moduł został usunięty.",
  lesson_created: "Lekcja została dodana do modułu.",
  lesson_updated: "Zmiany w lekcji zostały zapisane.",
  lesson_deleted: "Lekcja została usunięta.",
  invalid: "Sprawdź dane. Nazwa musi mieć od 3 do 160 znaków. Sprawdź też typ i rozmiar dodawanych plików.",
  course_not_found: "Ten kurs nie jest już dostępny. Odśwież listę kursów.",
  module_not_found: "Ten moduł nie jest już dostępny. Odśwież listę kursów.",
  lesson_not_found: "Ta lekcja nie jest już dostępna. Odśwież listę kursów.",
  server: "Nie udało się potwierdzić zapisu. Sprawdź stan kursu przed ponowną próbą.",
  rate: "Wykonano zbyt wiele operacji. Odczekaj kilka minut. Wpisane dane pozostają w formularzu.",
};

export function isCourseEditorSuccess(result: string) {
  return /^(course|module|lesson)_(created|updated|deleted|archived)$/.test(result);
}
