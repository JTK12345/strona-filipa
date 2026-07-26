import "server-only";

import { cache } from "react";
import { queryDatabase } from "@/app/lib/db";

export type CourseCatalogItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published";
  level: string;
  duration: string;
  priceCents: number | null;
  currency: string;
  salesEnabled: boolean;
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
  price_cents: number | null;
  currency: string;
  sales_enabled: boolean;
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
    courses.price_cents,
    courses.currency,
    courses.sales_enabled,
    COALESCE(
      array_agg(course_modules.title ORDER BY course_modules.position)
        FILTER (WHERE course_modules.id IS NOT NULL),
      ARRAY[]::text[]
    ) AS module_titles
  FROM courses
  LEFT JOIN course_modules ON course_modules.course_id = courses.id
`;

function mapCourse(row: CourseCatalogRow): CourseCatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    level: row.level_label,
    duration: row.duration_label,
    priceCents: row.price_cents,
    currency: row.currency.trim(),
    salesEnabled: row.sales_enabled,
    modules: row.module_titles,
  };
}

export function formatCoursePrice(course: CourseCatalogItem) {
  if (course.priceCents === null) {
    return "Cena w przygotowaniu";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: course.currency,
    minimumFractionDigits: course.priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(course.priceCents / 100);
}

export function getCourseStatusLabel(course: CourseCatalogItem) {
  if (course.status === "draft") {
    return "Szkic";
  }

  return course.salesEnabled ? "Dostępny" : "W przygotowaniu";
}

export const getPublishedCourses = cache(async () => {
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
