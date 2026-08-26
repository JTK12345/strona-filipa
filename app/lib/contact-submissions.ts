import "server-only";

import { queryDatabase } from "@/app/lib/db";

export type ContactSubmissionStatus = "new" | "in_progress" | "closed";

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  status: ContactSubmissionStatus;
  adminNote: string;
  createdAt: Date;
  updatedAt: Date;
};

type ContactSubmissionRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  status: ContactSubmissionStatus;
  admin_note: string;
  created_at: Date;
  updated_at: Date;
};

function mapSubmission(row: ContactSubmissionRow): ContactSubmission {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    topic: row.topic,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createContactSubmission(input: {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}) {
  await queryDatabase(
    `INSERT INTO contact_submissions (name, email, phone, topic, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.name,
      input.email,
      input.phone,
      input.topic,
      input.message,
    ],
  );
}

export async function listContactSubmissions() {
  const result = await queryDatabase<ContactSubmissionRow>(
    `SELECT id, name, email, phone, topic, message, status, admin_note, created_at, updated_at
     FROM contact_submissions
     ORDER BY
       CASE status
         WHEN 'new' THEN 0
         WHEN 'in_progress' THEN 1
         ELSE 2
       END,
       created_at DESC
     LIMIT 200`,
  );

  return result.rows.map(mapSubmission);
}

export async function updateContactSubmission(input: {
  submissionId: string;
  status: ContactSubmissionStatus;
  adminNote: string;
}) {
  await queryDatabase(
    `UPDATE contact_submissions
     SET status = $2,
         admin_note = $3
     WHERE id = $1`,
    [
      input.submissionId,
      input.status,
      input.adminNote.slice(0, 2000),
    ],
  );
}
