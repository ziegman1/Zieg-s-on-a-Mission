import { redirect } from "next/navigation";

/** Legacy route — visual editor is the primary experience. */
export default function AdminSiteCopyPage() {
  redirect("/admin/site-builder");
}
