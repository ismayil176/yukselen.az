import { redirect } from "next/navigation";

// /admin açanda 404 olmasın deyə login səhifəsinə yönləndiririk.
export default function AdminIndexPage() {
  redirect("/admin/login");
}
