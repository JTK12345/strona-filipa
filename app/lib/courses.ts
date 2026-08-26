import "server-only";

import { cache } from "react";
import { isDatabaseConfigured, queryDatabase } from "@/app/lib/db";

export type CourseCatalogItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published";
  level: string;
  duration: string;
  modules: string[];
};

type CourseCatalogRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published";
  level_label: string;
  duration_label: string;
  module_titles: string[];
};

const catalogSelect = `
  SELECT
    courses.id,
    courses.slug,
    courses.title,
    courses.description,
    courses.status,
    courses.level_label,
    courses.duration_label,
    COALESCE(
      array_agg(course_modules.title ORDER BY course_modules.position)
        FILTER (WHERE course_modules.id IS NOT NULL),
      ARRAY[]::text[]
    ) AS module_titles
  FROM courses
  LEFT JOIN course_modules ON course_modules.course_id = courses.id
`;

const previewCourses: CourseCatalogItem[] = [
  {
    id: "preview-kregoslup",
    slug: "kregoslup-bez-przeciazen",
    title: "Kręgosłup bez przeciążeń",
    description:
      "Program dla osób z napięciem pleców, długim siedzeniem i potrzebą bezpiecznego powrotu do ruchu.",
    status: "published",
    level: "Start",
    duration: "4 moduły",
    modules: [
      "Ocena napięcia i punkt wyjścia",
      "Mobilność odcinka piersiowego",
      "Biodra, oddech i stabilizacja",
      "Plan tygodniowy",
    ],
  },
  {
    id: "preview-kark-barki",
    slug: "kark-barki-praca-siedzaca",
    title: "Kark i barki przy pracy siedzącej",
    description:
      "Ścieżka dla osób, które czują sztywność szyi, barków i górnych pleców po pracy przy biurku.",
    status: "published",
    level: "Podstawowy",
    duration: "5 modułów",
    modules: [
      "Ergonomia bez dogmatów",
      "Ruch łopatek",
      "Oddech i żebra",
      "Szyja i górny odcinek pleców",
      "Rutyna 12 minut",
    ],
  },
];

function mapCourse(row: CourseCatalogRow): CourseCatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    level: row.level_label,
    duration: row.duration_label,
    modules: row.module_titles,
  };
}

export function getCourseStatusLabel(course: CourseCatalogItem) {
  if (course.status === "draft") {
    return "Szkic";
  }

  return "Po kodzie";
}

export const getPublishedCourses = cache(async () => {
  if (!isDatabaseConfigured()) {
    return previewCourses;
  }

  const result = await queryDatabase<CourseCatalogRow>(
    `${catalogSelect}
     WHERE courses.status = 'published'
     GROUP BY courses.id
     ORDER BY courses.position, courses.created_at`,
  );

  return result.rows.map(mapCourse);
});

export const getAccessibleCourses = cache(
  async (userId: string, isAdmin: boolean) => {
    if (!isDatabaseConfigured()) {
      return isAdmin ? previewCourses : [];
    }

    const result = await queryDatabase<CourseCatalogRow>(
      `${catalogSelect}
       WHERE courses.status <> 'archived'
         AND (
           $2::boolean
           OR (
             courses.status = 'published'
             AND EXISTS (
               SELECT 1
               FROM access_grants
               WHERE access_grants.user_id = $1
                 AND access_grants.revoked_at IS NULL
                 AND (
                   access_grants.expires_at IS NULL
                   OR access_grants.expires_at > now()
                 )
                 AND (
                   access_grants.scope = 'all_access'
                   OR (
                     access_grants.scope = 'course'
                     AND access_grants.course_id = courses.id
                   )
                 )
             )
           )
         )
       GROUP BY courses.id
       ORDER BY courses.position, courses.created_at`,
      [userId, isAdmin],
    );

    return result.rows.map(mapCourse);
  },
);
